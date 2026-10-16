"use client";

import { useTransition, useState } from "react";
import { sendMatchRequest } from "@/app/actions/connection";

const NOTE_MAX_LENGTH = 180;

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
  const [composerOpen, setComposerOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConnect = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await sendMatchRequest(partnerId, note);
        setStatus(result.status || "PENDING");
        setComposerOpen(false);
        setNote("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send request");
      }
    });
  };

  const trimmedNoteLength = note.trim().length;
  const noteTooLong = trimmedNoteLength > NOTE_MAX_LENGTH;

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
    <>
      <button
        onClick={() => {
          setComposerOpen(true);
          setError(null);
        }}
        disabled={isPending}
        className="flex-1 py-3 bg-surface-container text-on-surface-variant rounded-full font-bold text-xs hover:bg-primary-fixed-dim hover:text-on-primary-fixed transition-colors disabled:opacity-50"
      >
        {isPending ? "Sending..." : buttonText}
      </button>

      {composerOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-outline-variant/30 bg-surface p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-on-surface">Add a short note</h3>
                <p className="mt-1 text-sm leading-5 text-on-surface-variant">
                  Optional. This helps the other student understand why you want to connect.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setComposerOpen(false)}
                className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                aria-label="Close note composer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <textarea
              value={note}
              onChange={(event) => {
                setNote(event.target.value);
                setError(null);
              }}
              className="app-input min-h-28 w-full resize-none rounded-2xl p-4 text-sm"
              maxLength={NOTE_MAX_LENGTH + 20}
              placeholder="Example: I am also studying algorithms and would like to join your study sessions."
            />

            <div className="mt-2 flex items-center justify-between gap-3">
              <p className={`text-xs font-bold ${noteTooLong ? "text-error" : "text-on-surface-variant"}`}>
                {trimmedNoteLength}/{NOTE_MAX_LENGTH}
              </p>
              <p className="text-xs text-on-surface-variant">You can send without a note.</p>
            </div>

            {error && (
              <div className="mt-3 rounded-2xl border border-error/25 bg-error-container px-4 py-3 text-sm font-bold text-on-error-container">
                {error}
              </div>
            )}

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setComposerOpen(false);
                  setError(null);
                }}
                className="rounded-full bg-surface-container px-5 py-3 text-sm font-bold text-on-surface-variant transition-colors hover:text-on-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConnect}
                disabled={isPending || noteTooLong}
                className="app-primary-button rounded-full px-5 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Sending..." : "Send request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
