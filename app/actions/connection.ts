"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function blockUser(blockedId: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const blocker = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!blocker) throw new Error("User not found");

  if (blocker.id === blockedId) {
    throw new Error("You cannot block yourself");
  }

  // Graceful duplicate check (SEC-013)
  const existingBlock = await prisma.userBlock.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId: blocker.id,
        blockedId: blockedId
      }
    }
  });

  if (existingBlock) {
    return { success: true, message: "User is already blocked" };
  }

  await prisma.userBlock.create({
    data: {
      blockerId: blocker.id,
      blockedId: blockedId
    }
  });

  revalidatePath("/matching");
  return { success: true };
}

export async function reportUser(reportedId: string, reason: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const reporter = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!reporter) throw new Error("User not found");

  // Graceful duplicate report check (SEC-013)
  const existingReport = await prisma.report.findFirst({
    where: {
      reporterId: reporter.id,
      reportedId: reportedId
    }
  });

  if (existingReport) {
    return { success: true, message: "User already reported" };
  }

  await prisma.report.create({
    data: {
      reporterId: reporter.id,
      reportedId: reportedId,
      reason
    }
  });

  return { success: true };
}

export async function sendMatchRequest(targetUserId: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const sender = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });
  if (!sender) throw new Error("User not found");

  // Prevent sending to self
  if (sender.id === targetUserId) throw new Error("Invalid target");

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { profile: true },
  });
  if (!target) throw new Error("Target user not found");

  const blocked = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: sender.id, blockedId: targetUserId },
        { blockerId: targetUserId, blockedId: sender.id },
      ],
    },
  });
  if (blocked) throw new Error("You cannot connect with this user");

  const [senderProfile, targetProfile] = await prisma.$transaction([
    prisma.profile.upsert({
      where: { userId: sender.id },
      update: {},
      create: { userId: sender.id },
    }),
    prisma.profile.upsert({
      where: { userId: targetUserId },
      update: {},
      create: { userId: targetUserId },
    }),
  ]);

  const existing = await prisma.match.findFirst({
    where: {
      OR: [
        { profileId: senderProfile.id, matchedProfileId: targetProfile.id },
        { profileId: targetProfile.id, matchedProfileId: senderProfile.id },
      ],
    },
  });

  if (existing) {
    return { success: true, status: existing.status };
  }

  const match = await prisma.match.create({
    data: {
      profileId: senderProfile.id,
      matchedProfileId: targetProfile.id,
      status: "PENDING",
    },
  });

  await prisma.notification.create({
    data: {
      userId: targetUserId,
      type: "MATCH_REQUEST",
      content: `You have a new match request from ${sender.name || "a user"}.`,
      relatedId: match.id,
    },
  });

  revalidatePath("/matching");
  revalidatePath("/notifications");
  return { success: true, status: "PENDING" };
}

export async function acceptMatchRequest(notificationId: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });
  if (!user?.profile) throw new Error("Profile not found");

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification || notification.userId !== user.id || notification.type !== "MATCH_REQUEST" || !notification.relatedId) {
    throw new Error("Match request not found");
  }

  const match = await prisma.match.findUnique({
    where: { id: notification.relatedId },
  });
  if (!match || match.matchedProfileId !== user.profile.id) {
    throw new Error("Match request not found");
  }

  await prisma.$transaction([
    prisma.match.update({
      where: { id: match.id },
      data: { status: "ACCEPTED" },
    }),
    prisma.notification.update({
      where: { id: notification.id },
      data: { read: true },
    }),
  ]);

  revalidatePath("/matching");
  revalidatePath("/notifications");
  return { success: true };
}

export async function rejectMatchRequest(notificationId: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });
  if (!user?.profile) throw new Error("Profile not found");

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification || notification.userId !== user.id || notification.type !== "MATCH_REQUEST" || !notification.relatedId) {
    throw new Error("Match request not found");
  }

  const match = await prisma.match.findUnique({
    where: { id: notification.relatedId },
  });
  if (!match || match.matchedProfileId !== user.profile.id) {
    throw new Error("Match request not found");
  }

  await prisma.$transaction([
    prisma.match.update({
      where: { id: match.id },
      data: { status: "REJECTED" },
    }),
    prisma.notification.update({
      where: { id: notification.id },
      data: { read: true },
    }),
  ]);

  revalidatePath("/matching");
  revalidatePath("/notifications");
  return { success: true };
}
