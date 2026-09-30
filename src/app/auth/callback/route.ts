import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { resolveOrCreateAuthUser } from '@/server/auth/session';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      try {
        const authCtx = await resolveOrCreateAuthUser(data.user);
        if (['admin', 'branch_admin', 'warehouse', 'sales'].includes(authCtx.role)) {
          return NextResponse.redirect(`${origin}/admin`);
        }
      } catch (e) {
        console.error('Error resolving domain auth identity during callback:', e);
      }

      const redirectPath = next.startsWith('/') ? next : `/${next}`;
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  // Fallback: If no code or code exchange failed, redirect to login page with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
