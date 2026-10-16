"use client";

import { Briefcase, Filter, LogOut, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
  ImageDropzone,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Sheet,
  SheetContent,
  SheetTrigger,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonText,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ToastProvider,
  useToast,
} from "@/components/ui";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="m-0 font-grotesk text-3xl font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function OverlayDemos() {
  return (
    <Section title="Dialog, sheet, popover">
      <div className="flex flex-wrap items-center gap-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="danger" icon={<LogOut size={18} />}>
              Leave call
            </Button>
          </DialogTrigger>
          <DialogContent title="Leave this call?" description="Nadia stays in the room and your shared notes are saved to the chat.">
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Stay</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="danger">Leave call</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary" icon={<Filter size={18} />}>
              Filters (side sheet)
            </Button>
          </SheetTrigger>
          <SheetContent title="Filter jobs" description="Narrow the feed to what fits your week.">
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap gap-2">
                <Chip selected tone="career">
                  Internships
                </Chip>
                <Chip>Part-time</Chip>
                <Chip>Referrals</Chip>
              </div>
              <Input id="sheet-keyword" label="Keyword" placeholder="React, tutor, data entry" />
              <Button variant="career" fullWidth>
                Show 12 jobs
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary">Bottom sheet (mobile)</Button>
          </SheetTrigger>
          <SheetContent side="bottom" title="Share this job">
            <div className="flex flex-wrap gap-3">
              <Button variant="chat">Send to a partner</Button>
              <Button variant="secondary">Copy link</Button>
            </div>
          </SheetContent>
        </Sheet>

        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="nb-focus inline-flex cursor-pointer items-center gap-2 rounded-full border-nb bg-card py-1 pr-4 pl-1 font-grotesk font-bold shadow-nb-sm">
              <Avatar name="Nadia Rahman" size="sm" />
              Nadia Rahman
            </button>
          </PopoverTrigger>
          <PopoverContent aria-label="Nadia Rahman profile preview">
            <div className="flex items-center gap-3">
              <Avatar name="Nadia Rahman" size="lg" presence="online" />
              <div>
                <div className="text-lg font-bold">Nadia Rahman</div>
                <div className="text-sm text-fg-muted">CS · Semester 5</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge size="sm">Data Structures</Badge>
              <Badge size="sm">Evenings</Badge>
            </div>
            <Button variant="match" size="sm" fullWidth className="mt-4">
              Connect · 92%
            </Button>
          </PopoverContent>
        </Popover>
      </div>
    </Section>
  );
}

function TabsDemo() {
  return (
    <Section title="Tabs">
      <Tabs defaultValue="people">
        <TabsList aria-label="Inbox filter">
          <TabsTrigger value="people" tone="chat">
            People
          </TabsTrigger>
          <TabsTrigger value="groups" tone="chat">
            Groups
          </TabsTrigger>
          <TabsTrigger value="channels" tone="chat">
            Channels
          </TabsTrigger>
        </TabsList>
        <TabsContent value="people">
          <Card padding="sm">Direct messages with your study partners.</Card>
        </TabsContent>
        <TabsContent value="groups">
          <Card padding="sm">Study groups you belong to.</Card>
        </TabsContent>
        <TabsContent value="channels">
          <Card padding="sm">Course channels like #cse-220.</Card>
        </TabsContent>
      </Tabs>
    </Section>
  );
}

function ToastDemo() {
  const toast = useToast();
  return (
    <Section title="Toasts">
      <div className="flex flex-wrap gap-4">
        <Button variant="live" onClick={() => toast({ title: "Request sent", description: "Nadia will see it in her notifications.", tone: "success" })}>
          Success toast
        </Button>
        <Button
          variant="danger"
          onClick={() =>
            toast({
              title: "Upload failed",
              description: "poster.jpg is larger than 5 MB.",
              tone: "error",
              action: { label: "Try again", onClick: () => {} },
            })
          }
        >
          Error toast
        </Button>
        <Button variant="chat" onClick={() => toast({ title: "New message", description: "Arif: sent recursion-tree.pdf" })}>
          Info toast
        </Button>
      </div>
      <p className="m-0 text-sm text-fg-muted">Swipe right or press the × to dismiss. Errors stay longer and are announced immediately.</p>
    </Section>
  );
}

function UploadDemo() {
  const toast = useToast();
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const images = data.getAll("images").filter((value) => value instanceof File && value.size > 0);
    const photo = data.get("photo");
    toast({
      title: "Form data ready",
      description: `${images.length} job image${images.length === 1 ? "" : "s"}, ${photo instanceof File && photo.size ? "1" : "no"} new profile photo.`,
      tone: "success",
    });
  };

  return (
    <Section title="Image upload">
      <form onSubmit={onSubmit} className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <Card>
          <ImageDropzone id="demo-job-images" name="images" label="Job images (poster, notice, office photo)" maxFiles={4} />
        </Card>
        <Card>
          <ImageDropzone id="demo-photo" name="photo" label="Profile photo" variant="avatar" />
        </Card>
        <div className="md:col-span-2">
          <Button type="submit" variant="career" icon={<Briefcase size={18} />}>
            Submit form (shows what would be sent)
          </Button>
        </div>
      </form>
    </Section>
  );
}

function MotionDemo() {
  const [selected, setSelected] = useState<string[]>(["Evenings"]);
  const [shake, setShake] = useState(0);
  const toggle = (label: string) => setSelected((current) => (current.includes(label) ? current.filter((item) => item !== label) : [...current, label]));

  return (
    <Section title="Motion">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="flex flex-col gap-3">
          <span className="font-bold">Stamp on select</span>
          <div className="flex flex-wrap gap-2">
            {["Mornings", "Evenings", "Weekends"].map((label) => (
              <Chip key={label} selected={selected.includes(label)} onClick={() => toggle(label)}>
                {label}
              </Chip>
            ))}
          </div>
        </Card>
        <Card className="flex flex-col gap-3">
          <span className="font-bold">Shake on error</span>
          <div key={shake} className={shake ? "animate-nb-shake" : undefined}>
            <Input id="motion-code" label="Invite code" defaultValue="ZEN-000" error={shake ? "That code has expired." : undefined} />
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShake((value) => value + 1)}>
            Submit wrong code
          </Button>
        </Card>
        <Card className="flex flex-col gap-3">
          <span className="font-bold">Lift, press, pop</span>
          <p className="m-0 text-sm text-fg-muted">Hover lifts 2px, pressing sinks into the shadow. Overlays pop or slide in. All motion is cut under reduced-motion settings.</p>
          <Button variant="focus" icon={<Sparkles size={18} />}>
            Press me
          </Button>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-[1fr_2fr]" aria-busy="true" aria-label="Loading example">
        <SkeletonCard />
        <Card className="flex items-center gap-4">
          <SkeletonAvatar className="size-12" />
          <div className="flex flex-1 flex-col gap-2">
            <SkeletonText className="w-1/2" />
            <SkeletonText className="w-3/4" />
          </div>
        </Card>
      </div>
    </Section>
  );
}

export function InteractiveDemos() {
  return (
    <ToastProvider>
      <OverlayDemos />
      <TabsDemo />
      <ToastDemo />
      <UploadDemo />
      <MotionDemo />
    </ToastProvider>
  );
}
