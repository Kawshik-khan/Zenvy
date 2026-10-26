import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Every event the web app emits must have a handler on every socket server. Production runs
// standalone-socket.js on Render; it once lacked the group chat events, so group messages were
// silently dropped.

const require = createRequire(import.meta.url);
const root = path.resolve(__dirname, "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

// Files that talk to the socket through `@/lib/socket`.
const CLIENT_FILES = [
  "app/components/CallProvider.tsx",
  "app/(app)/chat/ChatClient.tsx",
  "app/(app)/groups/[id]/GroupChatClient.tsx",
  "app/(app)/channels/[id]/ChannelChatClient.tsx",
  "lib/call-notes.ts",
];

const SERVERS = ["standalone-socket.js", "server.js", "pages/api/socket.ts"];

function clientEmits() {
  const events = new Set<string>();
  for (const file of CLIENT_FILES) {
    for (const match of read(file).matchAll(/\bsocket\.emit\(\s*([^,)]*)/g)) {
      // The event name must be a literal (or a ternary between literals): a computed name would
      // hide from this test.
      const names = [...match[1].matchAll(/["']([^"'`$]+)["']/g)].map((m) => m[1]);
      expect(names.length, `${file}: socket.emit(${match[1]}) must name its event literally`).toBeGreaterThan(0);
      names.forEach((name) => events.add(name));
    }
  }
  return events;
}

/** Events registered by the shared handler modules, found by running them against a stub socket. */
function sharedHandlers() {
  const events = { conversation: new Set<string>(), roomChat: new Set<string>() };
  const stub = (into: Set<string>) => ({
    on: (event: string) => into.add(event),
    join() {},
    leave() {},
    emit() {},
    to: () => ({ emit() {} }),
    rooms: new Set<string>(),
  });
  const { registerConversationHandlers } = require("./conversation-socket");
  const { registerRoomChatHandlers } = require("./room-chat-socket");
  registerConversationHandlers({ io: {}, socket: stub(events.conversation), prisma: {}, userId: "u1" });
  registerRoomChatHandlers({ socket: stub(events.roomChat), prisma: {}, userId: "u1" });
  return events;
}

function serverHandlers(file: string) {
  const source = read(file);
  const shared = sharedHandlers();
  const events = new Set([...source.matchAll(/\bsocket\.on\(\s*["']([^"']+)["']/g)].map((m) => m[1]));
  if (/registerConversationHandlers\(/.test(source)) shared.conversation.forEach((e) => events.add(e));
  if (/registerRoomChatHandlers\(/.test(source)) shared.roomChat.forEach((e) => events.add(e));
  return events;
}

describe("socket event contract", () => {
  const emitted = clientEmits();

  it("finds the client events", () => {
    expect(emitted).toContain("group_message:created");
    expect(emitted).toContain("join_group_room");
    expect(emitted).toContain("message:send");
  });

  it.each(SERVERS)("%s handles every event the web app emits", (server) => {
    const handled = serverHandlers(server);
    const missing = [...emitted].filter((event) => !handled.has(event));
    expect(missing).toEqual([]);
  });
});
