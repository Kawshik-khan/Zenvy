import { Phone, PhoneOff } from "lucide-react";
import Link from "next/link";
import { Avatar, Button, buttonClasses } from "@/components/ui";

type IncomingCallBannerProps = {
  callerName: string;
  callerImage: string | null;
  mediaType: string;
  acceptHref: string;
  onDecline: () => void;
};

/** Floating prompt when someone calls. Accepting is a link into the call screen. */
export function IncomingCallBanner({ callerName, callerImage, mediaType, acceptHref, onDecline }: IncomingCallBannerProps) {
  return (
    <div
      role="alert"
      className="fixed inset-x-4 top-4 z-[120] mx-auto flex max-w-md animate-nb-pop-in items-center gap-3 rounded-nb-lg border-nb bg-focus p-3 text-ink shadow-nb-md"
    >
      <Avatar name={callerName} src={callerImage} size="md" />
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate font-grotesk font-bold">{callerName} is calling</p>
        <p className="m-0 text-sm">{mediaType === "VIDEO" ? "Video call" : "Voice call"}</p>
      </div>
      <Button variant="danger" size="sm" onClick={onDecline} aria-label={`Decline call from ${callerName}`} icon={<PhoneOff size={18} />}>
        Decline
      </Button>
      <Link href={acceptHref} className={buttonClasses({ variant: "live", size: "sm" })} aria-label={`Accept call from ${callerName}`}>
        <Phone aria-hidden="true" size={18} />
        Accept
      </Link>
    </div>
  );
}
