import { createGroup } from "@/app/actions/group";
import { fail, handle, ok, readJson, requireUserId } from "@/lib/mobile/http";
import { listGroups } from "@/lib/mobile/groups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The viewer's groups and suggestions to join (?q= searches). */
export async function GET(request: Request) {
  return handle(async () => {
    const userId = await requireUserId();
    return ok(await listGroups(userId, (new URL(request.url).searchParams.get("q") || "").slice(0, 80)));
  });
}

/** Creates a group with the viewer as admin. Body: { name, subject, description? }. */
export async function POST(request: Request) {
  return handle(async () => {
    await requireUserId();
    const body = await readJson<{ name?: unknown; subject?: unknown; description?: unknown }>(request);
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    if (!name || !subject) return fail("Add a name and a subject");
    const form = new FormData();
    form.set("name", name);
    form.set("subject", subject);
    if (typeof body.description === "string" && body.description.trim()) form.set("description", body.description.trim());
    const { groupId } = await createGroup(form);
    return ok({ id: groupId }, { status: 201 });
  });
}
