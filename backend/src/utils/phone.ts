/**
 * Normalizes phone numbers to standard E.164 format.
 * Special handling for Indian phone numbers (10 digits starting with 6-9).
 * e.g. "9876543210" -> "+919876543210"
 * "+91 98765 43210" -> "+919876543210"
 * "09876543210"     -> "+919876543210"
 */
export function normalizePhoneNumber(rawPhone: string, defaultCountryCode = '91'): { isValid: boolean; normalized: string; error?: string } {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { isValid: false, normalized: '', error: 'Phone number is required' };
  }

  // Strip all whitespace, dashes, parentheses
  let cleaned = rawPhone.replace(/[\s\-\(\)\.]/g, '');

  // If starts with +, strip it temporarily for inspection
  const hasPlus = cleaned.startsWith('+');
  if (hasPlus) {
    cleaned = cleaned.substring(1);
  }

  // Handle leading zero (common in Indian domestic dialing)
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  // Check 10-digit Indian standard
  if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) {
    cleaned = `${defaultCountryCode}${cleaned}`;
  }

  // Validate E.164 length (10 to 15 digits)
  if (!/^\d{10,15}$/.test(cleaned)) {
    return {
      isValid: false,
      normalized: '',
      error: 'Invalid phone number format. Must be a valid 10-15 digit mobile number.',
    };
  }

  return {
    isValid: true,
    normalized: `+${cleaned}`,
  };
}
