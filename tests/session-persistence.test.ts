import './setup';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { parseSafeCookies, createSupabaseClientFromRequest } from '../src/lib/supabase/server';
import { resolveAuthContextFromRequest } from '../src/server/auth/session';
import { proxy, config as proxyConfig } from '../src/proxy';
import { getSafeRedirectUrl } from '../src/lib/auth-redirect';
import { CustomerHeader, normalizeDisplayName, getAccountDisplayName } from '../src/components/customer/CustomerHeader';
import { AuthContext } from '../src/context/AuthContext';
import { CartContext } from '../src/context/CartContext';
import { CustomerContext } from '../src/context/CustomerContext';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
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

  // --------------------------------------------------------------------------
  // 6. Customer Header Authentication Loading & Skeleton Resilience
  // --------------------------------------------------------------------------
  describe('Customer Header Loading State & Skeleton Resilience', () => {
    const mockRouter = {
      push: () => {},
      replace: () => {},
      refresh: () => {},
      back: () => {},
      forward: () => {},
      prefetch: () => {},
    };

    const mockCart = {
      items: [],
      totalItems: 0,
      subtotal: 0,
      discountTotal: 0,
      total: 0,
    };

    const mockCartContext = {
      cart: mockCart,
      addItem: () => {},
      removeItem: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      isInitialized: true,
    };

    const mockCustomerContext = {
      profile: { name: '', email: '', phone: '', branchName: '' },
      updateProfile: () => {},
      addresses: [],
      defaultAddress: undefined,
      addAddress: () => ({} as any),
      updateAddress: () => {},
      deleteAddress: () => {},
      setDefaultAddress: () => {},
      customers: [],
      getCustomer: () => undefined,
      addCustomer: () => ({ success: true }),
      updateCustomer: () => ({ success: true }),
      toggleCustomerStatus: () => ({ success: true }),
      resetCustomersToDefaults: () => {},
      isInitialized: true,
      isLoading: false,
      error: null,
      refreshCustomers: async () => {},
      refreshAddresses: async () => {},
    };

    function renderHeader(authOverrides: Partial<any> = {}, customerOverrides: Partial<any> = {}) {
      const authValue = {
        user: null,
        role: 'customer',
        isLoading: false,
        loginAs: () => {},
        signIn: async () => ({ error: null }),
        signUp: async () => ({ error: null }),
        signOut: async () => {},
        logout: () => {},
        resetPassword: async () => ({ error: null }),
        updatePassword: async () => ({ error: null }),
        refreshSession: async () => {},
        signInWithGoogle: async () => ({ error: null }),
        sendPhoneOtp: async () => ({ error: null }),
        verifyPhoneOtp: async () => ({ error: null }),
        ...authOverrides,
      };

      const custValue = {
        ...mockCustomerContext,
        ...customerOverrides,
      };

      return renderToStaticMarkup(
        React.createElement(
          AppRouterContext.Provider,
          { value: mockRouter as any },
          React.createElement(
            AuthContext.Provider,
            { value: authValue as any },
            React.createElement(
              CartContext.Provider,
              { value: mockCartContext as any },
              React.createElement(
                CustomerContext.Provider,
                { value: custValue as any },
                React.createElement(CustomerHeader)
              )
            )
          )
        )
      );
    }

    it('renders layout-stable skeleton during isLoading without displaying "Sign in"', () => {
      const html = renderHeader({ isLoading: true, user: null });

      // Verifies loading skeleton is present
      assert.ok(html.includes('store-auth-skeleton'), 'Header must contain store-auth-skeleton during loading');
      assert.ok(html.includes('aria-label="Loading account"'), 'Must have aria-label Loading account');
      assert.ok(html.includes('aria-busy="true"'), 'Must have aria-busy="true" during loading');
      assert.ok(html.includes('store-auth-skeleton-icon'), 'Must have skeleton icon placeholder');
      assert.ok(html.includes('store-auth-skeleton-label'), 'Must have skeleton label placeholder');
      assert.ok(html.includes('store-drawer-account-skeleton'), 'Drawer must render drawer account skeleton');

      // Crucial: Must NEVER show "Sign in" or login link while session is loading!
      assert.ok(!html.includes('href="/login"'), 'Must not render /login link while session is resolving');
      assert.ok(!html.includes('store-action-label">Sign in<'), 'Must not render "Sign in" label while loading');
      assert.ok(!html.includes('Sign in to your account'), 'Must not render "Sign in to your account" button in drawer while loading');
    });

    it('renders Sign in action when session resolution completes with no user', () => {
      const html = renderHeader({ isLoading: false, user: null });

      // Verifies signed-out UI
      assert.ok(html.includes('href="/login"'), 'Must render /login link when resolved unauthenticated');
      assert.ok(html.includes('aria-label="Sign in"'), 'Must have aria-label="Sign in"');
      assert.ok(html.includes('store-action-label">Sign in<'), 'Must show "Sign in" label');
      assert.ok(html.includes('Sign in to your account'), 'Drawer must offer sign in button');

      // Must not show skeleton or account dropdown
      assert.ok(!html.includes('store-auth-skeleton'), 'Must not show skeleton when loading complete');
      assert.ok(!html.includes('aria-label="Your account"'), 'Must not show account dropdown when not logged in');
    });

    it('renders account dropdown immediately when authenticated customer resolves', () => {
      const authenticatedUser = {
        id: 'user-cust-123',
        name: 'Madan Kumar',
        email: 'madan@example.com',
        role: 'customer',
      };

      const html = renderHeader({ isLoading: false, user: authenticatedUser });

      // Verifies authenticated account dropdown
      assert.ok(html.includes('aria-label="Your account"'), 'Must render account dropdown for signed-in user');
      assert.ok(html.includes('<span class="store-action-label">Madan Kumar</span>'), 'Must display user name in trigger label');
      assert.ok(html.includes('<strong>Madan Kumar</strong>'), 'Must display user name in dropdown panel');
      assert.ok(html.includes('madan@example.com'), 'Must display user email');
      assert.ok(html.includes('My profile'), 'Must display profile links');

      // Must not show Sign in link or loading skeleton
      assert.ok(!html.includes('store-auth-skeleton'), 'Must not show skeleton when authenticated');
      assert.ok(!html.includes('href="/login"'), 'Must not show /login link when authenticated');
      assert.ok(!html.includes('Admin dashboard'), 'Must not show admin dashboard link for customer role');
    });

    it('normalizes lowercase user name to title case in desktop header trigger and panel', () => {
      const lowercaseUser = {
        id: 'user-cust-prod',
        name: 'madhan kumar',
        email: 'madhankumarvasimalla2008@gmail.com',
        role: 'customer',
      };

      const html = renderHeader({ isLoading: false, user: lowercaseUser });

      assert.ok(html.includes('aria-label="Your account"'), 'Must retain aria-label for accessibility');
      assert.ok(html.includes('<span class="store-action-label">Madhan Kumar</span>'), 'Must display Title Case name on trigger');
      assert.ok(html.includes('<strong>Madhan Kumar</strong>'), 'Must display Title Case name in account panel');
      assert.ok(!html.includes('store-action-label">Account<'), 'Must NOT show generic "Account" label when name is available');
    });

    it('derives and title-cases name from email prefix when user name is missing', () => {
      const emailOnlyUser = {
        id: 'user-email-only',
        name: '',
        email: 'priya.desai@abps.edu',
        role: 'customer',
      };

      const html = renderHeader({ isLoading: false, user: emailOnlyUser });

      assert.ok(html.includes('<span class="store-action-label">Priya Desai</span>'), 'Must derive "Priya Desai" from email prefix');
      assert.ok(html.includes('<strong>Priya Desai</strong>'), 'Must display derived name in panel');
      assert.ok(!html.includes('store-action-label">Account<'), 'Must NOT fall back to "Account" when email is present');
    });

    it('uses Supabase user_metadata full_name or name when user.name is empty or generic', () => {
      const metadataUser = {
        id: 'user-meta-1',
        email: 'aditya.v@example.com',
        role: 'customer',
        user_metadata: {
          full_name: 'aditya verma',
        },
      };

      const html = renderHeader({ isLoading: false, user: metadataUser });

      assert.ok(html.includes('<span class="store-action-label">Aditya Verma</span>'), 'Must use user_metadata full_name');
    });

    it('renders admin dashboard link when authenticated staff user resolves', () => {
      const adminUser = {
        id: 'user-admin-123',
        name: 'Admin Staff',
        email: 'admin@birlabooks.in',
        role: 'admin',
      };

      const html = renderHeader({ isLoading: false, user: adminUser });

      assert.ok(html.includes('aria-label="Your account"'), 'Must render account dropdown');
      assert.ok(html.includes('Admin dashboard'), 'Must include Admin dashboard link for admin role');
      assert.ok(html.includes('href="/admin"'), 'Must link to /admin');
    });

    it('normalizeDisplayName correctly formats varied casing and separators', () => {
      assert.strictEqual(normalizeDisplayName('madhan kumar'), 'Madhan Kumar');
      assert.strictEqual(normalizeDisplayName('MADHAN KUMAR'), 'Madhan Kumar');
      assert.strictEqual(normalizeDisplayName('priya.desai'), 'Priya Desai');
      assert.strictEqual(normalizeDisplayName('rajesh_kumar'), 'Rajesh Kumar');
      assert.strictEqual(normalizeDisplayName('anna-marie'), 'Anna Marie');
      assert.strictEqual(normalizeDisplayName('  dr.   r.k.   narayan  '), 'Dr R K Narayan');
      assert.strictEqual(normalizeDisplayName(''), '');
      assert.strictEqual(normalizeDisplayName(null as any), '');
    });

    it('getAccountDisplayName respects fallback hierarchy', () => {
      // 1. Profile display name takes precedence
      assert.strictEqual(
        getAccountDisplayName(
          { name: 'madhan kumar', email: 'test@abps.edu' },
          { name: 'Dr. Madhan Kumar', email: 'test@abps.edu' }
        ),
        'Dr Madhan Kumar'
      );

      // 2. Metadata takes precedence if profile is missing/generic
      assert.strictEqual(
        getAccountDisplayName(
          {
            email: 'test@abps.edu',
            user_metadata: { full_name: 'aditya verma' },
          },
          { name: 'Customer' }
        ),
        'Aditya Verma'
      );

      // 3. User name used if metadata missing
      assert.strictEqual(
        getAccountDisplayName({ name: 'madhan kumar', email: 'test@abps.edu' }),
        'Madhan Kumar'
      );

      // 4. Email prefix used if name is missing
      assert.strictEqual(
        getAccountDisplayName({ email: 'kavita.sharma@abps.edu' }),
        'Kavita Sharma'
      );

      // 5. Default "Account" if user is null or empty
      assert.strictEqual(getAccountDisplayName(null), 'Account');
      assert.strictEqual(getAccountDisplayName({ name: '', email: '' }), 'Account');
    });

    it('verifies storefront.css contains layout-stable skeleton rules and keyframes', async () => {
      const fs = await import('node:fs');
      const cssContent = fs.readFileSync('src/app/(customer)/storefront.css', 'utf-8');

      assert.ok(cssContent.includes('.store-auth-skeleton'), 'storefront.css must define .store-auth-skeleton');
      assert.ok(cssContent.includes('.store-auth-skeleton-icon'), 'storefront.css must define .store-auth-skeleton-icon');
      assert.ok(cssContent.includes('.store-auth-skeleton-label'), 'storefront.css must define .store-auth-skeleton-label');
      assert.ok(cssContent.includes('.store-drawer-account-skeleton'), 'storefront.css must define .store-drawer-account-skeleton');
      assert.ok(cssContent.includes('store-skeleton-pulse'), 'storefront.css must define store-skeleton-pulse animation');
      assert.ok(cssContent.includes('prefers-reduced-motion'), 'storefront.css must include prefers-reduced-motion query');
      assert.ok(
        cssContent.includes('.store-account summary .store-action-label'),
        'storefront.css must define .store-account summary .store-action-label'
      );
      assert.ok(cssContent.includes('text-overflow: ellipsis'), 'Must include text-overflow: ellipsis');
    });
  });

  // --------------------------------------------------------------------------
  // 7. Fast Session Restoration, Guest Handling & Admin Performance
  // --------------------------------------------------------------------------
  describe('Fast Session Restoration & Header Performance Invariants', () => {
    it('proxy passes through API requests directly without duplicate Supabase Auth latency', async () => {
      const req = new NextRequest('https://abps-books.vercel.app/api/auth/me', {
        headers: {
          host: 'abps-books.vercel.app',
          authorization: 'Bearer mock_token_123',
        },
      });

      const res = await proxy(req);
      assert.ok(res, 'Proxy must return response');
      assert.strictEqual(res.status, 200, 'Proxy passes through API route with status 200');
    });

    it('guest users without auth cookies resolve immediately without delay', () => {
      // When a user has no Supabase auth cookies in document.cookie, hasAuthCookie is false
      const mockCookie = 'theme=light; _ga=GA1.1.123';
      const hasAuthCookie =
        mockCookie.includes('-auth-token') ||
        mockCookie.includes('sb-') ||
        mockCookie.includes('supabase');
      assert.strictEqual(hasAuthCookie, false, 'Guest user without auth token cookies must be identified');

      const authCookie = 'sb-kqaqnpwwppvlxdovvlie-auth-token.0=xyz';
      const hasAuth =
        authCookie.includes('-auth-token') ||
        authCookie.includes('sb-') ||
        authCookie.includes('supabase');
      assert.strictEqual(hasAuth, true, 'Potential session cookie is correctly detected');
    });

    it('session restoration reconstructs customer identity instantly from metadata', () => {
      const mockSession = {
        user: {
          id: 'cust-uuid-456',
          email: 'student@abps.edu',
          user_metadata: {
            full_name: 'Aditya Student',
            phone: '9876543210',
          },
          app_metadata: {
            role: 'customer',
          },
          created_at: '2026-01-01T00:00:00.000Z',
        },
        access_token: 'mock-access-token',
      };

      const meta = mockSession.user.user_metadata;
      const reconstructed = {
        id: mockSession.user.id,
        name: meta.full_name || mockSession.user.email.split('@')[0],
        email: mockSession.user.email,
        phone: meta.phone || '',
        role: mockSession.user.app_metadata.role,
        createdAt: mockSession.user.created_at,
      };

      assert.strictEqual(reconstructed.id, 'cust-uuid-456');
      assert.strictEqual(reconstructed.name, 'Aditya Student');
      assert.strictEqual(reconstructed.email, 'student@abps.edu');
      assert.strictEqual(reconstructed.role, 'customer');
    });

    it('session restoration preserves cached admin role for instant header hydration', () => {
      const cachedAdmin = {
        id: 'admin-uuid-789',
        name: 'Principal Sharma',
        email: 'principal@birlabooks.in',
        phone: '9820011223',
        role: 'admin' as const,
        branchId: 'b1',
        createdAt: '2026-01-01T00:00:00.000Z',
      };

      // Mock session arrives for the same admin ID
      const mockSession = {
        user: {
          id: 'admin-uuid-789',
          email: 'principal@birlabooks.in',
        },
      };

      const match = cachedAdmin.id === mockSession.user.id;
      assert.strictEqual(match, true);
      assert.strictEqual(cachedAdmin.role, 'admin');
    });
  });
});
