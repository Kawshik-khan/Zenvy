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
  });
  if (!sender) throw new Error("User not found");

  // Prevent sending to self
  if (sender.id === targetUserId) throw new Error("Invalid target");

  // Create a Notification for the target user
  await prisma.notification.create({
    data: {
      userId: targetUserId,
      type: "MATCH_REQUEST",
      content: `You have a new match request from ${sender.name || "a user"}.`,
      relatedId: sender.id
    }
  });

  revalidatePath("/matching");
  return { success: true };
}
