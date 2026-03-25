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
        className="px-6 py-2 border-2 border-slate-300 text-slate-500 rounded-full text-xs font-bold hover:bg-slate-100 transition-colors active:scale-95 disabled:opacity-50"
      >
        {isPending ? "Updating..." : "Leave Group"}
      </button>
    );
  }

  return (
    <button 
      onClick={handleToggle}
      disabled={isPending}
      className="px-6 py-2 text-white rounded-full text-xs font-bold hover:scale-105 transition-transform active:scale-95 shadow-md disabled:opacity-50" 
      style={{ background: 'linear-gradient(135deg, #4647d3 0%, #6a37d4 100%)'}}
    >
      {isPending ? "Joining..." : "Join Group"}
    </button>
  );
}
