import { createRequire } from "node:module";
import { beforeEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const { registerRoomChatHandlers } = require("./room-chat-socket");

type Handler = (data?: unknown) => Promise<void> | void;

const stored = {
  id: "m1",
  groupId: "g1",
  senderId: "me",
  content: "hello",
  fileUrl: null,
  fileType: null,
  fileName: null,
  createdAt: new Date("2026-10-26T10:00:00Z"),
  sender: { name: "Nadia", image: null },
};

function setup({ member = true, message = stored as typeof stored | null } = {}) {
  const handlers = new Map<string, Handler>();
  const broadcasts: { room: string; event: string; payload: unknown }[] = [];
  const emitted: { event: string; payload: unknown }[] = [];
  const rooms = new Set<string>();
  const socket = {
    rooms,
    on: (event: string, handler: Handler) => handlers.set(event, handler),
    join: (room: string) => rooms.add(room),
    leave: (room: string) => rooms.delete(room),
    emit: (event: string, payload: unknown) => emitted.push({ event, payload }),
    to: (room: string) => ({ emit: (event: string, payload: unknown) => broadcasts.push({ room, event, payload }) }),
  };
  const messages = {
    findUnique: vi.fn(async () => message),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({ ...stored, ...data, id: "m2" })),
    delete: vi.fn(async () => ({})),
  };
  const prisma = {
    groupMember: { findUnique: vi.fn(async () => (member ? { id: "gm" } : null)) },
    channelMember: { findUnique: vi.fn(async () => (member ? { id: "cm" } : null)) },
    groupMessage: messages,
    channelMessage: messages,
  };
  registerRoomChatHandlers({ socket, prisma, userId: "me" });
  const fire = (event: string, data?: unknown) => handlers.get(event)!(data);
  return { fire, broadcasts, emitted, rooms, messages };
}

describe("room chat socket handlers", () => {
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));

  it("joins a group room only for members", async () => {
    const ok = setup();
    await ok.fire("join_group_room", "g1");
    expect(ok.rooms.has("group_g1")).toBe(true);

    const denied = setup({ member: false });
    await denied.fire("join_group_room", "g1");
    expect(denied.rooms.size).toBe(0);
    expect(denied.emitted[0].event).toBe("group_error");
  });

  it("broadcasts a message saved over HTTP from the database row", async () => {
    const { fire, broadcasts } = setup();
    await fire("group_message:created", { groupId: "g1", messageId: "m1" });
    expect(broadcasts).toEqual([
      {
        room: "group_g1",
        event: "receive_group_message",
        payload: expect.objectContaining({ id: "m1", content: "hello", senderName: "Nadia", isSelf: false }),
      },
    ]);
  });

  it("does not broadcast someone else's message or one from another room", async () => {
    const theirs = setup({ message: { ...stored, senderId: "other" } });
    await theirs.fire("group_message:created", { groupId: "g1", messageId: "m1" });
    expect(theirs.broadcasts).toEqual([]);

    const elsewhere = setup();
    await elsewhere.fire("group_message:created", { groupId: "g2", messageId: "m1" });
    expect(elsewhere.broadcasts).toEqual([]);

    const notMember = setup({ member: false });
    await notMember.fire("group_message:created", { groupId: "g1", messageId: "m1" });
    expect(notMember.broadcasts).toEqual([]);
  });

  it("still saves legacy socket sends and acknowledges them", async () => {
    const { fire, emitted, broadcasts, messages } = setup();
    await fire("send_group_message", { groupId: "g1", message: { id: "temp", content: "hey", senderId: "spoofed" } });
    expect(messages.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ senderId: "me", groupId: "g1", content: "hey" }) }));
    expect(emitted).toContainEqual({ event: "group_message_sent_success", payload: { tempId: "temp", realId: "m2" } });
    expect(broadcasts[0]).toMatchObject({ room: "group_g1", event: "receive_group_message" });
  });

  it("deletes only the sender's own message in that room", async () => {
    const own = setup();
    await own.fire("delete_group_message", { groupId: "g1", messageId: "m1" });
    expect(own.messages.delete).toHaveBeenCalled();
    expect(own.broadcasts).toEqual([{ room: "group_g1", event: "group_message_deleted", payload: { messageId: "m1" } }]);

    const theirs = setup({ message: { ...stored, senderId: "other" } });
    await theirs.fire("delete_group_message", { groupId: "g1", messageId: "m1" });
    expect(theirs.messages.delete).not.toHaveBeenCalled();
  });

  it("relays typing only to a room the socket joined", async () => {
    const { fire, broadcasts } = setup();
    await fire("typing", { roomId: "c1", type: "channel", senderName: "Nadia" });
    expect(broadcasts).toEqual([]);

    await fire("join_channel_room", "c1");
    await fire("typing", { roomId: "c1", type: "channel", senderName: "Nadia" });
    await fire("stop_typing", { roomId: "c1", type: "channel", senderName: "Nadia" });
    expect(broadcasts.map((b) => [b.room, b.event])).toEqual([
      ["channel_c1", "user_typing"],
      ["channel_c1", "user_stopped_typing"],
    ]);
  });
});
