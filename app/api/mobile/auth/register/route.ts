import { clientIp, fail, handle, ok, readJson } from "@/lib/mobile/http";
import { createMobileSession } from "@/lib/mobile/session";
import { registerUser } from "@/lib/register";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Creates an account and signs the app in straight away (emails are auto-verified for now). */
export async function POST(request: Request) {
  return handle(async () => {
    const body = await readJson<{ name?: unknown; email?: unknown; password?: unknown }>(request);
    const result = await registerUser({
      name: typeof body.name === "string" ? body.name : "",
      email: typeof body.email === "string" ? body.email : "",
      password: typeof body.password === "string" ? body.password : "",
      ip: clientIp(request),
    });
    if (!result.ok) return fail(result.error ?? "Check the highlighted fields.", 400, { fieldErrors: result.fieldErrors ?? {} });

    return ok({ user: result.user, session: await createMobileSession(result.user) }, { status: 201 });
  });
}
