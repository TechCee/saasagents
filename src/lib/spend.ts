import type { SupabaseClient } from "@supabase/supabase-js";

function estimateCostUsd(inputTokens: number, outputTokens: number) {
  const inRate = Number(process.env.OPENAI_INPUT_PRICE_PER_1K ?? 0.00015);
  const outRate = Number(process.env.OPENAI_OUTPUT_PRICE_PER_1K ?? 0.0006);
  return (inputTokens / 1000) * inRate + (outputTokens / 1000) * outRate;
}

export { estimateCostUsd };

export async function checkDailySpendExceeded(
  admin: SupabaseClient,
  organisationId: string,
  additionalUsd: number,
): Promise<{ exceeded: boolean; dailyTotal: number; limit: number }> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const { data: rows } = await admin
    .from("agent_logs")
    .select("estimated_cost_usd")
    .eq("organisation_id", organisationId)
    .gte("created_at", start.toISOString());

  const dailyTotal =
    (rows ?? []).reduce(
      (a, r) => a + Number((r as { estimated_cost_usd?: string }).estimated_cost_usd ?? 0),
      0,
    ) + additionalUsd;

  const { data: limRow } = await admin
    .from("org_spend_limits")
    .select("daily_spend_limit_usd, agents_paused")
    .eq("organisation_id", organisationId)
    .maybeSingle();

  const limit = Number(
    (limRow as { daily_spend_limit_usd?: number } | null)?.daily_spend_limit_usd ?? 5,
  );
  const paused = Boolean(
    (limRow as { agents_paused?: boolean } | null)?.agents_paused,
  );

  return {
    exceeded: paused || dailyTotal > limit,
    dailyTotal,
    limit,
  };
}

export async function pauseAgentsForOrg(admin: SupabaseClient, organisationId: string) {
  await admin
    .from("org_spend_limits")
    .upsert(
      { organisation_id: organisationId, agents_paused: true },
      { onConflict: "organisation_id" },
    );
}
