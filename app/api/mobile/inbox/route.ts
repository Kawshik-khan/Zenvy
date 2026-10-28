import { prisma } from "@/lib/prisma";
import { assertCanAccessConversation, serializeConversation } from "@/lib/conversations";
import { handle, ok, requireUserId } from "@/lib/mobile/http";
import { listChannels, listGroups } from "@/lib/mobile/groups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The Messages tab: direct conversations, group chats and channels in one request. */
export async function GET() {
  return handle(async () => {
    const userId = await requireUserId();
    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { userId, archived: false } } },
      include: {
        participants: { include: { user: { select: { id: true, name: true, image: true, email: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: { select: { name: true } } } },
      },
      orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
      take: 100,
    });

    // Same access rule as /api/conversations: a DM disappears when the match ends or a block exists.
    const accessible = [];
    for (const conversation of conversations) {
      try {
        await assertCanAccessConversation(userId, conversation.id);
        accessible.push(conversation);
      } catch {}
    }

    const [people, groups, channels] = await Promise.all([
      Promise.all(accessible.map((conversation) => serializeConversation(conversation, userId))),
      listGroups(userId),
      listChannels(userId),
    ]);
    // Participants carry emails as a name fallback on the web; the app gets names only.
    const direct = people.map(({ participants, ...conversation }) => ({
      ...conversation,
      participants: participants.map((participant: { id: string; name: string; image: string | null }) => ({ id: participant.id, name: participant.name.includes("@") ? "Zenvy student" : participant.name, image: participant.image })),
    }));

    return ok({ direct, groups: groups.mine, channels: channels.mine, suggestedChannels: channels.discover });
  });
}
