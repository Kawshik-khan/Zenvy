import React from "react";
export const runtime = "nodejs";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/app/components/Sidebar";
import CreateChannelModal from "@/app/components/CreateChannelModal";
import JoinChannelButton from "@/app/components/JoinChannelButton";
import Link from "next/link";
import ChannelSearch from "./ChannelSearch";
import NotificationBell from "@/app/components/NotificationBell";

export default async function ChannelsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });

  if (!user) return redirect("/login");

  const channels = await prisma.channel.findMany({
    include: {
      members: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      creator: { select: { id: true, name: true, image: true } },
      _count: { select: { members: true, messages: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedChannels = channels.map((channel) => ({
    id: channel.id,
    name: channel.name,
    tag: channel.tag,
    description: channel.description,
    creatorId: channel.creatorId,
    creatorName: channel.creator.name || "Unknown",
    creatorImage: channel.creator.image,
    memberCount: channel._count.members,
    messageCount: channel._count.messages,
    isMember: channel.members.some((member) => member.userId === user.id),
    isCreator: channel.creatorId === user.id,
    members: channel.members.slice(0, 4).map((member) => ({
      id: member.user.id,
      name: member.user.name || "Anonymous",
      image: member.user.image,
    })),
    createdAt: channel.createdAt.toISOString(),
  }));

  return (
    <div className="app-aurora antialiased selection:bg-primary/30 selection:text-on-surface">
      <Sidebar />
      <main className="app-main">
        <header className="app-topbar">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Public Hubs</p>
            <h1 className="text-lg font-black text-on-surface">Channels</h1>
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
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary">
                  <span className="material-symbols-outlined text-2xl text-white">tag</span>
                </div>
                <div>
                  <h2 className="text-3xl font-black leading-tight tracking-tight text-on-surface md:text-5xl">Channels</h2>
                  <p className="text-sm text-on-surface-variant">Discover, join, and chat in public topic spaces.</p>
                </div>
              </div>
              <p className="max-w-2xl text-base leading-relaxed text-on-surface-variant md:text-lg">
                Create or find channels by unique tags. Members can message, share files, and start focused conversations.
              </p>
            </div>
            <CreateChannelModal>
              <button className="app-primary-button inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-black">
                <span className="material-symbols-outlined text-lg">add</span>
                Create Channel
              </button>
            </CreateChannelModal>
          </section>

          <ChannelSearch channels={serializedChannels} userId={user.id} />

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {serializedChannels.map((channel) => (
              <article key={channel.id} className="group glass-panel-subtle glass-interactive flex h-full flex-col rounded-[28px] p-7">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <span className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                    <span className="text-primary/70">#</span>
                    {channel.tag}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    <span className="material-symbols-outlined text-xs">group</span>
                    {channel.memberCount}
                  </div>
                </div>

                <div className="mb-5 flex-1">
                  <h3 className="mb-2 text-xl font-bold leading-tight text-on-surface">{channel.name}</h3>
                  <p className="line-clamp-2 text-sm leading-relaxed text-on-surface-variant">
                    {channel.description || "A channel for open discussion."}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] text-on-surface-variant">
                    <span className="material-symbols-outlined text-xs">chat_bubble</span>
                    <span>{channel.messageCount} messages</span>
                    <span>by {channel.creatorName}</span>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-outline-variant/30 pt-6">
                  <div className="flex -space-x-3">
                    {channel.members.map((member) => (
                      <img
                        key={member.id}
                        alt={member.name}
                        className="h-9 w-9 rounded-full border-[3px] border-surface object-cover bg-surface-container"
                        src={member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&size=36`}
                      />
                    ))}
                    {channel.memberCount > 4 && (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-surface bg-surface-container text-[10px] font-bold text-on-surface-variant">
                        +{channel.memberCount - 4}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {channel.isMember && (
                      <Link href={`/channels/${channel.id}`} className="rounded-full bg-primary/10 px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/20">
                        Open
                      </Link>
                    )}
                    <JoinChannelButton channelId={channel.id} isMember={channel.isMember} isCreator={channel.isCreator} />
                  </div>
                </div>
              </article>
            ))}

            <CreateChannelModal>
              <div className="glass-panel-subtle flex h-full min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-primary/25 p-8 text-center transition-colors hover:border-primary/50">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-3xl text-primary">add_circle</span>
                </div>
                <h3 className="mb-2 text-lg font-bold text-on-surface">Create a Channel</h3>
                <p className="mb-6 text-sm text-on-surface-variant">Start a public channel with a unique searchable tag.</p>
                <span className="text-sm font-bold text-primary hover:underline">Create Channel</span>
              </div>
            </CreateChannelModal>
          </section>
        </div>
      </main>
    </div>
  );
}
