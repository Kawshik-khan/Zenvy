import { prisma } from "@/lib/prisma";
import { fail, handle, ok, requireUserId } from "@/lib/mobile/http";
import { createMobileSession } from "@/lib/mobile/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Swaps a still-valid session for a fresh 30-day one, so active app users stay signed in. */
export async function POST() {
  return handle(async () => {
    const userId = await requireUserId();
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, image: true } });
    if (!user) return fail("Account not found", 401);
    return ok({ user: { id: user.id, name: user.name, email: user.email }, session: await createMobileSession(user) });
  });
}
