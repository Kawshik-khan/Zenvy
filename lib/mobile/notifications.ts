import { prisma } from "@/lib/prisma";
import { iso } from "@/lib/mobile/http";

/**
 * The viewer's notifications, each with what it points at so the app can open it and, for
 * pending match requests and group invites, accept or decline in place.
 */
export async function listNotifications(userId: string, take = 60) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });

  const matchIds = notifications.filter((n) => n.type === "MATCH_REQUEST" && n.relatedId).map((n) => n.relatedId!);
  const inviteIds = notifications.filter((n) => n.type === "GROUP_INVITE" && n.relatedId).map((n) => n.relatedId!);

  const [matches, invites] = await Promise.all([
    matchIds.length
      ? prisma.match.findMany({
          where: { id: { in: matchIds } },
          select: { id: true, status: true, profile: { select: { user: { select: { id: true, name: true, image: true } } } } },
        })
      : Promise.resolve([]),
    inviteIds.length
      ? prisma.groupInvite.findMany({
          where: { id: { in: inviteIds } },
          select: { id: true, status: true, groupId: true, group: { select: { name: true } }, inviter: { select: { id: true, name: true, image: true } } },
        })
      : Promise.resolve([]),
  ]);
  const matchById = new Map(matches.map((match) => [match.id, match]));
  const inviteById = new Map(invites.map((invite) => [invite.id, invite]));

  return notifications.map((n) => {
    let actor: { id: string; name: string | null; image: string | null } | null = null;
    let target: { kind: "user" | "group" | "job"; id: string } | null = null;
    let pending = false;

    if (n.type === "MATCH_REQUEST" && n.relatedId) {
      const match = matchById.get(n.relatedId);
      if (match) {
        actor = match.profile.user;
        target = { kind: "user", id: match.profile.user.id };
        pending = match.status === "PENDING";
      }
    } else if (n.type === "GROUP_INVITE" && n.relatedId) {
      const invite = inviteById.get(n.relatedId);
      if (invite) {
        actor = invite.inviter;
        target = { kind: "group", id: invite.groupId };
        pending = invite.status === "PENDING";
      }
    } else if (n.type === "JOB_REVIEW" && n.relatedId) {
      target = { kind: "job", id: n.relatedId };
    }

    return { id: n.id, type: n.type, content: n.content, read: n.read, createdAt: iso(n.createdAt), actor, target, pending };
  });
}
