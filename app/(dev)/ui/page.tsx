import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Bell, Briefcase, Check, MessageCircle, Play, Plus, Search, Timer, Video } from "lucide-react";
import {
  Avatar,
  AvatarStack,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardHeader,
  Checkbox,
  Chip,
  EmptyState,
  IconButton,
  Input,
  palette,
  ProgressBar,
  Select,
  StatTile,
  Textarea,
} from "@/components/ui";
import { isEnabled } from "@/lib/flags";
import { InteractiveDemos } from "./InteractiveDemos";

export const metadata: Metadata = {
  title: "UI gallery · Zenvy",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const swatches: Array<{ name: keyof typeof palette; meaning: string }> = [
  { name: "paper", meaning: "Ground" },
  { name: "ink", meaning: "Text, edges, shadows" },
  { name: "match", meaning: "People, matching" },
  { name: "chat", meaning: "Messages" },
  { name: "focus", meaning: "Timers, streaks" },
  { name: "live", meaning: "Online, calls, success" },
  { name: "alert", meaning: "Errors, leave, deadlines" },
  { name: "career", meaning: "Jobs" },
];

const people = [{ name: "Nadia Rahman" }, { name: "Arif Hasan" }, { name: "Maya Lee" }, { name: "Samir Khan" }, { name: "Tania Jahan" }];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="m-0 font-grotesk text-3xl font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export default function UiGalleryPage() {
  if (process.env.NODE_ENV === "production" && !isEnabled("uiGallery")) notFound();

  return (
    <main className="min-h-screen bg-canvas font-grotesk text-fg">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-12 md:px-6">
        <header className="flex flex-col gap-2">
          <span className="font-jetbrains text-sm font-bold tracking-[0.1em]">ZENVY BRUTAL · COMPONENTS</span>
          <h1 className="m-0 text-5xl font-bold tracking-tight md:text-6xl">UI gallery</h1>
          <p className="m-0 max-w-2xl text-lg text-fg-muted">
            Every shared component in <code className="font-jetbrains">components/ui</code>, in each state. Loud volume by default; the last
            section shows the quiet volume used by focus and calls.
          </p>
        </header>

        <Section title="Colour">
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {swatches.map(({ name, meaning }) => (
              <Card key={name} padding="none" shadow="sm">
                <div className="h-20 border-b-[length:var(--nb-border-width)] border-line" style={{ background: palette[name] }} />
                <div className="p-3">
                  <div className="font-bold capitalize">{name}</div>
                  <div className="font-jetbrains text-xs">{palette[name]}</div>
                  <div className="text-sm text-fg-muted">{meaning}</div>
                </div>
              </Card>
            ))}
          </div>
        </Section>

        <Section title="Type">
          <Card className="flex flex-col gap-3">
            <div className="text-6xl leading-none font-bold tracking-tight">Display</div>
            <div className="text-3xl font-bold tracking-tight">Heading</div>
            <div className="text-xl font-bold">Title</div>
            <p className="m-0 text-base leading-relaxed">Body text in Space Grotesk. Numbers, timers and scores use JetBrains Mono.</p>
            <div className="font-jetbrains text-4xl font-bold">25:00 · 92%</div>
          </Card>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-4">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="match" icon={<Plus size={18} />}>
              Connect
            </Button>
            <Button variant="chat">Message</Button>
            <Button variant="focus" icon={<Play size={18} />}>
              Start focus
            </Button>
            <Button variant="live">Join call</Button>
            <Button variant="career" icon={<Briefcase size={18} />}>
              Apply
            </Button>
            <Button variant="danger">Leave call</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button loading>Saving</Button>
            <Button disabled>Disabled</Button>
            <ButtonLink href="/ui" variant="secondary" icon={<ArrowRight size={18} />}>
              Link as button
            </ButtonLink>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <IconButton label="Notifications" icon={<Bell size={20} />} />
            <IconButton label="Start video call" variant="live" icon={<Video size={20} />} />
            <IconButton label="Open messages" variant="chat" icon={<MessageCircle size={20} />} />
            <IconButton label="Search" size="sm" icon={<Search size={18} />} />
          </div>
        </Section>

        <Section title="Form controls">
          <Card className="grid gap-6 md:grid-cols-2">
            <Input id="g-email" label="Student email" type="email" placeholder="you@university.edu" hint="We send a verification link." />
            <Input id="g-name" label="Display name" defaultValue="K" error="Use at least 2 characters." />
            <Select id="g-mode" label="Work mode" defaultValue="hybrid">
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </Select>
            <Input id="g-disabled" label="Disabled" disabled defaultValue="Read only" />
            <Textarea id="g-bio" label="Bio" placeholder="What are you studying?" className="md:col-span-2" />
            <Checkbox id="g-terms" label="I confirm applicants will never be asked to pay a fee." className="md:col-span-2" />
          </Card>
        </Section>

        <Section title="Badges and chips">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="match">Match request</Badge>
            <Badge tone="chat">3 unread</Badge>
            <Badge tone="live">Live</Badge>
            <Badge tone="focus">7-day streak</Badge>
            <Badge tone="career" shape="label">
              Internship
            </Badge>
            <Badge tone="alert" shape="label">
              Closes in 3 days
            </Badge>
            <Badge size="sm">React</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Example filters">
            <Chip selected>For you</Chip>
            <Chip>Internships</Chip>
            <Chip>Part-time</Chip>
            <Chip selected tone="career">
              Remote
            </Chip>
          </div>
        </Section>

        <Section title="Avatars">
          <div className="flex flex-wrap items-center gap-5">
            <Avatar name="Nadia Rahman" size="sm" />
            <Avatar name="Arif Hasan" presence="online" />
            <Avatar name="Maya Lee" size="lg" presence="offline" />
            <Avatar name="OS study group" shape="square" size="lg" />
            <Avatar name="Kawshik Khan" size="xl" tone="match" />
            <AvatarStack people={people} />
          </div>
        </Section>

        <Section title="Cards and data">
          <div className="grid gap-6 md:grid-cols-4">
            <StatTile label="Streak" value="7 days" tone="focus" icon={<Timer size={20} />}>
              <ProgressBar label="Days this week" value={6} max={7} tone="ink" />
            </StatTile>
            <StatTile label="Focused this week" value="11h 20m" detail="Goal 15h">
              <ProgressBar label="Weekly focus goal" value={75} />
            </StatTile>
            <StatTile label="Unread" value="5" tone="chat" />
            <StatTile label="Partners online" value={<AvatarStack people={people.slice(0, 3)} size="sm" />} tone="live" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Card padding="none">
              <CardHeader title="Suggested partners" tone="match" action={<ButtonLink href="/ui" variant="secondary" size="sm">See all</ButtonLink>} />
              <ul className="m-0 list-none p-0">
                {people.slice(0, 3).map((person, index) => (
                  <li key={person.name} className="flex items-center gap-3 border-b-2 border-line px-5 py-4 last:border-b-0">
                    <Avatar name={person.name} />
                    <div className="flex-1">
                      <div className="font-bold">{person.name}</div>
                      <div className="text-sm text-fg-muted">CS · Data Structures</div>
                    </div>
                    <span className="font-jetbrains font-bold">{92 - index * 5}%</span>
                    <Button size="sm" variant="match">
                      Connect
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
            <EmptyState
              icon={<Check size={26} />}
              title="No upcoming sessions"
              description="Book a session with a partner and it will show up here."
              action={<Button variant="focus">Schedule a session</Button>}
            />
          </div>
        </Section>

        <InteractiveDemos />

        <section className="quiet flex flex-col gap-5 rounded-nb-lg border-nb bg-canvas p-6 md:p-8">
          <h2 className="m-0 font-grotesk text-3xl font-bold tracking-tight">Quiet volume</h2>
          <p className="m-0 text-fg-muted">
            Wrap a screen in <code className="font-jetbrains">.quiet</code>: muted ground, 2px edges, smaller shadows. Same components.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button>Start</Button>
            <Button variant="secondary">Reset</Button>
            <Button variant="focus">Lo-fi</Button>
            <Chip selected>Focus</Chip>
            <Chip>Short break</Chip>
          </div>
          <Card className="flex flex-col items-center gap-4">
            <span className="font-jetbrains text-7xl font-bold tracking-tight">18:42</span>
            <ProgressBar label="Focus round progress" value={38} className="max-w-md" />
          </Card>
        </section>
      </div>
    </main>
  );
}
