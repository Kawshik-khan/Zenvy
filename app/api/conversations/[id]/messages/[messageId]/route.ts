import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-user";
import { invalidateConversationUnread } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import { assertCanAccessConversation } from "@/lib/conversations";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const currentUser = await getRequestUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = currentUser.id;
  const { id, messageId } = await params;

  try {
    const conversation = await assertCanAccessConversation(userId, id);
    const message = await prisma.conversationMessage.findUnique({ where: { id: messageId } });
    if (!message || message.conversationId !== id || message.senderId !== userId) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    await prisma.conversationMessage.update({
      where: { id: messageId },
      data: { status: "DELETED", content: "" },
    });

    await invalidateConversationUnread(
      ...conversation.participants
        .map((participant) => participant.userId)
        .filter((participantUserId) => participantUserId !== userId)
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
  }
}
