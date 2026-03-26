import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export function hasSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.length &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
  );
}

async function createServerClientInternal(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* ignore in Server Components */
          }
        },
      },
    },
  );
}

/** Returns null when env vars are missing (e.g. UI exploration before setup). */
export async function createServerSupabaseClientOptional(): Promise<SupabaseClient | null> {
  if (!hasSupabaseConfigured()) return null;
  return createServerClientInternal();
}

export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  if (!hasSupabaseConfigured()) {
    // #region agent log
    fetch('http://127.0.0.1:7670/ingest/edda1648-0366-438c-9621-378fb5e6374b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'95d6c6'},body:JSON.stringify({sessionId:'95d6c6',runId:'pre-fix',hypothesisId:'H1_missing_env',location:'src/lib/supabase/server.ts:45',message:'createServerSupabaseClient() missing env',data:{hasUrl:Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.length),hasAnon:Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length),nodeEnv:process.env.NODE_ENV ?? null,nextRuntime:process.env.NEXT_RUNTIME ?? null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log
    throw new Error(
      "Supabase env vars are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, or set UI_PREVIEW_MODE=true to browse the UI without a backend.",
    );
  }
  return createServerClientInternal();
}
