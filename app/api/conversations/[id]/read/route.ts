import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-user";
import { invalidateConversationUnread } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import { assertCanAccessConversation } from "@/lib/conversations";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getRequestUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await assertCanAccessConversation(currentUser.id, id);
    await prisma.conversationParticipant.updateMany({
      where: { conversationId: id, userId: currentUser.id },
      data: { lastReadAt: new Date() },
    });
    await invalidateConversationUnread(currentUser.id);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
