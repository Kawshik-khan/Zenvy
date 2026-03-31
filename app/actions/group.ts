"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const groupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional().nullable(),
  subject: z.string().min(1, "Subject is required").max(100),
});

export async function createGroup(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) throw new Error("User not found");

  const validation = groupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    subject: formData.get("subject"),
  });

  if (!validation.success) {
    throw new Error(`Invalid input: ${validation.error.message}`);
  }

  const { name, description, subject } = validation.data;

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
