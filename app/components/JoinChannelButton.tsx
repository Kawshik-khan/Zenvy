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
        className="px-6 py-2 border border-outline-variant/50 text-on-surface-variant rounded-full text-xs font-bold hover:bg-surface-container hover:text-on-surface transition-colors active:scale-95 disabled:opacity-50"
      >
        {isPending ? "Updating..." : "Leave"}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className="px-6 py-2 text-white rounded-full text-xs font-bold app-primary-button disabled:opacity-50"
    >
      {isPending ? "Joining..." : "Join Channel"}
    </button>
  );
}
