"use client";

import { useMemo, useState } from "react";
import {
  EmailPreviewPanel,
  defaultBranding,
} from "@/components/email-preview-panel";
import type { BrandingRow } from "@/lib/email/render-html";

type Tab = "overview" | "branding";

function mergeBranding(server: Record<string, unknown> | null): BrandingRow {
  const d = defaultBranding();
  if (!server) return d;
  const footer = server.footer_links_json;
  const social = server.social_links_json;
  return {
    ...d,
    primary_color: String(server.primary_color ?? d.primary_color),
    secondary_color: String(server.secondary_color ?? d.secondary_color),
    background_color: String(server.background_color ?? d.background_color),
    text_color: String(server.text_color ?? d.text_color),
    header_logo_url: server.header_logo_url ? String(server.header_logo_url) : null,
    header_logo_width: Number(server.header_logo_width ?? d.header_logo_width),
    font_family: String(server.font_family ?? d.font_family),
    button_style: (server.button_style as BrandingRow["button_style"]) ?? d.button_style,
    footer_company_name: server.footer_company_name
      ? String(server.footer_company_name)
      : d.footer_company_name,
    footer_address: server.footer_address ? String(server.footer_address) : d.footer_address,
    footer_links_json: Array.isArray(footer) ? footer : d.footer_links_json,
    social_links_json:
      social && typeof social === "object" ? (social as Record<string, string>) : d.social_links_json,
    email_signature: server.email_signature ? String(server.email_signature) : d.email_signature,
    preview_text_prefix: server.preview_text_prefix
      ? String(server.preview_text_prefix)
      : d.preview_text_prefix,
  };
}

export function ProductWorkspace(props: {
  productId: string;
  organisationId: string;
  productName: string;
  outboundSenderEmail: string | null;
  adminEmail: string;
  serverBranding: Record<string, unknown> | null;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [branding, setBranding] = useState<BrandingRow>(() =>
    mergeBranding(props.serverBranding),
  );
  const [saving, setSaving] = useState(false);
  const [footerLinks, setFooterLinks] = useState<
    { label: string; url: string }[]
  >(() => {
    const raw = props.serverBranding?.footer_links_json;
    return Array.isArray(raw)
      ? (raw as { label: string; url: string }[])
      : (defaultBranding().footer_links_json as { label: string; url: string }[]);
  });

  const buttonPreviewClass = useMemo(() => {
    if (branding.button_style === "square") return "rounded-none";
    if (branding.button_style === "pill") return "rounded-full";
    return "rounded-md";
  }, [branding.button_style]);

  async function saveBranding() {
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${props.productId}/branding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...branding,
          footer_links_json: footerLinks,
          social_links_json: branding.social_links_json,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Save failed: ${JSON.stringify(err)}`);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="border-r border-[var(--cc-border)] bg-[var(--cc-panel)]/40">
        <div className="flex gap-2 border-b border-[var(--cc-border)] px-6 py-3">
          {(
            [
              ["overview", "Overview"],
              ["branding", "Branding"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                tab === k
                  ? "bg-[var(--cc-cyan)]/20 text-[var(--cc-cyan)] ring-1 ring-[var(--cc-cyan)]/35"
                  : "text-slate-400 hover:bg-white/5"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "overview" ? (
          <div className="max-w-none px-6 py-8">
            <h1 className="text-2xl font-semibold text-white">{props.productName}</h1>
            <p className="text-[var(--cc-muted)]">
              Configure campaigns, leads, and SEO from this workspace. Use the Branding tab to align
              HTML emails with product visuals (v5.1).
            </p>
          </div>
        ) : (
          <div className="space-y-6 px-6 py-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Product branding</h2>
                <p className="text-sm text-[var(--cc-muted)]">
                  Colours, typography, and footer drive the master HTML template.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void saveBranding()}
                disabled={saving}
                className="rounded-md bg-[var(--cc-cyan)]/90 px-4 py-2 text-sm font-semibold text-[var(--cc-bg-deep)] disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save branding"}
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["primary_color", "Primary"],
                  ["secondary_color", "Secondary"],
                  ["background_color", "Email outer background"],
                  ["text_color", "Body text"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block text-sm">
                  <span className="text-[var(--cc-muted)]">{label}</span>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={branding[key]}
                      onChange={(e) =>
                        setBranding((b) => ({ ...b, [key]: e.target.value }))
                      }
                      className="h-10 w-14 cursor-pointer rounded border border-[var(--cc-border)] bg-white"
                    />
                    <input
                      className="flex-1 rounded-md border border-[var(--cc-border)] bg-[var(--cc-bg-deep)] px-2 py-1 font-mono text-sm text-white"
                      value={branding[key]}
                      onChange={(e) =>
                        setBranding((b) => ({ ...b, [key]: e.target.value }))
                      }
                    />
                  </div>
                </label>
              ))}
            </div>

            <label className="block text-sm">
              <span className="text-[var(--cc-muted)]">Font stack</span>
              <input
                className="mt-1 w-full rounded-md border border-[var(--cc-border)] bg-[var(--cc-bg-deep)] px-2 py-1 text-white"
                value={branding.font_family}
                onChange={(e) =>
                  setBranding((b) => ({ ...b, font_family: e.target.value }))
                }
              />
            </label>

            <div>
              <span className="text-sm text-[var(--cc-muted)]">Button style</span>
              <div className="mt-2 flex flex-wrap gap-3">
                {(["rounded", "square", "pill"] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setBranding((b) => ({ ...b, button_style: style }))}
                    className={`${buttonPreviewClass} px-4 py-2 text-sm font-medium text-white`}
                    style={{ backgroundColor: branding.primary_color }}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <label className="block text-sm">
              <span className="text-[var(--cc-muted)]">Logo URL (Supabase Storage / CDN)</span>
              <input
                className="mt-1 w-full rounded-md border border-[var(--cc-border)] bg-[var(--cc-bg-deep)] px-2 py-1 text-white"
                value={branding.header_logo_url ?? ""}
                onChange={(e) =>
                  setBranding((b) => ({
                    ...b,
                    header_logo_url: e.target.value || null,
                  }))
                }
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-[var(--cc-muted)]">Company (footer)</span>
                <input
                  className="mt-1 w-full rounded-md border border-[var(--cc-border)] bg-[var(--cc-bg-deep)] px-2 py-1 text-white"
                  value={branding.footer_company_name ?? ""}
                  onChange={(e) =>
                    setBranding((b) => ({
                      ...b,
                      footer_company_name: e.target.value || null,
                    }))
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--cc-muted)]">Registered address</span>
                <input
                  className="mt-1 w-full rounded-md border border-[var(--cc-border)] bg-[var(--cc-bg-deep)] px-2 py-1 text-white"
                  value={branding.footer_address ?? ""}
                  onChange={(e) =>
                    setBranding((b) => ({
                      ...b,
                      footer_address: e.target.value || null,
                    }))
                  }
                />
              </label>
            </div>

            <div>
              <div className="text-sm text-[var(--cc-muted)]">Footer links</div>
              <div className="mt-2 space-y-2">
                {footerLinks.map((fl, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className="w-1/3 rounded-md border border-[var(--cc-border)] bg-[var(--cc-bg-deep)] px-2 py-1 text-sm text-white"
                      value={fl.label}
                      onChange={(e) => {
                        const next = [...footerLinks];
                        next[i] = { ...next[i], label: e.target.value };
                        setFooterLinks(next);
                      }}
                    />
                    <input
                      className="flex-1 rounded-md border border-[var(--cc-border)] px-2 py-1 text-sm"
                      value={fl.url}
                      onChange={(e) => {
                        const next = [...footerLinks];
                        next[i] = { ...next[i], url: e.target.value };
                        setFooterLinks(next);
                      }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="text-sm font-medium text-[var(--cc-cyan)]"
                  onClick={() => setFooterLinks((l) => [...l, { label: "Link", url: "https://" }])}
                >
                  + Add link
                </button>
              </div>
            </div>

            <label className="block text-sm">
              <span className="text-[var(--cc-muted)]">Signature block</span>
              <textarea
                className="mt-1 w-full rounded-md border border-[var(--cc-border)] bg-[var(--cc-bg-deep)] px-2 py-1 text-white"
                rows={2}
                value={branding.email_signature ?? ""}
                onChange={(e) =>
                  setBranding((b) => ({ ...b, email_signature: e.target.value || null }))
                }
              />
            </label>

            <label className="block text-sm">
              <span className="text-[var(--cc-muted)]">Preview text prefix</span>
              <input
                className="mt-1 w-full rounded-md border border-[var(--cc-border)] bg-[var(--cc-bg-deep)] px-2 py-1 text-white"
                value={branding.preview_text_prefix ?? ""}
                onChange={(e) =>
                  setBranding((b) => ({
                    ...b,
                    preview_text_prefix: e.target.value || null,
                  }))
                }
              />
            </label>

            <div
              className="rounded-xl border border-dashed border-[var(--cc-border)] p-4"
              style={{ backgroundColor: branding.background_color }}
            >
              <div className="text-xs font-semibold uppercase text-[var(--cc-muted)]">Mini preview</div>
              <div
                className="mt-3 rounded-lg p-4 text-white"
                style={{ backgroundColor: branding.primary_color }}
              >
                Header / logo area
              </div>
              <div
                className="rounded-b-lg bg-white p-4 text-sm"
                style={{ color: branding.text_color, fontFamily: branding.font_family }}
              >
                Body copy inherits typography and colours.
                <div className="mt-3">
                  <span
                    className={`inline-block px-3 py-2 text-sm font-semibold text-white ${buttonPreviewClass}`}
                    style={{ backgroundColor: branding.primary_color }}
                  >
                    CTA
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <EmailPreviewPanel
        organisationId={props.organisationId}
        productId={props.productId}
        productName={props.productName}
        adminEmail={props.adminEmail}
        outboundSenderEmail={props.outboundSenderEmail}
        branding={branding}
      />
    </div>
  );
}
