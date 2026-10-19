import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  assertCanAccessConversation,
  createConversationMessage,
  formatConversationMessage,
} from "@/lib/conversations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") || 50), 100);

  try {
    await assertCanAccessConversation(session.user.id, id);

    const messages = await prisma.conversationMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { sender: { select: { name: true, image: true } } },
    });

    const hasMore = messages.length > limit;
    const page = hasMore ? messages.slice(0, limit) : messages;
    const ordered = page.reverse();

    return NextResponse.json({
      messages: ordered.map((message) => formatConversationMessage(message, session.user!.id)),
      nextCursor: hasMore ? page[page.length - 1]?.id : null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const content = String(body?.content || "").trim();
  if (!content && !body?.fileUrl) {
    return NextResponse.json({ error: "Message content is required" }, { status: 400 });
  }

  try {
    const message = await createConversationMessage({
      conversationId: id,
      senderId: session.user.id,
      content,
      fileUrl: body?.fileUrl || null,
      fileType: body?.fileType || null,
      fileName: body?.fileName || null,
    });

    return NextResponse.json({ message });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unable to send message" }, { status: 403 });
  }
}
