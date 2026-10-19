"use client";

import { Heart } from "lucide-react";
import { useState, useTransition } from "react";
import { sendMatchRequest } from "@/app/actions/connection";
import { Alert, Badge, Button, Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger, Textarea } from "@/components/ui";

const NOTE_MAX_LENGTH = 180;

export default function ConnectButton({
  partnerId,
  partnerName,
  buttonText,
  initialStatus,
}: {
  partnerId: string;
  partnerName?: string;
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
      <Badge tone="live" className="min-h-11 px-4 text-[15px]">
        Matched
      </Badge>
    );
  }
  if (status === "PENDING") {
    return (
      <Badge tone="focus" className="min-h-11 px-4 text-[15px]">
        Pending
      </Badge>
    );
  }
  if (status === "REJECTED") {
    return (
      <Badge tone="card" className="min-h-11 px-4 text-[15px]">
        Rejected
      </Badge>
    );
  }

  return (
    <Dialog
      open={composerOpen}
      onOpenChange={(open) => {
        setComposerOpen(open);
        if (!open) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="match" size="sm" icon={<Heart size={16} />} aria-label={partnerName ? `${buttonText} with ${partnerName}` : buttonText}>
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent title="Add a short note" description="Optional. A line about why you want to connect helps them say yes.">
        <div className="flex flex-col gap-3">
          <Textarea
            id={`note-${partnerId}`}
            label="Your note"
            labelHidden
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setError(null);
            }}
            rows={4}
            maxLength={NOTE_MAX_LENGTH + 20}
            error={noteTooLong ? `Keep it under ${NOTE_MAX_LENGTH} characters.` : undefined}
            placeholder="I am also studying algorithms and would like to join your study sessions."
          />
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className={noteTooLong ? "font-bold" : "text-fg-muted"} aria-live="polite">
              {trimmedNoteLength}/{NOTE_MAX_LENGTH}
            </span>
            <span className="text-fg-muted">You can send without a note.</span>
          </div>
          {error && <Alert tone="error">{error}</Alert>}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button variant="match" onClick={handleConnect} loading={isPending} disabled={noteTooLong}>
            {isPending ? "Sending" : "Send request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
