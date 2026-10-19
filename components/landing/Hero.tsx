import { ArrowRight, Timer } from "lucide-react";
import { Avatar, Badge, ButtonLink, Card, ProgressBar } from "@/components/ui";

/** Illustration of the product: sample people and numbers, hidden from assistive tech. */
function HeroIllustration() {
  return (
    <div aria-hidden="true" className="relative mx-auto h-[26rem] w-full max-w-md lg:max-w-none">
      <Card padding="none" shadow="lg" className="absolute top-0 left-[4%] w-[80%] -rotate-3 animate-nb-rise">
        <div className="flex items-center gap-3 border-b-[length:var(--nb-border-width)] border-line bg-match px-5 py-4 text-ink">
          <Avatar name="Nadia Rahman" size="lg" tone="focus" />
          <div className="min-w-0 flex-1">
            <div className="text-xl font-bold">Nadia R.</div>
            <div className="text-sm">CS · Semester 5</div>
          </div>
          <span className="rounded-nb border-nb bg-card px-2 py-1 font-jetbrains text-2xl font-bold text-fg">92%</span>
        </div>
        <div className="flex flex-wrap gap-2 p-5">
          <Badge tone="chat">Same major</Badge>
          <Badge tone="focus">2 shared interests</Badge>
          <Badge tone="live">Availability set</Badge>
        </div>
      </Card>

      <Card tone="focus" shadow="md" padding="sm" className="absolute right-0 bottom-6 w-56 rotate-3 animate-nb-rise [animation-delay:120ms]">
        <div className="flex items-center gap-2 text-sm font-bold tracking-[0.08em] uppercase">
          <Timer size={16} /> Focus · 2 of 4
        </div>
        <div className="mt-1 font-jetbrains text-5xl leading-none font-bold">18:42</div>
        <ProgressBar label="Example focus progress" value={38} tone="ink" className="mt-3" />
      </Card>

      <div className="absolute bottom-16 left-0 max-w-[15rem] -rotate-2 animate-nb-rise rounded-nb-lg rounded-bl-sm border-nb bg-chat px-4 py-3 font-grotesk font-medium text-ink shadow-nb-md [animation-delay:240ms]">
        Library at 7? I&apos;ll bring the past papers.
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:px-6 lg:grid-cols-2 lg:py-24">
      <div className="flex flex-col items-start gap-7">
        <Badge tone="live">For university students</Badge>
        <h1 className="m-0 font-grotesk text-5xl leading-[1.02] font-bold tracking-tight text-fg sm:text-6xl">
          Find your study partner.{" "}
          <span className="mt-2 inline-block -rotate-1 border-nb bg-focus px-3 text-ink">Actually study.</span>
        </h1>
        <p className="m-0 max-w-xl font-grotesk text-lg leading-relaxed text-fg-muted sm:text-xl">
          Zenvy matches you with students who share your major, courses and free time, then gives you what you need to study together: chat,
          group rooms, voice and video calls, and a focus timer.
        </p>
        <div className="flex flex-wrap gap-4">
          <ButtonLink href="/register" variant="match" size="lg" icon={<ArrowRight size={20} />}>
            Find my match
          </ButtonLink>
          <ButtonLink href="/login" variant="secondary" size="lg">
            I have an account
          </ButtonLink>
        </div>
      </div>
      <HeroIllustration />
    </section>
  );
}
