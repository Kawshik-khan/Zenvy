import React from "react";
export const runtime = "nodejs";

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
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
    <div className="app-aurora min-h-screen selection:bg-primary/30 selection:text-on-surface">
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-6 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-secondary font-black text-white shadow-[0_0_18px_rgba(124,131,255,0.45)]">
            Z
          </div>
          <span className="text-2xl font-bold tracking-tight text-on-surface">Zenvy</span>
        </Link>
        <Link href="/profile" className="text-sm font-bold text-on-surface-variant transition-colors hover:text-primary">
          Profile
        </Link>
      </nav>

      <main className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 pb-12 md:grid-cols-[0.8fr_1.2fr] md:px-8">
        <section className="glass-panel-subtle rounded-[32px] p-6 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Almost Done</p>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-on-surface md:text-5xl">
            Complete your study profile.
          </h1>
          <p className="mt-4 text-sm leading-6 text-on-surface-variant">
            These details power partner matching, group suggestions, public profile previews, and study discovery.
          </p>
          <div className="mt-8 grid gap-3">
            {[
              ["school", "Academic context"],
              ["favorite", "Better partner matches"],
              ["schedule", "Availability-aware recommendations"],
            ].map(([icon, label]) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl bg-surface-container-low/60 p-4">
                <span className="material-symbols-outlined text-primary">{icon}</span>
                <span className="text-sm font-bold text-on-surface">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-[32px] p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-on-surface">Needed information</h2>
            <p className="mt-2 text-sm text-on-surface-variant">You can update this later from Profile Settings.</p>
          </div>
          <OnboardingForm user={user} completeProfile={completeProfile} />
        </section>
      </main>
    </div>
  );
}
