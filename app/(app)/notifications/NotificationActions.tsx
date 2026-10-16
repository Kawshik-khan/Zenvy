"use client";

import { useTransition } from "react";
import { acceptMatchRequest, rejectMatchRequest } from "@/app/actions/connection";
import { acceptGroupInvite, declineGroupInvite } from "@/app/actions/group-collaboration";
import { markNotificationRead } from "@/app/actions/notifications";

export function NotificationActions({ notificationId, type, read }: { notificationId: string; type: string; read: boolean }) {
  const [pending, startTransition] = useTransition();

  if (type === "MATCH_REQUEST" && !read) {
    return (
      <div className="flex gap-2">
        <button
          disabled={pending}
          onClick={() => startTransition(async () => {
            await acceptMatchRequest(notificationId);
          })}
          className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-bold disabled:opacity-50"
        >
          Accept
        </button>
        <button
          disabled={pending}
          onClick={() => startTransition(async () => {
            await rejectMatchRequest(notificationId);
          })}
          className="px-4 py-2 rounded-full bg-surface-container text-on-surface-variant text-xs font-bold disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    );
  }

  if (type === "GROUP_INVITE" && !read) {
    return (
      <div className="flex gap-2">
        <button
          disabled={pending}
          onClick={() => startTransition(async () => {
            await acceptGroupInvite(notificationId);
          })}
          className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-bold disabled:opacity-50"
        >
          Accept
        </button>
        <button
          disabled={pending}
          onClick={() => startTransition(async () => {
            await declineGroupInvite(notificationId);
          })}
          className="px-4 py-2 rounded-full bg-surface-container text-on-surface-variant text-xs font-bold disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    );
  }

  if (!read) {
    return (
      <button
        disabled={pending}
        onClick={() => startTransition(async () => {
          await markNotificationRead(notificationId);
        })}
        className="px-4 py-2 rounded-full bg-surface-container text-on-surface-variant text-xs font-bold disabled:opacity-50"
      >
        Mark read
      </button>
    );
  }

  return null;
}
