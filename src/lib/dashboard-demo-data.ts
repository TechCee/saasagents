import type { EnrolmentRow } from "@/components/command-center/dashboard-enrolments";

export type DashboardLogRow = {
  agent_type: string;
  status: string;
  created_at: string;
  estimated_cost_usd: number | null;
  product_id: string | null;
  payload: unknown;
  products: { name: string } | null;
  duration_sec?: number | null;
};

export type AgentStatusRow = {
  type: string;
  label: string;
  /** Maps to RUNNING | SUCCESS | ERROR | SCHEDULED */
  pill: "running" | "success" | "error" | "scheduled";
  lastRun: string;
  nextRun: string;
  progress: number;
};

export type StandupCard = {
  title: string;
  plan: string;
  lastCompleted: string;
};

export type PendingApprovalItem = {
  id: string;
  title: string;
  subtitle?: string;
};

export type EnrolTabCounts = {
  active: number;
  replied: number;
  exhausted: number;
  bounced: number;
};

export type DashboardLoadedData = {
  leadsWeek: number;
  emailsSent: number;
  postsPub: number;
  enrolActive: number;
  enrolTabCounts: EnrolTabCounts;
  pending: PendingApprovalItem[];
  pendingCount: number;
  standups: StandupCard[];
  enrolRows: EnrolmentRow[];
  logs: DashboardLogRow[];
  agentRows: AgentStatusRow[];
};

const now = new Date();

export function getDemoDashboardData(): DashboardLoadedData {
  const iso = (minsAgo: number) =>
    new Date(now.getTime() - minsAgo * 60 * 1000).toISOString();

  const logs: DashboardLogRow[] = [
    {
      agent_type: "lead_sourcing",
      status: "success",
      created_at: iso(12),
      estimated_cost_usd: 0.0214,
      product_id: null,
      duration_sec: 84,
      payload: {
        leads_sourced: 20,
        summary: "20 leads sourced — synced to internal CRM.",
      },
      products: { name: "Trustle" },
    },
    {
      agent_type: "email_communications",
      status: "success",
      created_at: iso(45),
      estimated_cost_usd: 0.0189,
      duration_sec: 132,
      product_id: null,
      payload: { summary: "Draft campaign queued for approval." },
      products: { name: "Process Pilots" },
    },
    {
      agent_type: "blog_content",
      status: "success",
      created_at: iso(120),
      estimated_cost_usd: 0.112,
      duration_sec: 240,
      product_id: null,
      payload: { summary: "Long-form draft: onboarding automation." },
      products: { name: "Trustle" },
    },
    {
      agent_type: "seo",
      status: "success",
      created_at: iso(400),
      estimated_cost_usd: 0.0098,
      duration_sec: 56,
      product_id: null,
      payload: {},
      products: { name: "Process Pilots" },
    },
  ];

  const enrolRows: EnrolmentRow[] = [
    {
      id: "demo-e1",
      status: "active",
      next_send_at: new Date(now.getTime() + 86400000).toISOString(),
      fuTag: "FU-2 of 3",
      dueLabel: "DUE: TODAY",
      lead: {
        first_name: "Sarah",
        last_name: "Mitchell",
        company: "Northwind Systems",
        job_title: "VP Operations",
      },
    },
    {
      id: "demo-e2",
      status: "active",
      next_send_at: new Date(now.getTime() + 2 * 86400000).toISOString(),
      fuTag: "FU-1 of 3",
      dueLabel: "DUE: MAR 28",
      lead: {
        first_name: "James",
        last_name: "Chen",
        company: "Apex Labs",
        job_title: "Head of Growth",
      },
    },
    {
      id: "demo-e3",
      status: "replied",
      next_send_at: null,
      fuTag: "FU-3 of 3",
      dueLabel: "REPLIED",
      lead: {
        first_name: "Elena",
        last_name: "Ruiz",
        company: "Stripefield Co",
        job_title: "CISO",
      },
    },
    {
      id: "demo-e4",
      status: "active",
      next_send_at: new Date(now.getTime() + 3600000).toISOString(),
      fuTag: "FU-2 of 4",
      dueLabel: "DUE: TODAY",
      lead: {
        first_name: "Marcus",
        last_name: "Webb",
        company: "Orbital Data",
        job_title: "Director IT",
      },
    },
    {
      id: "demo-e5",
      status: "completed",
      next_send_at: null,
      fuTag: "FU-3 of 3",
      dueLabel: "EXHAUSTED",
      lead: {
        first_name: "Priya",
        last_name: "Nair",
        company: "Helio Freight",
        job_title: "COO",
      },
    },
    {
      id: "demo-e6",
      status: "bounced",
      next_send_at: null,
      fuTag: "FU-1 of 3",
      dueLabel: "BOUNCED",
      lead: {
        first_name: "Tom",
        last_name: "Banks",
        company: "Invalid Co",
        job_title: "—",
      },
    },
  ];

  const agentRows: AgentStatusRow[] = [
    {
      type: "a1",
      label: "Lead Sourcing",
      pill: "success",
      lastRun: "Last: 06:12 UTC",
      nextRun: "Next: tomorrow 06:00",
      progress: 100,
    },
    {
      type: "a2",
      label: "Email Comms",
      pill: "running",
      lastRun: "Last: 09:02 UTC",
      nextRun: "Next: in 14m",
      progress: 62,
    },
    {
      type: "a3",
      label: "Blog Content",
      pill: "success",
      lastRun: "Last: Mon 07:00",
      nextRun: "Next: Mon 07:00",
      progress: 100,
    },
    {
      type: "a4",
      label: "Developer / PO / QA",
      pill: "scheduled",
      lastRun: "Last: Sun 09:00",
      nextRun: "Next: Sun 09:00",
      progress: 0,
    },
    {
      type: "a5",
      label: "SEO",
      pill: "success",
      lastRun: "Last: Wed 06:00",
      nextRun: "Next: Wed 06:00",
      progress: 100,
    },
    {
      type: "a6",
      label: "QA Sweep",
      pill: "error",
      lastRun: "Last: failed 08:41",
      nextRun: "Next: retry 10:00",
      progress: 28,
    },
  ];

  return {
    leadsWeek: 247,
    emailsSent: 1089,
    postsPub: 8,
    enrolActive: 74,
    enrolTabCounts: { active: 74, replied: 12, exhausted: 8, bounced: 2 },
    pendingCount: 5,
    pending: [
      { id: "p1", title: "FOLLOW-UP BATCH", subtitle: "SEQUENCE · 12 LEADS" },
      { id: "p2", title: "CAMPAIGN DRAFT", subtitle: "TRUSTLE · OUTBOUND V3" },
      { id: "p3", title: "SEO META PACK", subtitle: "PROCESS PILOTS · BLOG" },
      { id: "p4", title: "CHANNEL SCOUT DIGEST", subtitle: "WEEKLY · APPROVAL" },
      { id: "p5", title: "LEAD RE-SCORE BATCH", subtitle: "INTERNAL CRM · 240 ROWS" },
    ],
    standups: [
      {
        title: "Lead Sourcer",
        plan: "Source 20 Trustle B2B leads from finance vertical; de-dupe against internal CRM before import.",
        lastCompleted: "18 leads validated & imported — 2 held for manual review.",
      },
      {
        title: "Email Comms",
        plan: "Ship approval-queue drafts for Process Pilots trial cohort; cap sends at warming tier.",
        lastCompleted: "Batch 2 approved; 340 opens tracked in last 24h.",
      },
      {
        title: "Blog Writer",
        plan: "Draft 1,800w pillar on continuous compliance monitoring; internal link to product tour.",
        lastCompleted: "Outline v2 posted to CMS — awaiting SEO pass.",
      },
    ],
    enrolRows,
    logs,
    agentRows,
  };
}
