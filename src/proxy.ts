import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Next.js 16 Request Proxy for ABPS Books.
 * Runs on Node.js runtime before routes render.
 *
 * Responsibilities:
 * 1. Refreshes expired Supabase auth tokens ahead of Server Component rendering.
 * 2. Propagates refreshed session cookies to both the incoming request and outgoing response.
 * 3. Keeps server-rendered pages and client hydration in sync without dropping authenticated sessions.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase environment variables are missing (e.g. build step), pass through safely
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update request cookies so downstream route handlers/server components see updated tokens
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          // Update response cookies so browser receives new Set-Cookie headers
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    // Validates the session and proactively refreshes expired access tokens
    await supabase.auth.getUser();
  } catch (error) {
    // Secret-safe diagnostic logging in non-production
    if (process.env.NODE_ENV !== 'production' || process.env.AUTH_DEBUG === 'true') {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn('[proxy] Supabase session refresh failed:', msg);
    }
  }

  return response;
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static build files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static asset file extensions
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot|css|js)$).*)',
  ],
};
