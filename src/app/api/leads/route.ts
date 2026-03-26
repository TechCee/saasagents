import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const postSchema = z.object({
  product_id: z.string().uuid(),
  email: z.string().email(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company: z.string().optional(),
  job_title: z.string().optional(),
});

/**
 * Creates a lead with cross-product deduplication via `contacts` (v5.1).
 */
export async function POST(req: Request) {
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
  const b = parsed.data;
  const email = b.email.toLowerCase().trim();

  const { data: product } = await supabase
    .from("products")
    .select("organisation_id")
    .eq("id", b.product_id)
    .single();

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const orgId = (product as { organisation_id: string }).organisation_id;

  const { data: existingContact } = await supabase
    .from("contacts")
    .select("id, opted_out")
    .eq("organisation_id", orgId)
    .ilike("email", email)
    .maybeSingle();

  let contactId: string;
  if (existingContact) {
    const c = existingContact as { id: string; opted_out: boolean };
    if (c.opted_out) {
      return NextResponse.json(
        { error: "Contact has opted out for this organisation" },
        { status: 409 },
      );
    }
    contactId = c.id;
    await supabase
      .from("contacts")
      .update({
        first_name: b.first_name ?? undefined,
        last_name: b.last_name ?? undefined,
        company: b.company ?? undefined,
        job_title: b.job_title ?? undefined,
      })
      .eq("id", contactId);
  } else {
    const { data: created, error: cErr } = await supabase
      .from("contacts")
      .insert({
        organisation_id: orgId,
        email,
        first_name: b.first_name ?? null,
        last_name: b.last_name ?? null,
        company: b.company ?? null,
        job_title: b.job_title ?? null,
      })
      .select("id")
      .single();
    if (cErr || !created) {
      return NextResponse.json({ error: cErr?.message ?? "contact insert failed" }, { status: 500 });
    }
    contactId = (created as { id: string }).id;
  }

  const { data: lead, error: lErr } = await supabase
    .from("leads")
    .insert({
      organisation_id: orgId,
      product_id: b.product_id,
      contact_id: contactId,
      email,
      first_name: b.first_name ?? null,
      last_name: b.last_name ?? null,
      company: b.company ?? null,
      job_title: b.job_title ?? null,
      status: "new",
    })
    .select("*")
    .single();

  if (lErr) {
    return NextResponse.json({ error: lErr.message }, { status: 500 });
  }

  return NextResponse.json({ lead, contact_id: contactId });
}
