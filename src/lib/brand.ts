/**
 * Brand tokens — keep in sync with lr-mobile-v2/constants/theme.ts
 */
export const BRAND = {
  primary: "#5E3EA1",
  primaryLight: "#7C3AED",
  primaryDark: "#4C1D95",
  gradientStart: "#8B359E",
  gradientEnd: "#5E3EA1",

  background: "#FFFFFF",
  backgroundSecondary: "#F5F5F7",

  text: "#1E1E1E",
  textSecondary: "#4D4D4D",
  textMuted: "#64748B",

  success: "#0C6B24",
  warning: "#967E1C",
  error: "#961C1C",
  info: "#2466DE",

  border: "#E2E8F0",
  borderMuted: "#929292",
} as const;

/** PDF rgb() tuples derived from BRAND.primary (#5E3EA1) */
export const BRAND_PDF = {
  primary: { r: 0.369, g: 0.243, b: 0.631 },
  accent: { r: 0.95, g: 0.92, b: 1 },
} as const;
