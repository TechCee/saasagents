"use client";

import { useCallback, useEffect, useState } from "react";
import type { BrandingRow, StructuredEmail } from "@/lib/email/render-html";

type LeadOption = { id: string; label: string; tokens: Record<string, string> };

const DEFAULT_STRUCTURED: StructuredEmail = {
  subject: "Quick introduction",
  preview_text: "We help teams like yours streamline onboarding.",
  greeting: "Hi {{first_name}},",
  body_html_content:
    "<p>Thanks for taking a look at what we’re building. We’d love to show you a short demo tailored to <strong>{{company}}</strong>.</p>",
  cta_text: "Book a 15-min call",
  cta_url: "https://example.com/demo",
  ps_line: "P.S. If timing isn’t right, just reply and we’ll close the loop.",
};

export function defaultBranding(): BrandingRow {
  return {
    primary_color: "#1E3A5F",
    secondary_color: "#0099BB",
    background_color: "#F8FAFC",
    text_color: "#1E293B",
    header_logo_url: null,
    header_logo_width: 160,
    font_family: "Georgia, serif",
    button_style: "rounded",
    footer_company_name: "Your Company Ltd",
    footer_address: "123 Compliance Street, London",
    footer_links_json: [
      { label: "Website", url: "https://example.com" },
      { label: "Privacy", url: "https://example.com/privacy" },
    ],
    social_links_json: { linkedin: "https://linkedin.com" },
    email_signature: "Alex · Product Team",
    preview_text_prefix: "A quick note —",
  };
}

export function EmailPreviewPanel(props: {
  organisationId: string;
  productId: string;
  productName: string;
  adminEmail: string;
  outboundSenderEmail?: string | null;
  branding: BrandingRow;
  leads?: LeadOption[];
  structuredOverride?: StructuredEmail | null;
}) {
  const branding = props.branding;
  const structured = props.structuredOverride ?? DEFAULT_STRUCTURED;

  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [dark, setDark] = useState(false);
  const [leadIdx, setLeadIdx] = useState(0);
  const [html, setHtml] = useState<string>("");
  const [subject, setSubject] = useState(structured.subject);
  const [previewText, setPreviewText] = useState(structured.preview_text);
  const [sending, setSending] = useState(false);

  const personalisation = props.leads?.[leadIdx]?.tokens ?? {
    first_name: "Jordan",
    company: "Acme Robotics",
    job_title: "Head of Ops",
  };

  const refresh = useCallback(async () => {
    const structuredPayload: StructuredEmail = {
      ...structured,
      subject,
      preview_text: previewText,
    };
    const res = await fetch("/api/email/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organisationId: props.organisationId,
        productName: props.productName,
        branding,
        structured: structuredPayload,
        personalisation,
        emailForUnsubscribe: props.adminEmail,
        darkMode: dark,
      }),
    });
    const data = (await res.json()) as { html?: string; unsubscribeUrl?: string; error?: unknown };
    if (!res.ok) {
      setHtml(`<p style="padding:24px;font-family:sans-serif;">Preview error</p>`);
      return;
    }
    setHtml(data.html ?? "");
  }, [
    props.organisationId,
    props.productName,
    props.adminEmail,
    branding,
    structured,
    subject,
    previewText,
    personalisation,
    dark,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const iframeWidth = viewport === "desktop" ? 600 : 375;

  async function sendTest() {
    setSending(true);
    try {
      const res = await fetch("/api/email/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: props.adminEmail,
          subject,
          html,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Send failed: ${JSON.stringify(err)}`);
      } else {
        alert("Test email sent (if Resend is configured).");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col border-l border-[var(--cc-border)] bg-[var(--cc-panel)] shadow-xl">
      <header className="flex flex-wrap items-center gap-2 border-b border-[var(--cc-border)] px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--cc-muted)]">
          Preview
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setViewport("desktop")}
            className={`rounded-md px-3 py-1 text-sm ${viewport === "desktop" ? "bg-[var(--cc-cyan)]/25 text-[var(--cc-cyan)]" : "bg-white/5 text-slate-400"}`}
          >
            Desktop
          </button>
          <button
            type="button"
            onClick={() => setViewport("mobile")}
            className={`rounded-md px-3 py-1 text-sm ${viewport === "mobile" ? "bg-[var(--cc-cyan)]/25 text-[var(--cc-cyan)]" : "bg-white/5 text-slate-400"}`}
          >
            Mobile
          </button>
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            className="rounded-md bg-white/5 px-3 py-1 text-sm text-slate-300"
          >
            Dark mode: {dark ? "On" : "Off"}
          </button>
          {props.leads && props.leads.length > 0 ? (
            <select
              className="rounded-md border border-[var(--cc-border)] bg-[var(--cc-bg-deep)] px-2 py-1 text-sm text-slate-200"
              value={leadIdx}
              onChange={(e) => setLeadIdx(Number(e.target.value))}
            >
              {props.leads.map((l, i) => (
                <option key={l.id} value={i}>
                  {l.label}
                </option>
              ))}
            </select>
          ) : null}
          <button
            type="button"
            onClick={() => void sendTest()}
            disabled={sending}
            className="rounded-md bg-[var(--cc-cyan)]/90 px-3 py-1 text-sm font-semibold text-[var(--cc-bg-deep)] disabled:opacity-50"
          >
            Send test
          </button>
        </div>
      </header>

      <div className="space-y-3 border-b border-[var(--cc-border)] px-4 py-3 text-sm">
        <div>
          <span className="text-[var(--cc-muted)]">From · </span>
          <span className="font-medium text-white">
            {props.outboundSenderEmail ?? "— set outbound sender on product"}
          </span>
        </div>
        <label className="block">
          <span className="text-[var(--cc-muted)]">Subject</span>
          <input
            className="mt-1 w-full rounded-md border border-[var(--cc-border)] bg-[var(--cc-bg-deep)] px-2 py-1 text-white"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-[var(--cc-muted)]">Preview text</span>
          <input
            className="mt-1 w-full rounded-md border border-[var(--cc-border)] bg-[var(--cc-bg-deep)] px-2 py-1 text-white"
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-[var(--cc-bg-deep)]/80 p-4">
        <div className="mx-auto max-w-[720px] rounded-xl border border-[var(--cc-border)] bg-[var(--cc-panel-elevated)] p-4">
          <div className="mb-3 rounded-lg border border-[var(--cc-border)] bg-[var(--cc-bg-deep)] px-3 py-2 text-xs text-[var(--cc-muted)]">
            <div className="font-medium text-white">Inbox preview</div>
            <div>{props.outboundSenderEmail ?? "sender@yourdomain.com"}</div>
            <div className="truncate font-semibold text-slate-200">{subject}</div>
            <div className="truncate text-slate-500">
              {branding.preview_text_prefix} {previewText}
            </div>
          </div>
          <div className="overflow-auto rounded-lg border border-[var(--cc-border)] bg-white">
            <iframe
              title="Email preview"
              sandbox="allow-same-origin"
              srcDoc={html}
              style={{ width: iframeWidth, height: 640, border: "none", display: "block", margin: "0 auto" }}
            />
          </div>
        </div>
      </div>

      <footer className="flex flex-wrap gap-2 border-t border-[var(--cc-border)] bg-[var(--cc-panel)] px-4 py-3 text-sm">
        <button
          type="button"
          className="rounded-md bg-[var(--cc-lime)]/90 px-3 py-2 font-medium text-[var(--cc-bg-deep)]"
          disabled
          title="Wire campaign send worker (your ESP / SMTP)"
        >
          Approve &amp; send now
        </button>
        <button
          type="button"
          className="rounded-md border border-[var(--cc-border)] px-3 py-2 text-slate-300"
          disabled
        >
          Approve &amp; schedule
        </button>
        <button
          type="button"
          className="rounded-md bg-[var(--cc-amber)]/90 px-3 py-2 font-medium text-[var(--cc-bg-deep)]"
          disabled
        >
          Request revision
        </button>
        <button type="button" className="rounded-md bg-[var(--cc-rose)] px-3 py-2 text-white" disabled>
          Reject
        </button>
      </footer>
    </div>
  );
}
