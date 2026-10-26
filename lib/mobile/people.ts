import { recommendPeople, splitList } from "@/lib/discovery";
import { prisma } from "@/lib/prisma";
import { HttpError, iso } from "@/lib/mobile/http";

export type ConnectionState = {
  /** PENDING, ACCEPTED or REJECTED, from the Match row between the two profiles. */
  status: string;
  /** Who sent the request. */
  direction: "outgoing" | "incoming";
};

export type PersonSummary = {
  id: string;
  name: string;
  uniqueId: string | null;
  image: string | null;
  college: string | null;
  major: string | null;
  semester: number | null;
  bio: string | null;
  studyStyle: string | null;
  interests: string[];
  availability: string | null;
};

type UserWithProfile = {
  id: string;
  name: string | null;
  uniqueId?: string | null;
  image: string | null;
  profile?: {
    college?: string | null;
    major?: string | null;
    semester?: number | null;
    bio?: string | null;
    studyStyle?: string | null;
    interests?: string | null;
    availability?: string | null;
    profileImage?: string | null;
  } | null;
};

export function personSummary(user: UserWithProfile): PersonSummary {
  const p = user.profile;
  return {
    id: user.id,
    name: user.name || "Zenvy student",
    uniqueId: user.uniqueId ?? null,
    image: user.image || p?.profileImage || null,
    college: p?.college ?? null,
    major: p?.major ?? null,
    semester: p?.semester ?? null,
    bio: p?.bio ?? null,
    studyStyle: p?.studyStyle ?? null,
    interests: splitList(p?.interests),
    availability: p?.availability ?? null,
  };
}

export async function loadViewer(userId: string) {
  const viewer = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      groupMemberships: { select: { groupId: true } },
      channelMemberships: { select: { channelId: true } },
    },
  });
  if (!viewer) throw new HttpError("Account not found", 401);
  return viewer;
}

/** Match state between the viewer's profile and each of the given profiles. */
export async function connectionsByProfile(viewerProfileId: string | undefined, profileIds: string[]) {
  const map = new Map<string, ConnectionState & { matchId: string }>();
  if (!viewerProfileId || !profileIds.length) return map;
  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { profileId: viewerProfileId, matchedProfileId: { in: profileIds } },
        { matchedProfileId: viewerProfileId, profileId: { in: profileIds } },
      ],
    },
    orderBy: { updatedAt: "asc" },
  });
  for (const match of matches) {
    const outgoing = match.profileId === viewerProfileId;
    map.set(outgoing ? match.matchedProfileId : match.profileId, {
      status: match.status,
      direction: outgoing ? "outgoing" : "incoming",
      matchId: match.id,
    });
  }
  return map;
}

/** Ranked study partner suggestions for the viewer, with the connection state for each. */
export async function listPartners(userId: string, query = "", limit = 40) {
  const viewer = await loadViewer(userId);
  const candidates = await prisma.user.findMany({
    where: {
      NOT: { id: viewer.id },
      blockedBy: { none: { blockerId: viewer.id } },
      blocks: { none: { blockedId: viewer.id } },
    },
    include: {
      profile: true,
      groupMemberships: { select: { groupId: true } },
      channelMemberships: { select: { channelId: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 120,
  });

  const profileIds = candidates.map((candidate) => candidate.profile?.id).filter(Boolean) as string[];
  const connections = await connectionsByProfile(viewer.profile?.id, profileIds);
  const existingMatches = viewer.profile
    ? Array.from(connections.entries()).map(([otherProfileId, state]) => ({
        profileId: state.direction === "outgoing" ? viewer.profile!.id : otherProfileId,
        matchedProfileId: state.direction === "outgoing" ? otherProfileId : viewer.profile!.id,
        status: state.status,
      }))
    : [];

  const ranked = recommendPeople({ currentUser: viewer, candidates, existingMatches, query }).slice(0, limit);

  return ranked.map((candidate) => {
    const state = candidate.profile?.id ? connections.get(candidate.profile.id) : undefined;
    return {
      ...personSummary(candidate),
      score: candidate.discoveryScore,
      reasons: candidate.discoveryReasons,
      connection: state ? { status: state.status, direction: state.direction } : null,
    };
  });
}

/** Active study ads, newest first, with the poster's summary. */
export async function listStudyAds(limit = 10) {
  const ads = await prisma.studyAd.findMany({
    where: { status: "ACTIVE" },
    include: { user: { include: { profile: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return ads.map((ad) => ({
    id: ad.id,
    title: ad.title,
    description: ad.description,
    subjects: ad.subjects,
    availability: ad.availability,
    mode: ad.mode,
    createdAt: iso(ad.createdAt),
    author: personSummary(ad.user),
  }));
}

/** A person's profile as the viewer sees it. */
export async function getPerson(viewerId: string, targetId: string) {
  if (viewerId === targetId) throw new HttpError("That's you", 400);
  const viewer = await loadViewer(viewerId);
  const target = await prisma.user.findUnique({
    where: { id: targetId },
    include: {
      profile: true,
      groupMemberships: { select: { groupId: true, group: { select: { id: true, name: true } } } },
      channelMemberships: { select: { channelId: true } },
    },
  });
  if (!target) throw new HttpError("This person isn't on Zenvy anymore", 404);

  const blocked = await prisma.userBlock.findFirst({
    where: { OR: [{ blockerId: viewerId, blockedId: targetId }, { blockerId: targetId, blockedId: viewerId }] },
    select: { blockerId: true },
  });
  if (blocked && blocked.blockerId === targetId) throw new HttpError("This profile isn't available", 404);

  const connections = await connectionsByProfile(viewer.profile?.id, target.profile ? [target.profile.id] : []);
  const state = target.profile ? connections.get(target.profile.id) : undefined;

  const [scored] = recommendPeople({ currentUser: viewer, candidates: [target], existingMatches: [] });
  const myGroups = new Set(viewer.groupMemberships.map((membership) => membership.groupId));
  const sharedGroups = target.groupMemberships.filter((membership) => myGroups.has(membership.groupId)).map((membership) => membership.group);

  let requestNotificationId: string | null = null;
  if (state?.status === "PENDING" && state.direction === "incoming") {
    const notification = await prisma.notification.findFirst({
      where: { userId: viewerId, type: "MATCH_REQUEST", relatedId: state.matchId },
      select: { id: true },
    });
    requestNotificationId = notification?.id ?? null;
  }

  let requestNote: string | null = null;
  if (state) {
    const match = await prisma.match.findUnique({ where: { id: state.matchId }, select: { requestNote: true } });
    requestNote = match?.requestNote ?? null;
  }

  return {
    ...personSummary(target),
    score: scored?.discoveryScore ?? 0,
    reasons: scored?.discoveryReasons ?? [],
    connection: state ? { status: state.status, direction: state.direction } : null,
    requestNotificationId,
    requestNote,
    sharedGroups,
    blockedByMe: Boolean(blocked && blocked.blockerId === viewerId),
  };
}

/** Accepted study partners, for the new-message picker and profile counts. */
export async function listConnections(userId: string) {
  const viewer = await loadViewer(userId);
  if (!viewer.profile) return [];
  const matches = await prisma.match.findMany({
    where: { status: "ACCEPTED", OR: [{ profileId: viewer.profile.id }, { matchedProfileId: viewer.profile.id }] },
    include: {
      profile: { include: { user: true } },
      matchedProfile: { include: { user: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return matches.map((match) => {
    const other = match.profileId === viewer.profile!.id ? match.matchedProfile : match.profile;
    return personSummary({ ...other.user, profile: other });
  });
}
