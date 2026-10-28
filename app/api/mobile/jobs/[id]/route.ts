import { isEnabled } from "@/lib/flags";
import { prisma } from "@/lib/prisma";
import { getJob, partnerSaveCount } from "@/lib/jobs/service";
import { fail, handle, ok, requireUserId } from "@/lib/mobile/http";
import { jobCard } from "@/lib/mobile/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const userId = await requireUserId();
    if (!isEnabled("jobs")) return fail("Jobs are not available yet", 404);
    const { id } = await params;
    const viewer = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    const job = viewer ? await getJob(id, viewer) : null;
    if (!job) return fail("This post is no longer open", 404);

    return ok({
      job: {
        ...jobCard({ ...job, imageUrl: job.images[0]?.url ?? null }),
        description: job.description,
        applyMethod: job.applyMethod,
        applyTarget: job.applyTarget,
        images: job.images.filter((image) => image.url),
        isAuthor: job.isAuthor,
        reviewNote: job.isAuthor ? job.reviewNote : null,
        partnerSaves: await partnerSaveCount(id, userId),
      },
    });
  });
}
