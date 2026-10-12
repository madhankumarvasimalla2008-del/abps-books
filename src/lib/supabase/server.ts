import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Creates a server-side Supabase client reading and setting cookies via Next.js next/headers.
 * Suitable for Server Components, Server Actions, and Route Handlers.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}

/**
 * Safely parses cookie headers into a list of { name, value } pairs without throwing on malformed percent-encodings.
 * Preserves raw cookie values as expected by @supabase/ssr chunking and base64url decoding.
 */
export function parseSafeCookies(cookieHeader: string | null | undefined): Array<{ name: string; value: string }> {
  if (!cookieHeader || typeof cookieHeader !== 'string') {
    return [];
  }

  const results: Array<{ name: string; value: string }> = [];
  const parts = cookieHeader.split(';');

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) {
      results.push({ name: part, value: '' });
      continue;
    }

    const name = part.slice(0, eqIdx).trim();
    if (!name) continue;

    let value = part.slice(eqIdx + 1).trim();
    // Unwrap RFC 6265 enclosing quotes if present
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }

    results.push({ name, value });
  }

  return results;
}

/**
 * Creates a server-side Supabase client from a standard incoming Request object.
 * Resilient against malformed cookie encodings and preserves Supabase session chunking.
 */
export function createSupabaseClientFromRequest(
  req: Request,
  onSetCookies?: (cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) => void
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  let cookiesList: Array<{ name: string; value: string }> = [];
  if ('cookies' in req && typeof (req as any).cookies?.getAll === 'function') {
    try {
      cookiesList = (req as any).cookies.getAll();
    } catch {
      cookiesList = parseSafeCookies(req.headers.get('cookie'));
    }
  } else {
    cookiesList = parseSafeCookies(req.headers.get('cookie'));
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookiesList;
      },
      setAll(cookiesToSet) {
        if (onSetCookies) {
          try {
            onSetCookies(cookiesToSet);
          } catch {
            // Silently ignore if response cannot be mutated in this context
          }
        }
      },
    },
  });
}

/**
 * Creates a Supabase Admin Client using the secret Service Role Key.
 * STRICTLY SERVER-SIDE ONLY. NEVER EXPOSE TO THE CLIENT.
 */
export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  return createSupabaseJsClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
