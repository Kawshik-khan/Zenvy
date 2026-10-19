"use client";

import { Check, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { joinGroup } from "@/app/actions/group";
import { Badge, Button } from "@/components/ui";

export default function QuickJoinButton({ groupId, groupName }: { groupId: string; groupName?: string }) {
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
      <Badge tone="live" size="sm">
        <Check aria-hidden="true" size={14} /> Joined
      </Badge>
    );
  }

  return (
    <Button size="sm" variant="live" onClick={handleJoin} loading={isPending} icon={isPending ? undefined : <Plus size={16} />} aria-label={groupName ? `Join ${groupName}` : "Join group"}>
      Join
    </Button>
  );
}
