import { afterEach, describe, expect, it, vi } from "vitest";
import { decode } from "next-auth/jwt";
import { createMobileSession, MOBILE_SESSION_MAX_AGE } from "./session";

const SECRET = "test-secret-test-secret-test-secret-123";

describe("createMobileSession", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("mints a session token Auth.js can read under both cookie names", async () => {
    vi.stubEnv("AUTH_SECRET", SECRET);
    const session = await createMobileSession({ id: "user_1", name: "Nadia", email: "nadia@example.com" });

    expect(session.cookies.map((cookie) => cookie.name)).toEqual(["authjs.session-token", "__Secure-authjs.session-token"]);
    for (const cookie of session.cookies) {
      // The cookie name is the encryption salt, exactly as Auth.js reads it.
      const token = await decode({ token: cookie.value, secret: SECRET, salt: cookie.name });
      expect(token).toMatchObject({ sub: "user_1", name: "Nadia", email: "nadia@example.com" });
      expect((token!.exp as number) - (token!.iat as number)).toBe(MOBILE_SESSION_MAX_AGE);
    }
  });

  it("cannot be decoded with another cookie's salt or another secret", async () => {
    vi.stubEnv("AUTH_SECRET", SECRET);
    const [plain] = (await createMobileSession({ id: "user_1", name: null, email: null })).cookies;
    await expect(decode({ token: plain.value, secret: SECRET, salt: "__Secure-authjs.session-token" })).rejects.toThrow();
    await expect(decode({ token: plain.value, secret: "another-secret-another-secret-12345", salt: plain.name })).rejects.toThrow();
  });

  it("refuses to mint without a secret", async () => {
    vi.stubEnv("AUTH_SECRET", "");
    vi.stubEnv("NEXTAUTH_SECRET", "");
    await expect(createMobileSession({ id: "user_1", name: null, email: null })).rejects.toThrow("AUTH_SECRET");
  });
});
