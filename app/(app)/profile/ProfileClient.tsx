'use client';

import React, { useState, useTransition } from 'react';
import { Flame } from 'lucide-react';
import { Alert, Button, Card, Checkbox, ImageDropzone, Input, isGeneratedAvatar, ProgressBar, Select, Textarea } from '@/components/ui';
import { uploadProfilePicture } from './upload-action';
import type { StudyMetrics } from '@/lib/study-metrics';

type SaveResult = {
  success: boolean;
  error?: string;
};

type ProfileClientProps = {
  user: any;
  metrics: StudyMetrics;
  updateProfile: (formData: FormData) => Promise<SaveResult>;
  /** Rendered full width under the settings, outside the profile form. */
  dangerZone?: React.ReactNode;
};

export default function ProfileClient({ user, metrics, updateProfile, dangerZone }: ProfileClientProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  const [isSaving, startSaving] = useTransition();

  const currentBio = user.profile?.bio || "";
  const currentMatchingAvailable = user.profile?.matchingAvailable ?? true;

  const handleFilesChange = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    const result = await uploadProfilePicture(formData);

    if (result.error) {
      setUploadError(result.error);
    }

    setIsUploading(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveResult(null);
    const formData = new FormData(event.currentTarget);

    startSaving(async () => {
      const result = await updateProfile(formData);
      setSaveResult(result);
    });
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6 pb-28 md:px-8 md:pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="m-0 font-grotesk text-4xl font-bold tracking-tight md:text-5xl">Profile settings</h1>
        <p className="m-0 text-lg text-fg-muted">Manage how you appear to study partners and what you are looking for.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-4">
          <Card tone="card" shadow="md" className="flex flex-col gap-5">
            <ImageDropzone
              id="profile-photo"
              name="photo"
              label="Profile photo"
              variant="avatar"
              maxSizeMB={5}
              initialUrl={isGeneratedAvatar(user?.image) ? null : user?.image}
              error={uploadError ?? undefined}
              disabled={isUploading}
              onFilesChange={handleFilesChange}
            />
            {isUploading && (
              <p role="status" className="m-0 text-sm font-bold">
                Uploading photo
              </p>
            )}
            <div>
              <h2 className="m-0 font-grotesk text-xl font-bold">{user.name || 'Scholar'}</h2>
              <p className="m-0 text-fg-muted">{user.profile?.major || 'No major yet'}</p>
            </div>
          </Card>

          <Card tone="focus" shadow="md" className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="m-0 font-grotesk text-sm font-bold tracking-[0.08em] uppercase">Current rank</p>
                <p className="m-0 font-grotesk text-xl font-bold">{metrics.levelTitle}</p>
              </div>
              <p className="m-0 flex items-center gap-1.5 font-jetbrains text-2xl font-bold">
                <Flame aria-hidden="true" size={22} />
                {metrics.currentStreakDays}
                <span className="font-grotesk text-sm font-bold">{metrics.currentStreakDays === 1 ? 'day' : 'days'}</span>
              </p>
            </div>
            <ProgressBar value={metrics.levelProgressPercent} label="Progress to next level" tone="paper" />
            <p className="m-0 flex justify-between text-sm font-bold">
              <span>
                {metrics.xpForCurrentLevel.toLocaleString()} / {metrics.xpForNextLevel.toLocaleString()} XP
              </span>
              <span>{metrics.totalXp.toLocaleString()} total</span>
            </p>
          </Card>
        </div>

        <form id="account-settings" onSubmit={handleSubmit} className="flex scroll-mt-28 flex-col gap-6 lg:col-span-8">
          <Card tone="card" shadow="md">
            <h2 className="m-0 mb-5 font-grotesk text-2xl font-bold">Personal information</h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Input id="profile-name" name="name" label="Full name" defaultValue={user.name || ''} required />
              <Input id="profile-college" name="college" label="College" defaultValue={user.profile?.college || ''} placeholder="e.g. BRAC University" />
              <Textarea
                id="profile-bio"
                name="bio"
                label="Short bio"
                rows={3}
                defaultValue={currentBio}
                placeholder="Share your study goals, collaboration style, and what you are working on."
                className="md:col-span-2"
              />
            </div>
          </Card>

          <Card tone="card" shadow="md">
            <h2 className="m-0 mb-5 font-grotesk text-2xl font-bold">Academic details</h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Input id="profile-major" name="major" label="Major" defaultValue={user.profile?.major || ''} placeholder="e.g. Computer Science" />
              <Select id="profile-semester" name="semester" label="Semester" defaultValue={user.profile?.semester || ''}>
                <option value="">Select semester</option>
                {Array.from({ length: 12 }, (_, index) => index + 1).map((semester) => (
                  <option key={semester} value={semester}>
                    Semester {semester}
                  </option>
                ))}
              </Select>
              <Select id="profile-style" name="studyStyle" label="Study style" defaultValue={user.profile?.studyStyle || ''} className="md:col-span-2">
                <option value="">Select study style</option>
                <option value="Focused solo work">Focused solo work</option>
                <option value="Pair programming">Pair programming</option>
                <option value="Group discussion">Group discussion</option>
                <option value="Exam prep">Exam prep</option>
                <option value="Project collaboration">Project collaboration</option>
              </Select>
            </div>
          </Card>

          <Card tone="card" shadow="md">
            <h2 className="m-0 mb-5 font-grotesk text-2xl font-bold">Matching preferences</h2>
            <div className="flex flex-col gap-5">
              <Input
                id="profile-interests"
                name="interests"
                label="Interests"
                hint="Comma-separated topics, so matching and search can rank study partners accurately."
                defaultValue={user.profile?.interests || ''}
                placeholder="React, Algorithms, Physics"
              />
              <Textarea
                id="profile-availability"
                name="availability"
                label="Availability"
                rows={3}
                defaultValue={user.profile?.availability || ''}
                placeholder="Weeknights after 8 PM, Friday morning, weekend project sessions"
              />
              <div className="rounded-nb border-2 border-line bg-canvas p-4">
                <Checkbox
                  id="profile-matching"
                  name="matchingAvailable"
                  defaultChecked={currentMatchingAvailable}
                  label={
                    <>
                      <span className="block font-bold">Available for matching</span>
                      <span className="mt-1 block text-sm text-fg-muted">
                        Turn this off to hide your profile from partner recommendations while keeping your account active.
                      </span>
                    </>
                  }
                />
              </div>
              <Alert tone="info" title="Public profile">
                Matched and discoverable students can review your public academic profile before sending or accepting a request. Your email and private account details are not shown.
              </Alert>
            </div>
          </Card>

          <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-end">
            {saveResult && (
              <Alert tone={saveResult.success ? 'success' : 'error'} className="sm:flex-1">
                {saveResult.success ? 'Profile saved.' : saveResult.error || 'Failed to save profile.'}
              </Alert>
            )}
            <Button type="submit" variant="focus" size="lg" loading={isSaving}>
              {isSaving ? 'Saving' : 'Save profile'}
            </Button>
          </div>
        </form>

        {dangerZone}
      </div>
    </main>
  );
}
