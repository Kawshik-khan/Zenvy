const crypto = require("crypto");

const TOKEN_TTL_SECONDS = 5 * 60;

function getSocketSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
}

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function signPayload(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

function createSocketToken(userId) {
  const secret = getSocketSecret();
  if (!secret || !userId) return null;

  const payload = base64url(
    JSON.stringify({
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    }),
  );
  const signature = signPayload(payload, secret);

  return `${payload}.${signature}`;
}

function verifySocketToken(token) {
  const secret = getSocketSecret();
  if (!secret || typeof token !== "string") return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = signPayload(payload, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!decoded.sub || !decoded.exp) return null;
    if (decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return { sub: decoded.sub };
  } catch {
    return null;
  }
}

module.exports = {
  createSocketToken,
  verifySocketToken,
};
