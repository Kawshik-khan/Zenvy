import { describe, expect, it } from "vitest";
import { attachmentKind, conversationTypeLabel, formatListTime, isAttachmentPlaceholder, stopTypingNames, typingLabel } from "./chat-utils";

describe("chat utils", () => {
  it("shows the time for today and a date for earlier days", () => {
    const now = new Date("2026-03-10T15:00:00");
    expect(formatListTime(new Date("2026-03-10T09:41:00"), now)).toMatch(/9:41|09:41/);
    expect(formatListTime(new Date("2026-03-01T09:41:00"), now)).toMatch(/Mar/);
    expect(formatListTime(null, now)).toBe("");
  });

  it("recognises the placeholder text sent with a bare attachment", () => {
    expect(isAttachmentPlaceholder("Attached: notes.pdf", "notes.pdf")).toBe(true);
    expect(isAttachmentPlaceholder("Attached: notes.pdf", "other.pdf")).toBe(false);
    expect(isAttachmentPlaceholder("hello", null)).toBe(false);
  });

  it("words the typing line for one or several people", () => {
    expect(typingLabel([])).toBe("");
    expect(typingLabel(["Sam"])).toBe("Sam is typing");
    expect(typingLabel(["Sam", "Ana"])).toBe("Sam, Ana are typing");
  });

  it("classifies attachments", () => {
    expect(attachmentKind("image", "call_note")).toBe("image");
    expect(attachmentKind("video", "call_note")).toBe("video");
    expect(attachmentKind("call_note", "call_note")).toBe("note");
    expect(attachmentKind("application/pdf", "call_note")).toBe("file");
    expect(attachmentKind(null, "call_note")).toBe("file");
  });

  it("removes a name without mutating the original set", () => {
    const original = new Set(["Sam", "Ana"]);
    const next = stopTypingNames(original, "Sam");
    expect([...next]).toEqual(["Ana"]);
    expect(original.size).toBe(2);
  });

  it("names conversation types", () => {
    expect(conversationTypeLabel("DM")).toBe("Direct message");
    expect(conversationTypeLabel("GROUP")).toBe("Study group");
    expect(conversationTypeLabel("CHANNEL")).toBe("Channel");
    expect(conversationTypeLabel("OTHER")).toBe("Other");
  });
});
