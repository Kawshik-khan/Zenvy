import React from "react";
export const runtime = "nodejs";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Plus } from "lucide-react";
import Link from "next/link";
import JoinGroupButton from "@/app/components/JoinGroupButton";
import CreateGroupModal from "@/app/components/CreateGroupModal";
import ErrorView from "@/app/components/ErrorView";
import { AppHeader } from "@/components/shell/AppHeader";
import { AvatarStack, Badge, Button, ButtonLink, Card, EmptyState, Input, Select } from "@/components/ui";
import { recommendGroups } from "@/lib/discovery";

type GroupSearchParams = {
  q?: string;
  subject?: string;
  members?: string;
};

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function memberFilterMatches(value: string, count: number) {
  if (!value || value === "all") return true;
  if (value === "small") return count <= 5;
  if (value === "medium") return count > 5 && count <= 20;
  if (value === "large") return count > 20;
  return true;
}

export default async function StudyGroupsPage(props: { searchParams?: Promise<GroupSearchParams> }) {
  const searchParams = (await props.searchParams) || {};
  const query = searchParams.q || "";
  const subject = searchParams.subject || "all";
  const members = searchParams.members || "all";
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  let user;
  let groups;

  try {
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true },
    });

    if (!user) return redirect("/login");

    groups = await prisma.studyGroup.findMany({
      include: {
        members: {
          include: { user: true },
        },
        messages: { select: { createdAt: true }, take: 1, orderBy: { createdAt: "desc" } },
        events: { select: { startTime: true }, take: 1, orderBy: { startTime: "desc" } },
        _count: { select: { members: true, messages: true, events: true, resources: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Groups Page Error:", error);
    return <ErrorView error={error} />;
  }

  const rankedGroups = recommendGroups({
    currentUser: user,
    groups,
    query,
  }).filter((group) => {
    const matchesSubject = subject === "all" || (group.subject || "General") === subject;
    const matchesMembers = memberFilterMatches(members, group._count?.members ?? group.members.length);
    return matchesSubject && matchesMembers;
  });
  const recommendedGroups = rankedGroups
    .filter((group) => !group.members.some((member) => member.userId === user.id))
    .slice(0, 3);
  const subjectOptions = unique(groups.map((group) => group.subject || "General"));

  const filtersActive = Boolean(query || subject !== "all" || members !== "all");

  return (
    <div className="min-h-dvh bg-canvas font-grotesk text-fg">
      <AppHeader />

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 pb-28 md:px-8 md:pb-10">
        <section aria-labelledby="groups-title" className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-2">
            <h1 id="groups-title" className="m-0 text-4xl leading-[1.05] font-bold tracking-tight md:text-5xl">
              Study groups
            </h1>
            <p className="m-0 text-lg text-fg-muted">Join a group that fits your subject, or start one and lead the way.</p>
          </div>
          <CreateGroupModal>
            <Button variant="career" size="lg" icon={<Plus size={20} />}>
              Create group
            </Button>
          </CreateGroupModal>
        </section>

        <Card as="form" action="/groups" role="search" aria-label="Filter groups" padding="sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1.6fr)_1fr_1fr_auto]">
            <Input id="g-q" name="q" type="search" label="Search groups" labelHidden defaultValue={query} placeholder="Search groups, subjects, goals" className="sm:col-span-2 lg:col-span-1" />
            <Select id="g-subject" name="subject" label="Subject" labelHidden defaultValue={subject}>
              <option value="all">All subjects</option>
              {subjectOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            <Select id="g-members" name="members" label="Group size" labelHidden defaultValue={members}>
              <option value="all">Any size</option>
              <option value="small">1-5 members</option>
              <option value="medium">6-20 members</option>
              <option value="large">20+ members</option>
            </Select>
            <Button type="submit" className="sm:col-span-2 lg:col-span-1">
              Apply
            </Button>
          </div>
          {filtersActive && (
            <div className="mt-3">
              <ButtonLink href="/groups" variant="secondary" size="sm">
                Clear filters
              </ButtonLink>
            </div>
          )}
        </Card>

        {recommendedGroups.length > 0 && !query && (
          <section aria-labelledby="recommended-groups" className="flex flex-col gap-4">
            <h2 id="recommended-groups" className="m-0 text-2xl font-bold">
              Groups that fit your profile
            </h2>
            <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-3">
              {recommendedGroups.map((group) => (
                <li key={group.id} className="flex">
                  <Card as={Link} href={`/groups/${group.id}`} interactive tone="career" shadow="md" className="flex w-full flex-col gap-2 text-ink no-underline">
                    <span className="font-grotesk text-sm font-bold tracking-wide uppercase">{group.subject || "General"}</span>
                    <h3 className="m-0 truncate text-lg font-bold">{group.name}</h3>
                    <p className="m-0 line-clamp-2 text-[15px]">{group.discoveryReasons.join(" - ")}</p>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="all-groups" className="flex flex-col gap-5">
          <h2 id="all-groups" className="m-0 text-2xl font-bold">
            {filtersActive ? `${rankedGroups.length} result${rankedGroups.length === 1 ? "" : "s"}` : "All groups"}
          </h2>

          <ul className="m-0 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2 xl:grid-cols-3">
            {rankedGroups.map((group) => {
              const isMember = group.members.some((member) => member.userId === user.id);
              const memberCount = group._count?.members ?? group.members.length;
              const lastMessage = group.messages[0]?.createdAt;

              return (
                <li key={group.id} className="flex">
                  <Card as="article" shadow="md" className="flex w-full flex-col gap-5">
                    <div className="flex items-start justify-between gap-3">
                      <Badge tone="career" size="sm">
                        {group.subject || "General"}
                      </Badge>
                      <span className="text-sm font-bold text-fg-muted">
                        {memberCount} {memberCount === 1 ? "member" : "members"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <h3 className="m-0 text-xl leading-tight font-bold">
                        <Link href={`/groups/${group.id}`} className="nb-focus text-fg no-underline hover:underline">
                          {group.name}
                        </Link>
                      </h3>
                      <p className="m-0 line-clamp-3 text-[15px] text-fg-muted">{group.description || "A study group to collaborate and learn together."}</p>
                      {lastMessage && <p className="m-0 text-sm text-fg-muted">Last message {new Date(lastMessage).toLocaleDateString()}</p>}
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-3 border-t-2 border-line pt-4">
                      <AvatarStack people={group.members.map((member) => ({ name: member.user.name, src: member.user.image }))} max={3} size="sm" />
                      <JoinGroupButton groupId={group.id} isMember={isMember} groupName={group.name} />
                    </div>
                  </Card>
                </li>
              );
            })}

            {rankedGroups.length === 0 && (
              <li className="col-span-full">
                <EmptyState title="No groups found" description="Try a broader search, or create a new study group." />
              </li>
            )}

            <li className="flex">
              <CreateGroupModal>
                <button
                  type="button"
                  className="nb-focus nb-press flex min-h-[260px] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-nb-lg border-nb border-dashed bg-canvas p-8 text-center text-fg shadow-nb"
                >
                  <span aria-hidden="true" className="inline-flex size-14 items-center justify-center rounded-full border-nb bg-career text-ink">
                    <Plus size={26} />
                  </span>
                  <span className="font-grotesk text-lg font-bold">Can&apos;t find your subject?</span>
                  <span className="text-[15px] text-fg-muted">Create a new group and lead the way for other students.</span>
                </button>
              </CreateGroupModal>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
