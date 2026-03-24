"use client";

import { useTransition, useState } from "react";
import { sendMatchRequest } from "@/app/actions/connection";

export default function ConnectButton({ partnerId, buttonText }: { partnerId: string, buttonText: string }) {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  const handleConnect = () => {
    startTransition(async () => {
      // Simulate/Trigger match request
      await sendMatchRequest(partnerId);
      setSent(true);
    });
  };

  if (sent) {
    return (
      <button disabled className="flex-1 py-3 bg-green-50 text-green-600 rounded-full font-bold text-xs text-center inline-block cursor-not-allowed">
        Request Sent!
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
