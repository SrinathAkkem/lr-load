/**
 * Application environment. Use APP_ENV for business rules (OTP backdoors, etc.).
 * NODE_ENV is still used for Next.js build optimizations.
 */
export type AppEnv = "development" | "production";

export function getAppEnv(): AppEnv {
  const raw = process.env.APP_ENV ?? process.env.NODE_ENV ?? "development";
  return raw === "production" ? "production" : "development";
}

export function isProduction(): boolean {
  return getAppEnv() === "production";
}

export function isDevelopment(): boolean {
  return getAppEnv() === "development";
}
