import { NextResponse } from "next/server";
import { executeAgentOnce } from "@/lib/agents/execute-agent";
import { getOpenAIClient } from "@/lib/agents/openai-agents";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeNextCronRun } from "@/lib/cron/next-run";

function cronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  if (req.headers.get("x-cron-secret") === secret) return true;
  return false;
}

/**
 * Vercel Cron (GET) or manual POST: runs due `agent_schedules` rows for all orgs.
 */
export async function GET(req: Request) {
  return handleAgentScheduleCron(req);
}

export async function POST(req: Request) {
  return handleAgentScheduleCron(req);
}

async function handleAgentScheduleCron(req: Request) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!getOpenAIClient()) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "OPENAI_API_KEY not configured",
    });
  }

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("agent_schedules")
    .select("id, organisation_id, product_id, agent_type, cron_expr, next_run_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = new Date();
  const executed: { id: string; agent_type: string; ok: boolean }[] = [];

  for (const raw of rows ?? []) {
    const row = raw as {
      id: string;
      organisation_id: string;
      product_id: string | null;
      agent_type: string;
      cron_expr: string;
      next_run_at: string | null;
    };
    const nextAt = row.next_run_at ? new Date(row.next_run_at) : null;
    const due = !nextAt || nextAt.getTime() <= now.getTime();
    if (!due) continue;

    let nextRunIso: string;
    try {
      const nextRun = computeNextCronRun(row.cron_expr, now);
      nextRunIso = nextRun.toISOString();
    } catch {
      executed.push({ id: row.id, agent_type: row.agent_type, ok: false });
      continue;
    }

    const result = await executeAgentOnce(
      row.organisation_id,
      row.agent_type,
      `Scheduled run (cron: ${row.cron_expr}). Be concise.`,
      "cron/agent-schedules",
      row.product_id,
    );

    await admin
      .from("agent_schedules")
      .update({ next_run_at: nextRunIso })
      .eq("id", row.id);

    executed.push({
      id: row.id,
      agent_type: row.agent_type,
      ok: result.ok,
    });
  }

  return NextResponse.json({
    ok: true,
    checked: rows?.length ?? 0,
    fired: executed.filter((e) => e.ok).length,
    details: executed,
  });
}
