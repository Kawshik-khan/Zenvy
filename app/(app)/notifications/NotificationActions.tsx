"use client";

import { useTransition } from "react";
import { acceptMatchRequest, rejectMatchRequest } from "@/app/actions/connection";
import { acceptGroupInvite, declineGroupInvite } from "@/app/actions/group-collaboration";
import { markNotificationRead } from "@/app/actions/notifications";
import { Button } from "@/components/ui";

export function NotificationActions({ notificationId, type, read }: { notificationId: string; type: string; read: boolean }) {
  const [pending, startTransition] = useTransition();

  if (read) return null;

  if (type === "MATCH_REQUEST" || type === "GROUP_INVITE") {
    const accept = type === "MATCH_REQUEST" ? acceptMatchRequest : acceptGroupInvite;
    const decline = type === "MATCH_REQUEST" ? rejectMatchRequest : declineGroupInvite;
    return (
      <div className="flex shrink-0 gap-2">
        <Button variant="live" size="sm" disabled={pending} onClick={() => startTransition(async () => void (await accept(notificationId)))}>
          Accept
        </Button>
        <Button variant="secondary" size="sm" disabled={pending} onClick={() => startTransition(async () => void (await decline(notificationId)))}>
          {type === "MATCH_REQUEST" ? "Reject" : "Decline"}
        </Button>
      </div>
    );
  }

  return (
    <Button variant="secondary" size="sm" disabled={pending} onClick={() => startTransition(async () => void (await markNotificationRead(notificationId)))}>
      Mark read
    </Button>
  );
}
