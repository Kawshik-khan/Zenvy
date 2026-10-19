import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PeopleSearchResult = {
  id: string;
  name: string;
  uniqueId: string | null;
  avatar: string;
  major: string;
  college: string;
  interests: string[];
  availability: string | null;
  matchScore: number;
  connectionStatus: string | null;
  sharedGroups: number;
  sharedChannels: number;
  reasons: string[];
};

type CurrentUser = {
  id: string;
  profile: {
    id: string;
    major: string | null;
    college: string | null;
    interests: string | null;
  } | null;
  groupMemberships: Array<{ groupId: string }>;
  channelMemberships: Array<{ channelId: string }>;
};

type RawPeopleSearchRow = {
  id: string;
  name: string | null;
  uniqueId: string | null;
  email: string | null;
  image: string | null;
  updatedAt: Date;
  profileId: string | null;
  major: string | null;
  college: string | null;
  bio: string | null;
  interests: string | null;
  availability: string | null;
  sharedGroups: number;
  sharedChannels: number;
  connectionStatus: string | null;
  textRank: number | null;
  fuzzyRank: number | null;
  exactRank: number | null;
};

type SearchPeopleOptions = {
  currentUserId: string;
  query?: string;
  limit?: number;
};

function normalize(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

function splitList(value?: string | null) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function makeAvatar(name?: string | null, image?: string | null) {
  if (image) return image;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=random`;
}

function daysSince(value: Date) {
  return Math.max(0, Math.floor((Date.now() - value.getTime()) / 86_400_000));
}

function startsWithOrIncludes(query: string, values: Array<string | null | undefined>) {
  const q = normalize(query);
  if (!q) return 0;

  const normalizedValues = values.map(normalize).filter(Boolean);
  if (normalizedValues.some((value) => value === q)) return 60;
  if (normalizedValues.some((value) => value.startsWith(q))) return 42;
  if (normalizedValues.some((value) => value.includes(q))) return 24;

  const terms = q.split(/\s+/).filter(Boolean);
  const text = normalizedValues.join(" ");
  const termMatches = terms.filter((term) => text.includes(term)).length;
  return termMatches ? Math.min(20, termMatches * 8) : 0;
}

function sharedInterestCount(left?: string | null, right?: string | null) {
  const rightSet = new Set(splitList(right).map(normalize));
  return splitList(left)
    .map(normalize)
    .filter((interest) => rightSet.has(interest)).length;
}

function scoreRow(row: RawPeopleSearchRow, currentUser: CurrentUser, query: string) {
  const queryScore = startsWithOrIncludes(query, [
    row.name,
    row.uniqueId,
    row.email?.split("@")[0],
    row.major,
    row.college,
    row.interests,
    row.bio,
    row.availability,
  ]);
  const exactRank = Number(row.exactRank || 0);
  const textRank = Math.round(Number(row.textRank || 0) * 35);
  const fuzzyRank = Math.round(Number(row.fuzzyRank || 0) * 35);
  const sharedSpacesScore = Math.min((Number(row.sharedGroups) + Number(row.sharedChannels)) * 8, 24);
  const sharedInterests = sharedInterestCount(currentUser.profile?.interests, row.interests);
  const interestScore = Math.min(sharedInterests * 6, 18);
  const sameMajorScore = currentUser.profile?.major && normalize(currentUser.profile.major) === normalize(row.major) ? 16 : 0;
  const sameCollegeScore = currentUser.profile?.college && normalize(currentUser.profile.college) === normalize(row.college) ? 6 : 0;
  const availabilityScore = row.availability ? 8 : 0;
  const recencyScore = daysSince(row.updatedAt) <= 7 ? 5 : daysSince(row.updatedAt) <= 30 ? 3 : 0;

  return Math.max(
    0,
    Math.min(
      100,
      exactRank +
        queryScore +
        textRank +
        fuzzyRank +
        sharedSpacesScore +
        interestScore +
        sameMajorScore +
        sameCollegeScore +
        availabilityScore +
        recencyScore
    )
  );
}

function reasonsFor(row: RawPeopleSearchRow, currentUser: CurrentUser) {
  const reasons: string[] = [];
  const sharedSpaces = Number(row.sharedGroups) + Number(row.sharedChannels);
  const sharedInterests = sharedInterestCount(currentUser.profile?.interests, row.interests);

  if (sharedSpaces) reasons.push(`${sharedSpaces} shared space${sharedSpaces === 1 ? "" : "s"}`);
  if (currentUser.profile?.major && normalize(currentUser.profile.major) === normalize(row.major)) reasons.push("Same major");
  if (sharedInterests) reasons.push(`${sharedInterests} shared interest${sharedInterests === 1 ? "" : "s"}`);
  if (row.availability) reasons.push("Availability set");
  if (!reasons.length && row.major) reasons.push(row.major);
  if (!reasons.length) reasons.push("Study partner");

  return reasons.slice(0, 3);
}

function serializeRow(row: RawPeopleSearchRow, currentUser: CurrentUser, query: string): PeopleSearchResult {
  const name = row.name || "Anonymous";

  return {
    id: row.id,
    name,
    uniqueId: row.uniqueId,
    avatar: makeAvatar(name, row.image),
    major: row.major || "Student",
    college: row.college || "College not set",
    interests: splitList(row.interests).slice(0, 5),
    availability: row.availability,
    matchScore: scoreRow(row, currentUser, query),
    connectionStatus: row.connectionStatus,
    sharedGroups: Number(row.sharedGroups) || 0,
    sharedChannels: Number(row.sharedChannels) || 0,
    reasons: reasonsFor(row, currentUser),
  };
}

async function getCurrentUser(currentUserId: string) {
  return prisma.user.findUnique({
    where: { id: currentUserId },
    include: {
      profile: { select: { id: true, major: true, college: true, interests: true } },
      groupMemberships: { select: { groupId: true } },
      channelMemberships: { select: { channelId: true } },
    },
  });
}

async function fallbackSearch(currentUser: CurrentUser, query: string, limit: number) {
  const q = query.trim();
  const rows = await prisma.user.findMany({
    where: {
      id: { not: currentUser.id },
      blockedBy: { none: { blockerId: currentUser.id } },
      blocks: { none: { blockedId: currentUser.id } },
      profile: { is: { matchingAvailable: true } },
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { uniqueId: { contains: q, mode: "insensitive" } },
              { email: { startsWith: q, mode: "insensitive" } },
              { profile: { is: { major: { contains: q, mode: "insensitive" } } } },
              { profile: { is: { college: { contains: q, mode: "insensitive" } } } },
              { profile: { is: { interests: { contains: q, mode: "insensitive" } } } },
              { profile: { is: { bio: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    include: {
      profile: true,
      groupMemberships: { select: { groupId: true } },
      channelMemberships: { select: { channelId: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: Math.max(limit * 3, 24),
  });

  const currentGroups = new Set(currentUser.groupMemberships.map((item) => item.groupId));
  const currentChannels = new Set(currentUser.channelMemberships.map((item) => item.channelId));
  const profileIds = [currentUser.profile?.id, ...rows.map((row) => row.profile?.id)].filter(Boolean) as string[];
  const matches = currentUser.profile
    ? await prisma.match.findMany({
        where: {
          OR: [
            { profileId: currentUser.profile.id, matchedProfileId: { in: profileIds } },
            { matchedProfileId: currentUser.profile.id, profileId: { in: profileIds } },
          ],
        },
      })
    : [];
  const statusByProfileId = new Map<string, string>();

  for (const match of matches) {
    const profileId = match.profileId === currentUser.profile?.id ? match.matchedProfileId : match.profileId;
    statusByProfileId.set(profileId, match.status);
  }

  return rows
    .map((row) =>
      serializeRow(
        {
          id: row.id,
          name: row.name,
          uniqueId: row.uniqueId,
          email: row.email,
          image: row.image,
          updatedAt: row.updatedAt,
          profileId: row.profile?.id || null,
          major: row.profile?.major || null,
          college: row.profile?.college || null,
          bio: row.profile?.bio || null,
          interests: row.profile?.interests || null,
          availability: row.profile?.availability || null,
          sharedGroups: row.groupMemberships.filter((item) => currentGroups.has(item.groupId)).length,
          sharedChannels: row.channelMemberships.filter((item) => currentChannels.has(item.channelId)).length,
          connectionStatus: row.profile?.id ? statusByProfileId.get(row.profile.id) || null : null,
          textRank: 0,
          fuzzyRank: 0,
          exactRank: 0,
        },
        currentUser,
        q
      )
    )
    .sort((a, b) => b.matchScore - a.matchScore || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export async function searchPeople({ currentUserId, query = "", limit = 12 }: SearchPeopleOptions) {
  const currentUser = await getCurrentUser(currentUserId);
  if (!currentUser) return [];

  const normalizedQuery = query.trim().replace(/^@/, "").slice(0, 80);
  const boundedLimit = Math.max(1, Math.min(limit, 20));
  const currentProfileId = currentUser.profile?.id || null;

  try {
    const rows = await prisma.$queryRaw<RawPeopleSearchRow[]>`
      SELECT
        u."id",
        u."name",
        u."uniqueId",
        u."email",
        u."image",
        u."updatedAt",
        p."id" AS "profileId",
        p."major",
        p."college",
        p."bio",
        p."interests",
        p."availability",
        COALESCE(shared_groups.count, 0)::int AS "sharedGroups",
        COALESCE(shared_channels.count, 0)::int AS "sharedChannels",
        matches."status" AS "connectionStatus",
        CASE
          WHEN ${normalizedQuery} = '' THEN 0
          ELSE ts_rank_cd(
            to_tsvector('simple', concat_ws(' ', u."name", u."uniqueId", p."major", p."college", p."bio", p."interests", p."availability")),
            plainto_tsquery('simple', ${normalizedQuery})
          )
        END AS "textRank",
        CASE
          WHEN ${normalizedQuery} = '' THEN 0
          ELSE similarity(lower(concat_ws(' ', u."name", u."uniqueId", split_part(u."email", '@', 1), p."major", p."college", p."bio", p."interests")), lower(${normalizedQuery}))
        END AS "fuzzyRank",
        CASE
          WHEN lower(COALESCE(u."uniqueId", '')) = lower(${normalizedQuery}) THEN 70
          WHEN lower(COALESCE(u."name", '')) = lower(${normalizedQuery}) THEN 60
          WHEN lower(COALESCE(split_part(u."email", '@', 1), '')) = lower(${normalizedQuery}) THEN 55
          ELSE 0
        END AS "exactRank"
      FROM "User" u
      LEFT JOIN "Profile" p ON p."userId" = u."id"
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int
        FROM "GroupMember" mine
        INNER JOIN "GroupMember" theirs ON theirs."groupId" = mine."groupId"
        WHERE mine."userId" = ${currentUser.id} AND theirs."userId" = u."id"
      ) shared_groups ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int
        FROM "ChannelMember" mine
        INNER JOIN "ChannelMember" theirs ON theirs."channelId" = mine."channelId"
        WHERE mine."userId" = ${currentUser.id} AND theirs."userId" = u."id"
      ) shared_channels ON true
      LEFT JOIN LATERAL (
        SELECT m."status"
        FROM "Match" m
        WHERE ${currentProfileId}::text IS NOT NULL
          AND (
            (m."profileId" = ${currentProfileId}::text AND m."matchedProfileId" = p."id")
            OR (m."matchedProfileId" = ${currentProfileId}::text AND m."profileId" = p."id")
          )
        ORDER BY m."updatedAt" DESC
        LIMIT 1
      ) matches ON true
      WHERE u."id" <> ${currentUser.id}
        AND COALESCE(p."matchingAvailable", true) = true
        AND NOT EXISTS (
          SELECT 1 FROM "UserBlock" b
          WHERE (b."blockerId" = ${currentUser.id} AND b."blockedId" = u."id")
             OR (b."blockerId" = u."id" AND b."blockedId" = ${currentUser.id})
        )
        AND (
          ${normalizedQuery} = ''
          OR lower(COALESCE(u."name", '')) LIKE lower(${normalizedQuery}) || '%'
          OR lower(COALESCE(u."uniqueId", '')) LIKE lower(${normalizedQuery}) || '%'
          OR lower(COALESCE(split_part(u."email", '@', 1), '')) LIKE lower(${normalizedQuery}) || '%'
          OR to_tsvector('simple', concat_ws(' ', u."name", u."uniqueId", p."major", p."college", p."bio", p."interests", p."availability")) @@ plainto_tsquery('simple', ${normalizedQuery})
          OR similarity(lower(concat_ws(' ', u."name", u."uniqueId", split_part(u."email", '@', 1), p."major", p."college", p."bio", p."interests")), lower(${normalizedQuery})) > 0.18
        )
      ORDER BY
        "exactRank" DESC,
        "textRank" DESC,
        "fuzzyRank" DESC,
        "sharedGroups" DESC,
        "sharedChannels" DESC,
        u."updatedAt" DESC
      LIMIT ${Prisma.raw(String(Math.max(boundedLimit * 2, 20)))}
    `;

    return rows
      .map((row) => serializeRow(row, currentUser, normalizedQuery))
      .sort((a, b) => b.matchScore - a.matchScore || a.name.localeCompare(b.name))
      .slice(0, boundedLimit);
  } catch (error) {
    console.warn("People search raw query failed; falling back to Prisma contains search.", error);
    return fallbackSearch(currentUser, normalizedQuery, boundedLimit);
  }
}
