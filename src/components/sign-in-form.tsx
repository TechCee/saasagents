"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "@/app/login.module.css";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function SignInForm({
  showPreviewHint = false,
  uiPreviewEnabled = false,
  needsBackend = false,
}: {
  showPreviewHint?: boolean;
  uiPreviewEnabled?: boolean;
  needsBackend?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSubmitting(true);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <>
      {needsBackend ? (
        <div className={styles.needsBanner}>
          Add Supabase URL and anon key to <code>.env.local</code>, or enable UI preview mode.
        </div>
      ) : null}

      <div className={styles.statusBar}>
        <span className={styles.statusDot} aria-hidden />
        <span className={styles.statusText}>All systems operational</span>
      </div>

      <div className={styles.formHeader}>
        <p className={styles.formEyebrow}>Secure Access</p>
        <h2 className={styles.formTitle}>Sign in to Command Center</h2>
        <p className={styles.formDesc}>
          Sign in with your organisation account to open the Command Center — leads, campaigns, agent runs,
          and approvals in one place.
        </p>
        {showPreviewHint ? (
          <p className={styles.previewHint}>
            UI preview is on — use the button below to skip login. Use this form once Supabase is
            configured.
          </p>
        ) : null}
      </div>

      <form onSubmit={onSubmit} autoComplete="on">
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="login-email">
            <span>Email address</span>
          </label>
          <div className={styles.inputWrapper}>
            <span className={styles.inputIcon} aria-hidden>
              ✉
            </span>
            <input
              id="login-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={styles.formInput}
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="login-password">
            <span>Password</span>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
              }}
            >
              Forgot password?
            </a>
          </label>
          <div className={styles.inputWrapper}>
            <span className={styles.inputIcon} aria-hidden>
              🔒
            </span>
            <input
              id="login-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={styles.formInput}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {msg ? (
          <p className={styles.formError} role="alert">
            {msg}
          </p>
        ) : null}

        <button className={styles.btnPrimary} type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in to OpSync →"}
        </button>

        {uiPreviewEnabled ? (
          <>
            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>or</span>
              <div className={styles.dividerLine} />
            </div>
            <Link href="/dashboard" className={styles.btnGhost}>
              <span aria-hidden>👁</span>
              Open read-only UI preview
            </Link>
            <p className={styles.previewHint} style={{ marginTop: 10, textAlign: "center" }}>
              Set in <code>.env.local</code>: <code>UI_PREVIEW_MODE=true</code>
            </p>
          </>
        ) : null}
      </form>

      <div className={styles.formFooter}>
        <span className={styles.versionBadge}>v1.0.0.1</span>
      </div>
    </>
  );
}
