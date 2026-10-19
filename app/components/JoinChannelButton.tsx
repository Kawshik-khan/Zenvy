"use client";

import { useState, useTransition } from "react";
import { joinChannel, leaveChannel } from "@/app/actions/channel";
import { Badge, Button } from "@/components/ui";

export default function JoinChannelButton({
  channelId,
  isMember,
  isCreator = false,
  channelName,
}: {
  channelId: string;
  isMember: boolean;
  isCreator?: boolean;
  channelName?: string;
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
      <Badge tone="focus" size="sm">
        Creator
      </Badge>
    );
  }

  const suffix = channelName ? ` ${channelName}` : "";

  return (
    <Button
      variant={memberState ? "secondary" : "chat"}
      size="sm"
      onClick={handleToggle}
      loading={isPending}
      aria-label={`${memberState ? "Leave" : "Join"} channel${suffix}`}
    >
      {isPending ? (memberState ? "Leaving" : "Joining") : memberState ? "Leave" : "Join"}
    </Button>
  );
}
