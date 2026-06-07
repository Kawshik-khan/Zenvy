"use client";

import { useTransition, useState } from "react";
import { sendMatchRequest } from "@/app/actions/connection";

export default function ConnectButton({
  partnerId,
  buttonText,
  initialStatus,
}: {
  partnerId: string;
  buttonText: string;
  initialStatus?: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(initialStatus || null);

  const handleConnect = () => {
    startTransition(async () => {
      const result = await sendMatchRequest(partnerId);
      setStatus(result.status || "PENDING");
    });
  };

  if (status === "ACCEPTED") {
    return (
      <button disabled className="flex-1 py-3 bg-green-50 text-green-700 rounded-full font-bold text-xs text-center inline-block cursor-not-allowed">
        Matched
      </button>
    );
  }

  if (status === "PENDING") {
    return (
      <button disabled className="flex-1 py-3 bg-green-50 text-green-600 rounded-full font-bold text-xs text-center inline-block cursor-not-allowed">
        Pending
      </button>
    );
  }

  if (status === "REJECTED") {
    return (
      <button disabled className="flex-1 py-3 bg-surface-container text-on-surface-variant rounded-full font-bold text-xs text-center inline-block cursor-not-allowed">
        Rejected
      </button>
    );
  }

  return (
    <button 
      onClick={handleConnect}
      disabled={isPending}
      className="flex-1 py-3 bg-surface-container text-on-surface-variant rounded-full font-bold text-xs hover:bg-primary-fixed-dim hover:text-on-primary-fixed transition-colors disabled:opacity-50"
    >
      {isPending ? "Sending..." : buttonText}
    </button>
  );
}
