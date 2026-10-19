export const runtime = "nodejs";

import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ConnectButton from "@/app/(app)/matching/ConnectButton";
import { AppHeader } from "@/components/shell/AppHeader";
import { Avatar, Badge, ButtonLink, Card } from "@/components/ui";
import { prisma } from "@/lib/prisma";

function splitList(value?: string | null) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatSemester(value?: number | null) {
  return value ? `Semester ${value}` : "Semester not set";
}

export default async function PublicUserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  if (id === session.user.id) redirect("/profile");

  const [viewer, target, blocked] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
        groupMemberships: { select: { groupId: true } },
        channelMemberships: { select: { channelId: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        groupMemberships: { select: { groupId: true } },
        channelMemberships: { select: { channelId: true } },
      },
    }),
    prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: session.user.id, blockedId: id },
          { blockerId: id, blockedId: session.user.id },
        ],
      },
      select: { id: true },
    }),
  ]);

  if (!viewer) redirect("/login");
  if (!target || blocked) redirect("/matching");

  const match = viewer.profile && target.profile
    ? await prisma.match.findFirst({
        where: {
          OR: [
            { profileId: viewer.profile.id, matchedProfileId: target.profile.id },
            { profileId: target.profile.id, matchedProfileId: viewer.profile.id },
          ],
        },
      })
    : null;

  const viewerGroups = new Set(viewer.groupMemberships.map((membership) => membership.groupId));
  const viewerChannels = new Set(viewer.channelMemberships.map((membership) => membership.channelId));
  const sharedGroups = target.groupMemberships.filter((membership) => viewerGroups.has(membership.groupId)).length;
  const sharedChannels = target.channelMemberships.filter((membership) => viewerChannels.has(membership.channelId)).length;
  const interests = splitList(target.profile?.interests);
  const status = match?.status || null;

  return (
    <div className="min-h-dvh bg-canvas font-grotesk text-fg">
      <AppHeader
        actions={
          <ButtonLink href="/matching" variant="secondary" icon={<ArrowLeft size={18} />}>
            Matching
          </ButtonLink>
        }
      />

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 pb-28 md:px-8 md:pb-12">
        <Card as="section" tone="match" shadow="lg" padding="lg" aria-labelledby="profile-name">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-5">
              <Avatar name={target.name} src={target.image} size="xl" />
              <div className="min-w-0">
                <h1 id="profile-name" className="m-0 truncate text-4xl leading-tight font-bold tracking-tight md:text-5xl">
                  {target.name || "Anonymous"}
                </h1>
                <p className="m-0 mt-1 text-lg font-bold">{target.profile?.major || "Undecided"}</p>
                <p className="m-0 text-[15px]">
                  {target.profile?.college || "College not set"} · {formatSemester(target.profile?.semester)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {status === "ACCEPTED" && (
                <ButtonLink href={`/chat/personal?id=${target.id}`} variant="chat" size="lg">
                  Message
                </ButtonLink>
              )}
              <ConnectButton partnerId={target.id} partnerName={target.name || undefined} buttonText="Connect" initialStatus={status} />
            </div>
          </div>
        </Card>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <Card as="section" aria-labelledby="about-title" className="flex flex-col gap-6">
            <div>
              <h2 id="about-title" className="m-0 mb-2 text-2xl font-bold">
                About
              </h2>
              <p className="m-0 text-[17px] leading-relaxed text-fg-muted">{target.profile?.bio || "No bio added yet."}</p>
            </div>
            <div>
              <h3 className="m-0 mb-3 text-sm font-bold tracking-[0.08em] uppercase">Interests</h3>
              {interests.length ? (
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                  {interests.map((interest) => (
                    <li key={interest}>
                      <Badge>{interest}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="m-0 text-fg-muted">No interests added yet.</p>
              )}
            </div>
          </Card>

          <aside aria-label="Details" className="flex flex-col gap-5">
            <Card tone="focus" padding="sm">
              <h2 className="m-0 mb-2 text-sm font-bold tracking-[0.08em] uppercase">Availability</h2>
              <p className="m-0">{target.profile?.availability || "Availability not set"}</p>
            </Card>
            <Card padding="sm">
              <h2 className="m-0 mb-3 text-sm font-bold tracking-[0.08em] uppercase">Shared spaces</h2>
              <dl className="m-0 grid grid-cols-2 gap-3">
                <div className="rounded-nb border-2 border-line bg-canvas p-3">
                  <dd className="m-0 font-jetbrains text-3xl font-bold">{sharedGroups}</dd>
                  <dt className="text-xs font-bold tracking-[0.08em] uppercase text-fg-muted">Groups</dt>
                </div>
                <div className="rounded-nb border-2 border-line bg-canvas p-3">
                  <dd className="m-0 font-jetbrains text-3xl font-bold">{sharedChannels}</dd>
                  <dt className="text-xs font-bold tracking-[0.08em] uppercase text-fg-muted">Channels</dt>
                </div>
              </dl>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
