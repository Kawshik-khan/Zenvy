import React from "react";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/app/components/Sidebar";
import NotificationBell from "@/app/components/NotificationBell";
import ErrorView from "@/app/components/ErrorView";

function resourceIcon(type: string) {
  if (type === "FILE") return "description";
  if (type === "NOTE") return "sticky_note_2";
  return "link";
}

export default async function BookmarksPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { groupMemberships: { include: { group: true } } },
    });

    if (!user) redirect("/login");

    const groupIds = user.groupMemberships.map((membership) => membership.groupId);
    const resources = await prisma.groupResource.findMany({
      where: { groupId: { in: groupIds } },
      include: {
        group: { select: { id: true, name: true, subject: true } },
        creator: { select: { id: true, name: true, image: true } },
      },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      take: 48,
    });

    const pinnedResources = resources.filter((resource) => resource.pinned);
    const linkCount = resources.filter((resource) => resource.resourceType === "LINK").length;
    const fileCount = resources.filter((resource) => resource.resourceType === "FILE").length;

    return (
      <div className="app-aurora antialiased selection:bg-primary/30 selection:text-on-surface">
        <Sidebar />
        <main className="app-main">
          <header className="app-topbar">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Saved Knowledge</p>
              <h1 className="text-lg font-black text-on-surface">Bookmarks</h1>
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
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-end">
              <div className="xl:col-span-7">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-tertiary">
                    <span className="material-symbols-outlined text-2xl text-white">bookmark</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black leading-tight tracking-tight text-on-surface md:text-5xl">Bookmarked resources</h2>
                    <p className="text-sm text-on-surface-variant">Pinned links, notes, and files from your study groups.</p>
                  </div>
                </div>
                <p className="max-w-2xl text-base leading-relaxed text-on-surface-variant md:text-lg">
                  Your current bookmark view is powered by group resources, with pinned resources surfaced first for fast review.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 xl:col-span-5">
                {[
                  { label: "Pinned", value: pinnedResources.length, icon: "push_pin", color: "text-primary" },
                  { label: "Links", value: linkCount, icon: "link", color: "text-tertiary" },
                  { label: "Files", value: fileCount, icon: "description", color: "text-secondary" },
                ].map((stat) => (
                  <div key={stat.label} className="glass-panel-subtle rounded-[24px] p-4">
                    <span className={`material-symbols-outlined text-xl ${stat.color}`}>{stat.icon}</span>
                    <p className="mt-3 text-2xl font-black text-on-surface">{stat.value}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{stat.label}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <aside className="space-y-4 lg:col-span-4">
                <div className="glass-panel-subtle rounded-[28px] p-6">
                  <h3 className="text-lg font-black text-on-surface">Collections</h3>
                  <div className="mt-5 space-y-3">
                    {user.groupMemberships.length === 0 ? (
                      <p className="text-sm text-on-surface-variant">Join a study group to start collecting shared resources.</p>
                    ) : (
                      user.groupMemberships.slice(0, 8).map((membership) => {
                        const count = resources.filter((resource) => resource.groupId === membership.groupId).length;
                        return (
                          <Link
                            key={membership.groupId}
                            href={`/groups/${membership.groupId}`}
                            className="flex items-center justify-between gap-3 rounded-2xl bg-surface-container/60 p-4 transition-colors hover:bg-surface-container-high"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-on-surface">{membership.group.name}</p>
                              <p className="text-xs text-on-surface-variant">{membership.group.subject || "General"}</p>
                            </div>
                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{count}</span>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="glass-panel-subtle rounded-[28px] p-6">
                  <h3 className="text-lg font-black text-on-surface">Quick Filters</h3>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {["Pinned", "Links", "Files", "Notes", "Recent"].map((filter) => (
                      <span key={filter} className="rounded-full bg-surface-container px-4 py-2 text-xs font-bold text-on-surface-variant">
                        {filter}
                      </span>
                    ))}
                  </div>
                </div>
              </aside>

              <div className="lg:col-span-8">
                {resources.length === 0 ? (
                  <div className="glass-panel-subtle rounded-[28px] border border-dashed border-primary/25 p-12 text-center">
                    <span className="material-symbols-outlined text-5xl text-primary">bookmark_add</span>
                    <h3 className="mt-5 text-xl font-black text-on-surface">No bookmarked resources yet</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-on-surface-variant">
                      Pinned group resources will appear here. Open a group and add resources to build your study library.
                    </p>
                    <Link href="/groups" className="app-primary-button mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-black">
                      <span className="material-symbols-outlined text-lg">groups</span>
                      Browse Groups
                    </Link>
                  </div>
                ) : (
                  <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {resources.map((resource) => (
                      <article key={resource.id} className="glass-panel-subtle glass-interactive flex min-h-[240px] flex-col rounded-[28px] p-6">
                        <div className="mb-5 flex items-start justify-between gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20">
                            <span className="material-symbols-outlined text-2xl text-primary">{resourceIcon(resource.resourceType)}</span>
                          </div>
                          {resource.pinned && (
                            <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">Pinned</span>
                          )}
                        </div>

                        <div className="flex-1">
                          <p className="mb-2 text-xs font-black uppercase tracking-widest text-tertiary">{resource.group.name}</p>
                          <h3 className="text-xl font-black leading-tight text-on-surface">{resource.title}</h3>
                          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-on-surface-variant">
                            {resource.description || resource.fileName || "Saved study material from your group library."}
                          </p>
                        </div>

                        <div className="mt-6 flex items-center justify-between gap-4">
                          <div className="min-w-0 text-xs text-on-surface-variant">
                            <p className="truncate font-semibold text-on-surface">{resource.creator.name || "Unknown"}</p>
                            <p>{resource.updatedAt.toLocaleDateString()}</p>
                          </div>
                          {resource.url ? (
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full bg-primary/10 px-4 py-2 text-xs font-black text-primary transition-colors hover:bg-primary/20"
                            >
                              Open
                            </a>
                          ) : (
                            <Link href={`/groups/${resource.groupId}`} className="rounded-full bg-surface-container px-4 py-2 text-xs font-black text-on-surface-variant hover:bg-surface-container-high">
                              View
                            </Link>
                          )}
                        </div>
                      </article>
                    ))}
                  </section>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error("Bookmarks Page Error:", error);
    return <ErrorView error={error} />;
  }
}
