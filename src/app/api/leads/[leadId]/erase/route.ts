import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ leadId: string }> },
) {
  const { leadId } = await ctx.params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("organisation_id, role")
    .eq("id", user.id)
    .single();

  const orgId = (profile as { organisation_id?: string } | null)?.organisation_id;
  const role = (profile as { role?: string } | null)?.role;
  if (!orgId || !["admin", "super_admin"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: lead } = await supabase
    .from("leads")
    .select("id, email, contact_id")
    .eq("id", leadId)
    .eq("organisation_id", orgId)
    .single();

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const l = lead as { id: string; email: string; contact_id: string | null };
  const admin = createAdminClient();
  const emailLower = l.email.toLowerCase();

  await admin
    .from("leads")
    .update({
      first_name: "[ERASED]",
      last_name: "[ERASED]",
      company: "[ERASED]",
      job_title: "[ERASED]",
      email: `[erased-${l.id}]@invalid`,
      status: "erased",
      updated_at: new Date().toISOString(),
    })
    .eq("id", l.id);

  if (l.contact_id) {
    await admin
      .from("contacts")
      .update({
        first_name: "[ERASED]",
        last_name: "[ERASED]",
        company: "[ERASED]",
        job_title: "[ERASED]",
        email: `[erased-${l.contact_id}]@invalid`,
        opted_out: true,
      })
      .eq("id", l.contact_id);
  }

  await admin.from("email_suppressions").delete().eq("organisation_id", orgId).ilike("email", emailLower);

  await admin.from("email_sequence_enrolments").delete().eq("lead_id", l.id);

  const local = emailLower.split("@")[0] ?? "";
  if (local) {
    await admin
      .from("channel_intelligence")
      .delete()
      .eq("organisation_id", orgId)
      .eq("username", local);
  }
  await admin
    .from("channel_intelligence")
    .delete()
    .eq("organisation_id", orgId)
    .eq("username", emailLower);

  await admin.from("gdpr_erasure_log").insert({
    organisation_id: orgId,
    email_hash: createHash("sha256").update(emailLower).digest("hex"),
    requested_by: user.id,
  });

  return NextResponse.json({ ok: true });
}
