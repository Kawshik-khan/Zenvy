export const runtime = "nodejs";

import { ArrowLeft, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppHeader } from "@/components/shell/AppHeader";
import { Badge, Button, ButtonLink, Card, Input, Select, Textarea } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { createStudyAd } from "./actions";

export default async function PostStudyAdPage() {
  const session = await auth();
  if (!session?.user?.id && !session?.user?.email) redirect("/login");

  const user = session.user.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { profile: true },
      })
    : await prisma.user.findUnique({
        where: { email: session.user.email || "" },
        include: { profile: true },
      });

  if (!user) redirect("/login");

  return (
    <div className="min-h-dvh bg-canvas font-grotesk text-fg">
      <AppHeader
        actions={
          <ButtonLink href="/matching" variant="secondary" icon={<ArrowLeft size={18} />}>
            Matching
          </ButtonLink>
        }
      />

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 pb-28 md:px-8 md:pb-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card as="section" shadow="lg" padding="lg" className="flex flex-col gap-8" aria-labelledby="ad-title">
          <div className="flex flex-col gap-3">
            <Badge tone="focus">Study ad</Badge>
            <h1 id="ad-title" className="m-0 text-4xl leading-[1.05] font-bold tracking-tight md:text-5xl">
              Post your study ad
            </h1>
            <p className="m-0 max-w-2xl text-lg text-fg-muted">
              Tell classmates what you are studying, when you are free, and what kind of partner or group you want.
            </p>
          </div>

          <form action={createStudyAd} className="flex flex-col gap-5">
            <Input id="ad-title-input" name="title" label="Title" required maxLength={100} placeholder="Need a React study partner for finals" />
            <Input
              id="ad-subjects"
              name="subjects"
              label="Subjects or skills"
              required
              maxLength={200}
              defaultValue={user.profile?.interests || user.profile?.major || ""}
              placeholder="AI, Data Science, Algorithms"
            />
            <div className="grid gap-5 md:grid-cols-2">
              <Input
                id="ad-availability"
                name="availability"
                label="Availability"
                required
                maxLength={200}
                defaultValue={user.profile?.availability || ""}
                placeholder="Weeknights after 8 PM"
              />
              <Select id="ad-mode" name="mode" label="Mode" defaultValue="ANY">
                <option value="ANY">Any</option>
                <option value="ONLINE">Online</option>
                <option value="IN_PERSON">In person</option>
                <option value="HYBRID">Hybrid</option>
              </Select>
            </div>
            <Textarea
              id="ad-description"
              name="description"
              label="What should partners know?"
              required
              maxLength={800}
              rows={6}
              placeholder="Share your goal, exam date, study style, and what kind of partner would be a good fit."
            />
            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" variant="match" size="lg" icon={<Plus size={20} />}>
                Publish study ad
              </Button>
              <ButtonLink href="/matching" variant="secondary" size="lg">
                Cancel
              </ButtonLink>
            </div>
          </form>
        </Card>

        <aside aria-label="Tips" className="flex flex-col gap-4">
          {[
            ["Good titles", "Mention the subject and your immediate goal.", "chat"],
            ["Useful details", "Add schedule, study mode and preferred pace.", "live"],
            ["Better matches", "Keep profile interests current so your card ranks well.", "match"],
          ].map(([title, body, tone]) => (
            <Card key={title} tone={tone as "chat" | "live" | "match"} padding="sm" shadow="sm">
              <h2 className="m-0 text-lg font-bold">{title}</h2>
              <p className="m-0 mt-1">{body}</p>
            </Card>
          ))}
        </aside>
      </main>
    </div>
  );
}
