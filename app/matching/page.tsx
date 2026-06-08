import React from "react";
export const runtime = "nodejs";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/app/components/Sidebar";
import NotificationBell from "@/app/components/NotificationBell";
import ConnectButton from "./ConnectButton";
import Link from "next/link";
import { redirect } from "next/navigation";

type SearchParams = {
  q?: string;
  major?: string;
  semester?: string;
  skill?: string;
  availability?: string;
  min?: string;
};

type Partner = {
  id: string;
  name: string;
  major: string;
  semester: string;
  college: string;
  avatar: string;
  match: number;
  connectionStatus: string | null;
  skills: string[];
  schedule: string;
  reasons: string[];
  isAvailable: boolean;
  bio: string;
};

function splitList(value?: string | null) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function normalize(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

function makeAvatar(name?: string | null, image?: string | null) {
  if (image) return image;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=random`;
}

function formatMode(mode: string) {
  const labels: Record<string, string> = {
    ANY: "Any mode",
    ONLINE: "Online",
    IN_PERSON: "In person",
    HYBRID: "Hybrid",
  };
  return labels[mode] || "Any mode";
}

function relativeDate(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getReasons({
  currentMajor,
  otherMajor,
  currentCollege,
  otherCollege,
  currentSemester,
  otherSemester,
  overlap,
  available,
}: {
  currentMajor?: string | null;
  otherMajor?: string | null;
  currentCollege?: string | null;
  otherCollege?: string | null;
  currentSemester?: number | null;
  otherSemester?: number | null;
  overlap: string[];
  available: boolean;
}) {
  const reasons: string[] = [];

  if (currentMajor && otherMajor && normalize(currentMajor) === normalize(otherMajor)) reasons.push("Same department");
  if (currentCollege && otherCollege && normalize(currentCollege) === normalize(otherCollege)) reasons.push("Same college");
  if (currentSemester && otherSemester && Math.abs(currentSemester - otherSemester) <= 1) reasons.push("Similar semester");
  if (overlap[0]) reasons.push(`Shared ${overlap[0]} interest`);
  if (overlap.length > 1) reasons.push(`${overlap.length} shared interests`);
  if (available) reasons.push("Available for study");

  return reasons.length ? reasons.slice(0, 4) : ["Open to study partners", "Profile ready for matching"];
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="glass-panel-subtle rounded-[24px] p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{label}</span>
        <span className="material-symbols-outlined text-lg text-primary">{icon}</span>
      </div>
      <p className="text-2xl font-black tracking-tight text-on-surface">{value}</p>
    </div>
  );
}

function PartnerCard({ partner }: { partner: Partner }) {
  return (
    <article className="glass-panel-subtle glass-interactive flex h-full flex-col rounded-[28px] p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">
            <img className="h-14 w-14 rounded-2xl object-cover" src={partner.avatar} alt="" />
            <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-surface ${partner.isAvailable ? "bg-tertiary-fixed" : "bg-outline"}`} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-black text-on-surface">{partner.name}</h2>
            <p className="truncate text-sm text-on-surface-variant">{partner.major}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-primary-container/40 px-3 py-2 text-right">
          <p className="text-xl font-black leading-none text-primary">{partner.match}%</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Match</p>
        </div>
      </div>

      <div className="mb-4 grid gap-2">
        {partner.reasons.map((reason) => (
          <div key={reason} className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
            <span className="material-symbols-outlined text-sm text-tertiary-fixed">check_circle</span>
            <span>{reason}</span>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {partner.skills.slice(0, 4).map((skill) => (
          <span key={skill} className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-on-surface-variant">
            {skill}
          </span>
        ))}
      </div>

      <div className="mb-5 mt-auto rounded-2xl bg-surface-container-low/60 p-3 text-xs text-on-surface-variant">
        <div className="mb-1 flex items-center gap-2 font-bold text-on-surface">
          <span className="material-symbols-outlined text-sm">schedule</span>
          Availability
        </div>
        <p className="line-clamp-2">{partner.schedule}</p>
      </div>

      <div className="flex gap-2">
        <Link href={`/chat/personal?id=${partner.id}`} className="flex-1 rounded-full bg-primary-container py-3 text-center text-xs font-black text-on-primary-container transition-colors hover:bg-primary hover:text-white">
          Message
        </Link>
        <ConnectButton partnerId={partner.id} buttonText="Connect" initialStatus={partner.connectionStatus} />
      </div>

      <details className="mt-2 group/details">
        <summary className="list-none cursor-pointer rounded-full bg-surface-container py-3 text-center text-xs font-black text-on-surface-variant transition-colors hover:text-on-surface">
          View Profile
        </summary>
        <div className="mt-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low/40 p-4 text-xs leading-5 text-on-surface-variant">
          <p className="font-bold text-on-surface">{partner.college}</p>
          <p>{partner.semester}</p>
          <p className="mt-2">{partner.bio}</p>
        </div>
      </details>
    </article>
  );
}

export default async function MatchingPage(props: { searchParams?: Promise<SearchParams> }) {
  const searchParams = (await props.searchParams) || {};
  const q = searchParams.q || "";
  const major = searchParams.major || "";
  const semester = searchParams.semester || "";
  const skill = searchParams.skill || "";
  const availability = searchParams.availability || "";
  const minMatch = Number(searchParams.min || 0) || 0;

  const session = await auth();
  if (!session?.user?.id && !session?.user?.email) redirect("/login");

  const user = session.user.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { profile: true },
      })
    : await prisma.user.findUnique({
        where: { email: session.user.email || "" },
        include: { profile: true },
      });

  if (!user) redirect("/login");

  const [otherUsers, studyAds, suggestedGroups] = await Promise.all([
    prisma.user.findMany({
      where: {
        NOT: { id: user.id },
        blockedBy: { none: { blockerId: user.id } },
        blocks: { none: { blockedId: user.id } },
      },
      include: { profile: true },
      orderBy: { updatedAt: "desc" },
      take: 80,
    }),
    prisma.studyAd.findMany({
      where: { status: "ACTIVE" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            profile: { select: { major: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.studyGroup.findMany({
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const profileIds = [
    user.profile?.id,
    ...otherUsers.map((otherUser) => otherUser.profile?.id),
  ].filter(Boolean) as string[];

  const existingMatches = user.profile
    ? await prisma.match.findMany({
        where: {
          OR: [
            { profileId: user.profile.id, matchedProfileId: { in: profileIds } },
            { matchedProfileId: user.profile.id, profileId: { in: profileIds } },
          ],
        },
      })
    : [];

  const statusByProfileId = new Map<string, string>();
  for (const matchRecord of existingMatches) {
    const otherProfileId = matchRecord.profileId === user.profile?.id ? matchRecord.matchedProfileId : matchRecord.profileId;
    statusByProfileId.set(otherProfileId, matchRecord.status);
  }

  const currentInterests = splitList(user.profile?.interests).map((interest) => interest.toLowerCase());

  const processedPartners: Partner[] = otherUsers
    .map((otherUser) => {
      const otherInterests = splitList(otherUser.profile?.interests);
      const normalizedOtherInterests = otherInterests.map((interest) => interest.toLowerCase());
      const overlap = normalizedOtherInterests.filter((interest) => currentInterests.includes(interest));

      let match = 60;
      if (user.profile?.major && normalize(otherUser.profile?.major) === normalize(user.profile.major)) match += 15;
      if (user.profile?.college && normalize(otherUser.profile?.college) === normalize(user.profile.college)) match += 15;
      if (otherUser.profile?.semester && user.profile?.semester && Math.abs(otherUser.profile.semester - user.profile.semester) <= 1) match += 5;
      match += Math.min(overlap.length * 5, 20);

      const isAvailable = Boolean(otherUser.profile?.matchingAvailable && otherUser.profile?.availability);
      const displayOverlap = otherInterests.filter((interest) => currentInterests.includes(interest.toLowerCase()));

      return {
        id: otherUser.id,
        name: otherUser.name || "Anonymous",
        major: otherUser.profile?.major || "Undecided",
        semester: otherUser.profile?.semester ? `Semester ${otherUser.profile.semester}` : "Semester not set",
        college: otherUser.profile?.college || "College not set",
        avatar: makeAvatar(otherUser.name, otherUser.image),
        match: Math.min(match, 100),
        connectionStatus: otherUser.profile?.id ? statusByProfileId.get(otherUser.profile.id) || null : null,
        skills: otherInterests.length ? otherInterests : ["Study Partner"],
        schedule: otherUser.profile?.availability || "Availability not set",
        reasons: getReasons({
          currentMajor: user.profile?.major,
          otherMajor: otherUser.profile?.major,
          currentCollege: user.profile?.college,
          otherCollege: otherUser.profile?.college,
          currentSemester: user.profile?.semester,
          otherSemester: otherUser.profile?.semester,
          overlap: displayOverlap,
          available: isAvailable,
        }),
        isAvailable,
        bio: otherUser.profile?.bio || "No bio added yet.",
      };
    })
    .sort((a, b) => b.match - a.match || Number(b.isAvailable) - Number(a.isAvailable));

  const query = q.toLowerCase();
  const filteredPartners = processedPartners.filter((partner) => {
    const searchable = [partner.name, partner.major, partner.college, partner.schedule, ...partner.skills, ...partner.reasons].join(" ").toLowerCase();
    const matchesQuery = !query || searchable.includes(query);
    const matchesMajor = !major || major === "all" || partner.major === major;
    const matchesSemester = !semester || semester === "all" || partner.semester === semester;
    const matchesSkill = !skill || skill === "all" || partner.skills.includes(skill);
    const matchesAvailability = !availability || availability === "all" || (availability === "available" ? partner.isAvailable : partner.schedule !== "Availability not set");
    const matchesMin = partner.match >= minMatch;

    return matchesQuery && matchesMajor && matchesSemester && matchesSkill && matchesAvailability && matchesMin;
  });

  const majorOptions = unique(processedPartners.map((partner) => partner.major).filter((value) => value !== "Undecided"));
  const semesterOptions = unique(processedPartners.map((partner) => partner.semester).filter((value) => value !== "Semester not set"));
  const skillOptions = unique(processedPartners.flatMap((partner) => partner.skills).filter((value) => value !== "Study Partner")).slice(0, 20);
  const trendingSkills = skillOptions.slice(0, 8);
  const onlinePartners = processedPartners.filter((partner) => partner.isAvailable).slice(0, 6);

  const pendingRequests = user.profile
    ? await prisma.match.count({
        where: {
          matchedProfileId: user.profile.id,
          status: "PENDING",
        },
      })
    : 0;

  return (
    <div className="app-aurora antialiased overflow-x-hidden">
      <Sidebar />

      <main className="app-main">
        <header className="app-topbar font-sans text-sm">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Matching</p>
            <h1 className="truncate text-xl font-black tracking-tight text-on-surface">Find Your Tribe</h1>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="hidden items-center gap-3 border-l pl-4 glass-divider sm:flex">
              <div className="text-right">
                <p className="font-bold text-on-surface">{user.name || "Student"}</p>
                <p className="text-xs text-on-surface-variant">{user.profile?.major || "Undecided"}</p>
              </div>
              <img className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20" src={makeAvatar(user.name, user.image)} alt="" />
            </div>
          </div>
        </header>

        <div className="app-content min-h-[calc(100vh-64px)] p-4 md:p-8 xl:p-10">
          <div className="mx-auto max-w-[1700px] space-y-6">
            <section className="glass-panel-subtle overflow-hidden rounded-[32px] p-6 md:p-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div>
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-primary">Study Partner Network</p>
                  <h2 className="text-3xl font-black tracking-tight text-on-surface md:text-5xl">Find Your Tribe</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant md:text-base">
                    Browse classmates by match strength, shared interests, schedule fit, and active study goals.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link href="/matching/post-ad" className="app-primary-button inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-black">
                    <span className="material-symbols-outlined text-base">add</span>
                    Post Study Ad
                  </Link>
                  <a href="#matches" className="inline-flex items-center justify-center gap-2 rounded-full bg-surface-container px-6 py-3 text-sm font-black text-on-surface-variant transition-colors hover:text-on-surface">
                    <span className="material-symbols-outlined text-base">travel_explore</span>
                    Find Study Partner
                  </a>
                </div>
              </div>
            </section>

            <form action="/matching" className="glass-panel-subtle rounded-[28px] p-4">
              <div className="grid gap-3 md:grid-cols-[minmax(220px,1.4fr)_repeat(5,minmax(120px,1fr))_auto]">
                <label className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                  <input name="q" defaultValue={q} className="app-input h-full rounded-2xl py-3 pl-10 pr-4 text-sm" placeholder="Search name, major, or skill" />
                </label>

                <select name="major" defaultValue={major || "all"} className="app-input rounded-2xl px-4 py-3 text-sm">
                  <option value="all">Department</option>
                  {majorOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>

                <select name="semester" defaultValue={semester || "all"} className="app-input rounded-2xl px-4 py-3 text-sm">
                  <option value="all">Semester</option>
                  {semesterOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>

                <select name="skill" defaultValue={skill || "all"} className="app-input rounded-2xl px-4 py-3 text-sm">
                  <option value="all">Skills</option>
                  {skillOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>

                <select name="availability" defaultValue={availability || "all"} className="app-input rounded-2xl px-4 py-3 text-sm">
                  <option value="all">Availability</option>
                  <option value="available">Available now</option>
                  <option value="with-schedule">Has schedule</option>
                </select>

                <select name="min" defaultValue={String(minMatch || 0)} className="app-input rounded-2xl px-4 py-3 text-sm">
                  <option value="0">Match %</option>
                  <option value="70">70%+</option>
                  <option value="80">80%+</option>
                  <option value="90">90%+</option>
                </select>

                <button className="app-primary-button rounded-2xl px-5 py-3 text-sm font-black">Apply</button>
              </div>
            </form>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Students" value={processedPartners.length.toLocaleString()} icon="groups" />
              <StatCard label="Online Now" value={onlinePartners.length} icon="radio_button_checked" />
              <StatCard label="New Matches" value={processedPartners.filter((partner) => partner.match >= 85).length} icon="auto_awesome" />
              <StatCard label="Requests" value={pendingRequests} icon="notifications_active" />
            </section>

            <section id="matches" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
              <div>
                <div className="mb-4 flex items-end justify-between gap-4 px-1">
                  <div>
                    <h2 className="text-xl font-black text-on-surface">Recent Matches</h2>
                    <p className="text-sm text-on-surface-variant">{filteredPartners.length} student{filteredPartners.length === 1 ? "" : "s"} match your filters.</p>
                  </div>
                  {(q || major || semester || skill || availability || minMatch) && (
                    <Link href="/matching" className="rounded-full bg-surface-container px-4 py-2 text-xs font-bold text-on-surface-variant transition-colors hover:text-on-surface">
                      Clear filters
                    </Link>
                  )}
                </div>

                {filteredPartners.length ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3 min-[1700px]:grid-cols-4">
                    {filteredPartners.map((partner) => (
                      <PartnerCard key={partner.id} partner={partner} />
                    ))}
                  </div>
                ) : (
                  <div className="glass-panel-subtle rounded-[28px] border border-dashed border-outline-variant/40 p-10 text-center">
                    <span className="material-symbols-outlined mb-4 text-5xl text-on-surface-variant/60">search_off</span>
                    <h3 className="text-2xl font-black text-on-surface">No matching peers found</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">
                      Try fewer filters or post a study ad so interested classmates can find you.
                    </p>
                    <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                      <Link href="/matching" className="rounded-full bg-surface-container px-6 py-3 text-sm font-bold text-on-surface-variant transition-colors hover:text-on-surface">
                        Clear Filters
                      </Link>
                      <Link href="/matching/post-ad" className="app-primary-button rounded-full px-6 py-3 text-sm font-black">
                        Post Study Ad
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <aside className="hidden space-y-4 xl:block">
                <div className="glass-panel-subtle rounded-[28px] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-black text-on-surface">Online Now</h2>
                    <span className="rounded-full bg-tertiary-container/30 px-2 py-1 text-[10px] font-black text-tertiary-fixed">LIVE</span>
                  </div>
                  <div className="space-y-3">
                    {onlinePartners.length ? onlinePartners.map((partner) => (
                      <Link key={partner.id} href={`/chat/personal?id=${partner.id}`} className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-surface-container">
                        <span className="relative">
                          <img className="h-9 w-9 rounded-xl object-cover" src={partner.avatar} alt="" />
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface bg-tertiary-fixed" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-on-surface">{partner.name}</span>
                          <span className="block truncate text-xs text-on-surface-variant">{partner.major}</span>
                        </span>
                      </Link>
                    )) : (
                      <p className="text-sm leading-6 text-on-surface-variant">No students are marked available right now.</p>
                    )}
                  </div>
                </div>

                <div className="glass-panel-subtle rounded-[28px] p-5">
                  <h2 className="mb-4 text-sm font-black text-on-surface">Trending Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {trendingSkills.length ? trendingSkills.map((item) => (
                      <Link key={item} href={`/matching?skill=${encodeURIComponent(item)}`} className="rounded-full bg-surface-container px-3 py-1.5 text-xs font-bold text-on-surface-variant transition-colors hover:text-on-surface">
                        #{item.replace(/\s+/g, "")}
                      </Link>
                    )) : (
                      <p className="text-sm text-on-surface-variant">Skills appear here as profiles add interests.</p>
                    )}
                  </div>
                </div>

                <div className="glass-panel-subtle rounded-[28px] p-5">
                  <h2 className="mb-4 text-sm font-black text-on-surface">Suggested Groups</h2>
                  <div className="space-y-3">
                    {suggestedGroups.map((group) => (
                      <Link key={group.id} href={`/groups/${group.id}`} className="flex items-center justify-between gap-3 rounded-2xl p-3 transition-colors hover:bg-surface-container">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-on-surface">{group.name}</span>
                          <span className="block truncate text-xs text-on-surface-variant">{group.subject || "Study group"}</span>
                        </span>
                        <span className="shrink-0 rounded-full bg-surface-container-high px-2 py-1 text-[10px] font-black text-on-surface-variant">
                          {group._count.members}
                        </span>
                      </Link>
                    ))}
                    {!suggestedGroups.length && <p className="text-sm text-on-surface-variant">No groups have been created yet.</p>}
                  </div>
                </div>

                <div className="glass-panel-subtle rounded-[28px] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-black text-on-surface">Study Ads</h2>
                    <Link href="/matching/post-ad" className="text-xs font-black text-primary">Post</Link>
                  </div>
                  <div className="space-y-3">
                    {studyAds.map((ad) => (
                      <div key={ad.id} className="rounded-2xl bg-surface-container-low/50 p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <img className="h-7 w-7 rounded-lg object-cover" src={makeAvatar(ad.user.name, ad.user.image)} alt="" />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-on-surface">{ad.user.name || "Student"}</p>
                            <p className="truncate text-[11px] text-on-surface-variant">{ad.user.profile?.major || formatMode(ad.mode)} · {relativeDate(ad.createdAt)}</p>
                          </div>
                        </div>
                        <h3 className="line-clamp-2 text-sm font-black text-on-surface">{ad.title}</h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-on-surface-variant">{ad.subjects}</p>
                      </div>
                    ))}
                    {!studyAds.length && <p className="text-sm leading-6 text-on-surface-variant">No study ads yet. Be the first to post one.</p>}
                  </div>
                </div>
              </aside>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
