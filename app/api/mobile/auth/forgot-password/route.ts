import { requestPasswordReset } from "@/app/forgot-password/actions";
import { fail, handle, ok, readJson } from "@/lib/mobile/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Emails a reset link (same flow as the web form). Always answers sent for a valid email. */
export async function POST(request: Request) {
  return handle(async () => {
    const body = await readJson<{ email?: unknown }>(request);
    const form = new FormData();
    form.set("email", typeof body.email === "string" ? body.email : "");
    const state = await requestPasswordReset({ status: "idle" }, form);
    if (state.status === "error") return fail(state.emailError ?? state.error ?? "Something went wrong", state.emailError ? 400 : 429);
    return ok({ sent: true });
  });
}
