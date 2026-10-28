import { revalidatePath } from "next/cache";
import { handle, ok, readJson, requireUserId } from "@/lib/mobile/http";
import { createStudyAdForUser, type StudyAdInput } from "@/lib/study-ads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Body: { title, subjects, availability, description, mode: ONLINE | IN_PERSON | HYBRID | ANY }. */
export async function POST(request: Request) {
  return handle(async () => {
    const userId = await requireUserId();
    const ad = await createStudyAdForUser(userId, await readJson<StudyAdInput>(request));
    revalidatePath("/matching");
    return ok({ id: ad.id }, { status: 201 });
  });
}
