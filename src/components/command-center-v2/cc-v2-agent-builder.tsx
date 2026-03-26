"use client";

import { useCallback, useState } from "react";

function slugifyAgentName(name: string): string {
  const s = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
  return s.length >= 2 ? `custom_${s}` : "";
}

const BUILTIN_OPTIONS = [
  { value: "lead_sourcing", label: "Lead Sourcing" },
  { value: "email_communications", label: "Email Communications" },
  { value: "blog_content", label: "Blog Writer" },
  { value: "seo", label: "SEO" },
  { value: "standup", label: "Standup" },
  { value: "orchestrator", label: "Orchestrator" },
] as const;

type Props = { onClose: () => void };

export function CcV2AgentBuilder({ onClose }: Props) {
  const [template, setTemplate] = useState<string>(BUILTIN_OPTIONS[0].value);
  const [customName, setCustomName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userTask, setUserTask] = useState(
    "Summarize priorities for today in 5 bullets.",
  );
  const [cronExpr, setCronExpr] = useState("0 9 * * 1");
  const [triggerIdx, setTriggerIdx] = useState(0);
  const [model, setModel] = useState("gpt-4o-mini");
  const [busy, setBusy] = useState<"test" | "create" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const resolvedAgentType = useCallback(() => {
    if (template === "custom") {
      return slugifyAgentName(customName);
    }
    return template;
  }, [template, customName]);

  const runTest = async () => {
    const agent_type = resolvedAgentType();
    if (!agent_type) {
      setMsg("Enter a custom agent name (at least 2 meaningful characters).");
      return;
    }
    setBusy("test");
    setMsg(null);
    try {
      const res = await fetch("/api/agents/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          agent_type,
          instruction: userTask.trim() || undefined,
          model: model || undefined,
          system_prompt: systemPrompt.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        results?: { ok: boolean; summary?: string; error?: string }[];
      };
      if (!res.ok) {
        setMsg(data.error ?? `Request failed (${res.status})`);
        return;
      }
      const r = data.results?.[0];
      if (r?.ok && r.summary) {
        setMsg(`Test OK — preview:\n${r.summary.slice(0, 900)}${r.summary.length > 900 ? "…" : ""}`);
      } else {
        setMsg(r?.error ?? "Run finished without output.");
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Network error");
    } finally {
      setBusy(null);
    }
  };

  const createScheduled = async () => {
    const agent_type = resolvedAgentType();
    if (!agent_type) {
      setMsg("Enter a custom agent name (at least 2 meaningful characters).");
      return;
    }
    if (triggerIdx !== 0) {
      setMsg("Only “Scheduled (cron)” creates a row in Scheduler for now. Pick that trigger, or use Test Run + APIs.");
      return;
    }
    setBusy("create");
    setMsg(null);
    try {
      const res = await fetch("/api/agent-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          agent_type,
          cron_expr: cronExpr.trim(),
        }),
      });
      const data = (await res.json()) as { error?: string; schedule?: unknown };
      if (!res.ok) {
        setMsg(data.error ?? `Save failed (${res.status})`);
        return;
      }
      setMsg("Schedule saved. Cron runs every ~15 minutes on Vercel when CRON_SECRET is set.");
      onClose();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Network error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="modal-body">
      <div className="form-row" style={{ marginBottom: 10 }}>
        <div className="form-g">
          <div className="fl">Agent template</div>
          <select
            className="fi fs"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          >
            {BUILTIN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
            <option value="custom">Custom (name below)</option>
          </select>
        </div>
        <div className="form-g">
          <div className="fl">Output Type</div>
          <select className="fi fs" disabled>
            <option>Report (agent log + summary)</option>
          </select>
        </div>
      </div>
      {template === "custom" ? (
        <div className="form-g" style={{ marginBottom: 10 }}>
          <div className="fl">Custom agent name</div>
          <input
            className="fi"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g. Competitor Monitor"
          />
          <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 4 }}>
            Stored as <code>{slugifyAgentName(customName) || "custom_…"}</code>
          </div>
        </div>
      ) : null}
      <div className="form-g" style={{ marginBottom: 10 }}>
        <div className="fl">Description (standups / notes)</div>
        <input
          className="fi"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this agent do?"
        />
      </div>
      <div className="form-g" style={{ marginBottom: 10 }}>
        <div className="fl">System prompt (overrides template when set)</div>
        <textarea
          className="fta"
          style={{ minHeight: 110 }}
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder={
            "Optional. You are a specialist agent for our org. Use {{product.name}} if needed.\nLeave empty to use the built-in template."
          }
        />
      </div>
      <div className="form-g" style={{ marginBottom: 10 }}>
        <div className="fl">Task / user message (for Test Run)</div>
        <textarea
          className="fta"
          style={{ minHeight: 72 }}
          value={userTask}
          onChange={(e) => setUserTask(e.target.value)}
        />
      </div>
      <div className="form-g" style={{ marginBottom: 10 }}>
        <div className="fl">Model</div>
        <select
          className="fi fs"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          <option value="gpt-4o-mini">gpt-4o-mini</option>
          <option value="gpt-4o">gpt-4o</option>
        </select>
      </div>
      <div className="form-row">
        <div className="form-g">
          <div className="fl">Trigger Type</div>
          <select
            className="fi fs"
            value={triggerIdx}
            onChange={(e) => setTriggerIdx(Number(e.target.value))}
          >
            <option value={0}>Scheduled (cron)</option>
            <option value={1}>Manual only</option>
            <option value={2} disabled>
              After another agent completes
            </option>
          </select>
        </div>
        <div className="form-g">
          <div className="fl">Schedule (cron)</div>
          <input
            className="fi"
            value={cronExpr}
            onChange={(e) => setCronExpr(e.target.value)}
            placeholder="0 9 * * 1"
          />
        </div>
      </div>
      {msg ? (
        <pre
          style={{
            marginTop: 12,
            padding: 10,
            fontSize: 11,
            whiteSpace: "pre-wrap",
            background: "var(--bg3)",
            border: "1px solid var(--b1)",
            borderRadius: "var(--r)",
            color: "var(--t2)",
            maxHeight: 200,
            overflow: "auto",
          }}
        >
          {msg}
        </pre>
      ) : null}
      </div>
      <div className="modal-foot">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          CANCEL
        </button>
        <button
          type="button"
          className="btn btn-a btn-sm"
          disabled={busy !== null}
          onClick={() => void runTest()}
        >
          {busy === "test" ? "…" : "🧪 TEST RUN"}
        </button>
        <button
          type="button"
          className="btn btn-c"
          disabled={busy !== null}
          onClick={() => void createScheduled()}
        >
          CREATE AGENT →
        </button>
      </div>
    </>
  );
}
