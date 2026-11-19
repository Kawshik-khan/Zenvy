import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui";
import { MatchReceipt } from "./MatchReceipt";

export function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title" className="relative bg-canvas">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-14 pb-20 md:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:pt-24 lg:pb-28">
        <div className="flex min-w-0 animate-nb-rise flex-col items-start gap-8">
          <h1
            id="hero-title"
            className="m-0 font-grotesk text-[clamp(3.1rem,8.5vw,6.6rem)] leading-[0.9] font-semibold tracking-[-0.05em] text-balance text-fg"
          >
            Find your study <span className="font-display font-normal tracking-[-0.02em] italic">partner.</span>
          </h1>
          <p className="m-0 max-w-[36ch] text-lg leading-relaxed text-fg-muted sm:text-xl">
            Zenvy pairs you with students who share your courses and your free hours, then gives you a room to work in: chat, calls, shared notes
            and a focus timer.
          </p>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
            <ButtonLink href="/register" variant="match" size="lg">
              Find my match
              <ArrowRight size={20} aria-hidden="true" />
            </ButtonLink>
            <Link href="/login" className="nb-focus rounded-nb font-semibold text-fg underline decoration-2 underline-offset-[6px] hover:decoration-match">
              I have an account
            </Link>
          </div>
        </div>
        <div className="min-w-0">
          <MatchReceipt />
        </div>
      </div>
    </section>
  );
}
