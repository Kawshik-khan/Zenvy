"use client";

import { Check, Hash } from "lucide-react";
import { useState } from "react";
import { cx } from "@/components/ui";

const CHANNELS = ["cse-220", "calc-2", "organic-chem", "micro-econ", "ielts-prep", "thesis-writing", "physics-101"];

/** Example course channels you can "join" with a tap. Nothing is saved; it shows how channels feel. */
export function ChannelChips() {
  const [joined, setJoined] = useState<string[]>([]);
  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 font-bold">Tap to join a few channels (example)</p>
      <div className="flex flex-wrap gap-2.5">
        {CHANNELS.map((channel) => {
          const on = joined.includes(channel);
          return (
            <button
              key={channel}
              type="button"
              aria-pressed={on}
              onClick={() => setJoined((list) => (on ? list.filter((item) => item !== channel) : [...list, channel]))}
              className={cx(
                "nb-focus inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border-2 border-line px-4 font-jetbrains text-[15px] font-bold text-ink transition-[transform,box-shadow] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-nb-sm",
                on ? "animate-nb-stamp bg-live" : "bg-card",
              )}
            >
              {on ? <Check size={16} aria-hidden="true" /> : <Hash size={16} aria-hidden="true" />}
              {channel}
            </button>
          );
        })}
      </div>
      <p className="m-0 text-sm text-fg-muted" aria-live="polite">
        {joined.length === 0 ? "Your feed will show questions from the channels you join." : `${joined.length} joined. Your feed would show questions from these courses.`}
      </p>
    </div>
  );
}
