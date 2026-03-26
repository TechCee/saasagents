import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  to: z.string().email(),
  subject: z.string(),
  html: z.string(),
  listUnsubscribeUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not configured — wire Resend for send test." },
      { status: 501 },
    );
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
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const b = parsed.data;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };

  const emailPayload: Record<string, unknown> = {
    from: process.env.ALERT_EMAIL_FROM ?? "OpSync <onboarding@resend.dev>",
    to: [b.to],
    subject: b.subject,
    html: b.html,
  };

  if (b.listUnsubscribeUrl) {
    emailPayload.headers = {
      "List-Unsubscribe": `<${b.listUnsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify(emailPayload),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 502 });
  }

  const data = (await res.json()) as { id?: string };
  return NextResponse.json({ ok: true, id: data.id });
}
