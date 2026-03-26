import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const TIERS = [20, 50, 100, 200];

function tierForDate(start: Date) {
  const ms = Date.now() - start.getTime();
  const week = Math.floor(ms / (7 * 24 * 60 * 60 * 1000));
  return TIERS[Math.min(TIERS.length - 1, Math.max(0, week))];
}

export async function POST(req: Request) {
  if (req.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: products, error } = await admin
    .from("products")
    .select("id, warming_start_date, daily_send_limit")
    .not("warming_start_date", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let updated = 0;
  for (const p of products ?? []) {
    const row = p as { id: string; warming_start_date: string; daily_send_limit: number };
    const start = new Date(row.warming_start_date);
    const target = tierForDate(start);
    if (row.daily_send_limit !== target) {
      await admin
        .from("products")
        .update({ daily_send_limit: target })
        .eq("id", row.id);
      updated++;
    }
  }

  return NextResponse.json({ ok: true, checked: products?.length ?? 0, updated });
}
