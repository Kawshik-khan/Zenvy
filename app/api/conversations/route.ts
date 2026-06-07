import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { serializeConversation } from "@/lib/conversations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

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

  const serialized = await Promise.all(
    conversations.map((conversation) => serializeConversation(conversation, userId))
  );

  return NextResponse.json({ conversations: serialized });
}
