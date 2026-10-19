"use client";

import { useState } from "react";
import { createGroup } from "@/app/actions/group";
import { useRouter } from "next/navigation";
import { Button, Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger, Input, Textarea } from "@/components/ui";

/** Wrap a single button (or button-like element); clicking it opens the create-group dialog. */
export default function CreateGroupModal({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const handleAction = async (formData: FormData) => {
    setPending(true);
    await createGroup(formData);
    setPending(false);
    setIsOpen(false);
    router.refresh(); // Refresh page to see new group
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent title="Create study group" description="Pick a name and subject so classmates can find it.">
        <form action={handleAction} className="flex flex-col gap-4">
          <Input id="new-group-name" required name="name" type="text" label="Group name" placeholder="e.g. Advanced Calculus Study" />
          <Input id="new-group-subject" required name="subject" type="text" label="Subject" placeholder="e.g. Mathematics" />
          <Textarea id="new-group-description" name="description" label="Description" rows={3} placeholder="What are the goals of this group?" />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" variant="career" loading={pending}>
              {pending ? "Creating" : "Create group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
