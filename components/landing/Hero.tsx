import { ArrowRight, Check } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { Magnetic } from "@/components/motion/Magnetic";
import { PointerParallax } from "@/components/motion/PointerParallax";
import { HeroDecorations } from "./Decorations";
import { HeroCards } from "./HeroCards";

const WORDS = ["Find", "your", "study"];

export function Hero({ jobsEnabled }: { jobsEnabled: boolean }) {
  return (
    <PointerParallax className="relative overflow-hidden bg-canvas bg-grid">
      <section id="top" aria-labelledby="hero-title" className="relative">
        <HeroDecorations />
        <div className="relative z-[1] mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div className="flex flex-col items-start gap-7">
            <a href={jobsEnabled ? "#jobs" : "#features"} className="nb-focus inline-flex animate-nb-rise items-center gap-2 rounded-full border-2 border-line bg-live px-3.5 py-1 text-sm font-bold text-ink no-underline">
              <span aria-hidden="true" className="size-2.5 animate-nb-blink rounded-full bg-ink" />
              {jobsEnabled ? "New: jobs board and study stats" : "New: study stats and focus mode"}
              <ArrowRight size={16} aria-hidden="true" />
            </a>
            <h1 id="hero-title" className="m-0 font-grotesk text-5xl leading-[0.98] font-bold tracking-[-0.04em] text-fg sm:text-6xl lg:text-7xl">
              {WORDS.map((word, index) => (
                <span key={word} className="inline-block animate-nb-word" style={{ animationDelay: `${80 + index * 70}ms` }}>
                  {word}&nbsp;
                </span>
              ))}
              <span className="relative inline-block animate-nb-word" style={{ animationDelay: "290ms" }}>
                partner.
                <svg aria-hidden="true" viewBox="0 0 300 24" preserveAspectRatio="none" className="absolute -bottom-2 left-[-2%] h-[0.3em] w-[104%] overflow-visible">
                  <path d="M4 16 C 60 4, 110 22, 160 12 S 250 6, 296 14" pathLength={1} strokeDasharray={1} className="animate-nb-draw fill-none stroke-match" strokeWidth={9} strokeLinecap="round" />
                </svg>
              </span>{" "}
              <span className="mt-3 inline-block animate-nb-pop-in rounded-nb border-nb bg-focus px-3 pb-1.5 text-[0.82em] whitespace-nowrap text-ink shadow-nb-lg [animation-delay:520ms] -rotate-[1.5deg]">
                Actually study.
              </span>
            </h1>
            <p className="m-0 max-w-xl animate-nb-rise font-grotesk text-lg leading-relaxed text-fg-muted [animation-delay:600ms] sm:text-xl">
              Zenvy matches you with students who share your major, courses and free time. Then it gives you the room to work: chat, group calls, shared
              notes and a focus timer.
            </p>
            <div className="flex animate-nb-rise flex-wrap gap-4 [animation-delay:720ms]">
              <Magnetic>
                <ButtonLink href="/register" variant="match" size="lg">
                  Find my match
                  <ArrowRight size={20} aria-hidden="true" />
                </ButtonLink>
              </Magnetic>
              <ButtonLink href="/login" variant="secondary" size="lg">
                I have an account
              </ButtonLink>
            </div>
            <ul className="m-0 flex animate-nb-rise list-none flex-wrap gap-x-5 gap-y-2 p-0 text-[15px] font-semibold [animation-delay:840ms]">
              {["Every match shows its reasons", "Works on phone and laptop"].map((item) => (
                <li key={item} className="inline-flex items-center gap-2">
                  <span aria-hidden="true" className="inline-flex size-5 items-center justify-center rounded-full border-2 border-line bg-live text-ink">
                    <Check size={12} strokeWidth={3.5} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="animate-nb-rise [animation-delay:300ms]">
            <HeroCards jobsEnabled={jobsEnabled} />
          </div>
        </div>
      </section>
    </PointerParallax>
  );
}
