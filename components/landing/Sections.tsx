import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { ButtonLink, cx } from "@/components/ui";
import { ChannelChips } from "./ChannelChips";
import { FocusTimerDemo } from "./FocusTimerDemo";
import { JobsShowcase } from "./JobsShowcase";

type SectionTone = "paper" | "ink" | "quiet" | "career";

const sectionTone: Record<SectionTone, string> = {
  paper: "bg-canvas text-fg",
  ink: "bg-ink text-paper",
  quiet: "quiet bg-canvas text-fg",
  career: "bg-career/20 text-fg",
};

function Section({ id, tone = "paper", children }: { id?: string; tone?: SectionTone; children: ReactNode }) {
  return (
    <section id={id} className={cx("scroll-mt-20 border-t-[length:var(--nb-border-width)] border-line", sectionTone[tone])}>
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-20 md:px-6 lg:py-28">{children}</div>
    </section>
  );
}

function Heading({ children, intro, kicker }: { children: ReactNode; intro?: ReactNode; kicker?: string }) {
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      {kicker && <p className="m-0 font-jetbrains text-xs font-bold tracking-[0.14em] uppercase opacity-70">{kicker}</p>}
      <h2 className="m-0 font-grotesk text-4xl leading-[0.98] font-semibold tracking-[-0.035em] text-balance sm:text-[3.4rem]">{children}</h2>
      {intro && <p className="m-0 max-w-[52ch] text-lg leading-relaxed opacity-80">{intro}</p>}
    </div>
  );
}

const log = [
  { time: "Mon 21:10", title: "Make a profile", body: "Major, semester, courses and the hours you're free. It takes about two minutes." },
  { time: "Mon 21:13", title: "See who fits, and why", body: "Matches arrive scored, with the overlap listed. Send a request with a short note, or post a study ad and let people find you." },
  { time: "Tue 18:00", title: "Study together", body: "Chat, start a call, keep shared notes, and run a focus timer while you work." },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works" tone="ink">
      <Heading intro="A typical first week, give or take a few minutes.">From sign-up to your first session</Heading>
      <ol className="m-0 list-none p-0">
        {log.map((entry) => (
          <li key={entry.time} className="grid gap-2 border-t border-paper/25 py-7 sm:grid-cols-[10rem_1fr] lg:grid-cols-[10rem_1fr_1.3fr] lg:gap-10">
            <span className="font-jetbrains text-sm font-bold text-focus">{entry.time}</span>
            <h3 className="m-0 text-2xl font-semibold tracking-tight">{entry.title}</h3>
            <p className="m-0 text-[17px] leading-relaxed text-paper/75 sm:col-start-2 lg:col-start-3">{entry.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function Features({ jobsEnabled }: { jobsEnabled: boolean }) {
  const features: Array<{ title: string; body: string; swatch: string; isNew?: boolean }> = [
    { title: "Matching", body: "Scored on major, courses, interests, availability, college and semester, with the reasons shown.", swatch: "bg-match" },
    { title: "Messages", body: "Direct messages, study groups and course channels, with unread counts and file sharing.", swatch: "bg-chat" },
    { title: "Voice and video", body: "Start a call from any chat. Share your screen and keep notes that save to the chat.", swatch: "bg-live" },
    { title: "Focus mode", body: "A Pomodoro timer with ambient sound, streaks and study stats.", swatch: "bg-focus" },
    { title: "Events", body: "Plan sessions with your group, RSVP to events and get a reminder before they start.", swatch: "bg-alert" },
    jobsEnabled
      ? { title: "Jobs board", body: "Campus jobs, teaching-assistant roles and internships picked for your major.", swatch: "bg-career", isNew: true }
      : { title: "Notifications", body: "Push notifications for messages, match requests and incoming calls.", swatch: "bg-career" },
  ];
  return (
    <Section id="features">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Heading intro="Everything a study group needs, without juggling five apps.">What you get</Heading>
        </div>
        <dl className="m-0 border-b-2 border-line">
          {features.map((feature) => (
            <div key={feature.title} className="grid gap-2 border-t-2 border-line py-6 sm:grid-cols-[13rem_1fr] sm:gap-8">
              <dt className="flex items-center gap-3 text-xl font-semibold tracking-tight">
                <span aria-hidden="true" className={cx("size-3 shrink-0 rounded-full border-2 border-line", feature.swatch)} />
                {feature.title}
                {feature.isNew && <span className="rounded-md border-2 border-line bg-career px-1.5 font-jetbrains text-[11px] font-bold tracking-[0.08em] uppercase">New</span>}
              </dt>
              <dd className="m-0 text-[17px] leading-relaxed text-fg-muted">{feature.body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}

const reasons = ["Same major", "Shared courses", "Free at the same time", "Same college", "Similar semester", "Shared groups and channels"];

export function Matching() {
  return (
    <Section id="matching">
      <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
        <figure className="m-0 lg:order-1">
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
            <g>
              <rect x="280" y="104" width="80" height="42" rx="10" className="fill-card stroke-ink" strokeWidth={3} />
              <text x="320" y="132" textAnchor="middle" className="fill-ink font-jetbrains" fontWeight={700} fontSize={20}>
                92%
              </text>
            </g>
          </svg>
          <ul aria-hidden="true" className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0 sm:hidden">
            {["Computer Science", "CSE 220 · MAT 215", "Tue, Thu evenings", "Algorithms"].map((item) => (
              <li key={item} className="rounded-full border-2 border-line bg-focus px-2.5 text-sm font-bold">
                {item}
              </li>
            ))}
          </ul>
          <figcaption className="mt-3 font-jetbrains text-xs text-fg-muted">Example match. Yours depend on your profile.</figcaption>
        </figure>
        <div className="flex flex-col items-start gap-7">
          <Heading intro="Every match comes with a score and the overlap behind it, so you know who to message first and what to say.">
            Meet people who actually fit
          </Heading>
          <ul className="m-0 grid w-full list-none grid-cols-1 p-0 font-jetbrains text-sm sm:grid-cols-2" aria-label="What matching looks at">
            {reasons.map((reason) => (
              <li key={reason} className="border-t border-line/25 py-2.5">
                {reason}
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
      </div>
    </Section>
  );
}

export function Focus() {
  const stats = [
    { value: "6h 40m", label: "Focus this week" },
    { value: "9 days", label: "Current streak" },
    { value: "14", label: "Sessions with partners" },
  ];
  return (
    <Section id="focus" tone="quiet">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <div className="flex flex-col gap-8">
          <Heading
            kicker="Focus mode"
            intro="Focus screens and calls switch to softer edges and calmer colours. Run 25-minute blocks, and notifications wait until your break. Try it here."
          >
            When it&apos;s time to work, the app gets quieter
          </Heading>
          <div>
            <dl className="m-0 grid grid-cols-3 divide-x-2 divide-line border-y-2 border-line" aria-label="Example study stats">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col-reverse gap-1 px-3 py-4 first:pl-0">
                  <dt className="text-sm text-fg-muted">{stat.label}</dt>
                  <dd className="m-0 font-jetbrains text-2xl font-bold tabular-nums sm:text-3xl">{stat.value}</dd>
                </div>
              ))}
            </dl>
            <p className="m-0 mt-2 font-jetbrains text-xs text-fg-muted">Example stats.</p>
          </div>
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
        kicker="New · Jobs board"
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
      <div className="grid gap-x-12 md:grid-cols-2">
        {[
          { title: "Study groups", body: "Invite classmates, share files, plan events together and start a group call whenever you need one." },
          { title: "Channels", body: "Open spaces with their own tag, like #cse-220, for course questions and topic chat." },
        ].map((item) => (
          <div key={item.title} className="flex flex-col gap-2 border-t-2 border-line py-6">
            <h3 className="m-0 text-2xl font-semibold tracking-tight">{item.title}</h3>
            <p className="m-0 text-[17px] leading-relaxed text-fg-muted">{item.body}</p>
          </div>
        ))}
      </div>
      <ChannelChips />
    </Section>
  );
}

export function FinalCta() {
  return (
    <section className="border-t-[length:var(--nb-border-width)] border-line bg-focus text-ink">
      <div className="mx-auto grid max-w-6xl items-end gap-10 px-4 py-20 md:px-6 lg:grid-cols-[1.4fr_1fr] lg:py-28">
        <h2 className="m-0 font-grotesk text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.92] font-semibold tracking-[-0.05em] text-balance">
          Stop studying <span className="font-display font-normal tracking-[-0.02em] italic">alone.</span>
        </h2>
        <div className="flex flex-col items-start gap-6">
          <p className="m-0 max-w-[36ch] text-lg leading-relaxed">Make a profile, see your matches, and book your first session this week.</p>
          <ButtonLink href="/register" size="lg">
            Create your account
            <ArrowRight size={20} aria-hidden="true" />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
