import { redirect } from "next/navigation";
import { CcV2Root } from "@/components/command-center-v2/cc-v2-root";
import { createServerSupabaseClientOptional } from "@/lib/supabase/server";
import { isUiPreviewMode } from "@/lib/ui-preview";
import "@/styles/commandcenter-v2.css";
import { buildDashboardSummary, type DashboardAgentRow } from "@/lib/dashboard/build-summary";

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
          <div className="cc-preview-banner">
            UI PREVIEW MODE — no sign-in or Supabase required. Remove UI_PREVIEW_MODE from .env.local when
            you connect your backend.
          </div>
        }
        navCounts={undefined}
        orgName="—"
        agentStatuses={[
          {
            agent_type: "lead_sourcing",
            display_name: "Lead Sourcing",
            icon: "◈",
            icon_color_var: "var(--cyan)",
            status: "running",
            subtitle: "just now",
            chip_class: "ch-c",
            chip_label: "RUNNING",
            dot_class: "run",
          },
          {
            agent_type: "email_communications",
            display_name: "Email Comms",
            icon: "◉",
            icon_color_var: "var(--green)",
            status: "running",
            subtitle: "just now",
            chip_class: "ch-c",
            chip_label: "RUNNING",
            dot_class: "run",
          },
          {
            agent_type: "blog_content",
            display_name: "Blog Writer",
            icon: "◇",
            icon_color_var: "var(--purple)",
            status: "idle",
            subtitle: "ok",
            chip_class: "ch-g",
            chip_label: "SUCCESS",
            dot_class: "",
          },
          {
            agent_type: "dev_qa",
            display_name: "Dev / QA",
            icon: "◆",
            icon_color_var: "var(--amber)",
            status: "error",
            subtitle: "error",
            chip_class: "ch-r",
            chip_label: "ERROR",
            dot_class: "",
          },
          {
            agent_type: "seo",
            display_name: "SEO Agent",
            icon: "🌐",
            icon_color_var: "var(--t2)",
            status: "idle",
            subtitle: "ok",
            chip_class: "ch-g",
            chip_label: "SUCCESS",
            dot_class: "",
          },
          {
            agent_type: "channel_scout",
            display_name: "Channel Scout",
            icon: "📡",
            icon_color_var: "var(--t2)",
            status: "idle",
            subtitle: "Not scheduled",
            chip_class: "ch-g",
            chip_label: "IDLE",
            dot_class: "",
          },
          {
            agent_type: "standup",
            display_name: "Standup Agent",
            icon: "☀",
            icon_color_var: "var(--amber)",
            status: "idle",
            subtitle: "Not scheduled",
            chip_class: "ch-g",
            chip_label: "IDLE",
            dot_class: "",
          },
        ]}
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
  let navCounts:
    | {
        leads: number;
        campaigns: number;
        followups: number;
        blog: number;
        intelligence: number;
        agentLogs: number;
      }
    | undefined;
  let agentStatuses:
    | DashboardAgentRow[]
    | null
    | undefined;

  let orgName: string | null = null;
  if (orgId) {
    const { data: org } = await supabase
      .from("organisations")
      .select("name, plan_tier, created_at")
      .eq("id", orgId)
      .maybeSingle();
    if (org) {
      const o = org as { name?: string; plan_tier: string; created_at: string };
      orgName = o.name ?? null;
      planLabel = o.plan_tier.replace(/_/g, " ").toUpperCase();
      trialDays = trialDaysFromCreated(o.created_at);
    }

    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    const sinceWeek = new Date(Date.now() - 7 * 86400000).toISOString();

    const [
      leadsRes,
      campaignDraftsRes,
      followupsDueRes,
      blogDraftsRes,
      intelWeekRes,
      logsErrTodayRes,
    ] = await Promise.all([
      supabase.from("leads").select("*", { count: "exact", head: true }),
      supabase
        .from("email_campaigns")
        .select("*", { count: "exact", head: true })
        .in("status", ["draft", "pending_approval"]),
      supabase
        .from("email_sequence_enrolments")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .gte("next_send_at", start.toISOString())
        .lt("next_send_at", end.toISOString()),
      supabase.from("blog_posts").select("*", { count: "exact", head: true }).eq("status", "draft"),
      supabase
        .from("channel_intelligence")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sinceWeek),
      supabase
        .from("agent_logs")
        .select("*", { count: "exact", head: true })
        .eq("status", "error")
        .gte("created_at", start.toISOString()),
    ]);

    navCounts = {
      leads: leadsRes.count ?? 0,
      campaigns: campaignDraftsRes.count ?? 0,
      followups: followupsDueRes.count ?? 0,
      blog: blogDraftsRes.count ?? 0,
      intelligence: intelWeekRes.count ?? 0,
      agentLogs: logsErrTodayRes.count ?? 0,
    };

    const dash = await buildDashboardSummary(supabase);
    agentStatuses = dash.agents;
  }

  void leadsTotal;

  return (
    <CcV2Root
      userEmail={user.email ?? "user@local"}
      planLabel={planLabel}
      trialDaysLeft={trialDays}
      navCounts={navCounts}
      agentStatuses={agentStatuses}
      orgName={orgName}
    >
      {children}
    </CcV2Root>
  );
}
