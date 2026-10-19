import { cx } from "@/components/ui";

export type HeatDay = { date: string; activityCount: number; studyHours: number; level: number };

// Written out in full so Tailwind can see every class.
const levelClass = ["bg-heat-0", "bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4"] as const;
const levelOf = (level: number) => levelClass[Math.min(Math.max(Math.round(level), 0), levelClass.length - 1)];

export function Heatmap({ days, summary }: { days: HeatDay[]; summary: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div role="img" aria-label={summary} className="grid grid-cols-7 gap-1.5">
        {days.map((day) => (
          <div key={day.date} title={`${day.date}: ${day.activityCount} activities, ${day.studyHours}h`} className={cx("aspect-square rounded-md border-2 border-line", levelOf(day.level))} />
        ))}
      </div>
      <div aria-hidden="true" className="flex items-center gap-2 text-xs font-bold">
        Less
        <span className="flex gap-1">
          {levelClass.map((cls) => (
            <span key={cls} className={cx("size-3.5 rounded-sm border-2 border-line", cls)} />
          ))}
        </span>
        More
      </div>
    </div>
  );
}

export function StreakBars({ days }: { days: HeatDay[] }) {
  return (
    <div aria-hidden="true" className="flex h-14 items-end gap-1">
      {days.map((day) => (
        <div
          key={day.date}
          className={cx("w-full rounded-t-md border-2 border-line", levelOf(day.level))}
          style={{ height: `${Math.max(18, Math.round(day.level) * 12 + 12)}px` }}
        />
      ))}
    </div>
  );
}
