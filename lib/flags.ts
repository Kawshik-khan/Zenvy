// Server-side feature flags, driven by environment variables.
// Read these in server components, route handlers and server actions only:
// the env vars are not prefixed with NEXT_PUBLIC_, so they never reach the browser.

const FLAG_ENV = {
  jobs: "FEATURE_JOBS",
  // Exposes the /ui component gallery in production builds (previews, e2e).
  uiGallery: "UI_GALLERY",
} as const;

export type FeatureFlag = keyof typeof FLAG_ENV;

const TRUE_VALUES = new Set(["1", "true", "on", "yes"]);

export function isEnabled(flag: FeatureFlag, env: Record<string, string | undefined> = process.env) {
  const value = env[FLAG_ENV[flag]];
  return value ? TRUE_VALUES.has(value.trim().toLowerCase()) : false;
}
