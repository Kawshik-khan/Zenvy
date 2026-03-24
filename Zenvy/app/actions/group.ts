"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createGroup(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) throw new Error("User not found");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const subject = formData.get("subject") as string;

  if (!name || !subject) {
    throw new Error("Name and subject are required");
  }

  const group = await prisma.studyGroup.create({
    data: {
      name,
      description,
      subject,
      adminId: user.id,
      members: {
        create: {
          userId: user.id,
          role: "ADMIN"
        }
      }
    }
  });

  revalidatePath("/groups");
  return { success: true, groupId: group.id };
}

export async function joinGroup(groupId: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) throw new Error("User not found");

  // Check if already a member
  const existingMember = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id
      }
    }
  });

  if (existingMember) {
    return { success: true, message: "Already a member" };
  }

  await prisma.groupMember.create({
    data: {
      groupId,
      userId: user.id,
      role: "MEMBER"
    }
  });

  revalidatePath("/groups");
  return { success: true };
}

export async function leaveGroup(groupId: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) throw new Error("User not found");

  await prisma.groupMember.delete({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id
      }
    }
  });

  revalidatePath("/groups");
  return { success: true };
}
