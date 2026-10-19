import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { AppHeader } from "@/components/shell/AppHeader";
import { Badge, ButtonLink, Card, EmptyState, type Tone } from "@/components/ui";
import { deadlineLabel, STATUS_LABELS } from "@/lib/jobs/format";
import { listMine } from "@/lib/jobs/service";
import { DeleteJobButton } from "../_components/DeleteJobButton";

export const dynamic = "force-dynamic";

const statusTone: Record<string, Tone> = { LIVE: "live", PENDING_REVIEW: "focus", REJECTED: "alert", REMOVED: "alert", EXPIRED: "paper" };

export default async function MyJobsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const jobs = await listMine(session.user.id);

  return (
    <div className="min-h-dvh bg-canvas font-grotesk text-fg">
      <AppHeader />
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 pb-28 md:px-8 md:pb-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="m-0 text-4xl leading-[1.05] font-bold tracking-tight md:text-5xl">My posts</h1>
            <p className="m-0 text-lg text-fg-muted">Status of everything you have posted.</p>
          </div>
          <ButtonLink href="/jobs/new" variant="career">
            Post a job
          </ButtonLink>
        </div>

        {jobs.length ? (
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {jobs.map((job) => (
              <li key={job.id}>
                <Card as="article" shadow="md" padding="sm" className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={statusTone[job.status] ?? "card"} size="sm">
                      {STATUS_LABELS[job.status]}
                    </Badge>
                    <span className="text-sm text-fg-muted">{deadlineLabel(job.deadline)}</span>
                  </div>
                  <h2 className="m-0 text-xl font-bold">
                    <Link href={`/jobs/${job.id}`} className="nb-focus text-fg no-underline hover:underline">
                      {job.title}
                    </Link>
                  </h2>
                  <p className="m-0 text-[15px] text-fg-muted">
                    {job.company} · {job._count.saves} saved
                  </p>
                  {job.reviewNote && (
                    <p className="m-0 rounded-nb border-2 border-line bg-canvas p-3 text-[15px]">
                      <span className="font-bold">Reviewer note: </span>
                      {job.reviewNote}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <DeleteJobButton jobId={job.id} title={job.title} />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="You have not posted anything" description="Share an internship, job or referral with other students." action={<ButtonLink href="/jobs/new">Post a job</ButtonLink>} />
        )}
      </main>
    </div>
  );
}
