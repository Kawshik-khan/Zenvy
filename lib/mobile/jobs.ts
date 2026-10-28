import { deadlineLabel, isClosingSoon } from "@/lib/jobs/format";
import type { JobCardData } from "@/lib/jobs/service";
import { iso } from "@/lib/mobile/http";

type CardLike = Pick<JobCardData, "id" | "type" | "title" | "company" | "location" | "workMode" | "pay" | "tags" | "deadline" | "status" | "createdAt" | "saved" | "imageUrl"> & {
  author: { id: string; name: string | null; posterTrust: string };
};

export function jobCard(job: CardLike, now = new Date()) {
  return {
    id: job.id,
    type: job.type,
    title: job.title,
    company: job.company,
    location: job.location,
    workMode: job.workMode,
    pay: job.pay,
    tags: job.tags,
    deadline: iso(job.deadline),
    deadlineLabel: deadlineLabel(job.deadline, now),
    closingSoon: isClosingSoon(job.deadline, now),
    status: job.status,
    postedAt: iso(job.createdAt),
    saved: job.saved,
    imageUrl: job.imageUrl,
    author: { id: job.author.id, name: job.author.name || "Zenvy member", posterTrust: job.author.posterTrust },
  };
}
