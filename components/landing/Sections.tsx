import { Bell, CalendarDays, Hash, MessageCircle, Search, Timer, Users, Video } from "lucide-react";
import type { ReactNode } from "react";
import { Badge, ButtonLink, Card, cx, type Tone } from "@/components/ui";

function Section({ id, tone = "paper", children }: { id?: string; tone?: "paper" | "ink"; children: ReactNode }) {
  return (
    <section
      id={id}
      className={cx(
        "scroll-mt-20 border-t-[length:var(--nb-border-width)] border-line",
        tone === "ink" ? "bg-ink text-paper" : "bg-canvas text-fg",
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 md:px-6 lg:py-20">{children}</div>
    </section>
  );
}

function Heading({ children, intro }: { children: ReactNode; intro?: ReactNode }) {
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <h2 className="m-0 font-grotesk text-4xl font-bold tracking-tight sm:text-5xl">{children}</h2>
      {intro && <p className="m-0 font-grotesk text-lg leading-relaxed opacity-90">{intro}</p>}
    </div>
  );
}

const steps = [
  { num: "01", title: "Build your profile", body: "Add your major, semester, interests and when you are free. It takes a couple of minutes.", shadow: "shadow-[8px_8px_0_0_var(--color-match)]" },
  { num: "02", title: "Get matched", body: "See who fits and exactly why, then send a request with a short note.", shadow: "shadow-[8px_8px_0_0_var(--color-chat)]" },
  { num: "03", title: "Study together", body: "Chat, jump on a call, keep notes, and run a focus timer while you work.", shadow: "shadow-[8px_8px_0_0_var(--color-focus)]" },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works" tone="ink">
      <Heading>Three steps to your first session</Heading>
      <ol className="m-0 grid list-none gap-6 p-0 md:grid-cols-3">
        {steps.map((step) => (
          <li key={step.num}>
            <Card shadow="none" className={cx("flex h-full flex-col gap-3 border-paper", step.shadow)}>
              <span className="font-jetbrains text-4xl font-bold">{step.num}</span>
              <h3 className="m-0 font-grotesk text-2xl font-bold">{step.title}</h3>
              <p className="m-0 text-[17px] leading-relaxed">{step.body}</p>
            </Card>
          </li>
        ))}
      </ol>
    </Section>
  );
}

const features: Array<{ title: string; body: string; tone: Tone; icon: ReactNode }> = [
  { title: "Smart matching", body: "Scored on major, interests, availability, college and semester, with the reasons shown.", tone: "match", icon: <Users size={30} /> },
  { title: "Messages in one place", body: "Direct messages, study groups and course channels, with unread counts and file sharing.", tone: "chat", icon: <MessageCircle size={30} /> },
  { title: "Voice and video", body: "Start a call from any chat. Share your screen and keep notes during the call.", tone: "live", icon: <Video size={30} /> },
  { title: "Focus mode", body: "A Pomodoro timer with ambient sound, streaks and study stats.", tone: "focus", icon: <Timer size={30} /> },
  { title: "Events and scheduling", body: "Plan sessions with your group and RSVP to events.", tone: "card", icon: <CalendarDays size={30} /> },
  { title: "Notifications", body: "Get push notifications for messages, match requests and incoming calls.", tone: "card", icon: <Bell size={30} /> },
];

export function Features() {
  return (
    <Section id="features">
      <Heading intro="Everything a study group needs, without juggling five apps.">What you get</Heading>
      <ul className="m-0 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <li key={feature.title}>
            <Card tone={feature.tone} className="flex h-full flex-col gap-3">
              <span aria-hidden="true">{feature.icon}</span>
              <h3 className="m-0 font-grotesk text-2xl font-bold">{feature.title}</h3>
              <p className="m-0 text-[17px] leading-relaxed">{feature.body}</p>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}

const reasons = ["Same major", "Shared interests", "Availability set", "Same college", "Similar semester", "Shared groups and channels"];

export function Matching() {
  return (
    <Section id="matching">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-5">
          <Heading intro="Every match comes with a score and the reasons behind it, so you know who to message first and why.">
            Meet people who actually fit
          </Heading>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="What matching looks at">
            {reasons.map((reason) => (
              <li key={reason}>
                <Badge tone="card">{reason}</Badge>
              </li>
            ))}
          </ul>
          <p className="m-0 max-w-lg text-[17px] leading-relaxed text-fg-muted">
            Not finding the right person? Post a study ad with your subjects and availability and let others come to you.
          </p>
          <ButtonLink href="/register" variant="match" size="lg">
            Find my match
          </ButtonLink>
        </div>
        <Card tone="match" shadow="lg" className="flex flex-col gap-4 lg:rotate-1">
          <div className="flex items-center gap-2 font-bold">
            <Search size={20} aria-hidden="true" /> Suggested for you
          </div>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {[
              { name: "Nadia R.", detail: "Same major · Shared interests", score: 92 },
              { name: "Arif H.", detail: "Availability set · Same college", score: 87 },
              { name: "Maya L.", detail: "Similar semester · Shared groups", score: 81 },
            ].map((person) => (
              <li key={person.name} className="flex items-center gap-3 rounded-nb border-nb bg-card p-3 text-fg">
                <span aria-hidden="true" className="inline-flex size-10 items-center justify-center rounded-full border-nb bg-focus font-bold text-ink">
                  {person.name[0]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{person.name}</span>
                  <span className="block text-sm text-fg-muted">{person.detail}</span>
                </span>
                <span className="font-jetbrains text-xl font-bold">{person.score}%</span>
              </li>
            ))}
          </ul>
          <p className="m-0 text-sm">Example matches. Yours depend on your profile.</p>
        </Card>
      </div>
    </Section>
  );
}

export function Calls() {
  return (
    <Section id="calls" tone="ink">
      <Heading intro="Voice and video rooms for one-to-one sessions or whole groups, with a notepad that saves to the chat when the call ends.">
        Study together, live
      </Heading>
      <div aria-hidden="true" className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="grid grid-cols-2 gap-4">
          {[
            { name: "You", tone: "bg-focus" },
            { name: "Nadia", tone: "bg-match" },
            { name: "Arif", tone: "bg-chat" },
            { name: "Maya", tone: "bg-live" },
          ].map((person) => (
            <div key={person.name} className="relative flex aspect-video items-center justify-center rounded-nb-lg border-2 border-paper bg-quiet-ink">
              <span className={cx("inline-flex size-16 items-center justify-center rounded-full border-2 border-ink text-2xl font-bold text-ink", person.tone)}>
                {person.name[0]}
              </span>
              <span className="absolute bottom-2 left-2 rounded-md bg-paper px-2 py-0.5 text-sm font-bold text-ink">{person.name}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 rounded-nb-lg border-2 border-paper p-5">
          <div className="flex items-center justify-between font-bold">
            Call notes <Badge tone="live" size="sm">Saved to chat</Badge>
          </div>
          <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[15px]">
            <li>Past paper Q3: BFS shortest path</li>
            <li>Dijkstra vs Bellman-Ford</li>
            <li>Arif shares the recursion sketch</li>
          </ul>
        </div>
      </div>
    </Section>
  );
}

export function Communities() {
  return (
    <Section id="communities">
      <Heading intro="Join a study group for your course, or a channel for a topic.">Groups and channels</Heading>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <Users size={28} aria-hidden="true" />
          <h3 className="m-0 font-grotesk text-2xl font-bold">Study groups</h3>
          <p className="m-0 text-[17px] leading-relaxed">Invite classmates, share resources, plan events together and start a group call whenever you need one.</p>
        </Card>
        <Card className="flex flex-col gap-3">
          <Hash size={28} aria-hidden="true" />
          <h3 className="m-0 font-grotesk text-2xl font-bold">Channels</h3>
          <p className="m-0 text-[17px] leading-relaxed">Open spaces with their own tag, like #cse-220, for course questions and topic chat.</p>
        </Card>
      </div>
    </Section>
  );
}

export function FinalCta() {
  return (
    <section className="border-t-[length:var(--nb-border-width)] border-line bg-canvas px-4 py-16 md:px-6 lg:py-20">
      <Card tone="focus" shadow="lg" padding="lg" className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <h2 className="m-0 max-w-2xl font-grotesk text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
          Stop studying alone. Your partner is one request away.
        </h2>
        <ButtonLink href="/register" size="lg">
          Create your account
        </ButtonLink>
      </Card>
    </section>
  );
}
