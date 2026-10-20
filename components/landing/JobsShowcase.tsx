"use client";

import { Bookmark } from "lucide-react";
import { useState } from "react";
import { cx } from "@/components/ui";
import { Tilt } from "@/components/motion/Tilt";

type Job = { id: string; logo: string; logoBg: string; title: string; org: string; kind: "campus" | "ta" | "research"; tags: string[]; urgent?: string; body: string };

const JOBS: Job[] = [
  { id: "ta", logo: "TA", logoBg: "bg-career", title: "Teaching assistant, CSE 220", org: "Department of CSE", kind: "ta", tags: ["Part-time", "On campus"], urgent: "Closes in 3 days", body: "Run two lab sections a week and hold office hours for data structures students." },
  { id: "ml", logo: "ML", logoBg: "bg-live", title: "Research assistant, ML lab", org: "Machine Learning Lab", kind: "research", tags: ["10 hrs/week", "Research"], body: "Clean datasets and run experiments with a PhD student. Python required." },
  { id: "wc", logo: "WC", logoBg: "bg-focus", title: "Peer tutor, Writing Centre", org: "Student Services", kind: "campus", tags: ["Evenings", "Paid hourly"], body: "Help first-year students plan and revise essays in one-to-one sessions." },
];

const FILTERS = [
  { id: "all", label: "All jobs" },
  { id: "campus", label: "On campus" },
  { id: "ta", label: "TA roles" },
  { id: "research", label: "Research" },
] as const;

/** Example listings with working filters and bookmarks, so the jobs board can be tried here. */
export function JobsShowcase() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [saved, setSaved] = useState<string[]>(["ml"]);
  const visible = JOBS.filter((job) => filter === "all" || job.kind === filter || (filter === "campus" && job.tags.includes("On campus")));

  return (
    <div className="flex flex-col gap-6">
      <div role="group" aria-label="Filter example jobs" className="flex flex-wrap gap-2.5">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
            className={cx(
              "nb-focus min-h-11 cursor-pointer rounded-full border-2 border-line px-4 font-grotesk text-[15px] font-bold text-ink transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5",
              filter === item.id ? "animate-nb-stamp bg-career shadow-nb-sm" : "bg-card",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <ul className="m-0 grid list-none gap-7 p-0 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
        {visible.map((job) => {
          const isSaved = saved.includes(job.id);
          return (
            <li key={job.id} className="animate-nb-pop-in">
              <Tilt max={6} className="h-full">
                <article className="flex h-full flex-col gap-3.5 rounded-nb-lg border-nb bg-card p-6 text-ink shadow-[var(--tilt-shadow)]">
                  <div className="flex items-start gap-3.5">
                    <span aria-hidden="true" className={cx("inline-flex size-13 shrink-0 items-center justify-center rounded-xl border-nb font-jetbrains font-bold", job.logoBg)}>
                      {job.logo}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="m-0 text-xl leading-tight font-bold">{job.title}</h3>
                      <p className="m-0 text-[15px] text-fg-muted">{job.org}</p>
                    </div>
                    <button
                      type="button"
                      aria-pressed={isSaved}
                      aria-label={`${isSaved ? "Unsave" : "Save"} ${job.title}`}
                      onClick={() => setSaved((list) => (isSaved ? list.filter((id) => id !== job.id) : [...list, job.id]))}
                      className={cx("nb-focus inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-nb border-2 border-line transition-transform duration-150 hover:-rotate-6", isSaved ? "animate-nb-stamp bg-career" : "bg-card")}
                    >
                      <Bookmark size={20} aria-hidden="true" className={cx(isSaved && "fill-ink")} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {job.tags.map((tag) => (
                      <span key={tag} className="rounded-full border-2 border-line bg-paper px-2.5 text-[13px] font-bold">
                        {tag}
                      </span>
                    ))}
                    {job.urgent && <span className="rounded-full border-2 border-line bg-alert px-2.5 text-[13px] font-bold">{job.urgent}</span>}
                  </div>
                  <p className="m-0">{job.body}</p>
                </article>
              </Tilt>
            </li>
          );
        })}
      </ul>
      <p className="m-0 text-sm font-medium">
        Example listings. Saved here: {saved.length}. The jobs you see in the app depend on your college and major.
      </p>
    </div>
  );
}
