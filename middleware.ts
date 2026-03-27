import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware must not pull in Node-only APIs. On Vercel we observed:
 * `ReferenceError: __dirname is not defined` from edge-middleware when using
 * `createServerClient` from `@supabase/ssr` (bundled dependency hits `__dirname`).
 *
 * Session + cookies are refreshed in Server Components / route handlers via
 * `createServerClient` from `@supabase/ssr` in `src/lib/supabase/server.ts`.
 */
export function middleware(request: NextRequest) {
  return NextResponse.next({ request: { headers: request.headers } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.png|api/webhooks|unsubscribe).*)",
  ],
};
