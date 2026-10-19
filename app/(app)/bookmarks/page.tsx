import React from "react";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Bookmark, FileText, Link2, StickyNote, type LucideIcon } from "lucide-react";
import { AppHeader } from "@/components/shell/AppHeader";
import { Badge, ButtonLink, buttonClasses, Card, CardHeader, EmptyState, StatTile } from "@/components/ui";
import ErrorView from "@/app/components/ErrorView";

const resourceIcons: Record<string, LucideIcon> = { FILE: FileText, NOTE: StickyNote, LINK: Link2 };

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
      <div className="min-h-dvh bg-canvas font-grotesk text-fg">
        <AppHeader />

        <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 pb-28 md:px-8 md:pb-10">
          <section aria-labelledby="bookmarks-title" className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-end">
            <div className="flex max-w-2xl flex-col gap-2 xl:col-span-7">
              <h1 id="bookmarks-title" className="m-0 text-4xl leading-[1.05] font-bold tracking-tight md:text-5xl">
                Bookmarks
              </h1>
              <p className="m-0 text-lg text-fg-muted">Pinned links, notes and files from your study groups, pinned ones first.</p>
            </div>

            <div className="grid grid-cols-3 gap-3 xl:col-span-5">
              <StatTile label="Pinned" value={pinnedResources.length} tone="focus" />
              <StatTile label="Links" value={linkCount} tone="chat" />
              <StatTile label="Files" value={fileCount} tone="career" />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <aside aria-label="Collections" className="lg:col-span-4">
              <Card padding="none">
                <CardHeader title="Collections" tone="chat" />
                <div className="p-4">
                  {user.groupMemberships.length === 0 ? (
                    <p className="m-0 text-fg-muted">Join a study group to start collecting shared resources.</p>
                  ) : (
                    <ul className="m-0 flex list-none flex-col gap-2 p-0">
                      {user.groupMemberships.slice(0, 8).map((membership) => {
                        const count = resources.filter((resource) => resource.groupId === membership.groupId).length;
                        return (
                          <li key={membership.groupId}>
                            <Link
                              href={`/groups/${membership.groupId}`}
                              className="nb-focus flex items-center justify-between gap-3 rounded-nb border-2 border-transparent p-3 text-fg no-underline hover:border-line hover:bg-canvas"
                            >
                              <span className="min-w-0">
                                <span className="block truncate font-bold">{membership.group.name}</span>
                                <span className="block text-sm text-fg-muted">{membership.group.subject || "General"}</span>
                              </span>
                              <Badge tone="focus" size="sm">
                                {count}
                                <span className="sr-only"> resources</span>
                              </Badge>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </Card>
            </aside>

            <div className="lg:col-span-8">
              {resources.length === 0 ? (
                <EmptyState
                  icon={<Bookmark size={26} />}
                  title="No bookmarked resources yet"
                  description="Pinned group resources will appear here. Open a group and add resources to build your study library."
                  action={
                    <ButtonLink href="/groups" variant="career">
                      Browse groups
                    </ButtonLink>
                  }
                />
              ) : (
                <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-2">
                  {resources.map((resource) => {
                    const Icon = resourceIcons[resource.resourceType] ?? Link2;
                    return (
                      <li key={resource.id} className="flex">
                        <Card as="article" tone={resource.pinned ? "focus" : "card"} shadow="md" className="flex w-full flex-col gap-4">
                          <div className="flex items-start justify-between gap-3">
                            <span aria-hidden="true" className="inline-flex size-11 items-center justify-center rounded-nb border-2 border-line bg-card text-fg">
                              <Icon size={22} />
                            </span>
                            {resource.pinned && (
                              <Badge tone="ink" size="sm">
                                Pinned
                              </Badge>
                            )}
                          </div>

                          <div className="flex-1">
                            <p className="m-0 mb-1 text-sm font-bold tracking-wide uppercase">{resource.group.name}</p>
                            <h2 className="m-0 text-xl leading-tight font-bold">{resource.title}</h2>
                            <p className="m-0 mt-2 line-clamp-3 text-[15px]">{resource.description || resource.fileName || "Saved study material from your group library."}</p>
                          </div>

                          <div className="flex items-center justify-between gap-4 border-t-2 border-line pt-4">
                            <div className="min-w-0 text-sm">
                              <p className="m-0 truncate font-bold">{resource.creator.name || "Unknown"}</p>
                              <p className="m-0">{resource.updatedAt.toLocaleDateString()}</p>
                            </div>
                            {resource.url ? (
                              <a href={resource.url} target="_blank" rel="noreferrer" className={buttonClasses({ variant: "secondary", size: "sm" })} aria-label={`Open ${resource.title}`}>
                                Open
                              </a>
                            ) : (
                              <ButtonLink href={`/groups/${resource.groupId}`} variant="secondary" size="sm" aria-label={`View ${resource.title} in the group`}>
                                View
                              </ButtonLink>
                            )}
                          </div>
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </main>
      </div>
    );
  } catch (error) {
    console.error("Bookmarks Page Error:", error);
    return <ErrorView error={error} />;
  }
}
