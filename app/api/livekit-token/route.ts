import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { assertCanAccessCall } from "@/lib/calls";
import { createLiveKitCallCredentials } from "@/lib/livekit";

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

  try {
    await assertCanAccessCall(session.user.id, callId);
    const liveKit = await createLiveKitCallCredentials({
      callId,
      userId: session.user.id,
      userName: session.user.name,
    });
    return NextResponse.json(liveKit);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create LiveKit token" },
      { status: 500 },
    );
  }
}
