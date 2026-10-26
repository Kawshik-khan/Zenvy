import { recommendChannels, recommendGroups } from "@/lib/discovery";
import { prisma } from "@/lib/prisma";
import { HttpError, iso } from "@/lib/mobile/http";
import { listEvents } from "@/lib/mobile/activity";
import { loadViewer, personSummary } from "@/lib/mobile/people";

type LastMessage = { content: string; createdAt: Date; sender: { name: string | null } } | undefined;

function lastMessage(message: LastMessage) {
  return message ? { content: message.content, senderName: message.sender.name || "Someone", createdAt: iso(message.createdAt) } : null;
}

const groupCardInclude = {
  _count: { select: { members: true, messages: true, events: true, resources: true } },
  members: { select: { userId: true, role: true } },
  messages: { orderBy: { createdAt: "desc" as const }, take: 1, include: { sender: { select: { name: true } } } },
};

/** The viewer's groups and ranked groups they could join. */
export async function listGroups(userId: string, query = "") {
  const viewer = await loadViewer(userId);
  const groups = await prisma.studyGroup.findMany({ include: groupCardInclude, orderBy: { createdAt: "desc" }, take: 200 });

  const card = (group: (typeof groups)[number], reasons: string[] = []) => ({
    id: group.id,
    name: group.name,
    subject: group.subject,
    description: group.description,
    memberCount: group._count.members,
    myRole: group.members.find((member) => member.userId === userId)?.role ?? null,
    lastMessage: lastMessage(group.messages[0]),
    reasons,
  });

  const mine = groups
    .filter((group) => group.members.some((member) => member.userId === userId))
    .sort((a, b) => (b.messages[0]?.createdAt.getTime() ?? b.createdAt.getTime()) - (a.messages[0]?.createdAt.getTime() ?? a.createdAt.getTime()))
    .map((group) => card(group));
  const discover = recommendGroups({ currentUser: viewer, groups: groups.filter((group) => !group.members.some((member) => member.userId === userId)), query })
    .slice(0, 30)
    .map((group) => card(group, group.discoveryReasons));

  return { mine, discover };
}

export async function getGroup(userId: string, groupId: string) {
  const group = await prisma.studyGroup.findUnique({
    where: { id: groupId },
    include: {
      members: { include: { user: { include: { profile: true } } }, orderBy: { joinedAt: "asc" } },
      resources: { include: { creator: { select: { name: true } } }, orderBy: [{ pinned: "desc" }, { createdAt: "desc" }] },
    },
  });
  if (!group) throw new HttpError("This group no longer exists", 404);

  const me = group.members.find((member) => member.userId === userId);
  const [events, call] = await Promise.all([
    me ? listEvents(userId, { groupId, upcomingOnly: true, take: 20 }) : Promise.resolve([]),
    me
      ? prisma.callSession.findUnique({
          where: { roomId: `group:${groupId}` },
          include: { participants: { where: { status: "JOINED" }, include: { user: { select: { id: true, name: true, image: true } } } } },
        })
      : Promise.resolve(null),
  ]);
  const liveCall = call && call.status === "ACTIVE" && call.participants.length
    ? { id: call.id, mediaType: call.mediaType, startedAt: iso(call.startedAt), participants: call.participants.map((participant) => participant.user) }
    : null;

  return {
    id: group.id,
    name: group.name,
    subject: group.subject,
    description: group.description,
    createdAt: iso(group.createdAt),
    isMember: Boolean(me),
    myRole: me?.role ?? null,
    memberCount: group.members.length,
    members: group.members.map((member) => ({ ...personSummary(member.user), role: member.role })),
    // Resource links are only shown to members, like the web group page.
    resources: me
      ? group.resources.map((resource) => ({
          id: resource.id,
          title: resource.title,
          description: resource.description,
          type: resource.resourceType,
          url: resource.url,
          fileName: resource.fileName,
          fileType: resource.fileType,
          pinned: resource.pinned,
          creatorName: resource.creator.name || "Someone",
          createdAt: iso(resource.createdAt),
        }))
      : [],
    events,
    liveCall,
  };
}

const channelInclude = {
  _count: { select: { members: true, messages: true } },
  members: { select: { userId: true } },
  messages: { orderBy: { createdAt: "desc" as const }, take: 1, include: { sender: { select: { name: true } } } },
};

export async function listChannels(userId: string) {
  const viewer = await loadViewer(userId);
  const channels = await prisma.channel.findMany({ include: channelInclude, orderBy: { updatedAt: "desc" }, take: 200 });
  const card = (channel: (typeof channels)[number]) => ({
    id: channel.id,
    name: channel.name,
    tag: channel.tag,
    description: channel.description,
    memberCount: channel._count.members,
    lastMessage: lastMessage(channel.messages[0]),
  });
  const isMember = (channel: (typeof channels)[number]) => channel.members.some((member) => member.userId === userId);
  return {
    mine: channels.filter(isMember).map(card),
    discover: recommendChannels({ currentUser: viewer, channels: channels.filter((channel) => !isMember(channel)) }).slice(0, 10).map(card),
  };
}

/** Membership check shared by the group and channel message routes. */
export async function assertGroupMember(userId: string, groupId: string) {
  const membership = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } }, select: { id: true } });
  if (!membership) throw new HttpError("Join this group to see its chat", 403);
}

export async function assertChannelMember(userId: string, channelId: string) {
  const membership = await prisma.channelMember.findUnique({ where: { channelId_userId: { channelId, userId } }, select: { id: true } });
  if (!membership) throw new HttpError("Join this channel to see its messages", 403);
}
