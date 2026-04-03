"use client";

import { useState } from "react";
import Link from "next/link";
import JoinChannelButton from "@/app/components/JoinChannelButton";

type SerializedChannel = {
  id: string;
  name: string;
  tag: string;
  description: string | null;
  creatorId: string;
  creatorName: string;
  creatorImage: string | null;
  memberCount: number;
  messageCount: number;
  isMember: boolean;
  isCreator: boolean;
  members: { id: string; name: string; image: string | null }[];
  createdAt: string;
};

export default function ChannelSearch({
  channels,
  userId,
}: {
  channels: SerializedChannel[];
  userId: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? channels.filter(
        (ch) =>
          ch.tag.toLowerCase().includes(query.toLowerCase()) ||
          ch.name.toLowerCase().includes(query.toLowerCase())
      )
    : null;

  return (
    <>
      {/* Search Bar */}
      <div className="mb-8 md:mb-10">
        <div className="relative max-w-xl">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-xl">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by #tag or channel name..."
            className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-outline-variant/10 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all focus:shadow-lg focus:shadow-primary/5"
            id="channel-search"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {filtered && (
        <div className="mb-10">
          <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-4">
            Search Results · {filtered.length} found
          </h3>
          {filtered.length === 0 ? (
            <div className="bg-surface-container-low rounded-2xl p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/50 mb-3 block">
                search_off
              </span>
              <p className="text-sm text-on-surface-variant">
                No channels found for &quot;<strong>{query}</strong>&quot;
              </p>
              <p className="text-xs text-on-surface-variant/70 mt-1">
                Try a different tag or create a new channel
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((channel) => (
                <div
                  key={channel.id}
                  className="bg-surface-container-lowest rounded-xl p-6 border border-primary/20 shadow-md shadow-primary/5 flex flex-col animate-fade-in"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                      #{channel.tag}
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-bold">
                      {channel.memberCount} members
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-on-surface mb-1">{channel.name}</h4>
                  <p className="text-xs text-on-surface-variant line-clamp-2 mb-4 flex-1">
                    {channel.description || "A channel for open discussion."}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                    {channel.isMember ? (
                      <Link
                        href={`/channels/${channel.id}`}
                        className="px-4 py-2 bg-primary text-white rounded-full text-xs font-bold hover:bg-primary/90 transition-colors"
                      >
                        Open Chat
                      </Link>
                    ) : (
                      <span />
                    )}
                    <JoinChannelButton
                      channelId={channel.id}
                      isMember={channel.isMember}
                      isCreator={channel.isCreator}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <hr className="border-outline-variant/10 my-10" />
        </div>
      )}

      {/* Section Header */}
      <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-6">
        All Channels
      </h3>
    </>
  );
}
