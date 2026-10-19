import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppHeader } from "@/components/shell/AppHeader";
import { ButtonLink, EmptyState } from "@/components/ui";
import { listSaved } from "@/lib/jobs/service";
import { JobCard } from "../_components/JobCard";

export const dynamic = "force-dynamic";

export default async function SavedJobsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const jobs = await listSaved(session.user.id);

  return (
    <div className="min-h-dvh bg-canvas font-grotesk text-fg">
      <AppHeader />
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 pb-28 md:px-8 md:pb-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="m-0 text-4xl leading-[1.05] font-bold tracking-tight md:text-5xl">Saved jobs</h1>
            <p className="m-0 text-lg text-fg-muted">Sorted by deadline, soonest first.</p>
          </div>
          <ButtonLink href="/jobs" variant="secondary">
            Back to jobs
          </ButtonLink>
        </div>
        {jobs.length ? (
          <ul className="m-0 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => (
              <li key={job.id} className="flex">
                <div className="w-full">
                  <JobCard job={job} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Nothing saved yet" description="Save a post to keep it here until its deadline." action={<ButtonLink href="/jobs">Browse jobs</ButtonLink>} />
        )}
      </main>
    </div>
  );
}
