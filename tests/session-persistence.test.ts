import './setup';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseSafeCookies, createSupabaseClientFromRequest } from '../src/lib/supabase/server';
import { resolveAuthContextFromRequest } from '../src/server/auth/session';
import { proxy, config as proxyConfig } from '../src/proxy';
import { getSafeRedirectUrl } from '../src/lib/auth-redirect';
import { NextRequest } from 'next/server';

describe('ABPS Books — Session Persistence & Cookie Resilience Suite', () => {
  // --------------------------------------------------------------------------
  // 1. Safe Cookie Parsing & Percent-Encoding Resilience
  // --------------------------------------------------------------------------
  describe('Safe Cookie Parsing (parseSafeCookies)', () => {
    it('returns empty array when cookie header is missing or empty', () => {
      assert.deepStrictEqual(parseSafeCookies(null), []);
      assert.deepStrictEqual(parseSafeCookies(undefined), []);
      assert.deepStrictEqual(parseSafeCookies(''), []);
      assert.deepStrictEqual(parseSafeCookies('   '), []);
    });

    it('correctly parses single and multiple standard cookie pairs', () => {
      const header = 'theme=dark; user_id=12345; session=abcde';
      const parsed = parseSafeCookies(header);
      assert.deepStrictEqual(parsed, [
        { name: 'theme', value: 'dark' },
        { name: 'user_id', value: '12345' },
        { name: 'session', value: 'abcde' },
      ]);
    });

    it('handles malformed percent-encoding WITHOUT throwing URIError', () => {
      // Unescaped % characters (e.g. from analytics, tracking, or malformed queries)
      const malformedHeader = '_ga=GA1.1.12345%6789; tracking=percent%symbol; broken=%E0%A4%';
      assert.doesNotThrow(() => {
        const parsed = parseSafeCookies(malformedHeader);
        assert.strictEqual(parsed.length, 3);
        assert.strictEqual(parsed[0].name, '_ga');
        assert.strictEqual(parsed[0].value, 'GA1.1.12345%6789');
        assert.strictEqual(parsed[1].name, 'tracking');
        assert.strictEqual(parsed[1].value, 'percent%symbol');
        assert.strictEqual(parsed[2].name, 'broken');
        assert.strictEqual(parsed[2].value, '%E0%A4%');
      });
    });

    it('preserves chunked Supabase auth tokens and base64url payloads intact', () => {
      const chunk0 = 'base64-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9';
      const chunk1 = 'base64-eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTEyMzQtMTIzNC0xMjM0NTY3ODkwMTIifQ==';
      const header = `sb-kqaqnpwwppvlxdovvlie-auth-token.0=${chunk0}; sb-kqaqnpwwppvlxdovvlie-auth-token.1=${chunk1}`;

      const parsed = parseSafeCookies(header);
      assert.strictEqual(parsed.length, 2);
      assert.strictEqual(parsed[0].name, 'sb-kqaqnpwwppvlxdovvlie-auth-token.0');
      assert.strictEqual(parsed[0].value, chunk0);
      assert.strictEqual(parsed[1].name, 'sb-kqaqnpwwppvlxdovvlie-auth-token.1');
      assert.strictEqual(parsed[1].value, chunk1);
    });

    it('handles values containing multiple equals signs correctly', () => {
      const header = 'token=base64-eyJ==; key=a=b=c';
      const parsed = parseSafeCookies(header);
      assert.strictEqual(parsed.length, 2);
      assert.strictEqual(parsed[0].value, 'base64-eyJ==');
      assert.strictEqual(parsed[1].value, 'a=b=c');
    });

    it('unwraps RFC 6265 enclosing quotes around values', () => {
      const header = 'session="quoted_session_value"; normal=unquoted';
      const parsed = parseSafeCookies(header);
      assert.strictEqual(parsed[0].value, 'quoted_session_value');
      assert.strictEqual(parsed[1].value, 'unquoted');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Resilient Supabase Client Creation
  // --------------------------------------------------------------------------
  describe('Supabase Client from Request (createSupabaseClientFromRequest)', () => {
    it('initializes client and extracts cookies safely from Request headers', () => {
      const req = new Request('http://localhost:3000/api/auth/me', {
        headers: {
          cookie: 'sb-test-token=token_value_123; tracking=xyz',
        },
      });

      const client = createSupabaseClientFromRequest(req);
      assert.ok(client);
      assert.ok(client.auth);
    });

    it('does not crash when request contains malformed cookie headers', () => {
      const req = new Request('http://localhost:3000/api/auth/me', {
        headers: {
          cookie: 'malformed=%99%ZZ; normal=ok',
        },
      });

      assert.doesNotThrow(() => {
        const client = createSupabaseClientFromRequest(req);
        assert.ok(client);
      });
    });

    it('supports onSetCookies callback when provided for cookie mutation', () => {
      let setCookiesReceived: any[] = [];
      const req = new Request('http://localhost:3000/api/auth/me', {
        headers: { cookie: 'test=1' },
      });

      const client = createSupabaseClientFromRequest(req, (cookiesToSet) => {
        setCookiesReceived = cookiesToSet;
      });

      assert.ok(client);
      assert.strictEqual(setCookiesReceived.length, 0);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Fail-Closed Authentication & Session Resolution
  // --------------------------------------------------------------------------
  describe('Session Verification & Security Fail-Closed Invariants', () => {
    it('returns null for unauthenticated requests in production', async () => {
      const prevEnv = process.env.NODE_ENV;
      try {
        (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
        const req = new Request('http://localhost:3000/api/auth/me', {
          headers: {
            'x-user-id': 'spoofed-admin-id',
            'x-user-role': 'admin',
          },
        });

        const ctx = await resolveAuthContextFromRequest(req);
        assert.strictEqual(ctx, null, 'Must strictly fail closed in production without genuine Supabase session');
      } finally {
        (process.env as Record<string, string | undefined>).NODE_ENV = prevEnv;
      }
    });

    it('does not throw on requests with corrupted cookie headers', async () => {
      const prevEnv = process.env.NODE_ENV;
      try {
        (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
        const req = new Request('http://localhost:3000/api/auth/me', {
          headers: {
            cookie: 'corrupted=%E0%A4%invalid; _ga=123%456',
          },
        });

        const ctx = await resolveAuthContextFromRequest(req);
        assert.strictEqual(ctx, null, 'Must fail closed gracefully without throwing unhandled exceptions');
      } finally {
        (process.env as Record<string, string | undefined>).NODE_ENV = prevEnv;
      }
    });
  });

  // --------------------------------------------------------------------------
  // 4. Next.js 16 Proxy Convention & Matcher
  // --------------------------------------------------------------------------
  describe('Next.js 16 Proxy Convention (src/proxy.ts)', () => {
    it('exports a valid proxy function and config matcher', () => {
      assert.strictEqual(typeof proxy, 'function', 'src/proxy.ts must export a proxy function');
      assert.ok(proxyConfig, 'src/proxy.ts must export a config object');
      assert.ok(Array.isArray(proxyConfig.matcher), 'proxy config must specify a matcher array');
    });

    it('matches page routes and excludes static build and media assets', () => {
      const matcherPattern = new RegExp(
        proxyConfig.matcher[0].replace('^', '').replace('$', '')
      );

      // Should match application routes
      assert.ok(matcherPattern.test('/'), 'Should match root route /');
      assert.ok(matcherPattern.test('/admin'), 'Should match /admin');
      assert.ok(matcherPattern.test('/admin/inventory'), 'Should match /admin/inventory');
      assert.ok(matcherPattern.test('/login'), 'Should match /login');
      assert.ok(matcherPattern.test('/api/auth/me'), 'Should match /api/auth/me');

      // Should exclude static Next.js assets
      assert.ok(!matcherPattern.test('/_next/static/chunks/main.js'), 'Must exclude _next/static');
      assert.ok(!matcherPattern.test('/_next/image?url=logo.png'), 'Must exclude _next/image');
      assert.ok(!matcherPattern.test('/favicon.ico'), 'Must exclude favicon.ico');
      assert.ok(!matcherPattern.test('/logo.svg'), 'Must exclude .svg files');
      assert.ok(!matcherPattern.test('/hero.png'), 'Must exclude .png files');
      assert.ok(!matcherPattern.test('/cover.jpg'), 'Must exclude .jpg files');
      assert.ok(!matcherPattern.test('/font.woff2'), 'Must exclude .woff2 files');
    });

    it('returns a valid NextResponse when invoked', async () => {
      const req = new NextRequest('https://abps-books.vercel.app/admin', {
        headers: { host: 'abps-books.vercel.app' },
      });

      const res = await proxy(req);
      assert.ok(res, 'Proxy must return a response object');
      assert.strictEqual(res.status, 200, 'Proxy passes through with status 200 by default');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Google OAuth Redirect & Role Isolation
  // --------------------------------------------------------------------------
  describe('OAuth Redirect Role Isolation (getSafeRedirectUrl)', () => {
    it('preserves /admin destination for authorized staff roles', () => {
      assert.strictEqual(getSafeRedirectUrl('/admin', 'admin'), '/admin');
      assert.strictEqual(getSafeRedirectUrl('/admin/inventory', 'branch_admin'), '/admin/inventory');
      assert.strictEqual(getSafeRedirectUrl('/admin/orders', 'warehouse'), '/admin/orders');
      assert.strictEqual(getSafeRedirectUrl('/admin', 'sales'), '/admin');
    });

    it('strictly demotes /admin redirect to / for customer role', () => {
      assert.strictEqual(getSafeRedirectUrl('/admin', 'customer'), '/');
      assert.strictEqual(getSafeRedirectUrl('/admin/inventory', 'customer'), '/');
      assert.strictEqual(getSafeRedirectUrl('/admin/settings', 'customer'), '/');
    });

    it('allows valid customer destinations for customer role', () => {
      assert.strictEqual(getSafeRedirectUrl('/books', 'customer'), '/books');
      assert.strictEqual(getSafeRedirectUrl('/orders', 'customer'), '/orders');
      assert.strictEqual(getSafeRedirectUrl('/profile', 'customer'), '/profile');
    });

    it('strictly neutralizes open redirect attacks regardless of role', () => {
      assert.strictEqual(getSafeRedirectUrl('https://malicious.com', 'admin'), '/admin');
      assert.strictEqual(getSafeRedirectUrl('http://evil.com/admin', 'admin'), '/admin');
      assert.strictEqual(getSafeRedirectUrl('//evil.com', 'customer'), '/');
      assert.strictEqual(getSafeRedirectUrl('/\\\\evil.com', 'customer'), '/');
      assert.strictEqual(getSafeRedirectUrl('javascript:alert(1)', 'admin'), '/admin');
    });
  });
});
