import { Role } from '@/types';

export const CANONICAL_PRODUCTION_URL = 'https://abps-books.vercel.app';

/**
 * Determines whether the current execution context is considered production.
 */
export function isProductionEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production' ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
  );
}

/**
 * Resolves the application origin URL for redirects, callbacks, and emails.
 *
 * Guaranteed Invariants:
 * 1. In production, NEVER returns http://localhost:3000 under any circumstances.
 * 2. In production, prioritizes NEXT_PUBLIC_SITE_URL, then Vercel production variables, then CANONICAL_PRODUCTION_URL.
 * 3. In local development (NODE_ENV !== 'production' and VERCEL_ENV !== 'production'), allows window.location.origin or http://localhost:3000.
 */
export function getSiteOrigin(req?: Request): string {
  const isProd = isProductionEnvironment();

  // 1. Explicitly configured NEXT_PUBLIC_SITE_URL
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredSiteUrl) {
    let url = configuredSiteUrl;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    const cleanUrl = url.replace(/\/+$/, '');
    // In production, guard against accidental localhost in NEXT_PUBLIC_SITE_URL
    if (isProd && cleanUrl.includes('localhost')) {
      return CANONICAL_PRODUCTION_URL;
    }
    return cleanUrl;
  }

  // 2. Explicitly configured Vercel production URL variables
  const vercelProjectProdUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProjectProdUrl) {
    const url = vercelProjectProdUrl.startsWith('http') ? vercelProjectProdUrl : `https://${vercelProjectProdUrl}`;
    return url.replace(/\/+$/, '');
  }

  const vercelUrl = (process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL)?.trim();
  if (vercelUrl) {
    const url = vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`;
    return url.replace(/\/+$/, '');
  }

  // 3. Client-side browser window origin (if in browser)
  if (typeof window !== 'undefined' && window.location?.origin) {
    const clientOrigin = window.location.origin.replace(/\/+$/, '');
    if (isProd && clientOrigin.includes('localhost')) {
      // In production mode, never allow localhost client origin
      return CANONICAL_PRODUCTION_URL;
    }
    return clientOrigin;
  }

  // 4. Request headers (x-forwarded-host / host) if passed and not localhost in production
  if (req) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    if (host && !host.includes('localhost')) {
      return `${proto}://${host}`.replace(/\/+$/, '');
    }
  }

  // 5. In production, default fallback is ALWAYS the canonical production URL!
  if (isProd) {
    return CANONICAL_PRODUCTION_URL;
  }

  // 6. In local development only:
  return 'http://localhost:3000';
}

/**
 * Sanitizes open redirect parameters to prevent external Phishing / Open Redirect vulnerabilities.
 * Ensures the target route is internal and strictly role-appropriate.
 */
export function getSafeRedirectUrl(target: string | null | undefined, role: Role): string {
  if (target && target.startsWith('/') && !target.startsWith('//') && !target.startsWith('/\\')) {
    // If a customer tries to redirect to /admin, send them to store home
    if (target.startsWith('/admin') && !['admin', 'branch_admin', 'warehouse', 'sales'].includes(role)) {
      return '/';
    }
    return target;
  }
  return ['admin', 'branch_admin', 'warehouse', 'sales'].includes(role) ? '/admin' : '/';
}

/**
 * Sanitizes auth callback errors into user-friendly error messages.
 */
export function sanitizeAuthCallbackError(
  error: string | null | undefined,
  errorCode: string | null | undefined,
  errorDescription?: string | null | undefined
): string {
  if (errorDescription) {
    const decoded = decodeURIComponent(errorDescription.replace(/\+/g, ' '));
    if (decoded.toLowerCase().includes('expired')) {
      return 'The authentication link has expired or has already been used. Please request a new one.';
    }
    if (decoded.toLowerCase().includes('user cancelled') || decoded.toLowerCase().includes('access_denied')) {
      return 'Sign in was cancelled. Please try again.';
    }
    return decoded;
  }
  if (errorCode === 'otp_expired' || error === 'otp_expired') {
    return 'The verification link has expired or has already been used. Please request a new one.';
  }
  if (error === 'access_denied') {
    return 'Sign in was cancelled or access was denied. Please try again.';
  }
  return 'Authentication could not be completed. Please try again.';
}
