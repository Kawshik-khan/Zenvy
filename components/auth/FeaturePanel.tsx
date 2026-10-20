"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import { cx } from "@/components/ui";
import { FocusIllustration, JobsIllustration, MatchingIllustration, StudyTogetherIllustration } from "@/components/illustrations/AuthIllustrations";
import { Depth, PointerParallax } from "@/components/motion/PointerParallax";
import { useReducedMotion } from "@/components/motion/useMotionOk";

type Slide = { id: string; tab: string; title: string; body: string; bg: string; Art: ComponentType<{ className?: string }> };

const ALL_SLIDES: Slide[] = [
  { id: "matching", tab: "Matching", title: "Matches that make sense", body: "See who shares your major, courses and free time, and exactly why they're a good fit.", bg: "bg-match", Art: MatchingIllustration },
  { id: "together", tab: "Study together", title: "Study together, anywhere", body: "Chat, start a voice or video call, share your screen and keep notes that save to the chat.", bg: "bg-chat", Art: StudyTogetherIllustration },
  { id: "focus", tab: "Focus", title: "Focus mode that keeps you going", body: "25-minute blocks with ambient sound. Notifications wait until your break.", bg: "bg-focus", Art: FocusIllustration },
  { id: "jobs", tab: "Jobs", title: "Jobs that fit your classes", body: "Campus jobs, TA roles and internships picked for your major, with deadlines you can't miss.", bg: "bg-career", Art: JobsIllustration },
];

const ROTATE_MS = 6000;

/** The left half of the sign-in screens: one feature at a time, rotating until someone picks one. */
export function FeaturePanel({ jobsEnabled = false }: { jobsEnabled?: boolean }) {
  const slides = jobsEnabled ? ALL_SLIDES : ALL_SLIDES.filter((slide) => slide.id !== "jobs");
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const slide = slides[index];

  useEffect(() => {
    if (!auto || paused || reduce) return;
    const timer = window.setTimeout(() => setIndex((value) => (value + 1) % slides.length), ROTATE_MS);
    return () => window.clearTimeout(timer);
  }, [auto, paused, reduce, index, slides.length]);

  const choose = (next: number) => {
    setAuto(false);
    setIndex((next + slides.length) % slides.length);
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="What you can do on Zenvy"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cx(
        "relative flex min-w-0 flex-1 flex-col gap-6 overflow-hidden border-b-[length:var(--nb-border-width)] border-line bg-grid px-5 py-8 text-ink transition-colors duration-500 md:px-10 lg:border-r-[length:var(--nb-border-width)] lg:border-b-0 lg:py-10",
        slide.bg,
      )}
    >
      <PointerParallax className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6">
        <div key={slide.id} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${slides.length}: ${slide.title}`} className="flex animate-nb-pop-in flex-col gap-6">
          <Depth depth={-14} className="hidden md:block">
            <div className="rounded-nb-lg border-nb bg-paper p-3 shadow-nb-lg">
              <slide.Art className="block h-auto w-full" />
            </div>
          </Depth>
          <div className="flex flex-col gap-2">
            <h2 className="m-0 font-grotesk text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl">{slide.title}</h2>
            <p className="m-0 max-w-md text-lg">{slide.body}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div role="tablist" aria-label="Choose a feature" className="flex flex-wrap gap-2">
            {slides.map((item, itemIndex) => {
              const selected = itemIndex === index;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => choose(itemIndex)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                      event.preventDefault();
                      const next = itemIndex + (event.key === "ArrowRight" ? 1 : -1);
                      choose(next);
                      const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role='tab']");
                      tabs?.[(next + slides.length) % slides.length]?.focus();
                    }
                  }}
                  tabIndex={selected ? 0 : -1}
                  className={cx(
                    "nb-focus min-h-11 cursor-pointer rounded-full border-nb px-3.5 font-grotesk text-[15px] font-bold text-ink transition-[background,box-shadow,transform] duration-150",
                    selected ? "bg-card shadow-nb" : "bg-transparent hover:bg-card/60",
                  )}
                >
                  {item.tab}
                </button>
              );
            })}
          </div>
          <div className="ml-auto flex gap-2">
            <button type="button" aria-label="Previous feature" onClick={() => choose(index - 1)} className="nb-focus nb-press inline-flex size-11 cursor-pointer items-center justify-center rounded-nb border-nb bg-card text-ink shadow-nb-sm">
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Next feature" onClick={() => choose(index + 1)} className="nb-focus nb-press inline-flex size-11 cursor-pointer items-center justify-center rounded-nb border-nb bg-card text-ink shadow-nb-sm">
              <ArrowRight size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      </PointerParallax>
      <p className="m-0 text-sm font-medium">{auto && !reduce ? "Features change every 6 seconds. Hover to pause." : "Pick a feature to read about it."}</p>
    </section>
  );
}
