import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { bearerToken, createMobileToken, MOBILE_TOKEN_TTL_SECONDS, verifyMobileToken } from "./mobile-auth";

const NOW = Date.parse("2026-10-26T10:00:00Z");

describe("mobile tokens", () => {
  const original = process.env.AUTH_SECRET;
  beforeEach(() => {
    process.env.AUTH_SECRET = "test-secret";
  });
  afterEach(() => {
    process.env.AUTH_SECRET = original;
  });

  it("round-trips the user id", () => {
    const issued = createMobileToken("user_1", NOW);
    expect(issued).not.toBeNull();
    expect(verifyMobileToken(issued!.token, NOW)?.sub).toBe("user_1");
    expect(issued!.expiresAt.getTime()).toBe(NOW + MOBILE_TOKEN_TTL_SECONDS * 1000);
  });

  it("rejects expired tokens", () => {
    const issued = createMobileToken("user_1", NOW)!;
    expect(verifyMobileToken(issued.token, NOW + MOBILE_TOKEN_TTL_SECONDS * 1000 - 1000)).not.toBeNull();
    expect(verifyMobileToken(issued.token, NOW + MOBILE_TOKEN_TTL_SECONDS * 1000)).toBeNull();
  });

  it("rejects a tampered payload or signature", () => {
    const { token } = createMobileToken("user_1", NOW)!;
    const [payload, signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "admin", typ: "mobile", iat: 0, exp: 9999999999 })).toString("base64url");
    expect(verifyMobileToken(`${forged}.${signature}`, NOW)).toBeNull();
    expect(verifyMobileToken(`${payload}.${signature.slice(0, -2)}xx`, NOW)).toBeNull();
    expect(verifyMobileToken(`${token}.extra`, NOW)).toBeNull();
    expect(verifyMobileToken("", NOW)).toBeNull();
  });

  it("rejects tokens signed with another secret", () => {
    const { token } = createMobileToken("user_1", NOW)!;
    process.env.AUTH_SECRET = "rotated";
    expect(verifyMobileToken(token, NOW)).toBeNull();
  });

  it("does not accept socket tokens, which share the secret", async () => {
    const { createSocketToken } = await import("./socket-auth");
    expect(verifyMobileToken(createSocketToken("user_1"), NOW)).toBeNull();
  });

  it("issues nothing without a secret", () => {
    process.env.AUTH_SECRET = "";
    const nextAuth = process.env.NEXTAUTH_SECRET;
    process.env.NEXTAUTH_SECRET = "";
    expect(createMobileToken("user_1", NOW)).toBeNull();
    process.env.NEXTAUTH_SECRET = nextAuth;
  });
});

describe("bearerToken", () => {
  it("reads the token from an Authorization header", () => {
    expect(bearerToken("Bearer abc.def")).toBe("abc.def");
    expect(bearerToken("bearer   abc.def ")).toBe("abc.def");
  });

  it("ignores other schemes and empty values", () => {
    expect(bearerToken(null)).toBeNull();
    expect(bearerToken("Basic dXNlcjpwYXNz")).toBeNull();
    expect(bearerToken("Bearer")).toBeNull();
  });
});
