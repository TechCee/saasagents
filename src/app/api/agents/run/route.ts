import { NextResponse } from "next/server";
import { z } from "zod";
import {
  maybeSendFailureAlert,
  persistAgentRun,
} from "@/lib/agents/persist-run";

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
  const persisted = await persistAgentRun({
    organisation_id: b.organisation_id,
    agent_type: b.agent_type,
    product_id: b.product_id,
    status: b.status,
    input_tokens: b.input_tokens,
    output_tokens: b.output_tokens,
    payload: b.payload ?? null,
    error_message: b.error_message ?? null,
    consecutive_errors: b.consecutive_errors ?? 0,
  });

  if (!persisted.ok) {
    return persisted.response;
  }

  const consec = b.consecutive_errors ?? 0;
  await maybeSendFailureAlert(b.agent_type, b.organisation_id, consec);

  return NextResponse.json({
    ok: true,
    id: persisted.id,
    estimated_cost_usd: persisted.estimated_cost_usd,
  });
}
