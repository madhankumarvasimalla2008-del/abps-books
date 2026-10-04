/**
 * Customer Presentation Layer Text Sanitizer
 *
 * Ensures internal staging fixture markers, seed labels, or diagnostic annotations
 * never leak into customer-facing store interfaces.
 */
export function sanitizeCustomerText(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/\[STAGING FIXTURE\]\s*/gi, '')
    .replace(/Synthetic textbook data for testing and staging demonstration\.\s*/gi, '')
    .trim();
}
