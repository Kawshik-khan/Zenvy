import React from "react";
export const runtime = "nodejs";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CreateChannelModal from "@/app/components/CreateChannelModal";
import JoinChannelButton from "@/app/components/JoinChannelButton";
import { Plus } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/shell/AppHeader";
import { AvatarStack, Badge, Button, ButtonLink, Card, EmptyState, Input, Select } from "@/components/ui";
import { recommendChannels } from "@/lib/discovery";

type ChannelSearchParams = {
  q?: string;
  membership?: string;
};

export default async function ChannelsPage(props: { searchParams?: Promise<ChannelSearchParams> }) {
  const searchParams = (await props.searchParams) || {};
  const query = searchParams.q || "";
  const membership = searchParams.membership || "all";
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });

  if (!user) return redirect("/login");

  const channels = await prisma.channel.findMany({
    include: {
      members: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      creator: { select: { id: true, name: true, image: true } },
      messages: { select: { createdAt: true }, take: 1, orderBy: { createdAt: "desc" } },
      _count: { select: { members: true, messages: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rankedChannels = recommendChannels({
    currentUser: user,
    channels,
    query,
  }).filter((channel) => {
    const isMember = channel.members.some((member) => member.userId === user.id);
    if (membership === "joined") return isMember;
    if (membership === "new") return !isMember;
    return true;
  });

  const recommendedChannels = rankedChannels
    .filter((channel) => !channel.members.some((member) => member.userId === user.id))
    .slice(0, 3);

  const serializedChannels = rankedChannels.map((channel) => ({
    id: channel.id,
    name: channel.name,
    tag: channel.tag,
    description: channel.description,
    creatorId: channel.creatorId,
    creatorName: channel.creator.name || "Unknown",
    creatorImage: channel.creator.image,
    memberCount: channel._count.members,
    messageCount: channel._count.messages,
    isMember: channel.members.some((member) => member.userId === user.id),
    isCreator: channel.creatorId === user.id,
    members: channel.members.slice(0, 4).map((member) => ({
      id: member.user.id,
      name: member.user.name || "Anonymous",
      image: member.user.image,
    })),
    createdAt: channel.createdAt.toISOString(),
    discoveryReasons: channel.discoveryReasons,
  }));

  const filtersActive = Boolean(query || membership !== "all");

  return (
    <div className="min-h-dvh bg-canvas font-grotesk text-fg">
      <AppHeader />

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 pb-28 md:px-8 md:pb-10">
        <section aria-labelledby="channels-title" className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-2">
            <h1 id="channels-title" className="m-0 text-4xl leading-[1.05] font-bold tracking-tight md:text-5xl">
              Channels
            </h1>
            <p className="m-0 text-lg text-fg-muted">Public topic spaces you find by tag. Members can message and share files.</p>
          </div>
          <CreateChannelModal>
            <Button variant="chat" size="lg" icon={<Plus size={20} />}>
              Create channel
            </Button>
          </CreateChannelModal>
        </section>

        <Card as="form" action="/channels" role="search" aria-label="Filter channels" padding="sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,2fr)_1fr_auto]">
            <Input id="c-q" name="q" type="search" label="Search channels" labelHidden defaultValue={query} placeholder="Search #tag, channel name or description" className="sm:col-span-2 lg:col-span-1" />
            <Select id="c-membership" name="membership" label="Membership" labelHidden defaultValue={membership}>
              <option value="all">All channels</option>
              <option value="new">Not joined</option>
              <option value="joined">Joined</option>
            </Select>
            <Button type="submit" className="sm:col-span-2 lg:col-span-1">
              Search
            </Button>
          </div>
          {filtersActive && (
            <div className="mt-3">
              <ButtonLink href="/channels" variant="secondary" size="sm">
                Clear filters
              </ButtonLink>
            </div>
          )}
        </Card>

        {recommendedChannels.length > 0 && !query && (
          <section aria-labelledby="recommended-channels" className="flex flex-col gap-4">
            <h2 id="recommended-channels" className="m-0 text-2xl font-bold">
              Channels you may want to join
            </h2>
            <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-3">
              {recommendedChannels.map((channel) => (
                <li key={channel.id} className="flex">
                  <Card as={Link} href={`/channels/${channel.id}`} interactive tone="chat" shadow="md" className="flex w-full flex-col gap-2 text-ink no-underline">
                    <span className="font-jetbrains text-sm font-bold">#{channel.tag}</span>
                    <h3 className="m-0 truncate text-lg font-bold">{channel.name}</h3>
                    <p className="m-0 line-clamp-2 text-[15px]">{channel.discoveryReasons.join(" - ")}</p>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="all-channels" className="flex flex-col gap-5">
          <h2 id="all-channels" className="m-0 text-2xl font-bold">
            {filtersActive ? `${serializedChannels.length} result${serializedChannels.length === 1 ? "" : "s"}` : "All channels"}
          </h2>

          <ul className="m-0 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2 xl:grid-cols-3">
            {serializedChannels.map((channel) => (
              <li key={channel.id} className="flex">
                <Card as="article" shadow="md" className="flex w-full flex-col gap-5">
                  <div className="flex items-start justify-between gap-3">
                    <Badge tone="chat" size="sm" className="font-jetbrains">
                      #{channel.tag}
                    </Badge>
                    <span className="text-sm font-bold text-fg-muted">
                      {channel.memberCount} {channel.memberCount === 1 ? "member" : "members"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <h3 className="m-0 text-xl leading-tight font-bold">{channel.name}</h3>
                    <p className="m-0 line-clamp-2 text-[15px] text-fg-muted">{channel.description || "A channel for open discussion."}</p>
                    <p className="m-0 text-sm text-fg-muted">
                      {channel.messageCount} {channel.messageCount === 1 ? "message" : "messages"} · by {channel.creatorName}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3 border-t-2 border-line pt-4">
                    <AvatarStack people={channel.members} max={4} size="sm" />
                    <div className="flex items-center gap-2">
                      {channel.isMember && (
                        <ButtonLink href={`/channels/${channel.id}`} variant="chat" size="sm">
                          Open
                        </ButtonLink>
                      )}
                      <JoinChannelButton channelId={channel.id} isMember={channel.isMember} isCreator={channel.isCreator} channelName={channel.name} />
                    </div>
                  </div>
                </Card>
              </li>
            ))}

            {serializedChannels.length === 0 && (
              <li className="col-span-full">
                <EmptyState title="No channels found" description="Try another tag, or create a new public channel." />
              </li>
            )}

            <li className="flex">
              <CreateChannelModal>
                <button
                  type="button"
                  className="nb-focus nb-press flex min-h-[260px] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-nb-lg border-nb border-dashed bg-canvas p-8 text-center text-fg shadow-nb"
                >
                  <span aria-hidden="true" className="inline-flex size-14 items-center justify-center rounded-full border-nb bg-chat text-ink">
                    <Plus size={26} />
                  </span>
                  <span className="font-grotesk text-lg font-bold">Create a channel</span>
                  <span className="text-[15px] text-fg-muted">Start a public channel with a unique searchable tag.</span>
                </button>
              </CreateChannelModal>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
