import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { allowAgentRun } from "@/lib/rate-limit";
import {
  checkDailySpendExceeded,
  estimateCostUsd,
  pauseAgentsForOrg,
} from "@/lib/spend";

const bodySchema = z.object({
  organisation_id: z.string().uuid(),
  agent_type: z.string().min(1),
  product_id: z.string().uuid().optional(),
  status: z.enum(["success", "error", "skipped"]).default("success"),
  input_tokens: z.number().int().nonnegative().default(0),
  output_tokens: z.number().int().nonnegative().default(0),
  payload: z.record(z.string(), z.unknown()).optional(),
  error_message: z.string().optional(),
  consecutive_errors: z.number().int().nonnegative().optional(),
});

/**
 * Records an agent run with token/cost tracking, rate limiting, and spend guardrails.
 * Secured with CRON_SECRET or SUPABASE_SERVICE_ROLE_KEY in Authorization header for server-side callers.
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const cron = req.headers.get("x-cron-secret");
  const okAuth =
    (cron && cron === process.env.CRON_SECRET && process.env.CRON_SECRET) ||
    auth === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;

  if (!okAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const b = parsed.data;
  const allowed = await allowAgentRun(b.organisation_id, b.agent_type);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const cost = estimateCostUsd(b.input_tokens, b.output_tokens);
  const admin = createAdminClient();

  const spend = await checkDailySpendExceeded(admin, b.organisation_id, cost);
  if (spend.exceeded) {
    await pauseAgentsForOrg(admin, b.organisation_id);
    return NextResponse.json(
      {
        error: "Daily spend limit exceeded — agents paused for org",
        dailyTotal: spend.dailyTotal,
        limit: spend.limit,
      },
      { status: 402 },
    );
  }

  const { data: inserted, error } = await admin
    .from("agent_logs")
    .insert({
      organisation_id: b.organisation_id,
      product_id: b.product_id ?? null,
      agent_type: b.agent_type,
      status: b.status,
      payload: b.payload ?? null,
      error_message: b.error_message ?? null,
      input_tokens: b.input_tokens,
      output_tokens: b.output_tokens,
      estimated_cost_usd: cost,
      consecutive_errors: b.consecutive_errors ?? 0,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const consec = b.consecutive_errors ?? 0;
  if (consec >= 3 && process.env.RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.ALERT_EMAIL_FROM ?? "alerts@example.com",
          to: [process.env.ALERT_EMAIL_TO ?? "admin@example.com"],
          subject: `[OpSync] Agent failures: ${b.agent_type}`,
          text: `Organisation ${b.organisation_id} has ${consec} consecutive errors.`,
        }),
      });
    } catch {
      /* non-fatal */
    }
  }

  return NextResponse.json({ ok: true, id: inserted?.id, estimated_cost_usd: cost });
}
