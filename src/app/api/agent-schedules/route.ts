import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isUiPreviewMode } from "@/lib/ui-preview";
import { computeNextCronRun } from "@/lib/cron/next-run";

const postSchema = z.object({
  agent_type: z.string().min(1).max(80),
  cron_expr: z.string().min(1).max(120),
  product_id: z.string().uuid().optional(),
});

function parseCronOr400(expr: string) {
  try {
    return computeNextCronRun(expr, new Date());
  } catch {
    return null;
  }
}

/** List and create per-org agent schedules (RLS). */
export async function GET() {
  if (isUiPreviewMode()) {
    return NextResponse.json({ error: "Not available in UI preview mode" }, { status: 403 });
  }
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("agent_schedules")
    .select("id, agent_type, cron_expr, next_run_at, product_id, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ schedules: data ?? [] });
}

export async function POST(req: Request) {
  if (isUiPreviewMode()) {
    return NextResponse.json({ error: "Not available in UI preview mode" }, { status: 403 });
  }
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const next = parseCronOr400(parsed.data.cron_expr);
  if (!next) {
    return NextResponse.json(
      { error: "Invalid cron expression (use standard 5-field cron, e.g. 0 9 * * 1)" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("agent_schedules")
    .insert({
      agent_type: parsed.data.agent_type,
      cron_expr: parsed.data.cron_expr,
      product_id: parsed.data.product_id ?? null,
      next_run_at: next.toISOString(),
    })
    .select("id, agent_type, cron_expr, next_run_at, product_id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ schedule: data });
}
