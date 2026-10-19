export type RankableJob = { id: string; tags: string[]; title: string; createdAt: Date; deadline: Date };
export type RankProfile = { major?: string | null; interests?: string | null };

const DAY_MS = 24 * 60 * 60 * 1000;

function words(value?: string | null) {
  return (value ?? "")
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((word) => word.length > 1);
}

/** Interest and major keywords as a set, for matching against a post's tags and title. */
export function profileKeywords(profile: RankProfile) {
  return new Set([...words(profile.major), ...words(profile.interests)]);
}

export type ScoredJob<T> = { job: T; score: number; reasons: string[] };

/**
 * Higher is better. Relevance to the profile counts most, then freshness, then how soon the
 * deadline is (a closing soon post is worth seeing before one with weeks left).
 */
export function scoreJob(job: RankableJob, keywords: Set<string>, now: Date = new Date()) {
  const reasons: string[] = [];
  const haystack = new Set([...job.tags.flatMap((tag) => words(tag)), ...words(job.title)]);
  const overlap = [...keywords].filter((keyword) => haystack.has(keyword));
  let score = Math.min(overlap.length, 4) * 25;
  if (overlap.length) reasons.push(`Matches ${overlap.slice(0, 3).join(", ")}`);

  const ageDays = Math.max(0, (now.getTime() - job.createdAt.getTime()) / DAY_MS);
  score += 20 * Math.exp(-ageDays / 7);

  const daysLeft = (job.deadline.getTime() - now.getTime()) / DAY_MS;
  if (daysLeft <= 0) return { score: -1, reasons: [] };
  if (daysLeft <= 7) {
    score += 10 * (1 - daysLeft / 7);
    reasons.push("Closing soon");
  }
  return { score, reasons };
}

export function rankJobs<T extends RankableJob>(jobs: T[], profile: RankProfile, now: Date = new Date()): ScoredJob<T>[] {
  const keywords = profileKeywords(profile);
  return jobs
    .map((job) => ({ job, ...scoreJob(job, keywords, now) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score || b.job.createdAt.getTime() - a.job.createdAt.getTime());
}
