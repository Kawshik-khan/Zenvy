import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { searchPeople } from "@/lib/people-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id && !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = session.user.id
    ? { id: session.user.id }
    : await prisma.user.findUnique({
        where: { email: session.user.email || "" },
        select: { id: true },
      });

  if (!currentUser?.id) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const limit = Number(searchParams.get("limit") || 12);

  try {
    const people = await searchPeople({
      currentUserId: currentUser.id,
      query: q,
      limit: Number.isFinite(limit) ? limit : 12,
    });

    return NextResponse.json({ people });
  } catch (error) {
    console.error("People search error:", error);
    return NextResponse.json({ error: "Unable to search people" }, { status: 500 });
  }
}
