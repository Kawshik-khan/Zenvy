import { describe, expect, it } from "vitest";
import { CALL_NOTE_FILE_TYPE, MAX_MESSAGE_LENGTH, parseRoomMessageInput } from "./room-messages";

describe("parseRoomMessageInput", () => {
  it("accepts a text message and trims it", () => {
    expect(parseRoomMessageInput("group", { groupId: "g1", content: "  hi  " })).toEqual({
      ok: true,
      roomId: "g1",
      content: "hi",
      file: null,
    });
  });

  it("reads the id key for the room kind", () => {
    expect(parseRoomMessageInput("channel", { groupId: "g1", content: "hi" })).toEqual({ ok: false, error: "Missing channelId" });
    expect(parseRoomMessageInput("channel", { channelId: "c1", content: "hi" })).toMatchObject({ ok: true, roomId: "c1" });
  });

  it("rejects empty and oversized messages", () => {
    expect(parseRoomMessageInput("group", { groupId: "g1", content: "   " })).toMatchObject({ ok: false });
    expect(parseRoomMessageInput("group", { groupId: "g1", content: "x".repeat(MAX_MESSAGE_LENGTH + 1) })).toMatchObject({ ok: false });
    expect(parseRoomMessageInput("group", null)).toMatchObject({ ok: false });
  });

  it("accepts an http(s) attachment, even without text", () => {
    const input = parseRoomMessageInput("group", {
      groupId: "g1",
      content: "",
      fileUrl: "https://files.example.com/a.pdf",
      fileType: "pdf",
      fileName: "a.pdf",
    });
    expect(input).toEqual({
      ok: true,
      roomId: "g1",
      content: "",
      file: { fileUrl: "https://files.example.com/a.pdf", fileType: "pdf", fileName: "a.pdf" },
    });
  });

  it("rejects attachment URLs that are not http(s)", () => {
    for (const fileUrl of ["javascript:alert(1)", "data:text/html,hi", "not a url", 42]) {
      expect(parseRoomMessageInput("group", { groupId: "g1", content: "hi", fileUrl })).toEqual({ ok: false, error: "Invalid attachment" });
    }
  });

  it("keeps call notes, which have no file", () => {
    expect(parseRoomMessageInput("channel", { channelId: "c1", content: "note", fileType: CALL_NOTE_FILE_TYPE, fileUrl: null })).toMatchObject({
      ok: true,
      file: { fileUrl: null, fileType: CALL_NOTE_FILE_TYPE, fileName: null },
    });
    expect(parseRoomMessageInput("channel", { channelId: "c1", content: "", fileType: CALL_NOTE_FILE_TYPE })).toMatchObject({ ok: false });
  });

  it("ignores a fileType without a file", () => {
    expect(parseRoomMessageInput("group", { groupId: "g1", content: "hi", fileType: "image" })).toMatchObject({ ok: true, file: null });
  });
});
