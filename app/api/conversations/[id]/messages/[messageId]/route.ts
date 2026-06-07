import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assertCanAccessConversation } from "@/lib/conversations";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, messageId } = await params;

  try {
    await assertCanAccessConversation(session.user.id, id);
    const message = await prisma.conversationMessage.findUnique({ where: { id: messageId } });
    if (!message || message.conversationId !== id || message.senderId !== session.user.id) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    await prisma.conversationMessage.update({
      where: { id: messageId },
      data: { status: "DELETED", content: "" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
  }
}
