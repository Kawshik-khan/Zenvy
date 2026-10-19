import { Plus, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppHeader } from "@/components/shell/AppHeader";
import { Button, ButtonLink, Card, CardHeader, Checkbox, EmptyState, Input, Select } from "@/components/ui";
import { deadlineLabel } from "@/lib/jobs/format";
import { JOB_TYPE_LABELS, JOB_TYPES, WORK_MODE_LABELS, WORK_MODES } from "@/lib/jobs/schema";
import { forYou, listFeed } from "@/lib/jobs/service";
import { prisma } from "@/lib/prisma";
import { JobCard } from "./_components/JobCard";

export const dynamic = "force-dynamic";

type SearchParams = { q?: string; type?: string; mode?: string; paid?: string; cursor?: string };

export default async function JobsPage(props: { searchParams?: Promise<SearchParams> }) {
  const params = (await props.searchParams) || {};
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const filters = { q: params.q, type: params.type, mode: params.mode, paid: params.paid === "1" };
  const filtersActive = Boolean(params.q || params.type || params.mode || filters.paid);

  const [feed, profile] = await Promise.all([
    listFeed(session.user.id, filters, params.cursor),
    prisma.profile.findUnique({ where: { userId: session.user.id }, select: { major: true, interests: true } }),
  ]);
  const suggestions = profile && !params.cursor && !filtersActive ? await forYou(session.user.id, profile) : [];

  const nextParams = new URLSearchParams();
  for (const [key, value] of Object.entries({ q: params.q, type: params.type, mode: params.mode, paid: params.paid })) if (value) nextParams.set(key, value);
  if (feed.nextCursor) nextParams.set("cursor", feed.nextCursor);

  return (
    <div className="min-h-dvh bg-canvas font-grotesk text-fg">
      <AppHeader />

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 pb-28 md:px-8 md:pb-10">
        <section aria-labelledby="jobs-title" className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-2">
            <h1 id="jobs-title" className="m-0 text-4xl leading-[1.05] font-bold tracking-tight md:text-5xl">
              Jobs
            </h1>
            <p className="m-0 text-lg text-fg-muted">Internships, part-time work and referrals posted by students, alumni and employers.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/jobs/new" variant="career" size="lg" icon={<Plus size={20} />}>
              Post a job
            </ButtonLink>
            <ButtonLink href="/jobs/saved" variant="secondary" size="lg">
              Saved
            </ButtonLink>
            <ButtonLink href="/jobs/mine" variant="secondary" size="lg">
              My posts
            </ButtonLink>
          </div>
        </section>

        <Card as="form" action="/jobs" role="search" aria-label="Filter jobs" padding="sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,2fr)_1fr_1fr_auto_auto] lg:items-center">
            <Input id="j-q" name="q" type="search" label="Search jobs" labelHidden defaultValue={params.q ?? ""} placeholder="Search title, company or tag" className="sm:col-span-2 lg:col-span-1" />
            <Select id="j-type" name="type" label="Type" labelHidden defaultValue={params.type ?? ""}>
              <option value="">Any type</option>
              {JOB_TYPES.map((type) => (
                <option key={type} value={type}>
                  {JOB_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
            <Select id="j-mode" name="mode" label="Work mode" labelHidden defaultValue={params.mode ?? ""}>
              <option value="">Any mode</option>
              {WORK_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {WORK_MODE_LABELS[mode]}
                </option>
              ))}
            </Select>
            <Checkbox id="j-paid" name="paid" value="1" label="Paid only" defaultChecked={filters.paid} />
            <Button type="submit">Apply</Button>
          </div>
          {filtersActive && (
            <div className="mt-3">
              <ButtonLink href="/jobs" variant="secondary" size="sm">
                Clear filters
              </ButtonLink>
            </div>
          )}
        </Card>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_21rem]">
          <section aria-labelledby="feed-title" className="flex flex-col gap-5">
            <h2 id="feed-title" className="m-0 text-2xl font-bold">
              {filtersActive ? "Results" : "Latest posts"}
            </h2>
            {feed.jobs.length ? (
              <ul className="m-0 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2">
                {feed.jobs.map((job) => (
                  <li key={job.id} className="flex">
                    <div className="w-full">
                      <JobCard job={job} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title={filtersActive ? "No posts match these filters" : "No posts yet"}
                description={filtersActive ? "Try fewer filters." : "Be the first to share an opening."}
                action={
                  <ButtonLink href={filtersActive ? "/jobs" : "/jobs/new"} variant={filtersActive ? "secondary" : "career"}>
                    {filtersActive ? "Clear filters" : "Post a job"}
                  </ButtonLink>
                }
              />
            )}
            {feed.nextCursor && (
              <div className="flex justify-center">
                <ButtonLink href={`/jobs?${nextParams.toString()}`} variant="secondary">
                  Show more
                </ButtonLink>
              </div>
            )}
            {params.cursor && (
              <div className="flex justify-center">
                <ButtonLink href="/jobs" variant="ghost" size="sm">
                  Back to the newest
                </ButtonLink>
              </div>
            )}
          </section>

          <aside aria-label="Jobs extras" className="flex flex-col gap-6">
            {suggestions.length > 0 && (
              <Card padding="none">
                <CardHeader title="For you" tone="focus" />
                <ul className="m-0 flex list-none flex-col p-0">
                  {suggestions.map(({ job, reasons }) => (
                    <li key={job.id} className="border-b-2 border-line last:border-b-0">
                      <Link href={`/jobs/${job.id}`} className="nb-focus block px-4 py-3 text-fg no-underline hover:bg-canvas">
                        <span className="block font-bold">{job.title}</span>
                        <span className="block text-sm text-fg-muted">
                          {job.company} · {deadlineLabel(job.deadline)}
                        </span>
                        <span className="block text-sm font-bold">{reasons[0]}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card tone="alert" shadow="md" padding="sm" className="flex flex-col gap-2">
              <p className="m-0 flex items-center gap-2 font-grotesk text-lg font-bold">
                <ShieldAlert aria-hidden="true" size={20} />
                Stay safe
              </p>
              <p className="m-0 text-[15px]">A real employer never asks you to pay a fee, deposit or &ldquo;registration charge&rdquo;. If a post does, report it.</p>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
