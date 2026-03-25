"use client";

import { useState, useTransition } from "react";
import { joinGroup } from "@/app/actions/group";

export default function QuickJoinButton({ groupId }: { groupId: string }) {
  const [isPending, startTransition] = useTransition();
  const [joined, setJoined] = useState(false);

  const handleJoin = () => {
    startTransition(async () => {
      await joinGroup(groupId);
      setJoined(true);
    });
  };

  if (joined) {
    return (
      <div className="p-2 text-green-500 bg-green-50 rounded-full transition-colors flex items-center justify-center">
        <span className="material-symbols-outlined">check_circle</span>
      </div>
    );
  }

  return (
    <button 
      onClick={handleJoin}
      disabled={isPending}
      className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors disabled:opacity-50"
    >
      <span className="material-symbols-outlined">{isPending ? "hourglass_empty" : "add_circle"}</span>
    </button>
  );
}
