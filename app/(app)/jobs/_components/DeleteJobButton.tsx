"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui";
import { deleteJobAction } from "../actions";

export function DeleteJobButton({ jobId, title }: { jobId: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" icon={<Trash2 size={16} />} aria-label={`Delete ${title}`}>
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent title="Delete this post?" description={`"${title}" and its images will be removed for good.`}>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Keep it</Button>
          </DialogClose>
          <Button
            variant="danger"
            loading={pending}
            onClick={() =>
              startTransition(async () => {
                await deleteJobAction(jobId);
                setOpen(false);
                router.refresh();
              })
            }
          >
            Delete post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
