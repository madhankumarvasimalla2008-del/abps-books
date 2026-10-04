/**
 * Normalizes Indian mobile phone numbers to E.164 standard format (+91XXXXXXXXXX).
 * Accepts:
 * - 10-digit numbers: 9876543210 -> +919876543210
 * - Leading zero: 09876543210 -> +919876543210
 * - 91 prefix: 919876543210 -> +919876543210
 * - +91 standard: +919876543210 -> +919876543210
 * - Formatted with punctuation: "+91 98765 43210" -> +919876543210
 * - 0091 prefix: "0091-9876543210" -> +919876543210
 * - (091) prefix: "(091) 98765-43210" -> +919876543210
 *
 * Valid Indian mobile numbers are 10 digits starting with 6, 7, 8, or 9.
 */
export interface PhoneNormalizationResult {
  valid: boolean;
  phone?: string;
  error?: string;
}

export function normalizeIndianPhone(input: string): PhoneNormalizationResult {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'Please enter a mobile phone number.' };
  }

  // Strip common punctuation and formatting: spaces, dashes, parentheses, dots
  let cleaned = input.trim().replace(/[\s\-\(\)\.]/g, '');

  if (!cleaned) {
    return { valid: false, error: 'Please enter a mobile phone number.' };
  }

  // Handle leading plus
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Reject if any non-numeric characters remain
  if (!/^\d+$/.test(cleaned)) {
    return {
      valid: false,
      error: 'Phone number must contain only numeric digits.',
    };
  }

  let digits = cleaned;

  // Handle international dialing prefixes and domestic trunk prefixes
  if (digits.startsWith('0091') && digits.length === 14) {
    digits = digits.substring(4);
  } else if (digits.startsWith('091') && digits.length === 13) {
    digits = digits.substring(3);
  } else if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.substring(2);
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.substring(1);
  }

  // Final mobile number must contain exactly 10 digits
  if (digits.length < 10) {
    return {
      valid: false,
      error: 'Phone number is too short. Please enter a valid 10-digit Indian mobile number.',
    };
  }

  if (digits.length > 10) {
    return {
      valid: false,
      error: 'Phone number is too long. Please enter a valid 10-digit Indian mobile number.',
    };
  }

  // In India, valid mobile numbers start with 6, 7, 8, or 9 (TRAI National Numbering Plan)
  if (!/^[6-9]/.test(digits)) {
    return {
      valid: false,
      error: 'Invalid Indian mobile number. Number must start with 6, 7, 8, or 9.',
    };
  }

  return {
    valid: true,
    phone: `+91${digits}`,
  };
}

/**
 * Formats an E.164 Indian mobile number (+91XXXXXXXXXX) for readable user display (+91 XXXXX XXXXX).
 */
export function formatPhoneDisplay(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.substring(2, 7)} ${digits.substring(7)}`;
  }
  if (digits.length === 10) {
    return `+91 ${digits.substring(0, 5)} ${digits.substring(5)}`;
  }
  return phone;
}

/**
 * Sanitizes input for the India-only 10-digit mobile phone field.
 * - Strips leading +91, +, or domestic trunk 0
 * - Strips any non-numeric characters
 * - Prevents the user from typing or pasting +91 into the field
 * - Caps strictly at 10 numeric digits
 */
export function sanitizeIndianMobileInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let cleaned = input.trim();

  // Strip leading +91 or + if present (e.g. from paste or autocomplete)
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Strip non-numeric characters
  let digits = cleaned.replace(/\D/g, '');

  // If user pasted 12 digits starting with 91, strip the country code 91
  if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.substring(2);
  } else if (digits.startsWith('0') && digits.length === 11) {
    // Domestic trunk prefix 0
    digits = digits.substring(1);
  }

  // Restrict to exactly max 10 digits
  return digits.slice(0, 10);
}
