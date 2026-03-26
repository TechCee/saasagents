import { redirect } from "next/navigation";
import { CcV2Root } from "@/components/command-center-v2/cc-v2-root";
import { createServerSupabaseClientOptional } from "@/lib/supabase/server";
import { isUiPreviewMode } from "@/lib/ui-preview";
import "@/styles/commandcenter-v2.css";

function trialDaysFromCreated(createdAt: string | null) {
  if (!createdAt) return 9;
  const start = new Date(createdAt).getTime();
  const trialMs = 14 * 24 * 60 * 60 * 1000;
  const end = start + trialMs;
  const left = Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000));
  return Math.max(0, Math.min(14, left));
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (isUiPreviewMode()) {
    return (
      <CcV2Root
        userEmail="clive@trustle.io"
        planLabel="GROWTH"
        trialDaysLeft={9}
        previewBanner={
          <div
            style={{
              borderBottom: "1px solid rgba(255, 186, 8, 0.45)",
              background: "rgba(255, 186, 8, 0.12)",
              padding: "8px 16px",
              textAlign: "center",
              fontFamily: "var(--fm)",
              fontSize: 10,
              color: "var(--amber)",
            }}
          >
            UI PREVIEW MODE — no sign-in or Supabase required. Remove UI_PREVIEW_MODE from .env.local when
            you connect your backend.
          </div>
        }
      >
        {children}
      </CcV2Root>
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

  const { count: leadsTotal } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true });

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("organisation_id")
    .eq("id", user.id)
    .maybeSingle();

  const orgId = (profile as { organisation_id?: string } | null)?.organisation_id;

  let planLabel = "GROWTH";
  let trialDays: number | null = 9;
  if (orgId) {
    const { data: org } = await supabase
      .from("organisations")
      .select("plan_tier, created_at")
      .eq("id", orgId)
      .maybeSingle();
    if (org) {
      const o = org as { plan_tier: string; created_at: string };
      planLabel = o.plan_tier.replace(/_/g, " ").toUpperCase();
      trialDays = trialDaysFromCreated(o.created_at);
    }
  }

  void leadsTotal;

  return (
    <CcV2Root userEmail={user.email ?? "user@local"} planLabel={planLabel} trialDaysLeft={trialDays}>
      {children}
    </CcV2Root>
  );
}
