"use client";

import { useState, useTransition } from "react";
import { joinGroup, leaveGroup } from "@/app/actions/group";

export default function JoinGroupButton({ 
  groupId, 
  isMember 
}: { 
  groupId: string; 
  isMember: boolean;
}) {
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

  if (memberState) {
    return (
      <button 
        onClick={handleToggle}
        disabled={isPending}
        className="px-6 py-2 border border-outline-variant/50 text-on-surface-variant rounded-full text-xs font-bold hover:bg-surface-container hover:text-on-surface transition-colors active:scale-95 disabled:opacity-50"
      >
        {isPending ? "Updating..." : "Leave Group"}
      </button>
    );
  }

  return (
    <button 
      onClick={handleToggle}
      disabled={isPending}
      className="px-6 py-2 text-white rounded-full text-xs font-bold app-primary-button disabled:opacity-50"
    >
      {isPending ? "Joining..." : "Join Group"}
    </button>
  );
}
