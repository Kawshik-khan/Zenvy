"use server";

import { auth } from "@/auth";
import { invalidateStudyMetrics } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { getSafeFileExtension, validateChatAttachment } from "@/lib/upload-validation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const resourceSchema = z.object({
  groupId: z.string().min(1),
  title: z.string().min(1, "Title is required").max(140),
  description: z.string().max(500).optional().nullable(),
  resourceType: z.enum(["LINK", "FILE", "NOTE"]),
  url: z.string().url("Enter a valid URL").optional().nullable(),
});

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) throw new Error("User not found");

  return user;
}

async function assertGroupAdmin(groupId: string, userId: string) {
  const group = await prisma.studyGroup.findUnique({
    where: { id: groupId },
    include: { members: { where: { userId } } },
  });

  if (!group) throw new Error("Group not found");

  const membership = group.members[0];
  if (group.adminId !== userId && membership?.role !== "ADMIN") {
    throw new Error("Only group admins can perform this action");
  }

  return group;
}

export async function sendGroupInvite(groupId: string, inviteeId: string) {
  const user = await getCurrentUser();
  const group = await assertGroupAdmin(groupId, user.id);

  if (inviteeId === user.id) throw new Error("You are already in this group");

  const invitee = await prisma.user.findUnique({
    where: { id: inviteeId },
    select: { id: true, name: true },
  });
  if (!invitee) throw new Error("Invitee not found");

  const existingMember = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: inviteeId } },
  });
  if (existingMember) throw new Error("This user is already a group member");

  const existingInvite = await prisma.groupInvite.findFirst({
    where: { groupId, inviteeId, status: "PENDING" },
  });
  if (existingInvite) {
    return { success: true, inviteId: existingInvite.id, status: existingInvite.status };
  }

  const invite = await prisma.groupInvite.create({
    data: {
      groupId,
      inviterId: user.id,
      inviteeId,
      status: "PENDING",
    },
  });

  await prisma.notification.create({
    data: {
      userId: inviteeId,
      type: "GROUP_INVITE",
      content: `${user.name || "A group admin"} invited you to join ${group.name}.`,
      relatedId: invite.id,
    },
  });

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/notifications");
  return { success: true, inviteId: invite.id, status: invite.status };
}

export async function acceptGroupInvite(notificationId: string) {
  const user = await getCurrentUser();

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification || notification.userId !== user.id || notification.type !== "GROUP_INVITE" || !notification.relatedId) {
    throw new Error("Group invite not found");
  }

  const invite = await prisma.groupInvite.findUnique({
    where: { id: notification.relatedId },
  });
  if (!invite || invite.inviteeId !== user.id || invite.status !== "PENDING") {
    throw new Error("Group invite is no longer available");
  }

  await prisma.$transaction([
    prisma.groupMember.upsert({
      where: { groupId_userId: { groupId: invite.groupId, userId: user.id } },
      update: {},
      create: { groupId: invite.groupId, userId: user.id, role: "MEMBER" },
    }),
    prisma.groupInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED" },
    }),
    prisma.notification.update({
      where: { id: notification.id },
      data: { read: true },
    }),
  ]);

  await invalidateStudyMetrics(user.id);

  revalidatePath(`/groups/${invite.groupId}`);
  revalidatePath("/groups");
  revalidatePath("/notifications");
}

export async function declineGroupInvite(notificationId: string) {
  const user = await getCurrentUser();

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification || notification.userId !== user.id || notification.type !== "GROUP_INVITE" || !notification.relatedId) {
    throw new Error("Group invite not found");
  }

  const invite = await prisma.groupInvite.findUnique({
    where: { id: notification.relatedId },
  });
  if (!invite || invite.inviteeId !== user.id || invite.status !== "PENDING") {
    throw new Error("Group invite is no longer available");
  }

  await prisma.$transaction([
    prisma.groupInvite.update({
      where: { id: invite.id },
      data: { status: "DECLINED" },
    }),
    prisma.notification.update({
      where: { id: notification.id },
      data: { read: true },
    }),
  ]);

  revalidatePath(`/groups/${invite.groupId}`);
  revalidatePath("/notifications");
}

export async function cancelGroupInvite(inviteId: string) {
  const user = await getCurrentUser();

  const invite = await prisma.groupInvite.findUnique({
    where: { id: inviteId },
  });
  if (!invite) throw new Error("Invite not found");

  await assertGroupAdmin(invite.groupId, user.id);

  await prisma.groupInvite.update({
    where: { id: invite.id },
    data: { status: "CANCELED" },
  });

  await prisma.notification.updateMany({
    where: { relatedId: invite.id, type: "GROUP_INVITE" },
    data: { read: true },
  });

  revalidatePath(`/groups/${invite.groupId}`);
  revalidatePath("/notifications");
}

export async function createGroupResource(formData: FormData) {
  const user = await getCurrentUser();

  const validation = resourceSchema.safeParse({
    groupId: formData.get("groupId"),
    title: formData.get("title"),
    description: formData.get("description") || null,
    resourceType: formData.get("resourceType"),
    url: formData.get("url") || null,
  });

  if (!validation.success) {
    throw new Error(`Invalid resource: ${validation.error.message}`);
  }

  const { groupId, title, description, resourceType } = validation.data;
  let url = validation.data.url || null;
  let fileName: string | null = null;
  let fileType: string | null = null;

  await assertGroupAdmin(groupId, user.id);

  if (resourceType === "FILE") {
    const file = formData.get("file") as File | null;
    if (!file) throw new Error("File is required");

    const validationError = validateChatAttachment(file);
    if (validationError) throw new Error(validationError);

    const fileExt = getSafeFileExtension(file.name);
    const storagePath = `group-resources/${groupId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(storagePath, buffer, {
        contentType: file.type,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: publicUrl } = supabase.storage.from("attachments").getPublicUrl(storagePath);
    url = publicUrl.publicUrl;
    fileName = file.name.replace(/[^\w.\- ]/g, "").slice(0, 120) || "resource";
    fileType = file.type;
  }

  if (resourceType === "LINK" && !url) throw new Error("URL is required for link resources");
  if (resourceType === "NOTE" && !description) throw new Error("Description is required for note resources");

  await prisma.groupResource.create({
    data: {
      groupId,
      creatorId: user.id,
      title,
      description,
      resourceType,
      url,
      fileName,
      fileType,
    },
  });

  await invalidateStudyMetrics(user.id);

  revalidatePath(`/groups/${groupId}`);
}

export async function toggleGroupResourcePinned(resourceId: string) {
  const user = await getCurrentUser();

  const resource = await prisma.groupResource.findUnique({
    where: { id: resourceId },
  });
  if (!resource) throw new Error("Resource not found");

  await assertGroupAdmin(resource.groupId, user.id);

  await prisma.groupResource.update({
    where: { id: resource.id },
    data: { pinned: !resource.pinned },
  });

  await invalidateStudyMetrics(resource.creatorId);

  revalidatePath(`/groups/${resource.groupId}`);
}

export async function deleteGroupResource(resourceId: string) {
  const user = await getCurrentUser();

  const resource = await prisma.groupResource.findUnique({
    where: { id: resourceId },
  });
  if (!resource) throw new Error("Resource not found");

  await assertGroupAdmin(resource.groupId, user.id);

  await prisma.groupResource.delete({
    where: { id: resource.id },
  });

  await invalidateStudyMetrics(resource.creatorId);

  revalidatePath(`/groups/${resource.groupId}`);
}
