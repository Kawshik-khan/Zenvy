// Which sign-in options are switched on. Server-only: reads env vars without NEXT_PUBLIC_.

/** Google sign-in needs both OAuth credentials from Google Cloud Console. */
export function isGoogleEnabled(env: Record<string, string | undefined> = process.env) {
  return Boolean(env.AUTH_GOOGLE_ID?.trim() && env.AUTH_GOOGLE_SECRET?.trim());
}
