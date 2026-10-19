import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppHeader } from "@/components/shell/AppHeader";
import { ButtonLink, Card } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { JobForm } from "../_components/JobForm";

export default async function NewJobPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { emailVerified: true } });

  return (
    <div className="min-h-dvh bg-canvas font-grotesk text-fg">
      <AppHeader />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 pb-28 md:px-8 md:pb-10">
        <div className="flex flex-col gap-2">
          <h1 className="m-0 text-4xl leading-[1.05] font-bold tracking-tight md:text-5xl">Post a job</h1>
          <p className="m-0 text-lg text-fg-muted">New posters are reviewed before they go live, usually within a day.</p>
        </div>
        <Card shadow="md" padding="lg">
          <JobForm unverified={!user?.emailVerified} />
        </Card>
        <div>
          <ButtonLink href="/jobs" variant="secondary" size="sm">
            Back to jobs
          </ButtonLink>
        </div>
      </main>
    </div>
  );
}
