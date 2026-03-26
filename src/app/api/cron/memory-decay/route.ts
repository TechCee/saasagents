import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  if (req.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 14);

  const { error: delErr, count: deleted } = await admin
    .from("agent_memories")
    .delete({ count: "exact" })
    .eq("source", "channel_intelligence")
    .lte("importance", 1)
    .lt("created_at", cutoff.toISOString());

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  const { data: older, error: selErr } = await admin
    .from("agent_memories")
    .select("id, importance")
    .eq("source", "channel_intelligence")
    .gt("importance", 1)
    .lt("created_at", cutoff.toISOString());

  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 500 });
  }

  let decremented = 0;
  for (const row of older ?? []) {
    const r = row as { id: string; importance: number };
    await admin
      .from("agent_memories")
      .update({ importance: r.importance - 1 })
      .eq("id", r.id);
    decremented++;
  }

  return NextResponse.json({
    ok: true,
    deleted_old_low_importance: deleted ?? 0,
    decremented,
  });
}
