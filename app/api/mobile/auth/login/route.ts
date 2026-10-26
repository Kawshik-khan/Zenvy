import { AccountLockedError, verifyCredentials } from "@/lib/credentials";
import { clientIp, fail, handle, ok, readJson } from "@/lib/mobile/http";
import { createMobileSession } from "@/lib/mobile/session";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Email and password sign-in for the mobile app. Returns session cookies for the Cookie header. */
export async function POST(request: Request) {
  return handle(async () => {
    if (!(await rateLimit(`login_${clientIp(request)}`, 5))) {
      return fail("Too many requests. Please try again in 15 minutes.", 429);
    }

    const body = await readJson<{ email?: unknown; password?: unknown }>(request);
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email.trim() || !password) return fail("Enter your email and password.");

    let user;
    try {
      user = await verifyCredentials(email, password);
    } catch (error) {
      if (error instanceof AccountLockedError) return fail(error.message, 423);
      throw error;
    }
    if (!user) return fail("Invalid credentials.", 401);

    return ok({ user: { id: user.id, name: user.name, email: user.email }, session: await createMobileSession(user) });
  });
}
