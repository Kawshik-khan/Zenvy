import { NextResponse } from "next/server";
import { getMobileUser } from "@/lib/mobile-user";
import { getRequestUser } from "@/lib/request-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The signed-in user. The app calls this on launch to check its stored token is still good. */
export async function GET() {
  const current = await getRequestUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getMobileUser(current.id);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ user });
}
