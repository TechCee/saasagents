import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const patchSchema = z.object({
  primary_color: z.string().optional(),
  secondary_color: z.string().optional(),
  background_color: z.string().optional(),
  text_color: z.string().optional(),
  header_logo_url: z.string().nullable().optional(),
  header_logo_width: z.number().int().optional(),
  font_family: z.string().optional(),
  button_style: z.enum(["rounded", "square", "pill"]).optional(),
  footer_company_name: z.string().nullable().optional(),
  footer_address: z.string().nullable().optional(),
  footer_links_json: z
    .array(z.object({ label: z.string(), url: z.string() }))
    .optional(),
  social_links_json: z.record(z.string(), z.string()).optional(),
  email_signature: z.string().nullable().optional(),
  preview_text_prefix: z.string().nullable().optional(),
  channel_scout_auto_lead_enabled: z.boolean().optional(),
  channel_scout_auto_lead_threshold: z.number().optional().nullable(),
});

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ productId: string }> },
) {
  const { productId } = await ctx.params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: branding, error } = await supabase
    .from("product_branding")
    .select("*")
    .eq("product_id", productId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ branding });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ productId: string }> },
) {
  const { productId } = await ctx.params;
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
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: product } = await supabase
    .from("products")
    .select("id, organisation_id")
    .eq("id", productId)
    .single();

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const p = product as { id: string; organisation_id: string };

  const { data: existing } = await supabase
    .from("product_branding")
    .select("id")
    .eq("product_id", productId)
    .maybeSingle();

  const body = parsed.data;
  if (existing) {
    const { data, error } = await supabase
      .from("product_branding")
      .update(body)
      .eq("product_id", productId)
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ branding: data });
  }

  const insertRow = {
    organisation_id: p.organisation_id,
    product_id: p.id,
    ...body,
  };

  const { data, error } = await supabase
    .from("product_branding")
    .insert(insertRow)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ branding: data });
}
