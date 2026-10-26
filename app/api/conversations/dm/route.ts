import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-user";
import { resolveDmConversation, serializeConversation } from "@/lib/conversations";

export async function POST(request: Request) {
  const currentUser = await getRequestUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const targetUserId = body?.targetUserId;
    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });
    }

    const conversation = await resolveDmConversation(currentUser.id, targetUserId);
    return NextResponse.json({
      conversation: await serializeConversation(conversation, currentUser.id),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unable to resolve conversation" }, { status: 400 });
  }
}
