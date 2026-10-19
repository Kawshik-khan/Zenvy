import { Building2, MapPin, Timer } from "lucide-react";
import Link from "next/link";
import { Avatar, Badge, Card } from "@/components/ui";
import { deadlineLabel, isClosingSoon } from "@/lib/jobs/format";
import { JOB_TYPE_LABELS, WORK_MODE_LABELS } from "@/lib/jobs/schema";
import type { JobCardData } from "@/lib/jobs/service";
import { SaveButton } from "./SaveButton";

export function JobCard({ job }: { job: JobCardData }) {
  const closingSoon = isClosingSoon(job.deadline);
  return (
    <Card as="article" shadow="md" padding="none" className="flex flex-col">
      {job.imageUrl && (
        <Link href={`/jobs/${job.id}`} tabIndex={-1} aria-hidden="true" className="block border-b-[length:var(--nb-border-width)] border-line">
          <img src={job.imageUrl} alt="" loading="lazy" className="aspect-[16/7] w-full object-cover" />
        </Link>
      )}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="career" size="sm">
            {JOB_TYPE_LABELS[job.type]}
          </Badge>
          <Badge tone="paper" size="sm">
            {WORK_MODE_LABELS[job.workMode]}
          </Badge>
          {job.pay && (
            <Badge tone="live" size="sm">
              {job.pay}
            </Badge>
          )}
          {closingSoon && (
            <Badge tone="alert" size="sm">
              Closing soon
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <h3 className="m-0 text-xl leading-tight font-bold">
            <Link href={`/jobs/${job.id}`} className="nb-focus text-fg no-underline hover:underline">
              {job.title}
            </Link>
          </h3>
          <p className="m-0 flex items-center gap-2 text-[15px] font-bold">
            <Building2 aria-hidden="true" size={16} className="shrink-0" />
            {job.company}
          </p>
          <p className="m-0 flex items-center gap-2 text-[15px] text-fg-muted">
            <MapPin aria-hidden="true" size={16} className="shrink-0" />
            {job.location}
          </p>
        </div>

        {job.tags.length > 0 && (
          <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label="Tags">
            {job.tags.slice(0, 5).map((tag) => (
              <li key={tag} className="rounded-full border-2 border-line bg-canvas px-2.5 py-0.5 text-sm font-bold">
                {tag}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 border-t-2 border-line pt-4">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar name={job.author.name} src={job.author.image} size="sm" />
            <div className="min-w-0 text-sm">
              <p className="m-0 truncate font-bold">{job.author.name || "A student"}</p>
              <p className="m-0 flex items-center gap-1 text-fg-muted">
                <Timer aria-hidden="true" size={14} />
                {deadlineLabel(job.deadline)}
              </p>
            </div>
          </div>
          <SaveButton jobId={job.id} title={job.title} initialSaved={job.saved} />
        </div>
      </div>
    </Card>
  );
}
