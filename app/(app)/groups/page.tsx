import React from "react";
export const runtime = "nodejs";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Sidebar from "@/app/components/Sidebar";
import JoinGroupButton from "@/app/components/JoinGroupButton";
import CreateGroupModal from "@/app/components/CreateGroupModal";
import ErrorView from "@/app/components/ErrorView";
import NotificationBell from "@/app/components/NotificationBell";
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

  return (
    <div className="app-aurora antialiased selection:bg-primary/30 selection:text-on-surface">
      <Sidebar />
      <main className="app-main">
        <header className="app-topbar">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Study Commons</p>
            <h1 className="text-lg font-black text-on-surface">Study Groups</h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <img
              alt=""
              className="h-9 w-9 rounded-full object-cover ring-2 ring-primary/20"
              src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=random`}
            />
          </div>
        </header>

        <div className="app-content mx-auto max-w-7xl space-y-10 p-4 md:p-12">
          <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-3xl font-black leading-tight tracking-tight text-on-surface md:text-5xl">Find your tribe.</h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-on-surface-variant md:text-lg">
                Connect with peers who share your academic drive. Join specialized study groups designed for focused collaboration.
              </p>
            </div>
            <CreateGroupModal>
              <button className="app-primary-button inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-black">
                <span className="material-symbols-outlined text-lg">add</span>
                Create Group
              </button>
            </CreateGroupModal>
          </section>

          <form action="/groups" className="glass-panel-subtle rounded-[28px] p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px] flex-1">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant">search</span>
                <input name="q" defaultValue={query} className="app-input py-3 pl-12 pr-4 text-sm" placeholder="Search groups, subjects, goals..." />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface/50 px-4 py-2 text-sm font-medium text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">filter_list</span>
                Filters
              </div>
              <div className="relative">
                <select name="subject" defaultValue={subject} className="app-input min-w-[160px] appearance-none py-2 pl-4 pr-10 text-xs font-semibold">
                  <option value="all">All subjects</option>
                  {subjectOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">
                  expand_more
                </span>
              </div>
              <div className="relative">
                <select name="members" defaultValue={members} className="app-input min-w-[150px] appearance-none py-2 pl-4 pr-10 text-xs font-semibold">
                  <option value="all">Any size</option>
                  <option value="small">1-5 members</option>
                  <option value="medium">6-20 members</option>
                  <option value="large">20+ members</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">
                  expand_more
                </span>
              </div>
              <button className="app-primary-button rounded-full px-5 py-2 text-xs font-black">Apply</button>
              {(query || subject !== "all" || members !== "all") && (
                <Link href="/groups" className="px-4 text-xs font-bold text-primary hover:underline">Clear All</Link>
              )}
            </div>
          </form>

          {recommendedGroups.length > 0 && !query && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-primary">Recommended</p>
                  <h2 className="text-xl font-black text-on-surface">Groups that fit your profile</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {recommendedGroups.map((group) => (
                  <Link key={group.id} href={`/groups/${group.id}`} className="glass-panel-subtle glass-interactive rounded-[24px] p-5">
                    <span className="mb-3 block text-xs font-bold uppercase tracking-tight text-primary">{group.subject || "General"}</span>
                    <h3 className="truncate text-base font-black text-on-surface">{group.name}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-on-surface-variant">{group.discoveryReasons.join(" - ")}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {rankedGroups.map((group) => {
              const isMember = group.members.some((member) => member.userId === user.id);
              const memberCount = group._count?.members ?? group.members.length;

              return (
                <article key={group.id} className="group glass-panel-subtle glass-interactive flex h-full flex-col rounded-[28px] p-7">
                  <div className="mb-8 flex items-start justify-between gap-4">
                    <span className="rounded-full border border-accent-green/20 bg-accent-green/10 px-4 py-1.5 text-xs font-bold text-accent-green">
                      Active
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{memberCount} Members</span>
                  </div>
                  <div className="mb-6">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-tight text-primary">{group.subject || "General"}</span>
                    <Link href={`/groups/${group.id}`} className="block">
                      <h3 className="mb-3 text-xl font-bold leading-tight text-on-surface transition-colors group-hover:text-primary">{group.name}</h3>
                      <p className="line-clamp-3 text-sm leading-relaxed text-on-surface-variant">
                        {group.description || "A study group to collaborate and learn together."}
                      </p>
                    </Link>
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-outline-variant/30 pt-6">
                    <div className="flex -space-x-3">
                      {group.members.slice(0, 3).map((member) => (
                        <img
                          key={member.id}
                          alt={member.user.name || "Member"}
                          className="h-10 w-10 rounded-full border-2 border-surface object-cover bg-surface-container"
                          src={member.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user.name || "U")}&background=random`}
                        />
                      ))}
                      {memberCount > 3 && (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-surface bg-surface-container text-[10px] font-bold text-on-surface-variant">
                          +{memberCount - 3}
                        </div>
                      )}
                    </div>
                    <JoinGroupButton groupId={group.id} isMember={isMember} />
                  </div>
                </article>
              );
            })}

            {rankedGroups.length === 0 && (
              <div className="glass-panel-subtle col-span-full rounded-[28px] p-10 text-center">
                <span className="material-symbols-outlined mb-3 block text-4xl text-on-surface-variant/60">search_off</span>
                <h3 className="text-xl font-black text-on-surface">No groups found</h3>
                <p className="mt-2 text-sm text-on-surface-variant">Try a broader search or create a new study group.</p>
              </div>
            )}

            <CreateGroupModal>
              <div className="glass-panel-subtle flex h-full min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-primary/25 p-8 text-center transition-colors hover:border-primary/50">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-3xl text-primary">add_circle</span>
                </div>
                <h3 className="mb-2 text-lg font-bold text-on-surface">Can&apos;t find your subject?</h3>
                <p className="mb-6 text-sm text-on-surface-variant">Create a new group and lead the way for other students.</p>
                <span className="text-sm font-bold text-primary hover:underline">Start a New Group</span>
              </div>
            </CreateGroupModal>
          </section>
        </div>
      </main>
    </div>
  );
}
