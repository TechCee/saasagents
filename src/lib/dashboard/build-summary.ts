import type { SupabaseClient } from "@supabase/supabase-js";

export type DashboardAgentRow = {
  agent_type: string;
  display_name: string;
  icon: string;
  icon_color_var: string;
  status: "running" | "success" | "error" | "scheduled" | "idle";
  subtitle: string;
  chip_class: "ch-c" | "ch-g" | "ch-r" | "ch-a";
  chip_label: string;
  dot_class: "run" | "";
};

export type DashboardApproval = {
  kind: "email" | "blog" | "seo";
  title: string;
  subtitle: string;
  accent: "cyan" | "green" | "purple" | "amber";
  age: string;
};

export type DashboardStandupCard = {
  agent_type: string;
  display_name: string;
  accent: string;
  icon: string;
  chip: string;
  chip_class: string;
  chip_dot: boolean;
  sub: string;
  label: string;
  body: string;
};

export type DashboardFeedItem = {
  color: string;
  text: string;
  time: string;
  error?: boolean;
};

export type DashboardSummaryJson = {
  kpis: {
    leads_week: number;
    leads_week_delta: number;
    emails_sent_month: number;
    avg_open_rate: string;
    posts_published_month: number;
    active_enrolments: number;
  };
  agents: DashboardAgentRow[];
  approvals: DashboardApproval[];
  approval_count: number;
  standups: DashboardStandupCard[];
  standups_date_label: string;
  feed: DashboardFeedItem[];
};

const AGENT_META: Record<
  string,
  { display_name: string; icon: string; icon_color_var: string }
> = {
  lead_sourcing: {
    display_name: "Lead Sourcing",
    icon: "◈",
    icon_color_var: "var(--cyan)",
  },
  email_communications: {
    display_name: "Email Comms",
    icon: "◉",
    icon_color_var: "var(--green)",
  },
  blog_content: {
    display_name: "Blog Writer",
    icon: "◇",
    icon_color_var: "var(--purple)",
  },
  seo: { display_name: "SEO Agent", icon: "🌐", icon_color_var: "var(--t2)" },
  standup: {
    display_name: "Standup Agent",
    icon: "☀",
    icon_color_var: "var(--amber)",
  },
  standup_agent: {
    display_name: "Standup Agent",
    icon: "☀",
    icon_color_var: "var(--amber)",
  },
  channel_scout: {
    display_name: "Channel Scout",
    icon: "📡",
    icon_color_var: "var(--t2)",
  },
  orchestrator: {
    display_name: "Synthesis",
    icon: "✦",
    icon_color_var: "var(--cyan)",
  },
  dev_qa: {
    display_name: "Dev / QA",
    icon: "◆",
    icon_color_var: "var(--amber)",
  },
};

export const AGENT_ORDER = [
  "lead_sourcing",
  "email_communications",
  "blog_content",
  "seo",
  "channel_scout",
  "standup",
  "dev_qa",
];

export function formatAgentTypeLabel(type: string): string {
  return (
    AGENT_META[type]?.display_name ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function startOfWeekUTC(d = new Date()) {
  const day = d.getUTCDay();
  const diff = (day + 6) % 7;
  const s = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff),
  );
  s.setUTCHours(0, 0, 0, 0);
  return s;
}

function startOfMonthUTC(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

function relTime(iso: string) {
  const t = new Date(iso).getTime();
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function fmtNextRun(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  return `→ ${d.toISOString().slice(11, 16)} UTC`;
}

export async function buildDashboardSummary(
  supabase: SupabaseClient,
): Promise<DashboardSummaryJson> {
  const weekStart = startOfWeekUTC();
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 7);
  const monthStart = startOfMonthUTC();

  const { count: leadsWeek } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .gte("created_at", weekStart.toISOString());

  const { count: leadsPrevWeek } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .gte("created_at", prevWeekStart.toISOString())
    .lt("created_at", weekStart.toISOString());

  const { count: emailsSentMonth } = await supabase
    .from("email_campaigns")
    .select("*", { count: "exact", head: true })
    .eq("status", "sent")
    .gte("updated_at", monthStart.toISOString());

  const { count: activeEnrol } = await supabase
    .from("email_sequence_enrolments")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { count: postsMonth } = await supabase
    .from("blog_posts")
    .select("*", { count: "exact", head: true })
    .gte("created_at", monthStart.toISOString())
    .in("status", ["published", "posted", "live"]);

  const { data: logs } = await supabase
    .from("agent_logs")
    .select("id, agent_type, status, payload, error_message, created_at")
    .order("created_at", { ascending: false })
    .limit(120);

  const logByType = new Map<
    string,
    {
      status: string;
      created_at: string;
      error_message: string | null;
      payload: unknown;
    }
  >();
  for (const row of logs ?? []) {
    const r = row as {
      agent_type: string;
      status: string;
      created_at: string;
      error_message: string | null;
      payload: unknown;
    };
    if (!logByType.has(r.agent_type)) logByType.set(r.agent_type, r);
  }

  const { data: schedules } = await supabase
    .from("agent_schedules")
    .select("agent_type, next_run_at, cron_expr");

  // #region agent log
  fetch('http://127.0.0.1:7670/ingest/edda1648-0366-438c-9621-378fb5e6374b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'95d6c6'},body:JSON.stringify({sessionId:'95d6c6',runId:'pre-fix',hypothesisId:'H_schedule_rows_exist',location:'src/lib/dashboard/build-summary.ts:220',message:'agent_schedules snapshot',data:{scheduleRowCount:(schedules??[]).length,scheduleTypes:(schedules??[]).slice(0,10).map((r:any)=>String(r.agent_type??'')),scheduleHasCronNext:(schedules??[]).slice(0,10).map((r:any)=>({t:String(r.agent_type??''),hasCron:Boolean(String(r.cron_expr??'').trim()),hasNext:Boolean(r.next_run_at)}))},timestamp:Date.now()})}).catch(()=>{});
  // #endregion agent log

  const scheduleByType = new Map<
    string,
    { next_run_at: string | null; cron_expr: string }
  >();
  for (const s of schedules ?? []) {
    const row = s as {
      agent_type: string;
      next_run_at: string | null;
      cron_expr: string;
    };
    scheduleByType.set(row.agent_type, {
      next_run_at: row.next_run_at,
      cron_expr: row.cron_expr,
    });
  }

  const RUNNING_MS = 20 * 60 * 1000;
  const agents: DashboardAgentRow[] = [];
  for (const type of AGENT_ORDER) {
    const meta = AGENT_META[type] ?? {
      display_name: type.replace(/_/g, " "),
      icon: "◆",
      icon_color_var: "var(--t2)",
    };
    const last = logByType.get(type);
    const sched = scheduleByType.get(type);
    const hasSchedule = Boolean(sched?.cron_expr?.trim()) && Boolean(sched?.next_run_at);
    const age = last
      ? Date.now() - new Date(last.created_at).getTime()
      : Number.POSITIVE_INFINITY;

    let status: DashboardAgentRow["status"] = hasSchedule ? "scheduled" : "idle";
    let chip_class: DashboardAgentRow["chip_class"] = hasSchedule ? "ch-a" : "ch-g";
    let chip_label = hasSchedule ? "SCHEDULED" : "IDLE";
    let dot_class: "" | "run" = "";
    let subtitle = hasSchedule
      ? fmtNextRun(sched?.next_run_at)
      : "Not scheduled";

    if (last) {
      if (last.status === "error") {
        status = "error";
        chip_class = "ch-r";
        chip_label = "ERROR";
        subtitle =
          last.error_message?.slice(0, 42) ||
          (last.payload &&
          typeof last.payload === "object" &&
          "summary" in (last.payload as object)
            ? String((last.payload as { summary?: string }).summary).slice(0, 42)
            : "Failed");
      } else if (age < RUNNING_MS) {
        status = "running";
        chip_class = "ch-c";
        chip_label = "RUNNING";
        dot_class = "run";
        subtitle = relTime(last.created_at);
      } else {
        status = "success";
        chip_class = "ch-g";
        chip_label = "SUCCESS";
        subtitle = fmtNextRun(sched?.next_run_at) || relTime(last.created_at);
      }
    }

    agents.push({
      agent_type: type,
      display_name: meta.display_name,
      icon: meta.icon,
      icon_color_var: meta.icon_color_var,
      status,
      subtitle,
      chip_class,
      chip_label,
      dot_class,
    });
  }

  // #region agent log
  fetch('http://127.0.0.1:7670/ingest/edda1648-0366-438c-9621-378fb5e6374b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'95d6c6'},body:JSON.stringify({sessionId:'95d6c6',runId:'pre-fix',hypothesisId:'H_ui_uses_summary_agents',location:'src/lib/dashboard/build-summary.ts:300',message:'computed agent statuses',data:{agents:agents.map(a=>({t:a.agent_type,s:a.status,sub:a.subtitle}))},timestamp:Date.now()})}).catch(()=>{});
  // #endregion agent log

  const { data: pendingCamp } = await supabase
    .from("email_campaigns")
    .select("id, subject, status, updated_at")
    .in("status", ["pending_approval", "draft"])
    .order("updated_at", { ascending: false })
    .limit(4);

  const { data: draftBlog } = await supabase
    .from("blog_posts")
    .select("id, title, status, updated_at")
    .eq("status", "draft")
    .order("updated_at", { ascending: false })
    .limit(3);

  const { data: openSeo } = await supabase
    .from("seo_recommendations")
    .select("id, title, detail, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(3);

  const approvals: DashboardApproval[] = [];

  let emailHue: "cyan" | "green" = "cyan";
  for (const c of pendingCamp ?? []) {
    const row = c as {
      subject: string;
      status: string;
      updated_at: string;
    };
    const accent: "cyan" | "green" = emailHue;
    emailHue = emailHue === "cyan" ? "green" : "cyan";
    approvals.push({
      kind: "email",
      title: row.subject || "Email campaign",
      subtitle: row.status === "pending_approval" ? "Awaiting approval" : "Draft",
      accent,
      age: relTime(row.updated_at),
    });
  }
  for (const b of draftBlog ?? []) {
    const row = b as { title: string; updated_at: string };
    approvals.push({
      kind: "blog",
      title: row.title,
      subtitle: "Blog draft",
      accent: "purple",
      age: relTime(row.updated_at),
    });
  }
  for (const s of openSeo ?? []) {
    const row = s as { title: string; detail: string | null; created_at: string };
    approvals.push({
      kind: "seo",
      title: row.title,
      subtitle: row.detail?.slice(0, 80) ?? "SEO action",
      accent: "amber",
      age: relTime(row.created_at),
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: standupRows } = await supabase
    .from("agent_standups")
    .select("agent_type, plan_text, actual_text, standup_date")
    .eq("standup_date", today)
    .limit(20);

  const standups: DashboardStandupCard[] = (standupRows ?? []).map((raw) => {
    const r = raw as {
      agent_type: string;
      plan_text: string | null;
      actual_text: string | null;
    };
    const meta = AGENT_META[r.agent_type] ?? {
      display_name: r.agent_type,
      icon: "◇",
      accent: "var(--cyan)",
    };
    const accent =
      r.agent_type === "email_communications"
        ? "var(--green)"
        : r.agent_type === "blog_content"
          ? "var(--purple)"
          : "var(--cyan)";
    const body =
      r.plan_text?.trim() ||
      r.actual_text?.trim() ||
      "No plan recorded yet.";
    return {
      agent_type: r.agent_type,
      display_name: meta.display_name,
      accent,
      icon: meta.icon,
      chip: "TODAY",
      chip_class: "ch-c",
      chip_dot: true,
      sub: "Recorded",
      label: "Plan",
      body: body.slice(0, 220),
    };
  });

  const feed: DashboardFeedItem[] = (logs ?? []).slice(0, 8).map((raw) => {
    const r = raw as {
      agent_type: string;
      status: string;
      payload: unknown;
      error_message: string | null;
      created_at: string;
    };
    const p = r.payload as { summary?: string } | null;
    const snip = p?.summary?.trim().slice(0, 120);
    const meta = AGENT_META[r.agent_type];
    const name = meta?.display_name ?? r.agent_type;
    const text =
      r.status === "error"
        ? `${name}: ${r.error_message ?? "error"}`
        : snip
          ? `${name}: ${snip}${(p?.summary?.length ?? 0) > 120 ? "…" : ""}`
          : `${name} run · ${r.status}`;
    return {
      color:
        r.status === "error"
          ? "var(--red)"
          : r.agent_type === "email_communications"
            ? "var(--green)"
            : "var(--cyan)",
      text,
      time: new Date(r.created_at).toISOString().slice(11, 19) + " UTC",
      error: r.status === "error",
    };
  });

  const lw = leadsWeek ?? 0;
  const lpw = leadsPrevWeek ?? 0;

  return {
    kpis: {
      leads_week: lw,
      leads_week_delta: lw - lpw,
      emails_sent_month: emailsSentMonth ?? 0,
      avg_open_rate: "—",
      posts_published_month: postsMonth ?? 0,
      active_enrolments: activeEnrol ?? 0,
    },
    agents,
    approvals: approvals.slice(0, 6),
    approval_count: approvals.length,
    standups:
      standups.length > 0
        ? standups
        : [
            {
              agent_type: "_placeholder",
              display_name: "No standups yet",
              accent: "var(--t3)",
              icon: "◇",
              chip: "—",
              chip_class: "ch-a",
              chip_dot: false,
              sub: "—",
              label: "Tip",
              body: "Agent standups appear here after runs or when saved from the Standups screen.",
            },
          ],
    standups_date_label: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    }),
    feed:
      feed.length > 0
        ? feed
        : [
            {
              color: "var(--t3)",
              text: "No agent activity yet — run agents from the dashboard.",
              time: "",
            },
          ],
  };
}

