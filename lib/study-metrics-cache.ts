import { cacheKeys, getJsonCache, setJsonCache } from "@/lib/cache";
import { getStudyMetrics, type StudyMetrics } from "@/lib/study-metrics";

const STUDY_METRICS_TTL_SECONDS = 90;

export async function getCachedStudyMetrics(userId: string, now = new Date()): Promise<StudyMetrics> {
  const key = cacheKeys.studyMetrics(userId);
  const cached = await getJsonCache<StudyMetrics>(key);
  if (cached) return cached;

  const metrics = await getStudyMetrics(userId, now);
  await setJsonCache(key, metrics, STUDY_METRICS_TTL_SECONDS);
  return metrics;
}
