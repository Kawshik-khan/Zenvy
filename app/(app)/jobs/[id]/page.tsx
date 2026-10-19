import { Building2, Clock, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppHeader } from "@/components/shell/AppHeader";
import { Alert, Avatar, Badge, ButtonLink, Card } from "@/components/ui";
import { deadlineLabel, STATUS_LABELS } from "@/lib/jobs/format";
import { JOB_TYPE_LABELS, WORK_MODE_LABELS } from "@/lib/jobs/schema";
import { getJob, partnerSaveCount } from "@/lib/jobs/service";
import { prisma } from "@/lib/prisma";
import { ApplyPanel } from "../_components/ApplyPanel";
import { ReportDialog } from "../_components/ReportDialog";
import { SaveButton } from "../_components/SaveButton";

export const dynamic = "force-dynamic";

export default async function JobDetailPage(props: { params: Promise<{ id: string }>; searchParams?: Promise<{ posted?: string }> }) {
  const { id } = await props.params;
  const { posted } = (await props.searchParams) || {};
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const viewer = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true } });
  if (!viewer) redirect("/login");

  const job = await getJob(id, viewer);
  if (!job) notFound();

  const partners = job.status === "LIVE" ? await partnerSaveCount(job.id, viewer.id) : 0;
  const open = job.status === "LIVE" && job.deadline > new Date();

  return (
    <div className="min-h-dvh bg-canvas font-grotesk text-fg">
      <AppHeader />

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 pb-28 md:px-8 md:pb-10">
        <div>
          <ButtonLink href="/jobs" variant="secondary" size="sm">
            Back to jobs
          </ButtonLink>
        </div>

        {posted === "pending" && <Alert tone="info" title="Thanks, your post is with our reviewers">It will appear in the feed once approved. You can follow its status under My posts.</Alert>}
        {posted === "live" && <Alert tone="success" title="Your post is live" />}
        {!open && (
          <Alert tone="warning" title={`This post is ${STATUS_LABELS[job.status].toLowerCase()}`}>
            {job.reviewNote ? job.reviewNote : "Only you and admins can see it."}
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <article className="flex flex-col gap-6">
            <header className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
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
              </div>
              <h1 className="m-0 text-4xl leading-[1.05] font-bold tracking-tight md:text-5xl">{job.title}</h1>
              <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 text-[17px] font-bold">
                <li className="flex items-center gap-2">
                  <Building2 aria-hidden="true" size={18} />
                  {job.company}
                </li>
                <li className="flex items-center gap-2">
                  <MapPin aria-hidden="true" size={18} />
                  {job.location}
                </li>
                <li className="flex items-center gap-2">
                  <Clock aria-hidden="true" size={18} />
                  {deadlineLabel(job.deadline)}
                </li>
              </ul>
            </header>

            {job.images.some((image) => image.url) && (
              <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2" aria-label="Images">
                {job.images.map((image, index) =>
                  image.url ? (
                    <li key={image.id} className={index === 0 && job.images.length % 2 === 1 ? "sm:col-span-2" : undefined}>
                      <img src={image.url} alt={`${job.title} at ${job.company}, image ${index + 1}`} width={image.width} height={image.height} className="w-full rounded-nb-lg border-nb object-cover" />
                    </li>
                  ) : null,
                )}
              </ul>
            )}

            <Card shadow="md">
              <h2 className="m-0 mb-3 text-2xl font-bold">About this role</h2>
              <p className="m-0 text-[17px] leading-relaxed break-words whitespace-pre-wrap">{job.description}</p>
              {job.tags.length > 0 && (
                <ul className="m-0 mt-5 flex list-none flex-wrap gap-2 p-0" aria-label="Tags">
                  {job.tags.map((tag) => (
                    <li key={tag} className="rounded-full border-2 border-line bg-canvas px-3 py-0.5 text-sm font-bold">
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </article>

          <aside aria-label="Apply and poster" className="flex flex-col gap-5">
            <Card tone="career" shadow="md" className="flex flex-col gap-4">
              <h2 className="m-0 text-xl font-bold">Apply</h2>
              {open ? (
                <ApplyPanel method={job.applyMethod} target={job.applyTarget} title={job.title} authorId={job.author.id} authorName={job.author.name || "the poster"} isAuthor={job.isAuthor} />
              ) : (
                <p className="m-0 text-[15px]">Applications are closed for this post.</p>
              )}
              {open && (
                <div className="flex items-center justify-between gap-2 border-t-2 border-line pt-4">
                  <SaveButton jobId={job.id} title={job.title} initialSaved={job.saved} />
                  {!job.isAuthor && <ReportDialog jobId={job.id} title={job.title} />}
                </div>
              )}
            </Card>

            <Card shadow="md" padding="sm" className="flex flex-col gap-3">
              <p className="m-0 font-grotesk text-sm font-bold tracking-wide uppercase">Posted by</p>
              <div className="flex items-center gap-3">
                <Avatar name={job.author.name} src={job.author.image} size="md" />
                <div className="min-w-0">
                  <Link href={`/users/${job.author.id}`} className="nb-focus block truncate font-bold text-fg">
                    {job.author.name || "A student"}
                  </Link>
                  {job.author.posterTrust !== "STUDENT" && (
                    <Badge tone="live" size="sm">
                      {job.author.posterTrust === "ALUMNI" ? "Alumni" : "Verified employer"}
                    </Badge>
                  )}
                </div>
              </div>
              {partners > 0 && (
                <p className="m-0 flex items-center gap-2 text-[15px] font-bold">
                  <Users aria-hidden="true" size={18} />
                  {partners} of your partners saved this
                </p>
              )}
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
