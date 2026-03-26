import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductWorkspace } from "./product-workspace";
import { createServerSupabaseClientOptional } from "@/lib/supabase/server";
import { isUiPreviewMode } from "@/lib/ui-preview";

const DEMO_ORG = "00000000-0000-0000-0000-000000000001";
const DEMO_PRODUCT = "00000000-0000-0000-0000-000000000002";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  if (isUiPreviewMode()) {
    return (
      <div>
        <div className="border-b border-[var(--cc-border)] px-6 py-2 text-center font-mono text-[10px] text-[var(--cc-muted)]">
          Sample branding workspace —{" "}
          <Link href="/products" className="text-[var(--cc-cyan)] hover:underline">
            Back to products
          </Link>
        </div>
        <ProductWorkspace
          productId={productId || DEMO_PRODUCT}
          organisationId={DEMO_ORG}
          productName="Demo product"
          outboundSenderEmail="hello@yourdomain.com"
          adminEmail="preview@commandcenter.local"
          serverBranding={null}
        />
      </div>
    );
  }

  const supabase = await createServerSupabaseClientOptional();
  if (!supabase) {
    redirect("/?needs=backend");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: product, error } = await supabase
    .from("products")
    .select("id, name, organisation_id, outbound_sender_email")
    .eq("id", productId)
    .single();

  if (error || !product) {
    return (
      <main className="p-8">
        <p className="text-[var(--cc-muted)]">Product not found or Supabase not configured.</p>
      </main>
    );
  }

  const p = product as {
    id: string;
    name: string;
    organisation_id: string;
    outbound_sender_email: string | null;
  };

  const { data: branding } = await supabase
    .from("product_branding")
    .select("*")
    .eq("product_id", productId)
    .maybeSingle();

  return (
    <ProductWorkspace
      productId={p.id}
      organisationId={p.organisation_id}
      productName={p.name}
      outboundSenderEmail={p.outbound_sender_email}
      adminEmail={user.email ?? "admin@example.com"}
      serverBranding={(branding as Record<string, unknown> | null) ?? null}
    />
  );
}
