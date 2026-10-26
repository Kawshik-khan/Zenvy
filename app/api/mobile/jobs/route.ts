import { isEnabled } from "@/lib/flags";
import { prisma } from "@/lib/prisma";
import { forYou, listFeed, listSaved } from "@/lib/jobs/service";
import { handle, ok, requireUserId } from "@/lib/mobile/http";
import { jobCard } from "@/lib/mobile/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ?tab=browse (default; q, type, mode, paid=1, cursor) | saved | forYou.
 * Returns { enabled: false } while the jobs portal (FEATURE_JOBS) is off.
 */
export async function GET(request: Request) {
  return handle(async () => {
    const userId = await requireUserId();
    if (!isEnabled("jobs")) return ok({ enabled: false, jobs: [], nextCursor: null });

    const params = new URL(request.url).searchParams;
    const tab = params.get("tab") || "browse";

    if (tab === "saved") {
      return ok({ enabled: true, jobs: (await listSaved(userId)).map((job) => jobCard(job)), nextCursor: null });
    }
    if (tab === "forYou") {
      const profile = await prisma.profile.findUnique({ where: { userId }, select: { major: true, interests: true } });
      const ranked = await forYou(userId, profile ?? {});
      return ok({ enabled: true, jobs: ranked.map(({ job, reasons }) => ({ ...jobCard(job), reasons })), nextCursor: null });
    }

    const { jobs, nextCursor } = await listFeed(
      userId,
      {
        q: params.get("q")?.slice(0, 80) || undefined,
        type: params.get("type") || undefined,
        mode: params.get("mode") || undefined,
        paid: params.get("paid") === "1",
      },
      params.get("cursor") || undefined,
    );
    return ok({ enabled: true, jobs: jobs.map((job) => jobCard(job)), nextCursor });
  });
}
