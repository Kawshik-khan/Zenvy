export type ProfileLike = {
  id?: string;
  college?: string | null;
  major?: string | null;
  semester?: number | null;
  bio?: string | null;
  studyStyle?: string | null;
  interests?: string | null;
  availability?: string | null;
  matchingAvailable?: boolean | null;
};

export type UserDiscoveryInput = {
  id: string;
  name?: string | null;
  image?: string | null;
  updatedAt?: Date | string;
  profile?: ProfileLike | null;
  groupMemberships?: Array<{ groupId: string }>;
  channelMemberships?: Array<{ channelId: string }>;
};

export type ExistingMatchInput = {
  profileId: string;
  matchedProfileId: string;
  status: string;
};

export type GroupDiscoveryInput = {
  id: string;
  name: string;
  description?: string | null;
  subject?: string | null;
  createdAt?: Date | string;
  members: Array<{ userId: string }>;
  messages?: Array<{ createdAt: Date | string }>;
  events?: Array<{ startTime: Date | string }>;
  _count?: {
    members?: number;
    messages?: number;
    events?: number;
    resources?: number;
  };
};

export type ChannelDiscoveryInput = {
  id: string;
  name: string;
  tag: string;
  description?: string | null;
  createdAt?: Date | string;
  members: Array<{ userId: string }>;
  messages?: Array<{ createdAt: Date | string }>;
  _count?: {
    members?: number;
    messages?: number;
  };
};

export type ScoredResult<T> = T & {
  discoveryScore: number;
  discoveryReasons: string[];
};

export function splitList(value?: string | null) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalize(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function daysSince(value?: Date | string) {
  if (!value) return 365;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (Number.isNaN(time)) return 365;
  return Math.max(0, Math.floor((Date.now() - time) / 86400000));
}

function recencyScore(value?: Date | string, max = 5) {
  const days = daysSince(value);
  if (days <= 1) return max;
  if (days <= 7) return Math.round(max * 0.8);
  if (days <= 30) return Math.round(max * 0.45);
  return 0;
}

function sizeHealthScore(count: number, max = 10) {
  if (count <= 0) return 0;
  if (count <= 3) return Math.round(max * 0.45);
  if (count <= 30) return max;
  if (count <= 100) return Math.round(max * 0.75);
  return Math.round(max * 0.55);
}

function interestOverlap(a?: string | null, b?: string | null) {
  const left = splitList(a).map(normalize);
  const right = splitList(b).map(normalize);
  return unique(left.filter((item) => right.includes(item)));
}

export function searchScore(query: string, fields: Array<string | null | undefined>) {
  const q = normalize(query);
  if (!q) return 0;

  const text = fields.map((field) => normalize(field)).filter(Boolean);
  if (text.some((field) => field === q)) return 100;
  if (text.some((field) => field.startsWith(q))) return 80;
  if (text.some((field) => field.includes(q))) return 55;

  const terms = q.split(/\s+/).filter(Boolean);
  const haystack = text.join(" ");
  const matches = terms.filter((term) => haystack.includes(term)).length;
  return matches ? Math.min(45, matches * 15) : 0;
}

export function recommendPeople<T extends UserDiscoveryInput>({
  currentUser,
  candidates,
  existingMatches = [],
  query = "",
}: {
  currentUser: UserDiscoveryInput;
  candidates: T[];
  existingMatches?: ExistingMatchInput[];
  query?: string;
}) {
  const currentProfile = currentUser.profile;
  const currentProfileId = currentProfile?.id;
  const currentGroups = new Set((currentUser.groupMemberships || []).map((item) => item.groupId));
  const currentChannels = new Set((currentUser.channelMemberships || []).map((item) => item.channelId));
  const blockedStatuses = new Set(["REJECTED"]);

  const excludedProfileIds = new Set<string>();
  if (currentProfileId) {
    for (const match of existingMatches) {
      if (!blockedStatuses.has(match.status)) continue;
      if (match.profileId === currentProfileId) excludedProfileIds.add(match.matchedProfileId);
      if (match.matchedProfileId === currentProfileId) excludedProfileIds.add(match.profileId);
    }
  }

  return candidates
    .filter((candidate) => candidate.id !== currentUser.id)
    .filter((candidate) => candidate.profile?.matchingAvailable !== false)
    .filter((candidate) => !candidate.profile?.id || !excludedProfileIds.has(candidate.profile.id))
    .map((candidate) => {
      const profile = candidate.profile;
      const overlap = interestOverlap(currentProfile?.interests, profile?.interests);
      const mutualGroups = (candidate.groupMemberships || []).filter((item) => currentGroups.has(item.groupId)).length;
      const mutualChannels = (candidate.channelMemberships || []).filter((item) => currentChannels.has(item.channelId)).length;

      let score = 0;
      const reasons: string[] = [];

      if (currentProfile?.major && normalize(currentProfile.major) === normalize(profile?.major)) {
        score += 25;
        reasons.push("Same major");
      }
      score += Math.min(overlap.length * 8, 25);
      if (overlap[0]) reasons.push(`${overlap.length} shared interest${overlap.length === 1 ? "" : "s"}`);
      if (currentProfile?.availability && profile?.availability) {
        score += normalize(currentProfile.availability) === normalize(profile.availability) ? 20 : 10;
        reasons.push("Availability set");
      }
      if (currentProfile?.college && normalize(currentProfile.college) === normalize(profile?.college)) {
        score += 10;
        reasons.push("Same college");
      }
      if (currentProfile?.semester && profile?.semester && Math.abs(currentProfile.semester - profile.semester) <= 1) {
        score += 10;
        reasons.push("Similar semester");
      }
      const socialScore = Math.min((mutualGroups + mutualChannels) * 5, 10);
      if (socialScore) {
        score += socialScore;
        reasons.push("Shared spaces");
      }

      const textScore = searchScore(query, [candidate.name, profile?.major, profile?.college, profile?.interests, profile?.bio]);
      if (query && !textScore) score = -1;

      return {
        ...candidate,
        discoveryScore: Math.max(0, Math.min(100, score + textScore)),
        discoveryReasons: reasons.length ? reasons.slice(0, 4) : ["Open to study partners"],
      };
    })
    .filter((candidate) => candidate.discoveryScore >= 0)
    .sort((a, b) => b.discoveryScore - a.discoveryScore || normalize(a.name).localeCompare(normalize(b.name)));
}

export function recommendGroups<T extends GroupDiscoveryInput>({
  currentUser,
  groups,
  query = "",
}: {
  currentUser: UserDiscoveryInput;
  groups: T[];
  query?: string;
}) {
  const profile = currentUser.profile;
  const userInterests = splitList(profile?.interests).map(normalize);

  return groups
    .map((group) => {
      const memberCount = group._count?.members ?? group.members.length;
      const isMember = group.members.some((member) => member.userId === currentUser.id);
      const subject = normalize(group.subject);
      const subjectFit = subject && (subject === normalize(profile?.major) || userInterests.includes(subject)) ? 30 : 0;
      const keywordFit = Math.min(
        userInterests.filter((interest) => `${normalize(group.name)} ${normalize(group.description)} ${subject}`.includes(interest)).length * 8,
        25
      );
      const activity = Math.min(((group._count?.messages || group.messages?.length || 0) > 0 ? 10 : 0) + ((group._count?.events || 0) > 0 ? 5 : 0), 15);
      const search = searchScore(query, [group.name, group.subject, group.description]);

      let score = subjectFit + keywordFit + activity + sizeHealthScore(memberCount, 10) + recencyScore(group.createdAt, 5);
      if (!isMember) score += 5;
      if (query && !search) score = -1;

      const reasons = [
        subjectFit ? "Matches your academic profile" : "",
        keywordFit ? "Overlaps with your interests" : "",
        activity ? "Active community" : "",
        memberCount ? `${memberCount} member${memberCount === 1 ? "" : "s"}` : "",
      ].filter(Boolean);

      return {
        ...group,
        discoveryScore: Math.max(0, Math.min(100, score + search)),
        discoveryReasons: reasons.length ? reasons.slice(0, 3) : ["Open study group"],
      };
    })
    .filter((group) => group.discoveryScore >= 0)
    .sort((a, b) => b.discoveryScore - a.discoveryScore || a.name.localeCompare(b.name));
}

export function recommendChannels<T extends ChannelDiscoveryInput>({
  currentUser,
  channels,
  query = "",
}: {
  currentUser: UserDiscoveryInput;
  channels: T[];
  query?: string;
}) {
  const userInterests = splitList(currentUser.profile?.interests).map(normalize);

  return channels
    .map((channel) => {
      const memberCount = channel._count?.members ?? channel.members.length;
      const isMember = channel.members.some((member) => member.userId === currentUser.id);
      const search = searchScore(query, [channel.tag, channel.name, channel.description]);
      const text = `${normalize(channel.tag)} ${normalize(channel.name)} ${normalize(channel.description)}`;
      const interestFit = Math.min(userInterests.filter((interest) => text.includes(interest)).length * 7, 20);
      const activity = Math.min((channel._count?.messages || channel.messages?.length || 0) > 0 ? 20 : 0, 20);

      let score = interestFit + activity + sizeHealthScore(memberCount, 10) + recencyScore(channel.createdAt, 5);
      if (!isMember) score += 5;
      if (query && !search) score = -1;

      const reasons = [
        interestFit ? "Matches your interests" : "",
        activity ? "Recent conversation" : "",
        memberCount ? `${memberCount} member${memberCount === 1 ? "" : "s"}` : "",
      ].filter(Boolean);

      return {
        ...channel,
        discoveryScore: Math.max(0, Math.min(100, score + search)),
        discoveryReasons: reasons.length ? reasons.slice(0, 3) : ["Public channel"],
      };
    })
    .filter((channel) => channel.discoveryScore >= 0)
    .sort((a, b) => b.discoveryScore - a.discoveryScore || a.tag.localeCompare(b.tag));
}
