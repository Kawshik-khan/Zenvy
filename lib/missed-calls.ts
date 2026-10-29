import { prisma } from "@/lib/prisma";
import { createConversationMessage } from "@/lib/conversations";
import { sendWebPush } from "@/lib/push";
import { MISSED_CALL_FILE_TYPE } from "@/lib/missed-call-type";

export { MISSED_CALL_FILE_TYPE };

/** How long a DM call rings before it counts as missed. */
export const RING_SECONDS = 60;

/** Most a focus status can claim, so a client that never clears it can't block calls for long. */
export const MAX_FOCUS_MINUTES = 240;

/**
 * NO_ANSWER: rang out, or the caller hung up first.
 * FOCUS: never rang, because the person was in a focus session. They hear about it when it ends.
 */
export type MissedReason = "NO_ANSWER" | "FOCUS";

export function missedCallText(mediaType: string, reason: MissedReason) {
  const kind = mediaType === "VIDEO" ? "video" : "voice";
  return reason === "FOCUS" ? `Called (${kind}) while you were focusing` : `Missed ${kind} call`;
}

/**
 * Marks a ringing DM call as missed, then tells the person who missed it: a card in the chat,
 * a notification, and (unless they were focusing) a browser push.
 * Returns false when the call was not ringing, so the same call is never reported twice.
 */
export async function recordMissedDmCall(callId: string, reason: MissedReason = "NO_ANSWER") {
  const now = new Date();
  // Claim the call first, so the caller's hang-up and the ring timeout can't both report it.
  const claimed = await prisma.callSession.updateMany({
    where: { id: callId, type: "DM", status: "RINGING" },
    data: { status: "MISSED", endedAt: now },
  });
  if (claimed.count === 0) return false;

  const call = await prisma.callSession.findUnique({
    where: { id: callId },
    include: { participants: { include: { user: { select: { id: true, name: true } } } } },
  });
  if (!call) return false;

  const missedBy = call.participants.filter((p) => p.status === "INVITED");
  await prisma.callParticipant.updateMany({
    where: { callId, status: "INVITED" },
    data: { status: "MISSED" },
  });
  await prisma.callParticipant.updateMany({
    where: { callId, leftAt: null },
    data: { leftAt: now, lastSeenAt: now, audioEnabled: false, videoEnabled: false, screenSharing: false },
  });

  const callerId = call.startedById;
  if (!call.conversationId || !callerId || missedBy.length === 0) return true;
  const callerName = call.participants.find((p) => p.userId === callerId)?.user.name || "A study partner";

  try {
    await createConversationMessage({
      conversationId: call.conversationId,
      senderId: callerId,
      content: missedCallText(call.mediaType, reason),
      fileType: MISSED_CALL_FILE_TYPE,
      fileName: call.mediaType === "VIDEO" ? "VIDEO" : "AUDIO",
    });
  } catch (err) {
    // The two may no longer be allowed to DM (blocked, unmatched); the call is still marked missed.
    console.error("Could not post missed call card:", err);
  }

  const kind = call.mediaType === "VIDEO" ? "video" : "voice";
  const content = reason === "FOCUS" ? `${callerName} called while you were focusing` : `Missed ${kind} call from ${callerName}`;
  const media = call.mediaType === "VIDEO" ? "video" : "audio";
  await Promise.all(
    missedBy.map(async (p) => {
      await prisma.notification.create({
        data: { userId: p.userId, type: "MISSED_CALL", content, relatedId: callerId },
      });
      if (reason === "FOCUS") return;
      await sendWebPush(p.userId, {
        type: "missed_call",
        title: callerName,
        body: `Missed ${kind} call`,
        url: `/chat?conversation=${call.conversationId}`,
        callBackUrl: `/call/active?type=dm&id=${call.conversationId}&media=${media}`,
      });
    }),
  );
  return true;
}

/** Reports DM calls that have rung out. Cheap enough to run from the routes clients already poll. */
export async function expireRingingDmCalls(now = new Date()) {
  const stale = await prisma.callSession.findMany({
    where: { type: "DM", status: "RINGING", startedAt: { lt: new Date(now.getTime() - RING_SECONDS * 1000) } },
    select: { id: true },
    take: 20,
  });
  for (const call of stale) {
    await recordMissedDmCall(call.id).catch((err) => console.error("Could not expire call:", err));
  }
}

/** Minutes left in the user's focus session, or null when they are free to take a call. */
export function focusMinutesLeft(focusUntil: Date | null | undefined, now = new Date()) {
  if (!focusUntil) return null;
  const ms = focusUntil.getTime() - now.getTime();
  return ms > 0 ? Math.max(1, Math.ceil(ms / 60000)) : null;
}
