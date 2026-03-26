import type { NextConfig } from "next";

// #region agent log
// Build-time diagnostics to help debug Vercel deploy failures.
// (No secrets are logged; values are booleans/versions only.)
try {
  const payload = {
    sessionId: "95d6c6",
    runId: "pre-fix",
    hypothesisId: "H2_vercel_env_or_node",
    location: "next.config.ts:10",
    message: "Next.js config loaded",
    data: {
      node: process.version,
      vercel: Boolean(process.env.VERCEL),
      nodeEnv: process.env.NODE_ENV ?? null,
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.length),
      hasSupabaseAnon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length),
      hasServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.length),
    },
    timestamp: Date.now(),
  };
  // Local debug collector (no-op on Vercel; safe to fail)
  fetch("http://127.0.0.1:7670/ingest/edda1648-0366-438c-9621-378fb5e6374b", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "95d6c6" },
    body: JSON.stringify(payload),
  }).catch(() => {});
  // Also print to build logs (useful on Vercel)
  // eslint-disable-next-line no-console
  console.info("[opsync][build-diag]", payload.data);
} catch {
  /* ignore */
}
// #endregion agent log

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
