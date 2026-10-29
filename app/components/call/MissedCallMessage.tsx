"use client";

import Link from "next/link";
import { PhoneMissed, VideoOff } from "lucide-react";

type MissedCallMessageProps = {
  content: string;
  /** AUDIO or VIDEO, from the message's fileName. */
  mediaType?: string | null;
  isSelf: boolean;
  /** Starts a new call in this DM. Left out where calling back isn't possible. */
  callBackHref?: string;
};

/** The card a DM gets when a call goes unanswered: "Missed voice call" plus a call-back button. */
export default function MissedCallMessage({ content, mediaType, isSelf, callBackHref }: MissedCallMessageProps) {
  const video = mediaType === "VIDEO";
  const Icon = video ? VideoOff : PhoneMissed;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-line bg-alert text-ink">
        <Icon aria-hidden="true" size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="m-0 font-grotesk font-bold">{content}</p>
        <p className="m-0 text-sm text-fg-muted">{isSelf ? "No one picked up" : "Tap to call back"}</p>
      </div>
      {callBackHref && (
        <Link
          href={callBackHref}
          className="nb-focus inline-flex min-h-11 items-center rounded-nb border-2 border-line bg-live px-3 font-grotesk text-sm font-bold text-ink no-underline"
        >
          {isSelf ? "Call again" : "Call back"}
        </Link>
      )}
    </div>
  );
}
