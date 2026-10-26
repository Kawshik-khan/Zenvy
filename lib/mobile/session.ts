import { encode } from "next-auth/jwt";

/** Auth.js session lifetime (its default), mirrored so the app knows when to refresh. */
export const MOBILE_SESSION_MAX_AGE = 30 * 24 * 60 * 60;

// Auth.js picks the cookie name from the request protocol, and the cookie name is also the
// encryption salt. The app sends both cookies; the server reads the one it expects.
const COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"] as const;

export type MobileSession = {
  cookies: Array<{ name: string; value: string }>;
  expiresAt: string;
};

/**
 * Mints the same encrypted session token the browser gets after signing in. The mobile app sends
 * it back as a Cookie header, so every existing route handler and server action that calls
 * `auth()` works for the app unchanged.
 */
export async function createMobileSession(user: { id: string; name: string | null; email: string | null; image?: string | null }): Promise<MobileSession> {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");

  const token = { sub: user.id, name: user.name, email: user.email, picture: user.image ?? null };
  const cookies = await Promise.all(
    COOKIE_NAMES.map(async (name) => ({
      name,
      value: await encode({ token, secret, salt: name, maxAge: MOBILE_SESSION_MAX_AGE }),
    })),
  );

  return { cookies, expiresAt: new Date(Date.now() + MOBILE_SESSION_MAX_AGE * 1000).toISOString() };
}
