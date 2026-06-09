import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cacheKeys, getJsonCache, setJsonCache } from "@/lib/cache";

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
    const cacheKey = cacheKeys.conversationUnread(session.user.id);
    const cachedUnreadCount = await getJsonCache<number>(cacheKey);
    if (typeof cachedUnreadCount === "number") {
      return NextResponse.json({ unreadCount: cachedUnreadCount });
    }

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

    const unreadCount = Number(row?.unreadCount || 0);
    await setJsonCache(cacheKey, unreadCount, 15);

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error("Unread conversations count error:", error);
    return NextResponse.json({ error: "Unable to load unread chat count" }, { status: 500 });
  }
}
