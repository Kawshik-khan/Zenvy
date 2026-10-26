import { handle, ok, requireUserId } from "@/lib/mobile/http";
import { parseTzOffset, studyStats } from "@/lib/mobile/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handle(async () => {
    const userId = await requireUserId();
    return ok({ stats: await studyStats(userId, parseTzOffset(new URL(request.url).searchParams.get("tz"))) });
  });
}
