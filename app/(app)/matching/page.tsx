export const runtime = "nodejs";

import { Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppHeader } from "@/components/shell/AppHeader";
import { Avatar, Badge, Button, ButtonLink, Card, CardHeader, EmptyState, Input, Select, StatTile } from "@/components/ui";
import { recommendPeople, splitList } from "@/lib/discovery";
import { prisma } from "@/lib/prisma";
import { PartnerCard } from "./PartnerCard";
import { filterPartners, formatMode, hasActiveFilters, relativeDate, unique, type Partner } from "./partners";

type SearchParams = {
  q?: string;
  major?: string;
  semester?: string;
  skill?: string;
  availability?: string;
  min?: string;
};

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
        include: {
          profile: true,
          groupMemberships: { select: { groupId: true } },
          channelMemberships: { select: { channelId: true } },
        },
      })
    : await prisma.user.findUnique({
        where: { email: session.user.email || "" },
        include: {
          profile: true,
          groupMemberships: { select: { groupId: true } },
          channelMemberships: { select: { channelId: true } },
        },
      });

  if (!user) redirect("/login");

  const [otherUsers, studyAds, suggestedGroups] = await Promise.all([
    prisma.user.findMany({
      where: {
        NOT: { id: user.id },
        blockedBy: { none: { blockerId: user.id } },
        blocks: { none: { blockedId: user.id } },
      },
      include: {
        profile: true,
        groupMemberships: { select: { groupId: true } },
        channelMemberships: { select: { channelId: true } },
      },
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

  const processedPartners: Partner[] = recommendPeople({
    currentUser: user,
    candidates: otherUsers,
    existingMatches,
    query: q,
  })
    .map((otherUser) => {
      const otherInterests = splitList(otherUser.profile?.interests);
      const isAvailable = Boolean(otherUser.profile?.matchingAvailable && otherUser.profile?.availability);

      return {
        id: otherUser.id,
        name: otherUser.name || "Anonymous",
        major: otherUser.profile?.major || "Undecided",
        semester: otherUser.profile?.semester ? `Semester ${otherUser.profile.semester}` : "Semester not set",
        college: otherUser.profile?.college || "College not set",
        image: otherUser.image,
        match: Math.round(otherUser.discoveryScore),
        connectionStatus: otherUser.profile?.id ? statusByProfileId.get(otherUser.profile.id) || null : null,
        skills: otherInterests.length ? otherInterests : ["Study Partner"],
        schedule: otherUser.profile?.availability || "Availability not set",
        reasons: otherUser.discoveryReasons,
        isAvailable,
        bio: otherUser.profile?.bio || "No bio added yet.",
      };
    })
    .sort((a, b) => b.match - a.match || Number(b.isAvailable) - Number(a.isAvailable));

  const filters = { q, major, semester, skill, availability, minMatch };
  const filteredPartners = filterPartners(processedPartners, filters);

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

  const strongMatches = processedPartners.filter((partner) => partner.match >= 85).length;
  const filtersActive = hasActiveFilters(filters);

  return (
    <div className="min-h-dvh bg-canvas font-grotesk text-fg">
      <AppHeader />

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 pb-28 md:px-8 md:pb-10">
        <section aria-labelledby="matching-title" className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-2">
            <h1 id="matching-title" className="m-0 text-4xl leading-[1.05] font-bold tracking-tight md:text-5xl">
              Find partners
            </h1>
            <p className="m-0 text-lg text-fg-muted">Browse classmates by match strength, shared interests and schedule fit.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/matching/post-ad" variant="match" size="lg" icon={<Plus size={20} />}>
              Post a study ad
            </ButtonLink>
            <ButtonLink href="#matches" variant="secondary" size="lg" icon={<Search size={20} />}>
              Browse matches
            </ButtonLink>
          </div>
        </section>

        <Card as="form" action="/matching" role="search" aria-label="Filter partners" padding="sm">
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-[minmax(220px,1.4fr)_repeat(5,minmax(0,1fr))_auto]">
            <Input id="f-q" name="q" type="search" label="Filter by keyword" labelHidden defaultValue={q} placeholder="Search name, major or skill" className="sm:col-span-2 2xl:col-span-1" />
            <Select id="f-major" name="major" label="Department" labelHidden defaultValue={major || "all"}>
              <option value="all">Department</option>
              {majorOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            <Select id="f-semester" name="semester" label="Semester" labelHidden defaultValue={semester || "all"}>
              <option value="all">Semester</option>
              {semesterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            <Select id="f-skill" name="skill" label="Skill" labelHidden defaultValue={skill || "all"}>
              <option value="all">Skills</option>
              {skillOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            <Select id="f-availability" name="availability" label="Availability" labelHidden defaultValue={availability || "all"}>
              <option value="all">Availability</option>
              <option value="available">Open to match</option>
              <option value="with-schedule">Has schedule</option>
            </Select>
            <Select id="f-min" name="min" label="Minimum match" labelHidden defaultValue={String(minMatch || 0)}>
              <option value="0">Match %</option>
              <option value="70">70%+</option>
              <option value="80">80%+</option>
              <option value="90">90%+</option>
            </Select>
            <Button type="submit" size="md" className="sm:col-span-2 2xl:col-span-1">
              Apply
            </Button>
          </div>
        </Card>

        <section aria-label="Overview" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Students" value={processedPartners.length.toLocaleString()} icon={<Users size={20} />} />
          <StatTile label="Open to match" value={onlinePartners.length} detail="Marked available" tone="live" />
          <StatTile label="Strong matches" value={strongMatches} detail="85% or higher" tone="match" />
          <StatTile label="Requests" value={pendingRequests} detail="Waiting for you" tone="focus" />
        </section>

        <section id="matches" className="grid scroll-mt-24 gap-8 xl:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="m-0 text-2xl font-bold">Your matches</h2>
                <p className="m-0 text-fg-muted" aria-live="polite">
                  {filteredPartners.length} student{filteredPartners.length === 1 ? "" : "s"} match{filteredPartners.length === 1 ? "es" : ""} your filters.
                </p>
              </div>
              {filtersActive && (
                <ButtonLink href="/matching" variant="secondary" size="sm">
                  Clear filters
                </ButtonLink>
              )}
            </div>

            {filteredPartners.length ? (
              <ul className="m-0 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2 2xl:grid-cols-3">
                {filteredPartners.map((partner) => (
                  <li key={partner.id}>
                    <PartnerCard partner={partner} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No matching peers found"
                description="Try fewer filters, or post a study ad so interested classmates can find you."
                action={
                  <div className="flex flex-wrap justify-center gap-3">
                    <ButtonLink href="/matching" variant="secondary">
                      Clear filters
                    </ButtonLink>
                    <ButtonLink href="/matching/post-ad" variant="match">
                      Post a study ad
                    </ButtonLink>
                  </div>
                }
              />
            )}
          </div>

          <aside aria-label="Matching extras" className="flex flex-col gap-6">
            <Card padding="none">
              <CardHeader title="Open to match" tone="live" />
              <div className="p-4">
                {onlinePartners.length ? (
                  <ul className="m-0 flex list-none flex-col gap-1 p-0">
                    {onlinePartners.map((partner) => (
                      <li key={partner.id}>
                        <Link href={`/chat/personal?id=${partner.id}`} className="nb-focus flex items-center gap-3 rounded-nb p-2 text-fg no-underline hover:bg-canvas">
                          <Avatar name={partner.name} src={partner.image} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate font-bold">{partner.name}</span>
                            <span className="block truncate text-sm text-fg-muted">{partner.major}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="m-0 text-fg-muted">No students are marked available right now.</p>
                )}
              </div>
            </Card>

            <Card padding="none">
              <CardHeader title="Trending skills" tone="match" />
              <div className="p-4">
                {trendingSkills.length ? (
                  <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                    {trendingSkills.map((item) => (
                      <li key={item}>
                        <Link
                          href={`/matching?skill=${encodeURIComponent(item)}`}
                          className="nb-focus inline-flex min-h-9 items-center rounded-full border-2 border-line bg-card px-3 text-sm font-bold text-fg no-underline hover:bg-focus"
                        >
                          #{item.replace(/\s+/g, "")}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="m-0 text-fg-muted">Skills appear here as profiles add interests.</p>
                )}
              </div>
            </Card>

            <Card padding="none">
              <CardHeader title="Suggested groups" tone="chat" />
              {suggestedGroups.length ? (
                <ul className="m-0 flex list-none flex-col p-0">
                  {suggestedGroups.map((group) => (
                    <li key={group.id} className="border-b-2 border-line last:border-b-0">
                      <Link href={`/groups/${group.id}`} className="nb-focus flex items-center justify-between gap-3 px-4 py-3 text-fg no-underline hover:bg-canvas">
                        <span className="min-w-0">
                          <span className="block truncate font-bold">{group.name}</span>
                          <span className="block truncate text-sm text-fg-muted">{group.subject || "Study group"}</span>
                        </span>
                        <Badge size="sm">
                          {group._count.members}
                          <span className="sr-only"> members</span>
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="m-0 p-4 text-fg-muted">No groups have been created yet.</p>
              )}
            </Card>

            <Card padding="none">
              <CardHeader
                title="Study ads"
                tone="focus"
                action={
                  <ButtonLink href="/matching/post-ad" variant="secondary" size="sm">
                    Post
                  </ButtonLink>
                }
              />
              {studyAds.length ? (
                <ul className="m-0 flex list-none flex-col p-0">
                  {studyAds.map((ad) => (
                    <li key={ad.id} className="flex flex-col gap-2 border-b-2 border-line p-4 last:border-b-0">
                      <div className="flex items-center gap-2">
                        <Avatar name={ad.user.name} src={ad.user.image} size="sm" />
                        <div className="min-w-0">
                          <p className="m-0 truncate text-sm font-bold">{ad.user.name || "Student"}</p>
                          <p className="m-0 truncate text-xs text-fg-muted">
                            {ad.user.profile?.major || formatMode(ad.mode)} · {relativeDate(ad.createdAt)}
                          </p>
                        </div>
                      </div>
                      <h3 className="m-0 line-clamp-2 text-base font-bold">{ad.title}</h3>
                      <p className="m-0 line-clamp-2 text-sm text-fg-muted">{ad.subjects}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="m-0 p-4 text-fg-muted">No study ads yet. Be the first to post one.</p>
              )}
            </Card>
          </aside>
        </section>
      </main>
    </div>
  );
}
