"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useTransition } from "react";
import { Alert, Button, Card, Checkbox, Input, Select, Textarea } from "@/components/ui";

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Input id="college" name="college" label="College" required defaultValue={profile?.college || ""} placeholder="BRAC University" />
        <Input id="major" name="major" label="Major" required defaultValue={profile?.major || ""} placeholder="Computer Science" />
        <Select id="semester" name="semester" label="Semester" required defaultValue={profile?.semester || ""}>
          <option value="">Select semester</option>
          {Array.from({ length: 12 }, (_, index) => index + 1).map((semester) => (
            <option key={semester} value={semester}>
              Semester {semester}
            </option>
          ))}
        </Select>
        <Select id="studyStyle" name="studyStyle" label="Study style" defaultValue={profile?.studyStyle || ""}>
          <option value="">Select study style</option>
          <option value="Focused solo work">Focused solo work</option>
          <option value="Pair programming">Pair programming</option>
          <option value="Group discussion">Group discussion</option>
          <option value="Exam prep">Exam prep</option>
          <option value="Project collaboration">Project collaboration</option>
        </Select>
      </div>

      <Input
        id="interests"
        name="interests"
        label="Interests"
        required
        defaultValue={profile?.interests || ""}
        placeholder="React, Algorithms, Physics"
        hint="Separate topics with commas so we can find better partners and groups."
      />

      <Textarea
        id="availability"
        name="availability"
        label="Availability"
        required
        rows={3}
        defaultValue={profile?.availability || ""}
        placeholder="Weeknights after 8 PM, Friday morning, weekend project sessions..."
      />

      <Textarea
        id="bio"
        name="bio"
        label="Short bio"
        rows={3}
        defaultValue={profile?.bio || ""}
        placeholder="Share your study goals and what kind of classmates you want to work with."
      />

      <Card padding="sm" shadow="none" tone="paper">
        <Checkbox
          id="matchingAvailable"
          name="matchingAvailable"
          defaultChecked={profile?.matchingAvailable ?? true}
          label={
            <span>
              <span className="block font-bold">Available for matching</span>
              <span className="mt-0.5 block text-sm text-fg-muted">Keep this on so classmates can find your profile and send match requests.</span>
            </span>
          }
        />
      </Card>

      {result &&
        (result.success ? (
          <Alert tone="success">Profile completed. Taking you to the dashboard...</Alert>
        ) : (
          <Alert tone="error">{result.error || "Failed to save profile."}</Alert>
        ))}

      <Button type="submit" variant="match" size="lg" fullWidth loading={isPending} icon={isPending ? undefined : <ArrowRight size={20} />}>
        {isPending ? "Saving" : "Complete profile"}
      </Button>
    </form>
  );
}
