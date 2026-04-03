import React from 'react';
export const runtime = 'nodejs';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Sidebar from '@/app/components/Sidebar';
import CreateChannelModal from '@/app/components/CreateChannelModal';
import JoinChannelButton from '@/app/components/JoinChannelButton';
import Link from 'next/link';
import ChannelSearch from './ChannelSearch';

export default async function ChannelsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });

  if (!user) return redirect('/login');

  const channels = await prisma.channel.findMany({
    include: {
      members: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      creator: { select: { id: true, name: true, image: true } },
      _count: { select: { members: true, messages: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const serializedChannels = channels.map((ch) => ({
    id: ch.id,
    name: ch.name,
    tag: ch.tag,
    description: ch.description,
    creatorId: ch.creatorId,
    creatorName: ch.creator.name || 'Unknown',
    creatorImage: ch.creator.image,
    memberCount: ch._count.members,
    messageCount: ch._count.messages,
    isMember: ch.members.some((m) => m.userId === user.id),
    isCreator: ch.creatorId === user.id,
    members: ch.members.slice(0, 4).map((m) => ({
      id: m.user.id,
      name: m.user.name || 'Anonymous',
      image: m.user.image,
    })),
    createdAt: ch.createdAt.toISOString(),
  }));

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen">
      <Sidebar />

      {/* Top Bar */}
      <header className="sticky top-0 z-40 flex justify-between items-center px-4 md:px-8 h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm dark:shadow-none">
        <div className="flex items-center flex-1 max-w-sm md:max-w-xl">
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-lg">search</span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder="Search channels by tag..."
              type="text"
              id="channel-search-top"
              readOnly
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full overflow-hidden ml-2 ring-2 ring-primary/10">
            <img
              alt="User Profile Avatar"
              className="w-full h-full object-cover"
              src={user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=random`}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="md:ml-20 pb-24 md:pb-0 p-4 md:p-12 min-h-screen">
        {/* Hero */}
        <div className="mb-8 md:mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl">tag</span>
            </div>
            <div>
              <h2 className="text-3xl md:text-[2.75rem] font-black text-on-surface leading-tight tracking-tighter">
                Channels
              </h2>
              <p className="text-on-surface-variant text-sm">
                Discover, join, and chat in public channels
              </p>
            </div>
          </div>
          <p className="text-on-surface-variant max-w-2xl text-base md:text-lg leading-relaxed mt-4">
            Create or find channels by unique tags. Join any channel to start messaging with the community. Only members can send messages inside a channel.
          </p>
        </div>

        {/* Search & Filter */}
        <ChannelSearch channels={serializedChannels} userId={user.id} />

        {/* Channel Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {serializedChannels.map((channel) => (
            <div
              key={channel.id}
              className="group bg-surface-container-lowest rounded-xl p-6 md:p-8 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(70,71,211,0.06)] relative flex flex-col h-full border border-outline-variant/5 hover-lift"
            >
              {/* Tag Badge */}
              <div className="flex justify-between items-start mb-6">
                <span className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full flex items-center gap-1">
                  <span className="text-primary/70">#</span>
                  {channel.tag}
                </span>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                  <span className="material-symbols-outlined text-xs">group</span>
                  {channel.memberCount}
                </div>
              </div>

              {/* Info */}
              <div className="mb-4 flex-1">
                <h3 className="text-xl font-bold text-on-surface mb-2 leading-tight">{channel.name}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2">
                  {channel.description || 'A channel for open discussion.'}
                </p>
                <div className="flex items-center gap-2 mt-3 text-[10px] text-on-surface-variant">
                  <span className="material-symbols-outlined text-xs">chat_bubble</span>
                  <span>{channel.messageCount} messages</span>
                  <span className="mx-1">·</span>
                  <span>by {channel.creatorName}</span>
                </div>
              </div>

              {/* Bottom */}
              <div className="mt-auto pt-6 flex items-center justify-between border-t border-outline-variant/10">
                <div className="flex -space-x-3">
                  {channel.members.map((member) => (
                    <img
                      key={member.id}
                      alt={member.name}
                      className="w-9 h-9 rounded-full border-[3px] border-white dark:border-slate-900 object-cover bg-slate-200"
                      src={member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&size=36`}
                    />
                  ))}
                  {channel.memberCount > 4 && (
                    <div className="w-9 h-9 rounded-full border-[3px] border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                      +{channel.memberCount - 4}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {channel.isMember && (
                    <Link
                      href={`/channels/${channel.id}`}
                      className="px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold hover:bg-primary/20 transition-colors"
                    >
                      Open
                    </Link>
                  )}
                  <JoinChannelButton
                    channelId={channel.id}
                    isMember={channel.isMember}
                    isCreator={channel.isCreator}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Create new channel CTA */}
          <CreateChannelModal>
            <div className="bg-surface-container rounded-xl p-8 border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-surface-container-high transition-colors h-full min-h-[300px]">
              <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-3xl">add_circle</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-2">Create a Channel</h3>
              <p className="text-sm text-on-surface-variant mb-6">
                Start a new public channel with a unique tag for others to find.
              </p>
              <span className="text-sm font-bold text-primary hover:underline">Create Channel</span>
            </div>
          </CreateChannelModal>
        </div>
      </main>

      {/* Floating Action Button */}
      <CreateChannelModal>
        <button
          className="fixed bottom-24 md:bottom-10 right-6 md:right-10 w-14 h-14 md:w-16 md:h-16 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 z-50"
          style={{ background: 'linear-gradient(135deg, #4647d3 0%, #6a37d4 100%)' }}
        >
          <span className="material-symbols-outlined text-2xl md:text-3xl">add</span>
        </button>
      </CreateChannelModal>
    </div>
  );
}
