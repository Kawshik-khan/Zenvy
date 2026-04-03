"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const channelSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  tag: z.string().min(1, "Tag is required").max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Tag must be lowercase letters, numbers, and hyphens only"),
  description: z.string().max(500).optional().nullable(),
});

export async function createChannel(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) throw new Error("User not found");

  const rawTag = (formData.get("tag") as string || "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const validation = channelSchema.safeParse({
    name: formData.get("name"),
    tag: rawTag,
    description: formData.get("description"),
  });

  if (!validation.success) {
    throw new Error(`Invalid input: ${validation.error.message}`);
  }

  const { name, tag, description } = validation.data;

  // Check tag uniqueness
  const existing = await prisma.channel.findUnique({ where: { tag } });
  if (existing) {
    throw new Error("This tag is already taken. Please choose a different one.");
  }

  const channel = await prisma.channel.create({
    data: {
      name,
      tag,
      description,
      creatorId: user.id,
      members: {
        create: {
          userId: user.id,
          role: "CREATOR",
        },
      },
    },
  });

  revalidatePath("/channels");
  return { success: true, channelId: channel.id };
}

export async function joinChannel(channelId: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) throw new Error("User not found");

  const existingMember = await prisma.channelMember.findUnique({
    where: {
      channelId_userId: { channelId, userId: user.id },
    },
  });

  if (existingMember) {
    return { success: true, message: "Already a member" };
  }

  await prisma.channelMember.create({
    data: {
      channelId,
      userId: user.id,
      role: "MEMBER",
    },
  });

  revalidatePath("/channels");
  revalidatePath(`/channels/${channelId}`);
  return { success: true };
}

export async function leaveChannel(channelId: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) throw new Error("User not found");

  // Check if the user is the creator
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (channel?.creatorId === user.id) {
    throw new Error("Creator cannot leave the channel. Delete it instead.");
  }

  await prisma.channelMember.delete({
    where: {
      channelId_userId: { channelId, userId: user.id },
    },
  });

  revalidatePath("/channels");
  revalidatePath(`/channels/${channelId}`);
  return { success: true };
}

export async function deleteChannel(channelId: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) throw new Error("User not found");

  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) throw new Error("Channel not found");
  if (channel.creatorId !== user.id) throw new Error("Only the creator can delete this channel");

  await prisma.channel.delete({ where: { id: channelId } });

  revalidatePath("/channels");
  return { success: true };
}

export async function removeChannelMember(channelId: string, memberId: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) throw new Error("User not found");

  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) throw new Error("Channel not found");
  if (channel.creatorId !== user.id) throw new Error("Only the creator can remove members");
  if (memberId === user.id) throw new Error("Cannot remove yourself");

  await prisma.channelMember.delete({
    where: {
      channelId_userId: { channelId, userId: memberId },
    },
  });

  revalidatePath(`/channels/${channelId}`);
  return { success: true };
}

export async function searchChannels(query: string) {
  const channels = await prisma.channel.findMany({
    where: {
      OR: [
        { tag: { contains: query.toLowerCase(), mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, image: true } } } },
      creator: { select: { id: true, name: true, image: true } },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return channels;
}
