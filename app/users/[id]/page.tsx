import React from "react";
export const runtime = "nodejs";

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/app/components/Sidebar";
import NotificationBell from "@/app/components/NotificationBell";
import ConnectButton from "@/app/matching/ConnectButton";

function makeAvatar(name?: string | null, image?: string | null) {
  if (image) return image;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=random`;
}

function splitList(value?: string | null) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatSemester(value?: number | null) {
  return value ? `Semester ${value}` : "Semester not set";
}

export default async function PublicUserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  if (id === session.user.id) redirect("/profile");

  const [viewer, target, blocked] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
        groupMemberships: { select: { groupId: true } },
        channelMemberships: { select: { channelId: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        groupMemberships: { select: { groupId: true } },
        channelMemberships: { select: { channelId: true } },
      },
    }),
    prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: session.user.id, blockedId: id },
          { blockerId: id, blockedId: session.user.id },
        ],
      },
      select: { id: true },
    }),
  ]);

  if (!viewer) redirect("/login");
  if (!target || blocked) redirect("/matching");

  const match = viewer.profile && target.profile
    ? await prisma.match.findFirst({
        where: {
          OR: [
            { profileId: viewer.profile.id, matchedProfileId: target.profile.id },
            { profileId: target.profile.id, matchedProfileId: viewer.profile.id },
          ],
        },
      })
    : null;

  const viewerGroups = new Set(viewer.groupMemberships.map((membership) => membership.groupId));
  const viewerChannels = new Set(viewer.channelMemberships.map((membership) => membership.channelId));
  const sharedGroups = target.groupMemberships.filter((membership) => viewerGroups.has(membership.groupId)).length;
  const sharedChannels = target.channelMemberships.filter((membership) => viewerChannels.has(membership.channelId)).length;
  const interests = splitList(target.profile?.interests);
  const status = match?.status || null;

  return (
    <div className="app-aurora min-h-screen antialiased selection:bg-primary/30 selection:text-on-surface">
      <Sidebar />
      <main className="app-main">
        <header className="app-topbar">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Public Profile</p>
            <h1 className="text-lg font-black text-on-surface">Study Partner Profile</h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <img
              alt=""
              className="h-9 w-9 rounded-full object-cover ring-2 ring-primary/20"
              src={makeAvatar(viewer.name, viewer.image)}
            />
          </div>
        </header>

        <div className="app-content mx-auto max-w-5xl space-y-6 p-4 md:p-10">
          <section className="glass-panel-subtle overflow-hidden rounded-[32px] p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex min-w-0 items-center gap-5">
                <img
                  alt=""
                  className="h-24 w-24 shrink-0 rounded-[28px] object-cover ring-4 ring-primary/10"
                  src={makeAvatar(target.name, target.image)}
                />
                <div className="min-w-0">
                  <h2 className="truncate text-3xl font-black text-on-surface md:text-5xl">{target.name || "Anonymous"}</h2>
                  <p className="mt-2 text-base font-bold text-primary">{target.profile?.major || "Undecided"}</p>
                  <p className="mt-1 text-sm text-on-surface-variant">{target.profile?.college || "College not set"} - {formatSemester(target.profile?.semester)}</p>
                </div>
              </div>

              <div className="flex min-w-[12rem] flex-col gap-2">
                {status === "ACCEPTED" && (
                  <Link href={`/chat/personal?id=${target.id}`} className="app-primary-button rounded-full px-6 py-3 text-center text-sm font-black">
                    Message
                  </Link>
                )}
                <ConnectButton partnerId={target.id} buttonText="Connect" initialStatus={status} />
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="glass-panel-subtle rounded-[28px] p-6">
              <h3 className="mb-3 text-lg font-black text-on-surface">About</h3>
              <p className="text-sm leading-7 text-on-surface-variant">{target.profile?.bio || "No bio added yet."}</p>

              <div className="mt-6">
                <h4 className="mb-3 text-xs font-black uppercase tracking-widest text-on-surface-variant">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {interests.length ? interests.map((interest) => (
                    <span key={interest} className="rounded-full bg-surface-container px-3 py-1.5 text-xs font-bold text-on-surface-variant">
                      {interest}
                    </span>
                  )) : (
                    <p className="text-sm text-on-surface-variant">No interests added yet.</p>
                  )}
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="glass-panel-subtle rounded-[24px] p-5">
                <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Availability</p>
                <p className="mt-3 text-sm leading-6 text-on-surface">{target.profile?.availability || "Availability not set"}</p>
              </div>
              <div className="glass-panel-subtle rounded-[24px] p-5">
                <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Shared Spaces</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-surface-container-low p-3">
                    <p className="text-2xl font-black text-on-surface">{sharedGroups}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Groups</p>
                  </div>
                  <div className="rounded-2xl bg-surface-container-low p-3">
                    <p className="text-2xl font-black text-on-surface">{sharedChannels}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Channels</p>
                  </div>
                </div>
              </div>
              <Link href="/matching" className="block rounded-full bg-surface-container px-5 py-3 text-center text-xs font-black text-on-surface-variant transition-colors hover:text-on-surface">
                Back to Matching
              </Link>
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
}
