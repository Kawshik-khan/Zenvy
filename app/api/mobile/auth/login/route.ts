import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { checkCredentials } from "@/lib/credentials";
import { createMobileToken } from "@/lib/mobile-auth";
import { getMobileUser } from "@/lib/mobile-user";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mobile sign-in: email + password in, bearer token out. Same checks and lockout as the web form. */
export async function POST(request: Request) {
  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  if (!(await rateLimit(`login_${ip}`, 5))) {
    return NextResponse.json({ error: "Too many requests. Please try again in 15 minutes." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const result = await checkCredentials(body?.email, body?.password);
  if (!result.ok) {
    const message = result.reason === "locked" ? result.message : "Invalid credentials.";
    return NextResponse.json({ error: message }, { status: result.reason === "locked" ? 423 : 401 });
  }

  const issued = createMobileToken(result.user.id);
  if (!issued) return NextResponse.json({ error: "Sign-in is not configured" }, { status: 500 });

  return NextResponse.json({ token: issued.token, expiresAt: issued.expiresAt, user: await getMobileUser(result.user.id) });
}
