import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { processJobImage, type ProcessedImage } from "./images";
import { initialStatusFor, scanForScamSignals, shouldAutoHide } from "./moderation";
import { rankJobs } from "./ranking";
import type { JobInput, ReportReason } from "./schema";
import { removeJobImages, signedImageUrls, uploadJobImage } from "./storage";

export type FeedFilters = {
  q?: string;
  type?: string;
  mode?: string;
  paid?: boolean;
};

export const FEED_PAGE_SIZE = 12;

export const thumbPath = (path: string) => path.replace(/\.webp$/, "-thumb.webp");

/** Posts anyone can see: approved, not expired. */
export function publicWhere(now: Date = new Date()): Prisma.JobPostWhereInput {
  return { status: "LIVE", deadline: { gt: now } };
}

export function feedWhere(filters: FeedFilters, now: Date = new Date()): Prisma.JobPostWhereInput {
  const where: Prisma.JobPostWhereInput = { ...publicWhere(now) };
  if (filters.type && ["JOB", "INTERNSHIP", "PART_TIME", "REFERRAL"].includes(filters.type)) where.type = filters.type as never;
  if (filters.mode && ["REMOTE", "ONSITE", "HYBRID"].includes(filters.mode)) where.workMode = filters.mode as never;
  if (filters.paid) where.pay = { not: null };
  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { company: { contains: q, mode: "insensitive" } },
      { tags: { has: q.toLowerCase() } },
    ];
  }
  return where;
}

const cardInclude = {
  media: { orderBy: { order: "asc" }, take: 1 },
  author: { select: { id: true, name: true, image: true, posterTrust: true } },
} satisfies Prisma.JobPostInclude;

export type JobCardData = Prisma.JobPostGetPayload<{ include: typeof cardInclude }> & { saved: boolean; imageUrl: string | null };

async function decorate(jobs: Prisma.JobPostGetPayload<{ include: typeof cardInclude }>[], viewerId: string): Promise<JobCardData[]> {
  if (!jobs.length) return [];
  const saves = await prisma.jobSave.findMany({ where: { userId: viewerId, jobId: { in: jobs.map((job) => job.id) } }, select: { jobId: true } });
  const savedIds = new Set(saves.map((save) => save.jobId));
  const paths = jobs.flatMap((job) => job.media.map((media) => thumbPath(media.path)));
  const urls = await signedImageUrls(paths);
  return jobs.map((job) => ({
    ...job,
    saved: savedIds.has(job.id),
    imageUrl: job.media[0] ? (urls[thumbPath(job.media[0].path)] ?? null) : null,
  }));
}

export async function listFeed(viewerId: string, filters: FeedFilters, cursor?: string) {
  const rows = await prisma.jobPost.findMany({
    where: feedWhere(filters),
    include: cardInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: FEED_PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = rows.length > FEED_PAGE_SIZE;
  const page = rows.slice(0, FEED_PAGE_SIZE);
  return { jobs: await decorate(page, viewerId), nextCursor: hasMore ? page[page.length - 1].id : null };
}

/** The five best matches for a profile, from the 200 newest live posts. */
export async function forYou(viewerId: string, profile: { major?: string | null; interests?: string | null }) {
  const recent = await prisma.jobPost.findMany({ where: publicWhere(), include: cardInclude, orderBy: { createdAt: "desc" }, take: 200 });
  const ranked = rankJobs(recent, profile)
    .filter((entry) => entry.reasons.some((reason) => reason.startsWith("Matches")))
    .slice(0, 5);
  const decorated = await decorate(ranked.map((entry) => entry.job), viewerId);
  return decorated.map((job, index) => ({ job, reasons: ranked[index].reasons }));
}

export async function listMine(userId: string) {
  return prisma.jobPost.findMany({ where: { authorId: userId }, orderBy: { createdAt: "desc" }, include: { _count: { select: { saves: true, reports: true } } } });
}

export async function listSaved(userId: string) {
  const saves = await prisma.jobSave.findMany({
    where: { userId, job: { status: "LIVE" } },
    include: { job: { include: cardInclude } },
  });
  const jobs = saves.map((save) => save.job).sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  return decorate(jobs, userId);
}

type Viewer = { id: string; role?: string | null };

/** A post is visible to everyone while live; authors and admins can also see it in any other state. */
export async function getJob(id: string, viewer: Viewer) {
  const job = await prisma.jobPost.findUnique({
    where: { id },
    include: { media: { orderBy: { order: "asc" } }, author: { select: { id: true, name: true, image: true, posterTrust: true } } },
  });
  if (!job) return null;
  const privileged = job.authorId === viewer.id || viewer.role === "ADMIN";
  const open = job.status === "LIVE" && job.deadline > new Date();
  if (!privileged && !open) return null;

  const urls = await signedImageUrls(job.media.map((media) => media.path));
  const saved = Boolean(await prisma.jobSave.findUnique({ where: { userId_jobId: { userId: viewer.id, jobId: id } }, select: { jobId: true } }));
  return {
    ...job,
    saved,
    isAuthor: job.authorId === viewer.id,
    images: job.media.map((media) => ({ id: media.id, url: urls[media.path] ?? null, width: media.width, height: media.height })),
  };
}

/** How many of the viewer's accepted partners saved this post. */
export async function partnerSaveCount(jobId: string, viewerId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId: viewerId }, select: { id: true } });
  if (!profile) return 0;
  const matches = await prisma.match.findMany({
    where: { status: "ACCEPTED", OR: [{ profileId: profile.id }, { matchedProfileId: profile.id }] },
    select: { profile: { select: { userId: true } }, matchedProfile: { select: { userId: true } } },
  });
  const partnerIds = matches.map((match) => (match.profile.userId === viewerId ? match.matchedProfile.userId : match.profile.userId));
  if (!partnerIds.length) return 0;
  return prisma.jobSave.count({ where: { jobId, userId: { in: partnerIds } } });
}

export class JobError extends Error {}

export async function createJob(authorId: string, input: JobInput, files: Buffer[]) {
  const author = await prisma.user.findUnique({ where: { id: authorId }, select: { posterTrust: true, emailVerified: true } });
  if (!author) throw new JobError("Account not found");
  if (!author.emailVerified) throw new JobError("Verify your email before posting");

  const signals = scanForScamSignals(input.title, input.company, input.description, input.pay, input.applyTarget);
  const approvedPosts = await prisma.jobPost.count({ where: { authorId, status: { in: ["LIVE", "EXPIRED"] } } });
  const status = initialStatusFor({ posterTrust: author.posterTrust, approvedPosts, signals });

  // Decode and re-encode before anything is stored, so a bad image fails the whole post.
  let processed: ProcessedImage[];
  try {
    processed = await Promise.all(files.map((file) => processJobImage(file)));
  } catch {
    throw new JobError("One of the images could not be read. Use a JPEG, PNG or WebP photo.");
  }

  const job = await prisma.jobPost.create({
    data: {
      authorId,
      type: input.type,
      title: input.title,
      company: input.company,
      location: input.location,
      workMode: input.workMode,
      pay: input.pay,
      description: input.description,
      applyMethod: input.applyMethod,
      applyTarget: input.applyTarget,
      tags: input.tags,
      deadline: input.deadline,
      status,
      scamSignals: signals,
    },
  });

  if (processed.length) {
    const uploaded: string[] = [];
    try {
      for (const [index, image] of processed.entries()) {
        const path = `${job.id}/${index}.webp`;
        await uploadJobImage(path, image.full);
        await uploadJobImage(thumbPath(path), image.thumb);
        uploaded.push(path, thumbPath(path));
      }
      await prisma.jobMedia.createMany({ data: processed.map((image, index) => ({ jobId: job.id, path: `${job.id}/${index}.webp`, width: image.width, height: image.height, order: index })) });
    } catch (error) {
      await removeJobImages(uploaded);
      await prisma.jobPost.delete({ where: { id: job.id } });
      throw new JobError(error instanceof Error ? error.message : "Image upload failed");
    }
  }

  return { id: job.id, status, signals };
}

export async function toggleSave(userId: string, jobId: string) {
  const existing = await prisma.jobSave.findUnique({ where: { userId_jobId: { userId, jobId } } });
  if (existing) {
    await prisma.jobSave.delete({ where: { userId_jobId: { userId, jobId } } });
    return false;
  }
  const job = await prisma.jobPost.findFirst({ where: { id: jobId, ...publicWhere() }, select: { id: true } });
  if (!job) throw new JobError("This post is no longer open");
  await prisma.jobSave.create({ data: { userId, jobId } });
  return true;
}

export async function reportJob(input: { jobId: string; reporterId: string; reason: ReportReason; details?: string }) {
  const job = await prisma.jobPost.findUnique({ where: { id: input.jobId }, select: { authorId: true, status: true } });
  if (!job) throw new JobError("Post not found");
  if (job.authorId === input.reporterId) throw new JobError("You cannot report your own post");

  try {
    await prisma.jobReport.create({ data: { jobId: input.jobId, reporterId: input.reporterId, reason: input.reason, details: input.details?.slice(0, 500) || null } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { alreadyReported: true, hidden: false };
    throw error;
  }

  const count = await prisma.jobReport.count({ where: { jobId: input.jobId } });
  const hide = shouldAutoHide(count) && job.status === "LIVE";
  await prisma.jobPost.update({
    where: { id: input.jobId },
    data: { reportCount: count, ...(hide ? { status: "PENDING_REVIEW", reviewNote: "Hidden after reports, waiting for review" } : {}) },
  });
  return { alreadyReported: false, hidden: hide };
}

export type ReviewAction = "approve" | "reject" | "remove";

const REVIEW_COPY: Record<ReviewAction, { status: "LIVE" | "REJECTED" | "REMOVED"; message: (title: string, note?: string) => string }> = {
  approve: { status: "LIVE", message: (title) => `Your post "${title}" was approved and is now live.` },
  reject: { status: "REJECTED", message: (title, note) => `Your post "${title}" needs changes${note ? `: ${note}` : "."}` },
  remove: { status: "REMOVED", message: (title, note) => `Your post "${title}" was removed${note ? `: ${note}` : "."}` },
};

export async function reviewJob(jobId: string, adminId: string, action: ReviewAction, note?: string) {
  const job = await prisma.jobPost.findUnique({ where: { id: jobId }, select: { id: true, title: true, authorId: true } });
  if (!job) throw new JobError("Post not found");
  const copy = REVIEW_COPY[action];
  const trimmed = note?.trim() || undefined;
  await prisma.$transaction([
    prisma.jobPost.update({ where: { id: jobId }, data: { status: copy.status, reviewNote: trimmed ?? null, reviewedById: adminId, reviewedAt: new Date() } }),
    prisma.notification.create({ data: { userId: job.authorId, type: "JOB_REVIEW", content: copy.message(job.title, trimmed), relatedId: jobId } }),
  ]);
}

export async function reviewQueue() {
  return prisma.jobPost.findMany({
    where: { status: "PENDING_REVIEW" },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, name: true, email: true, posterTrust: true } }, _count: { select: { reports: true } } },
  });
}

/** Marks live posts past their deadline as expired. Safe to run repeatedly. */
export async function expireJobs(now: Date = new Date()) {
  const result = await prisma.jobPost.updateMany({ where: { status: "LIVE", deadline: { lte: now } }, data: { status: "EXPIRED" } });
  return result.count;
}
