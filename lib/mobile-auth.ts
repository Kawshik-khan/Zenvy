import crypto from "crypto";

// Bearer tokens for the mobile app. Browsers use the Auth.js session cookie; the app
// can't, so after a password check it gets one of these and sends
// `Authorization: Bearer <token>` with each API request.
//
// Format: base64url(JSON payload) + "." + HMAC-SHA256 signature, signed with AUTH_SECRET.
// `typ` keeps these apart from the 5-minute socket tokens in lib/socket-auth.js.

export const MOBILE_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
const TYPE = "mobile";

type Payload = { sub: string; typ: string; iat: number; exp: number };

function getSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
}

function sign(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(`${TYPE}.${payload}`).digest("base64url");
}

export function createMobileToken(userId: string, now = Date.now()) {
  const secret = getSecret();
  if (!secret || !userId) return null;
  const iat = Math.floor(now / 1000);
  const payload = Buffer.from(JSON.stringify({ sub: userId, typ: TYPE, iat, exp: iat + MOBILE_TOKEN_TTL_SECONDS } satisfies Payload)).toString("base64url");
  return { token: `${payload}.${sign(payload, secret)}`, expiresAt: new Date((iat + MOBILE_TOKEN_TTL_SECONDS) * 1000) };
}

/** Returns the user id for a valid, unexpired mobile token, otherwise null. */
export function verifyMobileToken(token: string | null | undefined, now = Date.now()): { sub: string; iat: number } | null {
  const secret = getSecret();
  if (!secret || typeof token !== "string") return null;

  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;

  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<Payload>;
    if (decoded.typ !== TYPE || typeof decoded.sub !== "string" || typeof decoded.exp !== "number" || typeof decoded.iat !== "number") return null;
    if (decoded.exp <= Math.floor(now / 1000)) return null;
    return { sub: decoded.sub, iat: decoded.iat };
  } catch {
    return null;
  }
}

/** The token from an `Authorization: Bearer …` header value, if there is one. */
export function bearerToken(header: string | null | undefined) {
  if (!header) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match ? match[1] : null;
}
