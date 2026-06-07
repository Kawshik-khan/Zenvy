import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { auth } from "@/auth";
import { assertCanAccessCall } from "@/lib/calls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const callId = req.nextUrl.searchParams.get("callId");
  if (!callId) {
    return NextResponse.json({ error: "Missing callId" }, { status: 400 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !serverUrl) {
    return NextResponse.json({ error: "LiveKit is not configured" }, { status: 500 });
  }

  await assertCanAccessCall(session.user.id, callId);

  const token = new AccessToken(apiKey, apiSecret, {
    identity: session.user.id,
    name: session.user.name || "Scholar",
    ttl: "2h",
  });

  token.addGrant({
    room: `call:${callId}`,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return NextResponse.json({
    token: await token.toJwt(),
    serverUrl,
    roomName: `call:${callId}`,
  });
}
