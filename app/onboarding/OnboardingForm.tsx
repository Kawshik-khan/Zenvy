"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type SaveResult = {
  success: boolean;
  error?: string;
};

type OnboardingFormProps = {
  user: {
    name: string | null;
    profile: {
      college: string | null;
      major: string | null;
      semester: number | null;
      bio: string | null;
      studyStyle: string | null;
      interests: string | null;
      availability: string | null;
      matchingAvailable: boolean;
    } | null;
  };
  completeProfile: (formData: FormData) => Promise<SaveResult>;
};

export default function OnboardingForm({ user, completeProfile }: OnboardingFormProps) {
  const router = useRouter();
  const [result, setResult] = useState<SaveResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const profile = user.profile;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const nextResult = await completeProfile(formData);
      setResult(nextResult);
      if (nextResult.success) {
        window.setTimeout(() => router.push("/dashboard"), 500);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">College</span>
          <input name="college" required className="app-input px-4 py-3" defaultValue={profile?.college || ""} placeholder="BRAC University" />
        </label>
        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Major</span>
          <input name="major" required className="app-input px-4 py-3" defaultValue={profile?.major || ""} placeholder="Computer Science" />
        </label>
        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Semester</span>
          <select name="semester" required className="app-input px-4 py-3" defaultValue={profile?.semester || ""}>
            <option value="">Select semester</option>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((semester) => (
              <option key={semester} value={semester}>
                Semester {semester}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Study Style</span>
          <select name="studyStyle" className="app-input px-4 py-3" defaultValue={profile?.studyStyle || ""}>
            <option value="">Select study style</option>
            <option value="Focused solo work">Focused solo work</option>
            <option value="Pair programming">Pair programming</option>
            <option value="Group discussion">Group discussion</option>
            <option value="Exam prep">Exam prep</option>
            <option value="Project collaboration">Project collaboration</option>
          </select>
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Interests</span>
        <input
          name="interests"
          required
          className="app-input px-4 py-3"
          defaultValue={profile?.interests || ""}
          placeholder="React, Algorithms, Physics"
        />
        <span className="block text-xs text-on-surface-variant">Use comma-separated topics so recommendations can find better partners and groups.</span>
      </label>

      <label className="block space-y-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Availability</span>
        <textarea
          name="availability"
          required
          className="app-input h-24 resize-none px-4 py-3"
          defaultValue={profile?.availability || ""}
          placeholder="Weeknights after 8 PM, Friday morning, weekend project sessions..."
        />
      </label>

      <label className="block space-y-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Short Bio</span>
        <textarea
          name="bio"
          className="app-input h-24 resize-none px-4 py-3"
          defaultValue={profile?.bio || ""}
          placeholder="Share your study goals and what kind of classmates you want to work with."
        />
      </label>

      <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-outline-variant/30 bg-surface-container-low/50 p-4">
        <input
          name="matchingAvailable"
          type="checkbox"
          defaultChecked={profile?.matchingAvailable ?? true}
          className="mt-1 h-5 w-5 rounded border-outline-variant accent-primary"
        />
        <span>
          <span className="block text-sm font-black text-on-surface">Available for matching</span>
          <span className="mt-1 block text-xs leading-5 text-on-surface-variant">Keep this on so classmates can discover your profile and send match requests.</span>
        </span>
      </label>

      {result && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-bold ${result.success ? "bg-accent-green/10 text-accent-green" : "bg-error-container text-on-error-container"}`}>
          {result.success ? "Profile completed successfully. Taking you to the dashboard..." : result.error || "Failed to save profile."}
        </div>
      )}

      <button disabled={isPending} className="app-primary-button flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-black disabled:opacity-60">
        <span>{isPending ? "Saving..." : "Complete Profile"}</span>
        <span className="material-symbols-outlined text-lg">arrow_forward</span>
      </button>
    </form>
  );
}
