export type Partner = {
  id: string;
  name: string;
  image: string | null;
  major: string;
  semester: string;
  college: string;
  match: number;
  connectionStatus: string | null;
  skills: string[];
  schedule: string;
  reasons: string[];
  isAvailable: boolean;
  bio: string;
};

export type PartnerFilters = {
  q?: string;
  major?: string;
  semester?: string;
  skill?: string;
  availability?: string;
  minMatch?: number;
};

export function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

const isAll = (value?: string) => !value || value === "all";

export function filterPartners(partners: Partner[], filters: PartnerFilters) {
  const query = (filters.q || "").toLowerCase();
  const minMatch = filters.minMatch || 0;

  return partners.filter((partner) => {
    const searchable = [partner.name, partner.major, partner.college, partner.schedule, partner.bio, ...partner.skills, ...partner.reasons].join(" ").toLowerCase();
    const matchesQuery = !query || searchable.includes(query);
    const matchesMajor = isAll(filters.major) || partner.major === filters.major;
    const matchesSemester = isAll(filters.semester) || partner.semester === filters.semester;
    const matchesSkill = isAll(filters.skill) || partner.skills.includes(filters.skill!);
    const matchesAvailability =
      isAll(filters.availability) || (filters.availability === "available" ? partner.isAvailable : partner.schedule !== "Availability not set");
    return matchesQuery && matchesMajor && matchesSemester && matchesSkill && matchesAvailability && partner.match >= minMatch;
  });
}

export function hasActiveFilters(filters: PartnerFilters) {
  return Boolean(filters.q || filters.major || filters.semester || filters.skill || filters.availability || filters.minMatch);
}

const MODE_LABELS: Record<string, string> = { ANY: "Any mode", ONLINE: "Online", IN_PERSON: "In person", HYBRID: "Hybrid" };
export function formatMode(mode: string) {
  return MODE_LABELS[mode] || "Any mode";
}

export function relativeDate(date: Date, now: number = Date.now()) {
  const diffDays = Math.floor((now - date.getTime()) / 86400000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
