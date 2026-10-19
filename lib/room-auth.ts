import { prisma } from "@/lib/prisma";
import { canDmUsers } from "@/lib/conversations";

const GLOBAL_ROOMS = new Set(["global_lobby"]);

export function parseDmRoomId(roomId: string) {
  if (!roomId.startsWith("dm_")) return null;

  const parts = roomId.slice(3).split("_").filter(Boolean);
  if (parts.length !== 2) return null;

  return {
    userA: parts[0],
    userB: parts[1],
  };
}

export async function canAccessMessageRoom(userId: string, roomId: string) {
  if (GLOBAL_ROOMS.has(roomId)) return true;

  const dm = parseDmRoomId(roomId);
  if (!dm) return false;

  if (dm.userA !== userId && dm.userB !== userId) return false;

  const otherUserId = dm.userA === userId ? dm.userB : dm.userA;
  return canDmUsers(userId, otherUserId);
}

export async function canAccessGroup(userId: string, groupId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { id: true },
  });

  return Boolean(membership);
}

export async function canAccessChannel(userId: string, channelId: string) {
  const membership = await prisma.channelMember.findUnique({
    where: { channelId_userId: { channelId, userId } },
    select: { id: true },
  });

  return Boolean(membership);
}

export async function canSignalUser(fromUserId: string, toUserId: string, roomId?: string) {
  if (fromUserId === toUserId) return false;

  if (roomId) {
    const allowedRoom = await canAccessMessageRoom(fromUserId, roomId);
    if (!allowedRoom) return false;

    const dm = parseDmRoomId(roomId);
    if (dm && dm.userA !== toUserId && dm.userB !== toUserId) return false;
  }

  return canDmUsers(fromUserId, toUserId);
}
