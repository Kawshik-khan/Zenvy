import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UnreadCountRow = {
  unreadCount: bigint | number;
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [row] = await prisma.$queryRaw<UnreadCountRow[]>`
      SELECT COUNT(*) AS "unreadCount"
      FROM "ConversationMessage" message
      INNER JOIN "ConversationParticipant" participant
        ON participant."conversationId" = message."conversationId"
       AND participant."userId" = ${session.user.id}
      WHERE participant."archived" = false
        AND message."senderId" <> ${session.user.id}
        AND message."status" <> 'DELETED'
        AND message."createdAt" > COALESCE(participant."lastReadAt", to_timestamp(0))
    `;

    return NextResponse.json({ unreadCount: Number(row?.unreadCount || 0) });
  } catch (error) {
    console.error("Unread conversations count error:", error);
    return NextResponse.json({ error: "Unable to load unread chat count" }, { status: 500 });
  }
}
