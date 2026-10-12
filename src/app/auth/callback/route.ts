import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { resolveOrCreateAuthUser } from '@/server/auth/session';
import { getSiteOrigin, getSafeRedirectUrl, sanitizeAuthCallbackError } from '@/lib/auth-redirect';
import { Role } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');
  const error = searchParams.get('error');
  const errorCode = searchParams.get('error_code');
  const errorDescription = searchParams.get('error_description');

  // Resolve production-safe canonical origin (strictly non-localhost in production)
  const origin = getSiteOrigin(request);

  // 1. Handle OAuth or Provider errors (e.g. user cancelled Google sign-in or expired link)
  if (error || errorCode || errorDescription) {
    const errorParam = encodeURIComponent(error || errorCode || 'auth_callback_failed');
    const message = sanitizeAuthCallbackError(error, errorCode, errorDescription);
    const messageParam = encodeURIComponent(message);
    return NextResponse.redirect(`${origin}/login?error=${errorParam}&message=${messageParam}`);
  }

  // 2. Exchange authorization code for session
  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError && data?.user) {
      let userRole: Role = 'customer';
      try {
        const authCtx = await resolveOrCreateAuthUser(data.user);
        userRole = authCtx.role as Role;
      } catch (e) {
        console.error('Error resolving domain auth identity during callback:', e);
      }

      const destination = getSafeRedirectUrl(next, userRole);
      return NextResponse.redirect(`${origin}${destination}`);
    }

    if (exchangeError) {
      console.error('Supabase code exchange error in callback route:', exchangeError.message);
      const message = encodeURIComponent(
        exchangeError.message || 'Authentication session exchange failed. Please try again.'
      );
      return NextResponse.redirect(`${origin}/login?error=auth_exchange_failed&message=${message}`);
    }
  }

  // 3. Fallback: If no code was provided
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
