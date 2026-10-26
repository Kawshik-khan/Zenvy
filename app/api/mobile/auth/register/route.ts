import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createAccount, validateSignUp } from "@/lib/accounts";
import { createMobileToken } from "@/lib/mobile-auth";
import { getMobileUser } from "@/lib/mobile-user";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mobile sign-up. Creates the account like the web form, then signs the person in. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const input = { name: String(body?.name ?? ""), email: String(body?.email ?? ""), password: String(body?.password ?? "") };

  const checked = validateSignUp(input);
  if (Object.keys(checked.fieldErrors).length) {
    return NextResponse.json({ error: "Check the highlighted fields.", fieldErrors: checked.fieldErrors }, { status: 400 });
  }

  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  if (!(await rateLimit(`register_${ip}`, 5))) {
    return NextResponse.json({ error: "Too many sign-up attempts. Please try again later." }, { status: 429 });
  }

  const result = await createAccount(input);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Check the highlighted fields.", fieldErrors: result.fieldErrors }, { status: result.fieldErrors ? 400 : 500 });
  }

  const issued = createMobileToken(result.userId);
  if (!issued) return NextResponse.json({ error: "Sign-in is not configured" }, { status: 500 });

  return NextResponse.json({ token: issued.token, expiresAt: issued.expiresAt, user: await getMobileUser(result.userId) }, { status: 201 });
}
