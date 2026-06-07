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

export default async function StudyGroupsPage() {
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
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Groups Page Error:", error);
    return <ErrorView error={error} />;
  }

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

          <section className="glass-panel-subtle rounded-[28px] p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface/50 px-4 py-2 text-sm font-medium text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">filter_list</span>
                Filters
              </div>
              {["Subject", "Goals", "Members", "Difficulty"].map((label) => (
                <div key={label} className="relative">
                  <select className="app-input min-w-[140px] appearance-none py-2 pl-4 pr-10 text-xs font-semibold">
                    <option>{label}</option>
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">
                    expand_more
                  </span>
                </div>
              ))}
              <button className="ml-auto px-4 text-xs font-bold text-primary hover:underline">Clear All</button>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => {
              const isMember = group.members.some((member) => member.userId === user.id);
              const memberCount = group.members.length;

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
