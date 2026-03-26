import { verifyUnsubscribeToken } from "@/lib/unsubscribe-jwt";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const token = (await searchParams).token;
  if (!token) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 pb-8 pt-[max(2rem,env(safe-area-inset-top))] sm:min-h-screen sm:px-6">
        <h1 className="text-xl font-semibold">Invalid link</h1>
        <p className="mt-2 text-slate-600">This unsubscribe link is missing required data.</p>
      </main>
    );
  }

  let payload;
  try {
    payload = await verifyUnsubscribeToken(token);
  } catch {
    payload = null;
  }

  if (!payload) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 pb-8 pt-[max(2rem,env(safe-area-inset-top))] sm:min-h-screen sm:px-6">
        <h1 className="text-xl font-semibold">Link expired or invalid</h1>
        <p className="mt-2 text-slate-600">Request a fresh unsubscribe link from the sender.</p>
      </main>
    );
  }

  const admin = createAdminClient();
  const email = payload.email;
  const orgId = payload.organisation_id;

  const { data: leads } = await admin
    .from("leads")
    .select("id")
    .eq("organisation_id", orgId)
    .ilike("email", email);

  const leadIds = (leads ?? []).map((l) => (l as { id: string }).id);

  if (leadIds.length) {
    await admin
      .from("leads")
      .update({ status: "opted_out", updated_at: new Date().toISOString() })
      .in("id", leadIds);
    await admin
      .from("email_sequence_enrolments")
      .update({
        status: "unsubscribed",
        completed_at: new Date().toISOString(),
      })
      .eq("organisation_id", orgId)
      .in("lead_id", leadIds)
      .in("status", ["active", "paused"]);
  }

  await admin.from("contacts").update({ opted_out: true }).eq("organisation_id", orgId).ilike("email", email);

  await admin.from("email_suppressions").upsert(
    {
      organisation_id: orgId,
      email,
      reason: "unsubscribed",
    },
    { onConflict: "organisation_id,email" },
  );

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] sm:min-h-screen sm:px-6">
      <h1 className="text-xl font-semibold">You’ve been unsubscribed</h1>
      <p className="mt-2 text-slate-600">
        We’ve removed <span className="font-medium">{email}</span> from marketing emails for this
        organisation. You won’t receive further messages from this sender.
      </p>
    </main>
  );
}
