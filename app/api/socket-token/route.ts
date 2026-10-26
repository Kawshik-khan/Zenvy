import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-user";
import { createSocketToken } from "@/lib/socket-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const currentUser = await getRequestUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = createSocketToken(currentUser.id);
  if (!token) {
    return NextResponse.json({ error: "Socket auth is not configured" }, { status: 500 });
  }

  return NextResponse.json({ token });
}
