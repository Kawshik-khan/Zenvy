"use client";

import { useState, useTransition } from "react";
import { joinGroup, leaveGroup } from "@/app/actions/group";
import { Button } from "@/components/ui";

export default function JoinGroupButton({ groupId, isMember, groupName }: { groupId: string; isMember: boolean; groupName?: string }) {
  const [isPending, startTransition] = useTransition();
  const [memberState, setMemberState] = useState(isMember);

  const handleToggle = () => {
    startTransition(async () => {
      if (memberState) {
        await leaveGroup(groupId);
        setMemberState(false);
      } else {
        await joinGroup(groupId);
        setMemberState(true);
      }
    });
  };

  const suffix = groupName ? ` ${groupName}` : "";

  return (
    <Button
      variant={memberState ? "secondary" : "career"}
      size="sm"
      onClick={handleToggle}
      loading={isPending}
      aria-label={`${memberState ? "Leave" : "Join"} group${suffix}`}
    >
      {isPending ? (memberState ? "Leaving" : "Joining") : memberState ? "Leave" : "Join"}
    </Button>
  );
}
