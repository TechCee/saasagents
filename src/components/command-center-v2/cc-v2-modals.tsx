"use client";

import { CcV2AgentBuilder } from "@/components/command-center-v2/cc-v2-agent-builder";
import type { DashboardSummaryJson } from "@/lib/dashboard/build-summary";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";

export type CcV2ModalId =
  | "lead-detail"
  | "add-product"
  | "invite"
  | "agent-builder"
  | "notif"
  | "profile"
  | null;

export type CcV2ModalApi = {
  openModal: (id: Exclude<CcV2ModalId, null>) => void;
  closeModal: () => void;
};

const ModalCtx = createContext<CcV2ModalApi | null>(null);

export function useCcV2Modal() {
  const v = useContext(ModalCtx);
  if (!v) throw new Error("useCcV2Modal must be used within CcV2ModalProvider");
  return v;
}

function overlayClick(e: React.MouseEvent, close: () => void) {
  if (e.target === e.currentTarget) close();
}

export function CcV2ModalProvider({
  children,
  userEmail = "",
  allowSignOut = false,
}: {
  children: React.ReactNode;
  userEmail?: string;
  allowSignOut?: boolean;
}) {
  const [open, setOpen] = useState<CcV2ModalId>(null);
  const openModal = useCallback((id: Exclude<CcV2ModalId, null>) => setOpen(id), []);
  const closeModal = useCallback(() => setOpen(null), []);
  const api = useMemo(() => ({ openModal, closeModal }), [openModal, closeModal]);

  const [notifLoading, setNotifLoading] = useState(false);
  const [notifErr, setNotifErr] = useState<string | null>(null);
  const [notifSummary, setNotifSummary] = useState<DashboardSummaryJson | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutErr, setSignOutErr] = useState<string | null>(null);

  const onSignOut = useCallback(async () => {
    setSignOutErr(null);
    setSigningOut(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        setSignOutErr(error.message);
        setSigningOut(false);
        return;
      }
      window.location.href = "/";
    } catch (e) {
      setSignOutErr(e instanceof Error ? e.message : "Sign out failed");
      setSigningOut(false);
    }
  }, []);

  useEffect(() => {
    if (open === "profile") {
      setSignOutErr(null);
    }
  }, [open]);

  useEffect(() => {
    if (open !== "notif") return;
    let cancelled = false;
    setNotifLoading(true);
    setNotifErr(null);
    void (async () => {
      try {
        const res = await fetch("/api/dashboard/summary", { credentials: "same-origin" });
        const j = (await res.json()) as Partial<DashboardSummaryJson> & { error?: string };
        if (!res.ok) {
          throw new Error(j.error ?? `Request failed (${res.status})`);
        }
        if (!cancelled) setNotifSummary(j as DashboardSummaryJson);
      } catch (e) {
        if (!cancelled) {
          setNotifErr(e instanceof Error ? e.message : "Network error");
          setNotifSummary(null);
        }
      } finally {
        if (!cancelled) setNotifLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <ModalCtx.Provider value={api}>
      {children}

        <div
          className={`modal-overlay${open === "lead-detail" ? " open" : ""}`}
          role="presentation"
          onClick={(e) => overlayClick(e, closeModal)}
        >
          <div className="modal">
            <div className="modal-hdr">
              <span className="modal-title">Lead details</span>
              <button type="button" className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--r)",
                  background: "var(--cyan-a05)",
                  border: "1px solid var(--b1)",
                }}
              >
                <div style={{ fontFamily: "var(--fm)", fontSize: 9, color: "var(--t3)", marginBottom: 6 }}>
                  LIVE MODE
                </div>
                <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.5 }}>
                  Lead detail view isn’t wired yet. Select a lead row once the detail endpoint is implemented.
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={closeModal}>
                CLOSE
              </button>
            </div>
          </div>
        </div>

        <div
          className={`modal-overlay${open === "add-product" ? " open" : ""}`}
          role="presentation"
          onClick={(e) => overlayClick(e, closeModal)}
        >
          <div className="modal">
            <div className="modal-hdr">
              <span className="modal-title">Add New Product</span>
              <button type="button" className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="g2" style={{ marginBottom: 10 }}>
                <div className="form-g">
                  <div className="fl">Product Name</div>
                  <input className="fi" placeholder="e.g. My SaaS Product" />
                </div>
                <div className="form-g">
                  <div className="fl">URL Slug</div>
                  <input className="fi" placeholder="my-saas-product" />
                </div>
              </div>
              <div className="form-g" style={{ marginBottom: 10 }}>
                <div className="fl">Description</div>
                <textarea className="fta" placeholder="What does this product do? Who is it for?" />
              </div>
              <div className="form-row" style={{ marginBottom: 10 }}>
                <div className="form-g">
                  <div className="fl">Website URL</div>
                  <input className="fi" placeholder="https://yourproduct.io" />
                </div>
                <div className="form-g">
                  <div className="fl">Target Market</div>
                  <select className="fi fs">
                    <option>B2B</option>
                    <option>B2C</option>
                    <option>Both B2B + B2C</option>
                  </select>
                </div>
              </div>
              <div className="form-g" style={{ marginBottom: 10 }}>
                <div className="fl">Lead Criteria — Target Job Titles (comma separated)</div>
                <input className="fi" placeholder="e.g. IT Manager, CISO, Head of IT, CTO" />
              </div>
              <div className="form-g" style={{ marginBottom: 10 }}>
                <div className="fl">Blog Topics (comma separated)</div>
                <input className="fi" placeholder="e.g. SaaS security, access management, IT compliance" />
              </div>
              <div className="form-row">
                <div className="form-g">
                  <div className="fl">Writing Tone</div>
                  <select className="fi fs">
                    <option>Professional</option>
                    <option>Friendly</option>
                    <option>Technical</option>
                    <option>Authoritative</option>
                  </select>
                </div>
                <div className="form-g">
                  <div className="fl">Primary Colour (branding)</div>
                  <input className="fi" placeholder="#1E3A5F" />
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={closeModal}>
                CANCEL
              </button>
              <button type="button" className="btn btn-c">
                CREATE PRODUCT →
              </button>
            </div>
          </div>
        </div>

        <div
          className={`modal-overlay${open === "invite" ? " open" : ""}`}
          role="presentation"
          onClick={(e) => overlayClick(e, closeModal)}
        >
          <div className="modal" style={{ width: 460 }}>
            <div className="modal-hdr">
              <span className="modal-title">Invite Team Member</span>
              <button type="button" className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-g" style={{ marginBottom: 10 }}>
                <div className="fl">Email Address</div>
                <input className="fi" placeholder="colleague@company.com" />
              </div>
              <div className="form-g" style={{ marginBottom: 10 }}>
                <div className="fl">Full Name</div>
                <input className="fi" placeholder="Their full name" />
              </div>
              <div className="form-g" style={{ marginBottom: 10 }}>
                <div className="fl">Role</div>
                <select className="fi fs">
                  <option>Viewer — read-only access to all data</option>
                  <option>Admin — full access, can approve and configure</option>
                </select>
              </div>
              <div className="info-box" style={{ fontSize: 11 }}>
                An invitation email will be sent via Resend with a magic link to set their password and access the
                OpSync.
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={closeModal}>
                CANCEL
              </button>
              <button type="button" className="btn btn-c">
                SEND INVITE →
              </button>
            </div>
          </div>
        </div>

        <div
          className={`modal-overlay${open === "agent-builder" ? " open" : ""}`}
          role="presentation"
          onClick={(e) => overlayClick(e, closeModal)}
        >
          <div className="modal" style={{ width: 660 }}>
            <div className="modal-hdr">
              <span className="modal-title">Custom Agent Builder</span>
              <button type="button" className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <CcV2AgentBuilder onClose={closeModal} />
          </div>
        </div>

        <div
          className={`modal-overlay${open === "notif" ? " open" : ""}`}
          role="presentation"
          onClick={(e) => overlayClick(e, closeModal)}
        >
          <div
            className="modal cc-modal-anchor"
            style={{
              width: "min(400px, calc(100vw - 24px))",
              position: "fixed",
              right: "max(12px, env(safe-area-inset-right))",
              top: "max(58px, calc(52px + env(safe-area-inset-top)))",
              margin: 0,
            }}
          >
            <div className="modal-hdr">
              <span className="modal-title">Notifications</span>
              <button type="button" className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <div style={{ padding: 8 }}>
              {notifLoading ? (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: "var(--r)",
                    background: "var(--cyan-a05)",
                    border: "1px solid var(--b1)",
                  }}
                >
                  <div style={{ fontFamily: "var(--fm)", fontSize: 9, color: "var(--t3)" }}>LOADING…</div>
                </div>
              ) : notifErr ? (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: "var(--r)",
                    background: "var(--red-a10)",
                    border: "1px solid var(--red-a20)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--fm)",
                      fontSize: 9,
                      fontWeight: 700,
                      color: "var(--red)",
                      marginBottom: 3,
                    }}
                  >
                    NOTIFICATIONS UNAVAILABLE
                  </div>
                  <div style={{ fontSize: 12, color: "var(--t1)" }}>{notifErr}</div>
                </div>
              ) : (
                (() => {
                  const s = notifSummary;
                  const items: { hdr: string; body: string; kind: "error" | "info" }[] = [];

                  const firstErr = (s?.feed ?? []).find((f) => Boolean(f.error));
                  if (firstErr) {
                    items.push({
                      kind: "error",
                      hdr: `AGENT ERROR · ${firstErr.time || "RECENT"}`,
                      body: firstErr.text,
                    });
                  }

                  for (const a of (s?.approvals ?? []).slice(0, 3)) {
                    items.push({
                      kind: "info",
                      hdr: `APPROVAL NEEDED · ${a.age}`,
                      body: a.title,
                    });
                  }

                  const intelHint =
                    typeof (s?.kpis?.leads_week as unknown) === "number" && (s?.kpis?.leads_week ?? 0) > 0
                      ? `${s?.kpis?.leads_week ?? 0} new leads this week — review in Leads`
                      : null;
                  if (intelHint) {
                    items.push({ kind: "info", hdr: "ACTIVITY · THIS WEEK", body: intelHint });
                  }

                  if (items.length === 0) {
                    items.push({
                      kind: "info",
                      hdr: "ALL CLEAR",
                      body: "No notifications right now.",
                    });
                  }

                  return (
                    <>
                      {items.map((it, idx) => (
                        <div
                          // eslint-disable-next-line react/no-array-index-key
                          key={`${it.hdr}-${idx}`}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "var(--r)",
                            background: it.kind === "error" ? "var(--red-a10)" : "var(--cyan-a05)",
                            border:
                              it.kind === "error"
                                ? "1px solid var(--red-a20)"
                                : "1px solid var(--b1)",
                            marginBottom: idx === items.length - 1 ? 0 : 6,
                          }}
                        >
                          <div
                            style={{
                              fontFamily: "var(--fm)",
                              fontSize: 9,
                              fontWeight: it.kind === "error" ? 700 : 500,
                              color: it.kind === "error" ? "var(--red)" : "var(--t3)",
                              marginBottom: 3,
                            }}
                          >
                            {it.hdr}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--t1)" }}>{it.body}</div>
                        </div>
                      ))}
                    </>
                  );
                })()
              )}
            </div>
          </div>
        </div>

        <div
          className={`modal-overlay${open === "profile" ? " open" : ""}`}
          role="presentation"
          onClick={(e) => overlayClick(e, closeModal)}
        >
          <div className="modal" style={{ width: 440 }}>
            <div className="modal-hdr">
              <span className="modal-title">Profile</span>
              <button type="button" className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {userEmail ? (
                <p style={{ fontSize: 12, color: "var(--t1)", marginBottom: 16 }}>
                  <span style={{ color: "var(--t4)" }}>Signed in as</span>
                  <br />
                  <span style={{ fontFamily: "var(--fm)", wordBreak: "break-all" }}>{userEmail}</span>
                </p>
              ) : null}
              <div
                style={{
                  fontFamily: "var(--fm)",
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  color: "var(--t4)",
                  marginBottom: 8,
                }}
              >
                ACCOUNT SETTINGS
              </div>
              <p style={{ fontSize: 12, color: "var(--t2)", marginBottom: 10, lineHeight: 1.45 }}>
                Manage workspace preferences, team access, and billing from these pages.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Link
                  href="/settings"
                  className="btn btn-ghost"
                  style={{ width: "100%", justifyContent: "flex-start", textDecoration: "none" }}
                  onClick={closeModal}
                >
                  <span style={{ marginRight: 8, opacity: 0.85 }} aria-hidden>
                    ⚙
                  </span>
                  Settings
                </Link>
                <Link
                  href="/users"
                  className="btn btn-ghost"
                  style={{ width: "100%", justifyContent: "flex-start", textDecoration: "none" }}
                  onClick={closeModal}
                >
                  <span style={{ marginRight: 8, opacity: 0.85 }} aria-hidden>
                    👤
                  </span>
                  Users
                </Link>
                <Link
                  href="/billing"
                  className="btn btn-ghost"
                  style={{ width: "100%", justifyContent: "flex-start", textDecoration: "none" }}
                  onClick={closeModal}
                >
                  <span style={{ marginRight: 8, opacity: 0.85 }} aria-hidden>
                    💳
                  </span>
                  Billing
                </Link>
              </div>
              {signOutErr ? (
                <p style={{ fontSize: 12, color: "var(--red)", marginTop: 12 }}>{signOutErr}</p>
              ) : null}
            </div>
            <div className="modal-foot" style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
              {allowSignOut ? (
                <button
                  type="button"
                  className="btn btn-r"
                  disabled={signingOut}
                  onClick={() => void onSignOut()}
                >
                  {signingOut ? "SIGNING OUT…" : "LOG OUT"}
                </button>
              ) : null}
              <button type="button" className="btn btn-ghost" onClick={closeModal}>
                CLOSE
              </button>
            </div>
          </div>
        </div>
    </ModalCtx.Provider>
  );
}
