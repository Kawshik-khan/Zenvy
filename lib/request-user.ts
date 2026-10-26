import { headers } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { bearerToken, verifyMobileToken } from "@/lib/mobile-auth";

export type RequestUser = { id: string; name: string | null };

/**
 * The signed-in user for an API route: the mobile app's bearer token when the request
 * carries one, otherwise the Auth.js session cookie. A request that sends a bearer token
 * is judged on that token alone, so a bad token never falls back to a cookie.
 */
export async function getRequestUser(): Promise<RequestUser | null> {
  const token = bearerToken((await headers()).get("authorization"));
  if (token) {
    const verified = verifyMobileToken(token);
    if (!verified) return null;
    const user = await prisma.user.findUnique({ where: { id: verified.sub }, select: { id: true, name: true } });
    return user ?? null;
  }

  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id, name: session.user.name ?? null };
}
