"use client";

import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cx } from "@/components/ui";
import { Depth } from "@/components/motion/PointerParallax";
import { Tilt } from "@/components/motion/Tilt";
import { useReducedMotion } from "@/components/motion/useMotionOk";

type MatchCard = { kind: "match"; id: string; name: string; initial: string; meta: string; score: number; band: string; avatar: string; reasons: Array<[string, number]> };
type JobCard = { kind: "job"; id: string; title: string; org: string; tags: string[]; deadline: string };
type DeckCard = MatchCard | JobCard;

const MATCH_CARDS: MatchCard[] = [
  { kind: "match", id: "nadia", name: "Nadia R.", initial: "N", meta: "Computer Science · Semester 5", score: 92, band: "bg-match", avatar: "bg-focus", reasons: [["Same major", 100], ["Shared courses: CSE 220, MAT 215", 80], ["Free Tue and Thu evenings", 70]] },
  { kind: "match", id: "arif", name: "Arif H.", initial: "A", meta: "EEE · Semester 4", score: 87, band: "bg-chat", avatar: "bg-match", reasons: [["Same college", 100], ["Free Tue evenings", 75], ["Similar semester", 65]] },
];
const JOB_CARD: JobCard = { kind: "job", id: "ta", title: "Teaching assistant", org: "CSE 220 · Dept. of CSE", tags: ["Part-time", "On campus"], deadline: "Closes in 3 days" };
const SLOTS = ["front", "left", "right"] as const;
const DECK_WIDTH = 560;
const DECK_HEIGHT = 540;

function slotStyle(slot: (typeof SLOTS)[number]) {
  if (slot === "front") return { transform: "translate(-50%, 0) rotate(0deg)", zIndex: 3 };
  if (slot === "left") return { transform: "translate(calc(-50% - 46%), 52px) rotate(-8deg)", zIndex: 2 };
  return { transform: "translate(calc(-50% + 46%), 52px) rotate(8deg)", zIndex: 1 };
}

function MatchFace({ card, front }: { card: MatchCard; front: boolean }) {
  return (
    <>
      <div className={cx("flex items-center gap-3 border-b-[length:var(--nb-border-width)] border-line p-3.5", card.band)}>
        <span className={cx("inline-flex size-12 shrink-0 items-center justify-center rounded-full border-nb text-xl font-bold", card.avatar)}>{card.initial}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg leading-tight font-bold">{card.name}</span>
          <span className="block truncate text-[13px]">{card.meta}</span>
        </span>
        <span className="rounded-nb border-nb bg-card px-1.5 font-jetbrains text-xl font-bold">{card.score}%</span>
      </div>
      <div className="flex flex-col gap-2.5 p-3.5">
        <span className="font-jetbrains text-[11px] font-bold tracking-[0.12em]">WHY YOU MATCH</span>
        {card.reasons.map(([label, value], index) => (
          <span key={label} className="flex flex-col gap-1 text-sm font-medium">
            {label}
            <span className="block h-2.5 overflow-hidden rounded-full border-2 border-line bg-paper">
              <span
                className={cx("block h-full origin-left border-r-2 border-line", card.band, front && "animate-nb-grow")}
                style={{ width: `${value}%`, animationDelay: `${120 + index * 90}ms` }}
              />
            </span>
          </span>
        ))}
        <span className="mt-1 flex gap-2">
          <span className="inline-flex min-h-10 flex-1 items-center justify-center rounded-nb border-nb bg-card text-sm font-bold">Pass</span>
          <span className="inline-flex min-h-10 flex-[1.4] items-center justify-center rounded-nb border-nb bg-match text-sm font-bold shadow-nb-sm">Send request</span>
        </span>
      </div>
    </>
  );
}

function JobFace({ card }: { card: JobCard }) {
  return (
    <>
      <div className="flex flex-row-reverse items-center gap-3 border-b-[length:var(--nb-border-width)] border-line bg-career p-3.5 text-right">
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-nb border-nb bg-focus font-jetbrains font-bold">TA</span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg leading-tight font-bold">{card.title}</span>
          <span className="block text-[13px]">{card.org}</span>
        </span>
      </div>
      <div className="flex flex-col items-end gap-2.5 p-3.5 text-right text-sm font-medium">
        <span className="rounded-md border-2 border-line bg-card px-2.5 text-[11px] font-bold tracking-[0.08em]">JOB · NEW</span>
        <span className="rounded-full border-2 border-line bg-alert px-2.5 text-[13px] font-bold">{card.deadline}</span>
        <span>{card.tags.join(" · ")}</span>
        <span className="inline-flex min-h-10 items-center rounded-nb border-nb bg-career px-3.5 font-bold shadow-nb-sm">View job</span>
      </div>
    </>
  );
}

function LiveTimer() {
  const [seconds, setSeconds] = useState(18 * 60 + 42);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const timer = window.setInterval(() => setSeconds((value) => (value > 0 ? value - 1 : 25 * 60)), 1000);
    return () => window.clearInterval(timer);
  }, [reduce]);
  return (
    <span className="font-jetbrains text-[32px] leading-none font-bold tabular-nums">
      {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
    </span>
  );
}

/**
 * The hero's product picture: a fan of match and job cards. Click a card at the side to bring
 * it to the front; the front card tilts toward the pointer. Decorative, so hidden from
 * assistive tech (the copy beside it says the same thing).
 */
export function HeroCards({ jobsEnabled }: { jobsEnabled: boolean }) {
  const deck: DeckCard[] = [MATCH_CARDS[0], MATCH_CARDS[1], jobsEnabled ? JOB_CARD : { ...MATCH_CARDS[1], id: "maya", name: "Maya L.", initial: "M", meta: "Computer Science · Semester 6", score: 81, band: "bg-live", avatar: "bg-chat", reasons: [["Same major", 100], ["2 shared groups", 60], ["Similar semester", 55]] }];
  const [order, setOrder] = useState([0, 1, 2]);

  const bringToFront = (deckIndex: number) =>
    setOrder((current) => {
      const position = current.indexOf(deckIndex);
      if (position === 0) return current;
      const next = [...current];
      [next[0], next[position]] = [next[position], next[0]];
      return next;
    });

  // The fan is drawn at 560x540 and scaled to the column, so it fits phones and narrow laptop columns alike.
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / DECK_WIDTH)));
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frameRef} aria-hidden="true" className="relative mx-auto w-full max-w-[560px] select-none" style={{ height: DECK_HEIGHT * scale }}>
    <div className="absolute top-0 left-0 origin-top-left" style={{ width: DECK_WIDTH, height: DECK_HEIGHT, scale: String(scale) }}>
      {deck.map((card, deckIndex) => {
        const slot = SLOTS[order.indexOf(deckIndex)];
        const front = slot === "front";
        return (
          <div
            key={card.id}
            onClick={() => bringToFront(deckIndex)}
            className={cx("absolute top-[70px] left-1/2 w-[280px] transition-transform duration-[650ms] ease-[var(--ease-nb-spring)]", !front && "cursor-pointer")}
            style={slotStyle(slot)}
          >
            <Tilt max={front ? 10 : 0}>
              <div className={cx("overflow-hidden rounded-nb-lg border-nb bg-card text-ink", front ? "shadow-[var(--tilt-shadow)]" : "shadow-nb-md")}>
                {card.kind === "match" ? <MatchFace card={card} front={front} /> : <JobFace card={card} />}
              </div>
            </Tilt>
          </div>
        );
      })}

      <Depth depth={-18} className="absolute top-0 right-0 z-10">
        <div className="animate-nb-float">
          <div className="rotate-[5deg] rounded-nb border-nb bg-focus px-3.5 py-2.5 text-ink shadow-nb-md">
            <span className="block text-[11px] font-bold tracking-[0.08em]">FOCUS · 2 OF 4</span>
            <LiveTimer />
          </div>
        </div>
      </Depth>
      <Depth depth={14} className="absolute bottom-11 left-0 z-10">
        <div className="max-w-[210px] origin-left animate-nb-sway rounded-[14px_14px_14px_4px] border-nb bg-chat px-3.5 py-2.5 font-bold text-ink shadow-nb-md">
          Library at 7? I&apos;ll bring the past papers.
        </div>
      </Depth>
      <Depth depth={-10} className="absolute right-0 bottom-0 z-10">
        <div className="animate-nb-float [animation-delay:-1.3s]">
          <div className="flex items-center gap-2.5 rounded-nb border-nb bg-card px-3.5 py-2.5 text-ink shadow-nb-md">
            <span className="inline-flex size-8 items-center justify-center rounded-lg border-2 border-line bg-live">
              <Check size={16} strokeWidth={3} />
            </span>
            <span className="text-sm leading-tight font-bold">
              Arif accepted
              <span className="block font-medium">Say hi and plan a session</span>
            </span>
          </div>
        </div>
      </Depth>
    </div>
    </div>
  );
}
