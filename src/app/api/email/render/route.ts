import { NextResponse } from "next/server";
import { z } from "zod";
import {
  renderMasterEmailTemplate,
  type BrandingRow,
  type StructuredEmail,
} from "@/lib/email/render-html";
import { signUnsubscribeToken } from "@/lib/unsubscribe-jwt";

const schema = z.object({
  organisationId: z.string().uuid(),
  productName: z.string(),
  branding: z.record(z.string(), z.unknown()),
  structured: z.object({
    subject: z.string(),
    preview_text: z.string(),
    greeting: z.string(),
    body_html_content: z.string(),
    cta_text: z.string(),
    cta_url: z.string(),
    ps_line: z.string().optional().nullable(),
  }),
  personalisation: z.record(z.string(), z.string()).optional(),
  emailForUnsubscribe: z.string().email(),
  darkMode: z.boolean().optional(),
});

export async function POST(req: Request) {
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
  const branding = b.branding as unknown as BrandingRow;
  const structured = b.structured as StructuredEmail;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const token = await signUnsubscribeToken({
    email: b.emailForUnsubscribe.toLowerCase(),
    organisation_id: b.organisationId,
  });
  const unsubscribeUrl = `${appUrl}/unsubscribe?token=${encodeURIComponent(token)}`;
  const html = renderMasterEmailTemplate({
    productName: b.productName,
    branding,
    structured,
    unsubscribeUrl,
    personalisation: b.personalisation,
    darkMode: b.darkMode,
  });
  return NextResponse.json({ html, unsubscribeUrl });
}
