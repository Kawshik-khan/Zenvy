import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { invalidateConversationUnread } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import { assertCanAccessConversation } from "@/lib/conversations";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await assertCanAccessConversation(session.user.id, id);
    await prisma.conversationParticipant.updateMany({
      where: { conversationId: id, userId: session.user.id },
      data: { lastReadAt: new Date() },
    });
    await invalidateConversationUnread(session.user.id);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
