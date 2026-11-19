import { cx } from "@/components/ui";

const LINES: Array<[string, number]> = [
  ["Same major", 30],
  ["Shared courses: CSE 220, MAT 215", 24],
  ["Both free Tue, Thu 18:00–21:00", 21],
  ["Same college", 10],
  ["Similar semester", 7],
];

/**
 * The hero's product picture: a match laid out like a receipt, so the score adds up from
 * the reasons behind it. Decorative, so hidden from assistive tech (the copy beside it says the same).
 */
export function MatchReceipt() {
  const total = LINES.reduce((sum, [, points]) => sum + points, 0);
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-[420px] select-none pb-24">
      <div className="rounded-nb-lg border-nb bg-card text-ink shadow-nb-lg">
        <div className="flex items-start justify-between gap-4 border-b-2 border-dashed border-line px-6 pt-5 pb-4">
          <div className="min-w-0">
            <p className="m-0 font-jetbrains text-[11px] font-bold tracking-[0.14em] text-fg-muted">MATCH · TUE 19 NOV</p>
            <p className="m-0 mt-2 text-2xl leading-tight font-semibold tracking-tight">Nadia R.</p>
            <p className="m-0 text-sm text-fg-muted">Computer Science · Semester 5</p>
          </div>
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border-nb bg-match text-xl font-bold">N</span>
        </div>

        <ul className="m-0 list-none px-6 py-4 font-jetbrains text-[13px]">
          {LINES.map(([label, points], index) => (
            <li
              key={label}
              className="flex animate-nb-rise items-baseline gap-2 py-1.5"
              style={{ animationDelay: `${250 + index * 110}ms` }}
            >
              <span className="min-w-0">{label}</span>
              <span className="mb-1 flex-1 border-b-2 border-dotted border-line/30" />
              <span className="font-bold tabular-nums">+{points}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-end justify-between border-t-2 border-dashed border-line px-6 pt-3 pb-5">
          <span className="font-jetbrains text-[11px] font-bold tracking-[0.14em]">SCORE</span>
          <span className="font-jetbrains text-5xl leading-none font-bold tabular-nums">{total}</span>
        </div>

        <div className="grid grid-cols-[1fr_1.5fr] gap-2 border-t-[length:var(--nb-border-width)] border-line p-3">
          <span className="inline-flex min-h-11 items-center justify-center rounded-nb border-2 border-line text-sm font-bold">Pass</span>
          <span className="inline-flex min-h-11 items-center justify-center rounded-nb border-2 border-line bg-match text-sm font-bold">Send request</span>
        </div>
      </div>

      <div
        className={cx(
          "absolute right-[-8px] bottom-0 max-w-[250px] animate-nb-rise rounded-[16px_16px_4px_16px] border-nb bg-chat px-4 py-3 text-ink shadow-nb-md",
          "[animation-delay:900ms] sm:right-[-28px]",
        )}
      >
        <p className="m-0 leading-snug font-semibold">Library at 7? I&apos;ll bring the past papers.</p>
        <p className="m-0 mt-1 font-jetbrains text-[11px] font-bold">NADIA · 18:04</p>
      </div>
    </div>
  );
}
