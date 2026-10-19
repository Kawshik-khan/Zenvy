import React from "react";
export const runtime = "nodejs";

import { CalendarClock, GraduationCap, Heart } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { Badge, ButtonLink, Card, toneBg } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { cleanText, isProfileComplete } from "@/lib/profile-completion";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fonboarding");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true },
  });

  if (!user) redirect("/login?callbackUrl=%2Fonboarding");
  if (isProfileComplete(user.profile)) redirect("/dashboard");

  async function completeProfile(formData: FormData) {
    "use server";

    try {
      const session = await auth();
      if (!session?.user?.id) return { success: false, error: "You must be signed in to complete your profile." };

      const college = cleanText(formData.get("college"));
      const major = cleanText(formData.get("major"));
      const semesterValue = cleanText(formData.get("semester"));
      const studyStyle = cleanText(formData.get("studyStyle"));
      const interests = cleanText(formData.get("interests"));
      const availability = cleanText(formData.get("availability"));
      const bio = cleanText(formData.get("bio"));
      const matchingAvailable = formData.get("matchingAvailable") === "on";
      const semester = semesterValue ? Number(semesterValue) : null;

      if (!college) return { success: false, error: "College is required." };
      if (!major) return { success: false, error: "Major is required." };
      if (!interests) return { success: false, error: "Add at least one interest." };
      if (!availability) return { success: false, error: "Availability is required." };
      if (semester === null || !Number.isInteger(semester) || semester < 1 || semester > 12) {
        return { success: false, error: "Semester must be between 1 and 12." };
      }

      await prisma.profile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          college,
          major,
          semester,
          studyStyle: studyStyle || null,
          interests,
          availability,
          bio: bio || null,
          matchingAvailable,
        },
        update: {
          college,
          major,
          semester,
          studyStyle: studyStyle || null,
          interests,
          availability,
          bio: bio || null,
          matchingAvailable,
        },
      });

      return { success: true };
    } catch (error: any) {
      console.error("Onboarding save failed:", error);
      return { success: false, error: error.message || "Unable to complete profile." };
    }
  }

  return (
    <AuthShell
      width="xl"
      action={
        <ButtonLink href="/profile" variant="ghost" size="sm">
          Profile
        </ButtonLink>
      }
    >
      <div className="grid items-start gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="flex flex-col gap-5">
          <Badge tone="focus">Almost done</Badge>
          <h1 className="m-0 font-grotesk text-4xl leading-[1.05] font-bold tracking-tight md:text-5xl">Complete your study profile.</h1>
          <p className="m-0 leading-relaxed text-fg-muted">
            These details power partner matching, group suggestions and what others see on your profile.
          </p>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {[
              { icon: <GraduationCap size={22} />, label: "Academic context", tone: "chat" as const },
              { icon: <Heart size={22} />, label: "Better partner matches", tone: "match" as const },
              { icon: <CalendarClock size={22} />, label: "Availability-aware suggestions", tone: "live" as const },
            ].map((item) => (
              <li key={item.label}>
                <Card padding="sm" shadow="sm" className="flex items-center gap-3">
                  <span aria-hidden="true" className={`inline-flex size-11 shrink-0 items-center justify-center rounded-nb border-nb text-ink ${toneBg[item.tone]}`}>
                    {item.icon}
                  </span>
                  <span className="font-bold">{item.label}</span>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <Card shadow="lg" padding="lg" className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h2 className="m-0 font-grotesk text-2xl font-bold">What we need</h2>
            <p className="m-0 text-fg-muted">You can change any of this later in your profile settings.</p>
          </div>
          <OnboardingForm user={user} completeProfile={completeProfile} />
        </Card>
      </div>
    </AuthShell>
  );
}
