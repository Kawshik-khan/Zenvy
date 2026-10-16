import type { ReactNode } from "react";
import { Card } from "./Card";
import type { Tone } from "./tokens";

type StatTileProps = {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
  children?: ReactNode;
};

/** Dashboard tile: small uppercase label, big mono number, optional detail. */
export function StatTile({ label, value, detail, tone = "card", icon, children }: StatTileProps) {
  return (
    <Card tone={tone} padding="sm" className="flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-2">
        <span className="font-grotesk text-sm font-bold tracking-[0.08em] uppercase">{label}</span>
        {icon && <span aria-hidden="true">{icon}</span>}
      </div>
      <span className="font-jetbrains text-4xl leading-none font-bold">{value}</span>
      {detail && <span className="text-sm">{detail}</span>}
      {children}
    </Card>
  );
}
