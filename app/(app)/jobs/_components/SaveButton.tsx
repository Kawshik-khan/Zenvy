"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { Button, useToast } from "@/components/ui";
import { toggleSaveAction } from "../actions";

export function SaveButton({ jobId, title, initialSaved, size = "sm" }: { jobId: string; title: string; initialSaved: boolean; size?: "sm" | "md" }) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const toggle = () => {
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const result = await toggleSaveAction(jobId);
      if ("error" in result && result.error) {
        setSaved(!next);
        toast({ tone: "error", title: result.error });
      } else if ("saved" in result) {
        setSaved(Boolean(result.saved));
      }
    });
  };

  return (
    <Button
      variant={saved ? "focus" : "secondary"}
      size={size}
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      aria-label={`${saved ? "Unsave" : "Save"} ${title}`}
      icon={saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
    >
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
