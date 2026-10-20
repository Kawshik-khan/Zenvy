import { describe, expect, it } from "vitest";
import { isGoogleEnabled } from "./auth-providers";
import { passwordSchema, passwordStrength } from "./password";
import { hashResetToken, isExpired } from "./password-reset";

describe("passwordStrength", () => {
  it("is empty for an empty password", () => {
    expect(passwordStrength("")).toMatchObject({ score: 0, label: "", acceptable: false });
  });

  it("calls anything under 8 characters too short", () => {
    expect(passwordStrength("Ab1!")).toMatchObject({ score: 1, label: "Too short", acceptable: false });
  });

  it("grows with uppercase, numbers and symbols", () => {
    expect(passwordStrength("studytime").label).toBe("Weak");
    expect(passwordStrength("Studytime").label).toBe("Okay");
    expect(passwordStrength("Studytime1").label).toBe("Good");
    expect(passwordStrength("Studytime1!").label).toBe("Strong");
  });

  it("matches what the server accepts", () => {
    for (const value of ["", "short", "studytime", "Studytime", "studytime1", "Studytime1", "Studytime1!"]) {
      expect(passwordStrength(value).acceptable).toBe(passwordSchema.safeParse(value).success);
    }
  });
});

describe("password reset tokens", () => {
  it("hashes the same token the same way and different tokens differently", () => {
    expect(hashResetToken("abc")).toBe(hashResetToken("abc"));
    expect(hashResetToken("abc")).not.toBe(hashResetToken("abd"));
    expect(hashResetToken("abc")).not.toContain("abc");
  });

  it("treats a token as expired at or after its expiry time", () => {
    const now = new Date("2026-10-20T10:00:00Z");
    expect(isExpired(new Date("2026-10-20T10:00:01Z"), now)).toBe(false);
    expect(isExpired(new Date("2026-10-20T10:00:00Z"), now)).toBe(true);
  });
});

describe("isGoogleEnabled", () => {
  it("needs both the client id and secret", () => {
    expect(isGoogleEnabled({})).toBe(false);
    expect(isGoogleEnabled({ AUTH_GOOGLE_ID: "id" })).toBe(false);
    expect(isGoogleEnabled({ AUTH_GOOGLE_ID: " ", AUTH_GOOGLE_SECRET: "secret" })).toBe(false);
    expect(isGoogleEnabled({ AUTH_GOOGLE_ID: "id", AUTH_GOOGLE_SECRET: "secret" })).toBe(true);
  });
});
