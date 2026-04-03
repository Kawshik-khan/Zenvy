"use client";

import { useState, useTransition } from "react";
import { joinChannel, leaveChannel } from "@/app/actions/channel";

export default function JoinChannelButton({
  channelId,
  isMember,
  isCreator = false,
}: {
  channelId: string;
  isMember: boolean;
  isCreator?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [memberState, setMemberState] = useState(isMember);

  const handleToggle = () => {
    startTransition(async () => {
      if (memberState) {
        await leaveChannel(channelId);
        setMemberState(false);
      } else {
        await joinChannel(channelId);
        setMemberState(true);
      }
    });
  };

  if (isCreator) {
    return (
      <span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold">
        Creator
      </span>
    );
  }

  if (memberState) {
    return (
      <button
        onClick={handleToggle}
        disabled={isPending}
        className="px-6 py-2 border-2 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 rounded-full text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95 disabled:opacity-50"
      >
        {isPending ? "Updating..." : "Leave"}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className="px-6 py-2 text-white rounded-full text-xs font-bold hover:scale-105 transition-transform active:scale-95 shadow-md disabled:opacity-50"
      style={{ background: "linear-gradient(135deg, #4647d3 0%, #6a37d4 100%)" }}
    >
      {isPending ? "Joining..." : "Join Channel"}
    </button>
  );
}
