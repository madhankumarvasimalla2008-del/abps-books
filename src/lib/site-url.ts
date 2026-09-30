/**
 * Resolves the application origin URL for redirects, callbacks, and emails.
 *
 * Order of precedence:
 * 1. window.location.origin (if running in browser client)
 * 2. NEXT_PUBLIC_SITE_URL environment variable
 * 3. NEXT_PUBLIC_VERCEL_URL environment variable (prepended with https://)
 * 4. http://localhost:3000 (default fallback for local development)
 */
export function getSiteOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  if (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.trim() !== '') {
    let url = process.env.NEXT_PUBLIC_SITE_URL.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    return url.replace(/\/+$/, '');
  }

  if (process.env.NEXT_PUBLIC_VERCEL_URL && process.env.NEXT_PUBLIC_VERCEL_URL.trim() !== '') {
    let url = process.env.NEXT_PUBLIC_VERCEL_URL.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    return url.replace(/\/+$/, '');
  }

  return 'http://localhost:3000';
}
