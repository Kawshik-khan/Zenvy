import { handle, ok, requireUserId } from "@/lib/mobile/http";
import { listPartners, listStudyAds } from "@/lib/mobile/people";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Ranked partner suggestions (?q= filters by name, major, college, interests) and active study ads. */
export async function GET(request: Request) {
  return handle(async () => {
    const userId = await requireUserId();
    const q = (new URL(request.url).searchParams.get("q") || "").slice(0, 80);
    const [partners, studyAds] = await Promise.all([listPartners(userId, q), listStudyAds()]);
    return ok({ partners, studyAds });
  });
}
