import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { DELETE_CONFIRMATION } from "@/lib/account-deletion-constants";

export { DELETE_CONFIRMATION };

/**
 * Checks a deletion request: the typed confirmation, and the password for accounts that have one
 * (Google-only accounts have none). Returns a user-facing error, or null when it may proceed.
 */
export async function checkDeletionRequest(userId: string, confirmation: string, password?: string | null) {
  if (confirmation.trim() !== DELETE_CONFIRMATION) return `Type ${DELETE_CONFIRMATION} to confirm.`;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
  if (!user) return "Account not found.";
  if (user.password && !(password && (await bcrypt.compare(password, user.password)))) return "That password is incorrect.";
  return null;
}

/**
 * Permanently deletes a user and everything they own. Almost every relation cascades from User;
 * the three that don't are handled first:
 * - study groups they run pass to the longest-standing other member, or are deleted when empty;
 * - channels they created pass the same way;
 * - events they created are deleted (their RSVPs cascade).
 */
export async function deleteAccount(userId: string) {
  await prisma.$transaction(async (tx) => {
    const groups = await tx.studyGroup.findMany({
      where: { adminId: userId },
      select: { id: true, members: { where: { userId: { not: userId } }, orderBy: { joinedAt: "asc" }, take: 1, select: { userId: true } } },
    });
    for (const group of groups) {
      const heir = group.members[0]?.userId;
      if (!heir) {
        await tx.studyGroup.delete({ where: { id: group.id } });
        continue;
      }
      await tx.studyGroup.update({ where: { id: group.id }, data: { adminId: heir } });
      await tx.groupMember.update({ where: { groupId_userId: { groupId: group.id, userId: heir } }, data: { role: "ADMIN" } });
    }

    const channels = await tx.channel.findMany({
      where: { creatorId: userId },
      select: { id: true, members: { where: { userId: { not: userId } }, orderBy: { joinedAt: "asc" }, take: 1, select: { userId: true } } },
    });
    for (const channel of channels) {
      const heir = channel.members[0]?.userId;
      if (!heir) {
        await tx.channel.delete({ where: { id: channel.id } });
        continue;
      }
      await tx.channel.update({ where: { id: channel.id }, data: { creatorId: heir } });
      await tx.channelMember.update({ where: { channelId_userId: { channelId: channel.id, userId: heir } }, data: { role: "CREATOR" } });
    }

    await tx.event.deleteMany({ where: { creatorId: userId } });
    await tx.user.delete({ where: { id: userId } });
  });

  await removeAvatarFiles(userId);
}

/** Profile photos live under avatars/<userId>/. Best effort: the account is already gone. */
async function removeAvatarFiles(userId: string) {
  try {
    const bucket = supabase.storage.from("avatars");
    const { data } = await bucket.list(userId);
    if (data?.length) await bucket.remove(data.map((file) => `${userId}/${file.name}`));
  } catch (error) {
    console.error("Avatar cleanup failed after account deletion:", error);
  }
}
