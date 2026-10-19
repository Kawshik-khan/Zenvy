"use client";

import { useState } from "react";
import { createChannel } from "@/app/actions/channel";
import { useRouter } from "next/navigation";
import { Alert, Button, Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger, Input, Textarea } from "@/components/ui";

/** Wrap a single button (or button-like element); clicking it opens the create-channel dialog. */
export default function CreateChannelModal({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [tagValue, setTagValue] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const generateTag = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (val: string) => {
    setNameValue(val);
    setTagValue(generateTag(val));
  };

  const handleAction = async (formData: FormData) => {
    setPending(true);
    setError("");
    try {
      await createChannel(formData);
      setPending(false);
      setIsOpen(false);
      setNameValue("");
      setTagValue("");
      router.refresh();
    } catch (e: any) {
      setError(e.message || "Something went wrong");
      setPending(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setError("");
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent title="Create channel" description="A public channel anyone can discover and join.">
        <form action={handleAction} className="flex flex-col gap-4">
          <Input
            id="new-channel-name"
            required
            name="name"
            type="text"
            label="Channel name"
            value={nameValue}
            onChange={(event) => handleNameChange(event.target.value)}
            placeholder="e.g. CS 101 Study Hall"
          />
          <Input
            id="new-channel-tag"
            required
            name="tag"
            type="text"
            label="Unique tag"
            hint="Others find your channel by searching this tag. Lowercase letters, numbers and dashes."
            value={tagValue}
            onChange={(event) => setTagValue(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            placeholder="cs-101-study-hall"
          />
          <Textarea id="new-channel-description" name="description" label="Description" rows={3} placeholder="What is this channel about?" />
          {error && <Alert tone="error">{error}</Alert>}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" variant="chat" loading={pending}>
              {pending ? "Creating" : "Create channel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
