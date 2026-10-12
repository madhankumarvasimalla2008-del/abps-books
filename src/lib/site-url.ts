/**
 * Resolves the application origin URL for redirects, callbacks, and emails.
 * Core resolution logic is centrally maintained in src/lib/auth-redirect.ts.
 */
export {
  CANONICAL_PRODUCTION_URL,
  isProductionEnvironment,
  getSiteOrigin,
} from './auth-redirect';
