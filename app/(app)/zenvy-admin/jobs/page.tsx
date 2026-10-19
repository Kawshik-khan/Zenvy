import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppHeader } from "@/components/shell/AppHeader";
import { Badge, Button, ButtonLink, Card, EmptyState, Input } from "@/components/ui";
import { JOB_TYPE_LABELS } from "@/lib/jobs/schema";
import { reviewQueue } from "@/lib/jobs/service";
import { prisma } from "@/lib/prisma";
import { reviewJobAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/zenvy-admin/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "ADMIN") redirect("/dashboard");

  const queue = await reviewQueue();

  return (
    <div className="min-h-dvh bg-canvas font-grotesk text-fg">
      <AppHeader />
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 pb-28 md:px-8 md:pb-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="m-0 text-4xl leading-[1.05] font-bold tracking-tight md:text-5xl">Job review queue</h1>
            <p className="m-0 text-lg text-fg-muted">{queue.length} waiting, oldest first.</p>
          </div>
          <ButtonLink href="/zenvy-admin" variant="secondary" size="sm">
            Back to overview
          </ButtonLink>
        </div>

        {queue.length === 0 ? (
          <EmptyState title="The queue is empty" description="New posts from first-time posters and reported posts appear here." />
        ) : (
          <ul className="m-0 flex list-none flex-col gap-5 p-0">
            {queue.map((job) => (
              <li key={job.id}>
                <Card as="article" shadow="md" className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="career" size="sm">
                      {JOB_TYPE_LABELS[job.type]}
                    </Badge>
                    <Badge tone="paper" size="sm">
                      {job.author.posterTrust.replace("_", " ").toLowerCase()}
                    </Badge>
                    {job._count.reports > 0 && (
                      <Badge tone="alert" size="sm">
                        {job._count.reports} report{job._count.reports === 1 ? "" : "s"}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <h2 className="m-0 text-2xl font-bold">{job.title}</h2>
                    <p className="m-0 text-fg-muted">
                      {job.company} · {job.location} · by {job.author.name || job.author.email}
                    </p>
                  </div>
                  {job.scamSignals.length > 0 && (
                    <div role="note" className="rounded-nb border-nb bg-alert p-3 text-ink">
                      <p className="m-0 font-bold">Possible scam signals</p>
                      <ul className="m-0 mt-1 list-disc pl-5">
                        {job.scamSignals.map((signal) => (
                          <li key={signal}>{signal}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {job.reviewNote && <p className="m-0 text-sm text-fg-muted">System note: {job.reviewNote}</p>}
                  <p className="m-0 line-clamp-6 text-[15px] break-words whitespace-pre-wrap">{job.description}</p>
                  {job.applyTarget && <p className="m-0 font-jetbrains text-sm break-all">Apply: {job.applyTarget}</p>}

                  <form action={reviewJobAction} className="flex flex-col gap-3 border-t-2 border-line pt-4">
                    <input type="hidden" name="jobId" value={job.id} />
                    <Input id={`note-${job.id}`} name="note" label="Note to poster (needed to reject or remove)" maxLength={300} />
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" name="action" value="approve" variant="live" size="sm" aria-label={`Approve ${job.title}`}>
                        Approve
                      </Button>
                      <Button type="submit" name="action" value="reject" variant="focus" size="sm" aria-label={`Ask for changes to ${job.title}`}>
                        Needs changes
                      </Button>
                      <Button type="submit" name="action" value="remove" variant="danger" size="sm" aria-label={`Remove ${job.title}`}>
                        Remove
                      </Button>
                    </div>
                  </form>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
