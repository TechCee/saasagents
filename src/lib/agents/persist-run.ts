import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { allowAgentRun } from "@/lib/rate-limit";
import {
  checkDailySpendExceeded,
  estimateCostUsd,
  pauseAgentsForOrg,
} from "@/lib/spend";

export type PersistAgentRunInput = {
  organisation_id: string;
  agent_type: string;
  product_id?: string | null;
  status: "success" | "error" | "skipped";
  input_tokens: number;
  output_tokens: number;
  payload?: Record<string, unknown> | null;
  error_message?: string | null;
  consecutive_errors?: number;
};

export type PersistAgentRunResult =
  | { ok: true; id: string; estimated_cost_usd: number }
  | { ok: false; response: NextResponse };

/**
 * Rate limit, spend guardrails, insert agent_logs. Used by /api/agents/run and /api/agents/execute.
 */
export async function persistAgentRun(
  b: PersistAgentRunInput,
): Promise<PersistAgentRunResult> {
  const allowed = await allowAgentRun(b.organisation_id, b.agent_type);
  if (!allowed) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Rate limited" }, { status: 429 }),
    };
  }

  const cost = estimateCostUsd(b.input_tokens, b.output_tokens);
  const admin = createAdminClient();

  const spend = await checkDailySpendExceeded(admin, b.organisation_id, cost);
  if (spend.exceeded) {
    await pauseAgentsForOrg(admin, b.organisation_id);
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Daily spend limit exceeded — agents paused for org",
          dailyTotal: spend.dailyTotal,
          limit: spend.limit,
        },
        { status: 402 },
      ),
    };
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
    return {
      ok: false,
      response: NextResponse.json({ error: error.message }, { status: 500 }),
    };
  }

  return {
    ok: true,
    id: inserted?.id as string,
    estimated_cost_usd: cost,
  };
}

export async function maybeSendFailureAlert(
  agentType: string,
  organisationId: string,
  consec: number,
) {
  if (consec < 3 || !process.env.RESEND_API_KEY) return;
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
        subject: `[OpSync] Agent failures: ${agentType}`,
        text: `Organisation ${organisationId} has ${consec} consecutive errors.`,
      }),
    });
  } catch {
    /* non-fatal */
  }
}
