/**
 * Normalize Indian mobile numbers to 10 digits.
 * Strips non-digits, removes leading 91 country code if present.
 */
export function normalizeIndianMobile(input: string): string {
  // Strip all non-digit characters
  const digits = input.replace(/\D/g, "");
  
  // If 12 digits starting with 91, remove the country code
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  
  // If 11 digits starting with 1 (after 91), remove leading 1
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }
  
  // Return last 10 digits if longer
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  
  return digits;
}

/**
 * Format mobile number for display: +91 XXXXX XXXXX
 */
export function formatIndianMobile(mobile: string): string {
  const normalized = normalizeIndianMobile(mobile);
  if (normalized.length === 10) {
    return `+91 ${normalized.slice(0, 5)} ${normalized.slice(5)}`;
  }
  return mobile;
}
