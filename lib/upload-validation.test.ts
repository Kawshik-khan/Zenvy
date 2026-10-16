import { describe, expect, it } from "vitest";
import { getSafeFileExtension, validateChatAttachment, validateProfileImage } from "./upload-validation";

function fakeFile(name: string, type: string, size: number) {
  return new File([new Uint8Array(size)], name, { type });
}

describe("getSafeFileExtension", () => {
  it("lowercases and strips unsafe characters", () => {
    expect(getSafeFileExtension("Photo.JPG")).toBe("jpg");
    expect(getSafeFileExtension("evil.p$h%p")).toBe("php");
  });

  it("falls back to bin when there is no usable extension", () => {
    expect(getSafeFileExtension("archive.")).toBe("bin");
    expect(getSafeFileExtension("x.$$$")).toBe("bin");
  });
});

describe("validateProfileImage", () => {
  it("accepts a small PNG", () => {
    expect(validateProfileImage(fakeFile("a.png", "image/png", 1024))).toBeNull();
  });

  it("rejects files over 5MB", () => {
    expect(validateProfileImage(fakeFile("a.png", "image/png", 5 * 1024 * 1024 + 1))).toMatch(/5MB/);
  });

  it("rejects non-image types", () => {
    expect(validateProfileImage(fakeFile("a.pdf", "application/pdf", 1024))).toMatch(/must be/);
  });
});

describe("validateChatAttachment", () => {
  it("accepts a PDF", () => {
    expect(validateChatAttachment(fakeFile("notes.pdf", "application/pdf", 2048))).toBeNull();
  });

  it("rejects executables", () => {
    expect(validateChatAttachment(fakeFile("a.exe", "application/x-msdownload", 2048))).not.toBeNull();
  });
});
