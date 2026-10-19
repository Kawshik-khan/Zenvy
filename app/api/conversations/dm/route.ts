import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { resolveDmConversation, serializeConversation } from "@/lib/conversations";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const targetUserId = body?.targetUserId;
    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });
    }

    const conversation = await resolveDmConversation(session.user.id, targetUserId);
    return NextResponse.json({
      conversation: await serializeConversation(conversation, session.user.id),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unable to resolve conversation" }, { status: 400 });
  }
}
