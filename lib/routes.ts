// Which pages can be visited without signing in. Everything else is protected by
// middleware.ts (via auth.config.ts). API routes are excluded from the middleware
// and check the session themselves, so they can answer 401 JSON instead of a redirect.

const PUBLIC_EXACT = new Set(["/", "/login", "/register", "/verify", "/zenvy-admin/login"]);

// Dev-only component gallery; the page itself 404s in production unless UI_GALLERY=true.
const PUBLIC_PREFIXES = ["/ui"];

export function isPublicPath(pathname: string) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (PUBLIC_EXACT.has(path)) return true;
  return PUBLIC_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

/**
 * Post-login destination, or null if unsafe. Accepts relative paths, and absolute URLs
 * on `origin` (middleware puts the full URL in ?callbackUrl=). Everything else is rejected
 * to prevent open redirects.
 */
export function safeCallbackPath(value: string | null | undefined, origin?: string) {
  if (!value) return null;
  if (value.startsWith("/")) {
    if (value.startsWith("//") || value.startsWith("/\\")) return null;
    return value;
  }
  if (!origin) return null;
  try {
    const url = new URL(value);
    if (url.origin !== new URL(origin).origin) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
