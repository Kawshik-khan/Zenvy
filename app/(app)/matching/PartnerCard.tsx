import { CalendarClock, Check } from "lucide-react";
import { Avatar, Badge, ButtonLink, Card } from "@/components/ui";
import ConnectButton from "./ConnectButton";
import type { Partner } from "./partners";

export function PartnerCard({ partner }: { partner: Partner }) {
  return (
    <Card as="article" padding="none" className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b-[length:var(--nb-border-width)] border-line bg-match px-5 py-4 text-ink">
        <Avatar name={partner.name} src={partner.image} size="lg" presence={partner.isAvailable ? "online" : undefined} />
        <div className="min-w-0 flex-1">
          <h2 className="m-0 line-clamp-2 text-xl leading-tight font-bold break-words">{partner.name}</h2>
          <p className="m-0 line-clamp-1 text-sm">{partner.major}</p>
        </div>
        <span className="rounded-nb border-nb bg-card px-2 py-1 text-fg">
          <span className="font-jetbrains text-xl font-bold">{partner.match}%</span>
          <span className="sr-only"> match</span>
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <p className="m-0 mb-2 text-xs font-bold tracking-[0.08em] uppercase">Why you match</p>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[15px]">
            {partner.reasons.map((reason) => (
              <li key={reason} className="flex items-center gap-2">
                <Check aria-hidden="true" size={16} className="shrink-0" />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Interests">
          {partner.skills.slice(0, 4).map((skill) => (
            <li key={skill}>
              <Badge size="sm">{skill}</Badge>
            </li>
          ))}
        </ul>

        <div className="mt-auto rounded-nb border-2 border-line bg-canvas p-3 text-sm">
          <p className="m-0 mb-1 flex items-center gap-2 font-bold">
            <CalendarClock aria-hidden="true" size={16} /> Availability
          </p>
          <p className="m-0 line-clamp-2 text-fg-muted">{partner.schedule}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink href={`/users/${partner.id}`} variant="secondary" size="sm">
            View profile
          </ButtonLink>
          {partner.connectionStatus === "ACCEPTED" && (
            <ButtonLink href={`/chat/personal?id=${partner.id}`} variant="chat" size="sm">
              Message
            </ButtonLink>
          )}
          <ConnectButton partnerId={partner.id} partnerName={partner.name} buttonText="Connect" initialStatus={partner.connectionStatus} />
        </div>

        <details className="group">
          <summary className="nb-focus cursor-pointer rounded-nb text-sm font-bold underline-offset-4 hover:underline">Quick preview</summary>
          <div className="mt-3 rounded-nb border-2 border-line bg-canvas p-3 text-sm leading-relaxed">
            <p className="m-0 font-bold">{partner.college}</p>
            <p className="m-0 text-fg-muted">{partner.semester}</p>
            <p className="m-0 mt-2">{partner.bio}</p>
          </div>
        </details>
      </div>
    </Card>
  );
}
