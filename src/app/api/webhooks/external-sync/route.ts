import { createHash, createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Optional inbound webhook: reply/bounce detection from your mail provider or a legacy external system.
 * Core CRM (leads, contacts, sequences) lives in Supabase — this route only updates state from trusted events.
 */

function webhookSecret() {
  return (
    process.env.CRM_SYNC_WEBHOOK_SECRET ||
    process.env.ZOHO_WEBHOOK_SECRET ||
    ""
  );
}

function timingSafeEqualHex(a: string, b: string) {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

function extractEmail(obj: unknown): string | null {
  if (!obj || typeof obj !== "object") return null;
  const r = obj as Record<string, unknown>;
  for (const k of ["Email", "email", "EMAIL"]) {
    if (typeof r[k] === "string" && (r[k] as string).includes("@")) {
      return (r[k] as string).toLowerCase().trim();
    }
  }
  for (const v of Object.values(r)) {
    const found = extractEmail(v);
    if (found) return found;
  }
  return null;
}

function classifyEvent(payload: Record<string, unknown>): "reply" | "bounce" | "unknown" {
  const s = JSON.stringify(payload).toLowerCase();
  if (s.includes("bounce") || s.includes("bounced") || s.includes("invalid"))
    return "bounce";
  if (s.includes("reply") || s.includes("inbound") || s.includes("response")) return "reply";
  return "unknown";
}

function readSignature(req: Request) {
  return (
    req.headers.get("x-webhook-signature") ??
    req.headers.get("x-crm-sync-signature") ??
    req.headers.get("x-zoho-signature") ??
    req.headers.get("x-zoho-webhook-signature") ??
    req.headers.get("zoho-signature")
  );
}

export async function POST(req: Request) {
  const secret = webhookSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "CRM_SYNC_WEBHOOK_SECRET not configured (optional route)" },
      { status: 501 },
    );
  }

  const raw = await req.text();
  const sig = readSignature(req);

  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const sigHex = sig?.replace(/^sha256=/i, "").trim() ?? "";
  const ok = Boolean(sig && timingSafeEqualHex(expected, sigHex));

  if (!ok) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const url = new URL(req.url);
  const organisationId = url.searchParams.get("organisation_id");
  if (!organisationId) {
    return NextResponse.json({ error: "organisation_id query required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const eventType = classifyEvent(payload);
  const email = extractEmail(payload)?.toLowerCase() ?? null;

  await admin.from("external_sync_webhook_log").insert({
    organisation_id: organisationId,
    event_type: eventType,
    payload,
  });

  if (!email) {
    return NextResponse.json({ ok: true, note: "No email in payload" });
  }

  const { data: leads } = await admin
    .from("leads")
    .select("id")
    .eq("organisation_id", organisationId)
    .ilike("email", email);

  const leadIds = (leads ?? []).map((l) => (l as { id: string }).id);

  if (eventType === "reply") {
    if (leadIds.length) {
      await admin
        .from("leads")
        .update({ status: "replied", updated_at: new Date().toISOString() })
        .in("id", leadIds);
      await admin
        .from("email_sequence_enrolments")
        .update({
          status: "replied",
          completed_at: new Date().toISOString(),
        })
        .eq("organisation_id", organisationId)
        .in("lead_id", leadIds)
        .eq("status", "active");
    }
  } else if (eventType === "bounce") {
    await admin.from("email_suppressions").upsert(
      {
        organisation_id: organisationId,
        email,
        reason: "hard_bounce",
      },
      { onConflict: "organisation_id,email" },
    );
    if (leadIds.length) {
      await admin
        .from("leads")
        .update({ status: "invalid", updated_at: new Date().toISOString() })
        .in("id", leadIds);
      await admin
        .from("email_sequence_enrolments")
        .update({
          status: "bounced",
          completed_at: new Date().toISOString(),
        })
        .eq("organisation_id", organisationId)
        .in("lead_id", leadIds);
    }
  }

  return NextResponse.json({
    ok: true,
    eventType,
    emailHash: createHash("sha256").update(email).digest("hex"),
  });
}
