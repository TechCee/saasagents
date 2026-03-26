import type { SupabaseClient } from "@supabase/supabase-js";
import type { CommandCenterPage } from "@/lib/command-center/page-types";
import { escHtml } from "@/lib/html-escape";
import {
  buildDashboardSummary,
  formatAgentTypeLabel,
} from "@/lib/dashboard/build-summary";

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

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toISOString().slice(11, 19);
}

function stripHtml(html: string, max = 4000): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export async function buildCommandCenterPageData(
  supabase: SupabaseClient,
  page: CommandCenterPage,
  env: { appUrl: string; openaiConfigured: boolean },
): Promise<Record<string, unknown>> {
  switch (page) {
    case "leads":
      return buildLeads(supabase);
    case "campaigns":
      return buildCampaigns(supabase);
    case "emailpreview":
      return buildEmailPreview(supabase);
    case "followups":
      return buildFollowups(supabase);
    case "blog":
      return buildBlog(supabase);
    case "seo":
      return buildSeo(supabase);
    case "intelligence":
      return buildIntelligence(supabase);
    case "memory":
      return buildMemory(supabase);
    case "logs":
      return buildLogs(supabase);
    case "standups":
      return buildStandups(supabase);
    case "agents":
      return buildAgents(supabase);
    case "scheduler":
      return buildScheduler(supabase);
    case "products":
      return buildProducts(supabase);
    case "branding":
      return buildBranding(supabase);
    case "users":
      return buildUsers(supabase);
    case "settings":
      return buildSettings(supabase, env.appUrl, env.openaiConfigured);
    case "billing":
      return buildBilling(supabase);
    case "superadmin":
      return buildSuperAdmin(supabase);
    default:
      return {};
  }
}

async function buildLeads(supabase: SupabaseClient) {
  const weekStart = startOfWeekUTC();
  const { count: total } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true });
  const { count: weekN } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .gte("created_at", weekStart.toISOString());
  const { count: qualified } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .gte("score", 70);
  const { count: inSeq } = await supabase
    .from("email_sequence_enrolments")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");
  const { count: replied } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("status", "replied");
  const { count: opted } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("status", "opted_out");

  const { data: rows } = await supabase
    .from("leads")
    .select(
      "id, email, first_name, last_name, company, job_title, status, score, updated_at, products(name)",
    )
    .order("updated_at", { ascending: false })
    .limit(50);

  const leads = (rows ?? []).map((r: Record<string, unknown>) => {
    const prod = r.products as { name?: string } | null;
    const fn = (r.first_name as string) || "";
    const ln = (r.last_name as string) || "";
    const name = `${fn} ${ln}`.trim() || (r.email as string);
    const sc = Number(r.score ?? 0);
    const w = Math.min(100, Math.max(0, sc));
    const barColor =
      sc >= 70 ? "var(--green)" : sc >= 50 ? "var(--amber)" : "var(--red)";
    return {
      id: r.id as string,
      name,
      title: (r.job_title as string) || "—",
      company: (r.company as string) || "—",
      product: prod?.name ?? "—",
      source: (r as { external_lead_ref?: string }).external_lead_ref || "—",
      score: sc,
      score_width: w,
      bar_color: barColor,
      status: String(r.status || "new").toUpperCase(),
      sequence: "—",
      last_contact: fmtDate(r.updated_at as string),
    };
  });

  const tot = total ?? 0;
  const qPct = tot > 0 ? Math.round(((qualified ?? 0) / tot) * 100) : 0;
  return {
    kpis: {
      total: tot,
      total_delta: `+${weekN ?? 0} this week`,
      qualified: qualified ?? 0,
      qualified_delta: `${qPct}% of total`,
      in_sequence: inSeq ?? 0,
      replied: replied ?? 0,
      reply_rate: tot > 0 ? `${(((replied ?? 0) / tot) * 100).toFixed(1)}%` : "—",
      opted_out: opted ?? 0,
    },
    leads,
    footer: `Showing ${leads.length} of ${tot} leads`,
  };
}

async function buildCampaigns(supabase: SupabaseClient) {
  const monthStart = startOfMonthUTC();
  const { count: drafts } = await supabase
    .from("email_campaigns")
    .select("*", { count: "exact", head: true })
    .in("status", ["draft", "pending_approval"]);
  const { count: sentMonth } = await supabase
    .from("email_campaigns")
    .select("*", { count: "exact", head: true })
    .eq("status", "sent")
    .gte("updated_at", monthStart.toISOString());
  const { count: seqActive } = await supabase
    .from("email_sequences")
    .select("*", { count: "exact", head: true })
    .eq("active", true);
  const { count: enrol } = await supabase
    .from("email_sequence_enrolments")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { data: camps } = await supabase
    .from("email_campaigns")
    .select(
      "id, subject, preview_text, status, recipient_lead_ids, updated_at, products(name)",
    )
    .order("updated_at", { ascending: false })
    .limit(40);

  const rows = (camps ?? []).map((c: Record<string, unknown>) => {
    const prod = c.products as { name?: string } | null;
    const rec = (c.recipient_lead_ids as string[])?.length ?? 0;
    const st = String(c.status || "draft").toUpperCase();
    return {
      title: (c.subject as string) || "Untitled campaign",
      subtitle: ((c.preview_text as string) || "").slice(0, 80) || "—",
      product: prod?.name ?? "—",
      status: st,
      recipients: rec,
      open: "—",
      reply: "—",
      fus: "—",
      created: fmtDate(c.updated_at as string),
    };
  });

  return {
    kpis: {
      drafts: drafts ?? 0,
      sent_month: sentMonth ?? 0,
      open_rate: "—",
      reply_rate: "—",
      sequences: seqActive ?? 0,
      enrolments: enrol ?? 0,
    },
    draft_tab_badge: drafts ?? 0,
    campaigns: rows,
  };
}

async function buildEmailPreview(supabase: SupabaseClient) {
  const { data: camp } = await supabase
    .from("email_campaigns")
    .select(
      "id, subject, preview_text, body_html, from_address, recipient_lead_ids, products(name)",
    )
    .in("status", ["draft", "pending_approval", "scheduled"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!camp) {
    return {
      title: "No draft campaign",
      subject_a: "",
      subject_b: "",
      preview_text: "",
      from_addr: "—",
      recipients: "0 leads",
      body_html:
        "<p style='padding:20px;color:var(--t3)'>Create a campaign under Campaigns to preview it here.</p>",
      subj_line: "No subject",
      prev_line: "",
    };
  }

  const c = camp as Record<string, unknown>;
  const prod = c.products as { name?: string } | null;
  const rec = (c.recipient_lead_ids as string[])?.length ?? 0;
  const body = (c.body_html as string) || "";
  const safeBody =
    body.trim() ||
    `<p style="color:var(--t2)">${escHtml(stripHtml(String(c.preview_text || "")))}</p>`;

  return {
    title: `${(c.subject as string)?.slice(0, 42) || "Campaign"} — ${prod?.name ?? "Product"}`,
    subject_a: c.subject as string,
    subject_b: "",
    preview_text: (c.preview_text as string) || "",
    from_addr: (c.from_address as string) || "—",
    recipients: `${rec} leads · ${prod?.name ?? ""}`,
    body_html: safeBody,
    subj_line: (c.subject as string) || "—",
    prev_line: (c.preview_text as string) || "",
  };
}

async function buildFollowups(supabase: SupabaseClient) {
  const { count: active } = await supabase
    .from("email_sequence_enrolments")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");
  const { count: replied } = await supabase
    .from("email_sequence_enrolments")
    .select("*", { count: "exact", head: true })
    .eq("status", "replied");
  const { count: done } = await supabase
    .from("email_sequence_enrolments")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  const { count: dueToday } = await supabase
    .from("email_sequence_enrolments")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .gte("next_send_at", start.toISOString())
    .lt("next_send_at", end.toISOString());

  const { data: enrolRows } = await supabase
    .from("email_sequence_enrolments")
    .select(
      "id, current_step, status, next_send_at, leads(email, first_name, last_name, job_title, company, products(name)), email_sequences(name)",
    )
    .order("next_send_at", { ascending: true, nullsFirst: false })
    .limit(40);

  const tracker = (enrolRows ?? []).map((raw: Record<string, unknown>) => {
    const L = raw.leads as Record<string, unknown> | null;
    const fn = (L?.first_name as string) || "";
    const ln = (L?.last_name as string) || "";
    const name = `${fn} ${ln}`.trim() || String(L?.email || "—");
    const sub = [L?.job_title, L?.company].filter(Boolean).join(" · ") || "—";
    const seq = raw.email_sequences as { name?: string } | null;
    const prod = L?.products as { name?: string } | null;
    const st = String(raw.status || "").toUpperCase();
    const step = `Step ${raw.current_step ?? 0}`;
    return {
      name,
      sub,
      product: prod?.name?.slice(0, 8) ?? "—",
      campaign: seq?.name?.slice(0, 14) ?? "—",
      step,
      tone: "—",
      status: st,
      next_due: raw.next_send_at
        ? fmtDate(raw.next_send_at as string)
        : "—",
    };
  });

  return {
    kpis: {
      active: active ?? 0,
      replied: replied ?? 0,
      exhausted: done ?? 0,
      due_today: dueToday ?? 0,
    },
    tracker,
  };
}

async function buildBlog(supabase: SupabaseClient) {
  const { count: drafts } = await supabase
    .from("blog_posts")
    .select("*", { count: "exact", head: true })
    .eq("status", "draft");
  const { count: published } = await supabase
    .from("blog_posts")
    .select("*", { count: "exact", head: true })
    .in("status", ["published", "posted", "live"]);
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, slug, body_md, status, created_at, products(name)")
    .order("updated_at", { ascending: false })
    .limit(24);

  let wordSum = 0;
  let wordN = 0;
  const cards = (posts ?? []).map((p: Record<string, unknown>) => {
    const md = (p.body_md as string) || "";
    const words = md.trim() ? md.trim().split(/\s+/).length : 0;
    if (words) {
      wordSum += words;
      wordN++;
    }
    const prod = p.products as { name?: string } | null;
    const st = String(p.status).toUpperCase();
    const isDraft = p.status === "draft";
    return {
      title: p.title as string,
      product: prod?.name ?? "—",
      status: st,
      border: isDraft ? "var(--amber)" : "var(--green)",
      chip_class: isDraft ? "ch-a" : "ch-g",
      excerpt: stripHtml(md, 220) || "—",
      meta: `${words || "—"} words`,
      date: fmtDate(p.created_at as string),
    };
  });

  const avgWords = wordN > 0 ? Math.round(wordSum / wordN) : 0;

  return {
    kpis: {
      drafts: drafts ?? 0,
      published: published ?? 0,
      avg_words: avgWords,
      seo_ready: published ?? 0,
    },
    draft_badge: drafts ?? 0,
    posts: cards,
  };
}

async function buildSeo(supabase: SupabaseClient) {
  const { count: open } = await supabase
    .from("seo_recommendations")
    .select("*", { count: "exact", head: true })
    .eq("status", "open");
  const { data: recs } = await supabase
    .from("seo_recommendations")
    .select("id, title, detail, status")
    .order("created_at", { ascending: false })
    .limit(12);
  const { data: reports } = await supabase
    .from("seo_reports")
    .select("report_week, summary, products(name)")
    .order("created_at", { ascending: false })
    .limit(3);

  const recommendations = (recs ?? []).map((r: Record<string, unknown>) => ({
    title: r.title as string,
    detail: ((r.detail as string) || "").slice(0, 120),
    priority: "HIGH",
  }));

  const rankRows: { pos: string; url: string; title: string }[] = [];
  for (const rep of reports ?? []) {
    const R = rep as { summary?: Record<string, unknown>; products?: { name?: string } };
    const s = R.summary;
    if (s && typeof s.pages === "object" && Array.isArray(s.pages)) {
      for (const p of s.pages as { position?: number; url?: string; title?: string }[]) {
        rankRows.push({
          pos: String(p.position ?? "—"),
          url: p.url || "—",
          title: p.title || "—",
        });
      }
    }
  }
  if (rankRows.length === 0) {
    rankRows.push({
      pos: "—",
      url: "Add SEO report data",
      title: "Run SEO agent or import GSC summary into seo_reports.summary",
    });
  }

  return {
    kpis: {
      avg_pos: "—",
      impressions: "—",
      clicks: "—",
      open_actions: open ?? 0,
    },
    recommendations,
    rank_rows: rankRows.slice(0, 6),
  };
}

async function buildIntelligence(supabase: SupabaseClient) {
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const { count: week } = await supabase
    .from("channel_intelligence")
    .select("*", { count: "exact", head: true })
    .gte("created_at", since);
  const { count: pain } = await supabase
    .from("channel_intelligence")
    .select("*", { count: "exact", head: true })
    .ilike("category", "%pain%");
  const { data: rows } = await supabase
    .from("channel_intelligence")
    .select("id, channel, title, excerpt, category, relevance_score, products(name)")
    .order("created_at", { ascending: false })
    .limit(20);

  const feed = (rows ?? []).map((r: Record<string, unknown>) => {
    const prod = r.products as { name?: string } | null;
    const cat = String(r.category || "SIGNAL").toUpperCase();
    return {
      cat,
      channel: r.channel as string,
      score: Number(r.relevance_score ?? 0),
      product: prod?.name?.slice(0, 12) ?? "—",
      title: (r.title as string) || "—",
      body: ((r.excerpt as string) || "").slice(0, 280),
    };
  });

  return {
    kpis: {
      findings_week: week ?? 0,
      pain: pain ?? 0,
      warm: Math.min(feed.length, 5),
      competitor: 0,
      trending: 0,
    },
    feed,
    warm: feed.slice(0, 4),
  };
}

async function buildMemory(supabase: SupabaseClient) {
  const { count: total } = await supabase
    .from("agent_memories")
    .select("*", { count: "exact", head: true });
  const { data: mems } = await supabase
    .from("agent_memories")
    .select("id, agent_type, source, content, importance, created_at")
    .order("created_at", { ascending: false })
    .limit(25);

  const recent = (mems ?? []).map((m: Record<string, unknown>) => ({
    type: String(m.source || "memory").toUpperCase(),
    agent: formatAgentTypeLabel(m.agent_type as string),
    importance: m.importance as number,
    body: ((m.content as string) || "").slice(0, 240),
    date: fmtDate(m.created_at as string),
  }));

  return {
    kpis: {
      total: total ?? 0,
      decision: "—",
      intel: "—",
    },
    recent,
  };
}

async function buildLogs(supabase: SupabaseClient) {
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const monthStart = startOfMonthUTC();

  const { data: logs } = await supabase
    .from("agent_logs")
    .select(
      "id, agent_type, status, payload, error_message, estimated_cost_usd, created_at, products(name)",
    )
    .order("created_at", { ascending: false })
    .limit(80);

  const { data: dayRows } = await supabase
    .from("agent_logs")
    .select("estimated_cost_usd")
    .gte("created_at", dayStart.toISOString());
  const { data: monthRows } = await supabase
    .from("agent_logs")
    .select("estimated_cost_usd")
    .gte("created_at", monthStart.toISOString());

  const sumUsd = (rows: { estimated_cost_usd?: string | number }[] | null) =>
    (rows ?? []).reduce((a, r) => a + Number(r.estimated_cost_usd ?? 0), 0);

  const daySpend = sumUsd(dayRows as { estimated_cost_usd?: string }[]);
  const monthSpend = sumUsd(monthRows as { estimated_cost_usd?: string }[]);

  const { count: totalEntries } = await supabase
    .from("agent_logs")
    .select("*", { count: "exact", head: true });

  const { data: lim } = await supabase
    .from("org_spend_limits")
    .select("daily_spend_limit_usd, monthly_spend_limit_usd")
    .maybeSingle();

  const limitRow = lim as {
    daily_spend_limit_usd?: number;
    monthly_spend_limit_usd?: number;
  } | null;
  const dailyLimit = Number(limitRow?.daily_spend_limit_usd ?? 5);
  const monthlyLimit = Number(limitRow?.monthly_spend_limit_usd ?? 50);

  const entries = (logs ?? []).map((r: Record<string, unknown>) => {
    const prod = r.products as { name?: string } | null;
    const p = r.payload as { summary?: string } | null;
    const summary = p?.summary
      ? String(p.summary).slice(0, 90)
      : (r.error_message as string)?.slice(0, 90) || r.status;
    return {
      time: fmtTime(r.created_at as string),
      agent: formatAgentTypeLabel(r.agent_type as string),
      product: prod?.name?.slice(0, 10) ?? "—",
      type: "RUN",
      status: String(r.status || "").toUpperCase(),
      duration: "—",
      records: "—",
      cost: Number(r.estimated_cost_usd ?? 0).toFixed(4),
      summary,
      error: r.status === "error",
    };
  });

  return {
    header: {
      today: daySpend.toFixed(3),
      month: monthSpend.toFixed(2),
      month_limit: monthlyLimit.toFixed(2),
      total_entries: totalEntries ?? 0,
      daily_limit: dailyLimit.toFixed(2),
    },
    entries,
  };
}

type StandupRow = {
  agent_type: string;
  plan_text: string | null;
  actual_text: string | null;
  standup_date: string;
};

async function buildStandups(supabase: SupabaseClient) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: rows } = await supabase
    .from("agent_standups")
    .select("agent_type, plan_text, actual_text, standup_date")
    .gte("standup_date", today)
    .order("standup_date", { ascending: false })
    .limit(20);

  const { data: recent } = await supabase
    .from("agent_standups")
    .select("agent_type, plan_text, actual_text, standup_date")
    .order("standup_date", { ascending: false })
    .limit(30);

  const byType = new Map<string, StandupRow>();
  for (const r of recent ?? []) {
    const row = r as StandupRow;
    if (!byType.has(row.agent_type)) byType.set(row.agent_type, row);
  }

  const cards = (rows ?? []).length
    ? (rows as Record<string, unknown>[]).map((r) => ({
        agent_type: r.agent_type,
        name: formatAgentTypeLabel(r.agent_type as string),
        plan: String(r.plan_text || "").slice(0, 400),
        actual: String(r.actual_text || "").slice(0, 400),
        date: r.standup_date as string,
      }))
    : Array.from(byType.entries()).map(([, r]) => {
        const row = r as Record<string, unknown>;
        return {
          agent_type: row.agent_type,
          name: formatAgentTypeLabel(row.agent_type as string),
          plan: String(row.plan_text || "No plan saved.").slice(0, 400),
          actual: String(row.actual_text || "").slice(0, 400),
          date: row.standup_date as string,
        };
      });

  return {
    date_label: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    cards,
  };
}

async function buildAgents(supabase: SupabaseClient) {
  const summary = await buildDashboardSummary(supabase);
  const { data: customs } = await supabase
    .from("custom_agents")
    .select("id, name, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  const memoryCounts: Record<string, number> = {};
  const { data: mc } = await supabase
    .from("agent_memories")
    .select("agent_type");
  for (const row of mc ?? []) {
    const t = (row as { agent_type: string }).agent_type;
    memoryCounts[t] = (memoryCounts[t] || 0) + 1;
  }

  const builtin = summary.agents.map((a) => ({
    ...a,
    mem_count: memoryCounts[a.agent_type] ?? 0,
  }));

  return {
    builtin,
    custom: (customs ?? []).map((c: Record<string, unknown>) => ({
      id: c.id as string,
      name: c.name as string,
    })),
  };
}

async function buildScheduler(supabase: SupabaseClient) {
  const { data: rows } = await supabase
    .from("agent_schedules")
    .select(
      "id, agent_type, cron_expr, next_run_at, products(name), created_at",
    )
    .order("created_at", { ascending: false });

  const schedules = (rows ?? []).map((r: Record<string, unknown>) => {
    const prod = r.products as { name?: string } | null;
    return {
      agent: formatAgentTypeLabel(r.agent_type as string),
      agent_type: r.agent_type as string,
      cron: r.cron_expr as string,
      product: prod?.name ?? "—",
      next: r.next_run_at
        ? new Date(r.next_run_at as string).toISOString().slice(11, 16) + " UTC"
        : "—",
    };
  });

  return { schedules };
}

async function buildProducts(supabase: SupabaseClient) {
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug")
    .order("name", { ascending: true });

  const cards: Record<string, unknown>[] = [];
  for (const p of products ?? []) {
    const pr = p as { id: string; name: string; slug: string };
    const { count: lc } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("product_id", pr.id);
    const { count: ec } = await supabase
      .from("email_campaigns")
      .select("*", { count: "exact", head: true })
      .eq("product_id", pr.id)
      .eq("status", "sent");
    const { count: bc } = await supabase
      .from("blog_posts")
      .select("*", { count: "exact", head: true })
      .eq("product_id", pr.id);
    const initials = pr.name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    cards.push({
      id: pr.id,
      name: pr.name,
      slug: pr.slug,
      initials,
      leads: lc ?? 0,
      emails: ec ?? 0,
      posts: bc ?? 0,
    });
  }

  return { products: cards };
}

async function buildBranding(supabase: SupabaseClient) {
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .order("name", { ascending: true });
  const firstId = (products?.[0] as { id?: string })?.id;
  if (!firstId) {
    return {
      products: [],
      title: "Email Branding",
      branding: null,
    };
  }
  const { data: branding } = await supabase
    .from("product_branding")
    .select("*")
    .eq("product_id", firstId)
    .maybeSingle();
  const prodName = (products?.[0] as { name?: string })?.name ?? "Product";
  return {
    products: (products ?? []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      name: p.name as string,
    })),
    title: `Email Branding — ${prodName}`,
    branding: branding ?? null,
    product_id: firstId,
  };
}

async function buildUsers(supabase: SupabaseClient) {
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, display_name, email, role, created_at")
    .order("created_at", { ascending: true });

  const rows = (profiles ?? []).map((r: Record<string, unknown>) => {
    const name =
      (r.display_name as string) ||
      (r.email as string)?.split("@")[0] ||
      "User";
    const parts = name.split(/\s+/).filter(Boolean);
    const av =
      parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase();
    return {
      name,
      email: (r.email as string) || "—",
      role: String(r.role || "member").replace(/_/g, " ").toUpperCase(),
      av,
    };
  });

  const { count: seats } = await supabase
    .from("user_profiles")
    .select("*", { count: "exact", head: true });

  return { users: rows, seat_label: `${seats ?? 0} team members` };
}

async function buildSettings(
  supabase: SupabaseClient,
  appUrl: string,
  openaiConfigured: boolean,
) {
  const { data: org } = await supabase
    .from("organisations")
    .select("id, name, plan_tier, settings")
    .maybeSingle();
  const { data: spend } = await supabase
    .from("org_spend_limits")
    .select("daily_spend_limit_usd, monthly_spend_limit_usd, agents_paused")
    .maybeSingle();
  const monthStart = startOfMonthUTC();
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const { data: dayLogs } = await supabase
    .from("agent_logs")
    .select("estimated_cost_usd")
    .gte("created_at", dayStart.toISOString());
  const { data: monthLogs } = await supabase
    .from("agent_logs")
    .select("estimated_cost_usd")
    .gte("created_at", monthStart.toISOString());
  const sum = (rows: { estimated_cost_usd?: string }[] | null) =>
    (rows ?? []).reduce((a, r) => a + Number(r.estimated_cost_usd ?? 0), 0);
  const today = sum(dayLogs as { estimated_cost_usd?: string }[]);
  const month = sum(monthLogs as { estimated_cost_usd?: string }[]);
  const O = org as { name?: string } | null;
  const S = spend as {
    daily_spend_limit_usd?: number;
    monthly_spend_limit_usd?: number;
  } | null;

  return {
    org_name: O?.name ?? "—",
    webhook_url: `${appUrl.replace(/\/$/, "")}/api/webhooks/external-sync`,
    daily_limit: String(S?.daily_spend_limit_usd ?? 5),
    monthly_limit: String(S?.monthly_spend_limit_usd ?? 50),
    spend_today: today.toFixed(3),
    spend_month: month.toFixed(2),
    openai_configured: openaiConfigured,
  };
}

async function buildBilling(supabase: SupabaseClient) {
  const { data: org } = await supabase
    .from("organisations")
    .select("plan_tier, created_at, cancelled_at")
    .maybeSingle();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .maybeSingle();
  const monthStart = startOfMonthUTC();
  const { data: monthLogs } = await supabase
    .from("agent_logs")
    .select("estimated_cost_usd")
    .gte("created_at", monthStart.toISOString());
  const monthSpend = (monthLogs ?? []).reduce(
    (a, r) => a + Number((r as { estimated_cost_usd?: string }).estimated_cost_usd ?? 0),
    0,
  );
  const O = org as { plan_tier?: string; created_at?: string } | null;
  const plan = (O?.plan_tier ?? "growth").replace(/_/g, " ").toUpperCase();
  return {
    plan,
    status: (sub as { status?: string } | null)?.status ?? "inactive",
    month_spend: monthSpend.toFixed(2),
  };
}

async function buildSuperAdmin(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { access: "none" as const };
  const { data: me } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = (me as { role?: string } | null)?.role;
  if (role !== "super_admin") {
    return { access: "org_only" as const };
  }
  const { data: orgs } = await supabase
    .from("organisations")
    .select("id, name, plan_tier, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { count: errorWeek } = await supabase
    .from("agent_logs")
    .select("*", { count: "exact", head: true })
    .eq("status", "error")
    .gte("created_at", weekAgo);

  return {
    access: "full" as const,
    tenant_count: orgs?.length ?? 0,
    error_week: errorWeek ?? 0,
    organisations: (orgs ?? []).map((o: Record<string, unknown>) => ({
      id: o.id as string,
      name: o.name as string,
      plan: String(o.plan_tier || "").replace(/_/g, " ").toUpperCase(),
    })),
  };
}
