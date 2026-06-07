import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSocketToken } from "@/lib/socket-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = createSocketToken(session.user.id);
  if (!token) {
    return NextResponse.json({ error: "Socket auth is not configured" }, { status: 500 });
  }

  return NextResponse.json({ token });
}
