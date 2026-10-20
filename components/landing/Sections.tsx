import { ArrowRight, Bell, Briefcase, CalendarDays, Flame, Hash, MessageCircle, Timer, Users, Video } from "lucide-react";
import type { ReactNode } from "react";
import { ButtonLink, cx, type Tone } from "@/components/ui";
import { Magnetic } from "@/components/motion/Magnetic";
import { Tilt } from "@/components/motion/Tilt";
import { ChannelChips } from "./ChannelChips";
import { FocusTimerDemo } from "./FocusTimerDemo";
import { JobsShowcase } from "./JobsShowcase";

type SectionTone = "paper" | "ink" | "quiet" | "career";

const sectionTone: Record<SectionTone, string> = {
  paper: "bg-canvas bg-grid text-fg",
  ink: "bg-ink bg-grid-light text-paper",
  quiet: "quiet bg-canvas text-fg",
  career: "bg-career/25 bg-grid text-fg",
};

function Section({ id, tone = "paper", children }: { id?: string; tone?: SectionTone; children: ReactNode }) {
  return (
    <section id={id} className={cx("scroll-mt-20 border-t-[length:var(--nb-border-width)] border-line", sectionTone[tone])}>
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 md:px-6 lg:py-24">{children}</div>
    </section>
  );
}

function Heading({ children, intro, eyebrow }: { children: ReactNode; intro?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      {eyebrow}
      <h2 className="m-0 font-grotesk text-4xl font-bold tracking-tight text-balance sm:text-5xl">{children}</h2>
      {intro && <p className="m-0 font-grotesk text-lg leading-relaxed opacity-90">{intro}</p>}
    </div>
  );
}

export function ChannelStrip() {
  const channels = ["#cse-220", "#calc-2", "#organic-chem", "#data-structures", "#micro-econ", "#ielts-prep", "#physics-101", "#linear-algebra", "#thesis-writing"];
  const dots = ["bg-focus", "bg-match", "bg-chat", "bg-live", "bg-career"];
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="m-0 flex shrink-0 list-none items-center gap-6 px-3 py-4">
      {channels.map((channel, index) => (
        <li key={channel} className="inline-flex items-center gap-6 font-jetbrains text-lg font-bold whitespace-nowrap">
          {channel}
          <span aria-hidden="true" className={cx("size-3 rotate-45 border-2 border-paper", dots[index % dots.length])} />
        </li>
      ))}
    </ul>
  );
  return (
    <div aria-label="Example course channels" role="region" className="group overflow-hidden border-t-[length:var(--nb-border-width)] border-line bg-ink text-paper">
      <div className="flex w-max animate-nb-marquee group-hover:[animation-play-state:paused] motion-reduce:w-auto motion-reduce:flex-wrap">
        {row(false)}
        <span className="contents motion-reduce:hidden">{row(true)}</span>
      </div>
    </div>
  );
}

const steps = [
  { num: "01", title: "Build your profile", body: "Add your major, semester, courses and the hours you're free. It takes about two minutes.", shadow: "shadow-[9px_9px_0_0_var(--color-match)]", dot: "bg-match" },
  { num: "02", title: "Get matched", body: "See who fits and why. Send a request with a short note, or post a study ad and let people find you.", shadow: "shadow-[9px_9px_0_0_var(--color-chat)]", dot: "bg-chat" },
  { num: "03", title: "Study together", body: "Chat, start a call, keep shared notes, and run a focus timer while you work.", shadow: "shadow-[9px_9px_0_0_var(--color-focus)]", dot: "bg-focus" },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works" tone="ink">
      <Heading>From sign-up to your first session in three steps</Heading>
      <ol className="m-0 grid list-none gap-7 p-0 md:grid-cols-3">
        {steps.map((step) => (
          <li key={step.num} className="nb-reveal">
            <div className={cx("flex h-full flex-col gap-3 rounded-nb-lg border-[length:var(--nb-border-width)] border-paper bg-card p-6 text-ink", step.shadow)}>
              <span className={cx("inline-flex size-13 items-center justify-center rounded-full border-nb font-jetbrains text-xl font-bold", step.dot)}>{step.num}</span>
              <h3 className="m-0 font-grotesk text-2xl font-bold">{step.title}</h3>
              <p className="m-0 text-[17px] leading-relaxed">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function Features({ jobsEnabled }: { jobsEnabled: boolean }) {
  const features: Array<{ title: string; body: string; tone: Tone; icon: ReactNode; isNew?: boolean }> = [
    { title: "Smart matching", body: "Scored on major, courses, interests, availability, college and semester, with the reasons shown.", tone: "match", icon: <Users size={30} /> },
    { title: "Messages in one place", body: "Direct messages, study groups and course channels, with unread counts and file sharing.", tone: "chat", icon: <MessageCircle size={30} /> },
    { title: "Voice and video", body: "Start a call from any chat. Share your screen and keep notes that save to the chat.", tone: "live", icon: <Video size={30} /> },
    { title: "Focus mode", body: "A Pomodoro timer with ambient sound, streaks and study stats.", tone: "focus", icon: <Timer size={30} /> },
    { title: "Events and scheduling", body: "Plan sessions with your group, RSVP to events and get a reminder before they start.", tone: "card", icon: <CalendarDays size={30} /> },
    jobsEnabled
      ? { title: "Jobs board", body: "Campus jobs, teaching-assistant roles and internships picked for your major.", tone: "career", icon: <Briefcase size={30} />, isNew: true }
      : { title: "Notifications", body: "Push notifications for messages, match requests and incoming calls.", tone: "card", icon: <Bell size={30} /> },
  ];
  const fills: Record<string, string> = { match: "bg-match", chat: "bg-chat", live: "bg-live", focus: "bg-focus", career: "bg-career", card: "bg-card" };
  return (
    <Section id="features">
      <Heading intro="Everything a study group needs, without juggling five apps.">What you get</Heading>
      <ul className="m-0 grid list-none gap-7 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <li key={feature.title} className="nb-reveal">
            <Tilt className="h-full">
              <div className={cx("flex h-full flex-col gap-3 rounded-nb-lg border-nb p-6 text-ink shadow-[var(--tilt-shadow)]", fills[feature.tone])}>
                <span aria-hidden="true" className="inline-flex size-13 items-center justify-center rounded-xl border-nb bg-card">
                  {feature.icon}
                </span>
                <h3 className="m-0 font-grotesk text-2xl font-bold">
                  {feature.title}
                  {feature.isNew && <span className="ml-2 rounded-md border-2 border-line bg-card px-2 align-middle text-xs tracking-[0.08em] uppercase">New</span>}
                </h3>
                <p className="m-0 text-[17px] leading-relaxed">{feature.body}</p>
              </div>
            </Tilt>
          </li>
        ))}
      </ul>
    </Section>
  );
}

const reasons = ["Same major", "Shared courses", "Free at the same time", "Same college", "Similar semester", "Shared groups and channels"];

export function Matching() {
  return (
    <Section id="matching">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-5">
          <Heading intro="Every match comes with a score and the overlap behind it, so you know who to message first and what to say.">Meet people who actually fit</Heading>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="What matching looks at">
            {reasons.map((reason) => (
              <li key={reason} className="rounded-full border-2 border-line bg-card px-3 py-1 text-sm font-bold">
                {reason}
              </li>
            ))}
          </ul>
          <p className="m-0 max-w-lg text-[17px] leading-relaxed text-fg-muted">
            Not finding the right person? Post a study ad with your subjects and availability and let others come to you.
          </p>
          <Magnetic>
            <ButtonLink href="/register" variant="match" size="lg">
              Find my match
            </ButtonLink>
          </Magnetic>
        </div>
        <div className="nb-reveal">
        <Tilt max={5}>
          <figure className="m-0 rotate-1 rounded-nb-lg border-nb bg-card p-5 shadow-[var(--tilt-shadow)]">
            <svg viewBox="0 0 640 440" className="h-auto w-full" role="img" aria-label="Example: you and Nadia R. share Computer Science, CSE 220 and MAT 215, Tuesday and Thursday evenings, and Algorithms. 92% match.">
              <g className="stroke-ink" strokeWidth={3}>
                <circle cx="236" cy="230" r="180" className="fill-chat" />
                <circle cx="404" cy="230" r="180" className="fill-match" />
                <path d="M320 70.8 A180 180 0 0 1 320 389.2 A180 180 0 0 1 320 70.8 Z" className="fill-focus" />
              </g>
              <g className="fill-ink font-jetbrains" fontWeight={700} fontSize={15} textAnchor="middle">
                <text x="116" y="140">YOU</text>
                <text x="524" y="140">NADIA R.</text>
              </g>
              <g className="fill-ink font-grotesk" fontWeight={500} fontSize={17} textAnchor="middle">
                <text x="138" y="224">Databases</text>
                <text x="138" y="256">Mornings</text>
                <text x="502" y="224">Proofs</text>
                <text x="502" y="256">Night owl</text>
              </g>
              <g className="fill-ink font-grotesk" fontWeight={700} fontSize={15} textAnchor="middle">
                <text x="320" y="200">Computer Science</text>
                <text x="320" y="228">CSE 220 · MAT 215</text>
                <text x="320" y="256">Tue, Thu evenings</text>
                <text x="320" y="284">Algorithms</text>
              </g>
              <g className="animate-nb-float">
                <rect x="286" y="110" width="80" height="42" rx="10" className="fill-ink" />
                <rect x="280" y="104" width="80" height="42" rx="10" className="fill-card stroke-ink" strokeWidth={3} />
                <text x="320" y="132" textAnchor="middle" className="fill-ink font-jetbrains" fontWeight={700} fontSize={20}>
                  92%
                </text>
              </g>
            </svg>
            <figcaption className="mt-2 text-sm font-medium">Example match. Yours depend on your profile.</figcaption>
          </figure>
        </Tilt>
        </div>
      </div>
    </Section>
  );
}

export function Focus() {
  const stats = [
    { value: "6h 40m", label: "Focus this week", icon: <Timer size={18} />, fill: "bg-focus" },
    { value: "9 days", label: "Current streak", icon: <Flame size={18} />, fill: "bg-alert" },
    { value: "14", label: "Sessions with partners", icon: <Users size={18} />, fill: "bg-match" },
  ];
  return (
    <Section id="focus" tone="quiet">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Heading
            eyebrow={<span className="self-start rounded-md border-2 border-line bg-focus px-2.5 py-0.5 text-xs font-bold tracking-[0.08em] text-ink uppercase">Focus mode · quiet by design</span>}
            intro="Focus screens and calls switch to softer edges and calmer colours. Run 25-minute blocks, and notifications wait until your break. Try it here."
          >
            When it&apos;s time to work, the app gets quieter
          </Heading>
          <ul className="m-0 grid list-none grid-cols-1 gap-3.5 p-0 sm:grid-cols-3" aria-label="Example study stats">
            {stats.map((stat) => (
              <li key={stat.label} className="flex flex-col gap-1 rounded-nb border-nb bg-card p-3.5 shadow-nb-sm">
                <span aria-hidden="true" className={cx("inline-flex size-8 items-center justify-center rounded-md border-2 border-line text-ink", stat.fill)}>
                  {stat.icon}
                </span>
                <span className="font-jetbrains text-2xl font-bold">{stat.value}</span>
                <span className="text-sm font-medium">{stat.label}</span>
              </li>
            ))}
          </ul>
          <p className="m-0 text-sm font-medium">Example stats.</p>
        </div>
        <FocusTimerDemo />
      </div>
    </Section>
  );
}

export function Jobs() {
  return (
    <Section id="jobs" tone="career">
      <Heading
        eyebrow={<span className="self-start rounded-md border-2 border-line bg-career px-2.5 py-0.5 text-xs font-bold tracking-[0.08em] text-ink uppercase">New · Jobs board</span>}
        intro="Campus jobs, teaching-assistant roles, research posts and internships, picked for your major. Save the ones you like and see the deadline at a glance."
      >
        Jobs that fit around your classes
      </Heading>
      <JobsShowcase />
      <div>
        <ButtonLink href="/register" variant="career" size="lg">
          Join to browse all jobs
          <ArrowRight size={20} aria-hidden="true" />
        </ButtonLink>
      </div>
    </Section>
  );
}

export function Communities() {
  return (
    <Section id="communities">
      <Heading intro="Start a study group with classmates, or drop into an open channel for a topic.">Groups and channels</Heading>
      <div className="grid gap-7 md:grid-cols-2">
        {[
          { title: "Study groups", body: "Invite classmates, share files, plan events together and start a group call whenever you need one.", icon: <Users size={28} />, fill: "bg-match" },
          { title: "Channels", body: "Open spaces with their own tag, like #cse-220, for course questions and topic chat.", icon: <Hash size={28} />, fill: "bg-chat" },
        ].map((item) => (
          <div key={item.title} className="nb-reveal">
          <Tilt className="h-full">
            <div className="flex h-full flex-col gap-3 rounded-nb-lg border-nb bg-card p-7 shadow-[var(--tilt-shadow)]">
              <span aria-hidden="true" className={cx("inline-flex size-13 items-center justify-center rounded-xl border-nb text-ink", item.fill)}>
                {item.icon}
              </span>
              <h3 className="m-0 font-grotesk text-2xl font-bold">{item.title}</h3>
              <p className="m-0 text-[17px] leading-relaxed">{item.body}</p>
            </div>
          </Tilt>
          </div>
        ))}
      </div>
      <ChannelChips />
    </Section>
  );
}

export function FinalCta() {
  return (
    <section className="border-t-[length:var(--nb-border-width)] border-line bg-canvas bg-grid px-4 py-16 md:px-6 lg:py-24">
      <div className="nb-reveal mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-nb-lg border-nb bg-focus p-8 text-ink shadow-nb-lg md:flex-row md:items-center md:p-12">
        <div className="flex max-w-2xl flex-col gap-3">
          <h2 className="m-0 font-grotesk text-4xl leading-tight font-bold tracking-tight sm:text-5xl">Stop studying alone. Your partner is one request away.</h2>
          <p className="m-0 text-lg">Make a profile, see your matches, and book your first session this week.</p>
        </div>
        <Magnetic>
          <ButtonLink href="/register" size="lg">
            Create your account
            <ArrowRight size={20} aria-hidden="true" />
          </ButtonLink>
        </Magnetic>
      </div>
    </section>
  );
}
