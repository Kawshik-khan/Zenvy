"use client";

import { ExternalLink, Mail, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, ButtonLink, Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui";

type ApplyPanelProps = {
  method: "LINK" | "EMAIL" | "MESSAGE";
  target: string | null;
  title: string;
  authorId: string;
  authorName: string;
  isAuthor: boolean;
};

export function ApplyPanel({ method, target, title, authorId, authorName, isAuthor }: ApplyPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (isAuthor) return <p className="m-0 text-[15px] text-fg-muted">This is your post. Applicants contact you through the method you chose.</p>;

  if (method === "EMAIL" && target) {
    return (
      <ButtonLink href={`mailto:${target}?subject=${encodeURIComponent(`Application: ${title}`)}`} variant="career" size="lg" icon={<Mail size={20} />} fullWidth>
        Apply by email
      </ButtonLink>
    );
  }

  if (method === "LINK" && target) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="career" size="lg" fullWidth icon={<ExternalLink size={20} />}>
            Apply on their site
          </Button>
        </DialogTrigger>
        <DialogContent title="You are leaving Zenvy" description="Zenvy does not control this site. Never pay anyone to apply for a job.">
          <p className="m-0 rounded-nb border-2 border-line bg-canvas p-3 font-jetbrains text-sm break-all">{target}</p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Stay here</Button>
            </DialogClose>
            <a
              href={target}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="nb-focus nb-press inline-flex min-h-12 items-center justify-center gap-2 rounded-nb border-nb bg-career px-5 font-grotesk font-bold text-ink no-underline shadow-nb"
            >
              Continue
              <ExternalLink aria-hidden="true" size={18} />
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const startChat = async () => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/conversations/dm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetUserId: authorId }) });
      const data = await res.json();
      if (!res.ok || !data.conversation?.id) throw new Error(data.error || "Could not open a chat");
      router.push(`/chat?conversation=${data.conversation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open a chat");
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Button variant="career" size="lg" fullWidth icon={<MessageSquare size={20} />} onClick={startChat} loading={pending}>
        Message {authorName}
      </Button>
      {error && (
        <Alert tone="warning">
          {error}.{" "}
          <Link href={`/users/${authorId}`} className="nb-focus font-bold text-fg underline">
            View their profile
          </Link>{" "}
          to send a connection request first.
        </Alert>
      )}
    </div>
  );
}
