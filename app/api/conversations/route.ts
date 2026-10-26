import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-user";
import { prisma } from "@/lib/prisma";
import { assertCanAccessConversation, serializeConversation } from "@/lib/conversations";

export async function GET() {
  const currentUser = await getRequestUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = currentUser.id;

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId, archived: false } },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, image: true, email: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: { select: { name: true } } },
      },
    },
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    take: 100,
  });

  const accessibleConversations = [];
  for (const conversation of conversations) {
    try {
      await assertCanAccessConversation(userId, conversation.id);
      accessibleConversations.push(conversation);
    } catch {}
  }

  const serialized = await Promise.all(
    accessibleConversations.map((conversation) => serializeConversation(conversation, userId))
  );

  return NextResponse.json({ conversations: serialized });
}
