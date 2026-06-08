'use client';

import React, { useState, useRef, useTransition } from 'react';
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
};

export default function ProfileClient({ user, metrics, updateProfile }: ProfileClientProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  const [isSaving, startSaving] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentBio = user.profile?.bio || "";
  const currentMatchingAvailable = user.profile?.matchingAvailable ?? true;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
      <main className="app-main">
        <div className="app-content p-4 md:p-12 max-w-6xl mx-auto">
          <div className="mb-8 md:mb-12">
            <h2 className="text-3xl md:text-[2.75rem] font-black tracking-tighter text-on-surface leading-tight mb-2">Profile Settings</h2>
            <p className="text-on-surface-variant text-base md:text-lg">Manage your digital presence and academic preferences.</p>
          </div>

          <form id="account-settings" onSubmit={handleSubmit} className="scroll-mt-28">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4 space-y-8">
                <div className="glass-panel-subtle rounded-[28px] p-8 flex flex-col items-center text-center">
                  <div className="relative group cursor-pointer mb-6" onClick={() => fileInputRef.current?.click()}>
                    <img alt="Profile" className="w-32 h-32 rounded-xl object-cover ring-4 ring-primary/20 group-hover:opacity-80 transition-all" src={user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=random&size=128`} />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-primary/80 text-white rounded-full p-2">
                        <span className="material-symbols-outlined">photo_camera</span>
                      </div>
                    </div>
                    {isUploading && (
                      <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-xl">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
                      </div>
                    )}
                  </div>

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />

                  {uploadError && <p className="text-red-400 text-[10px] mb-2 font-bold">{uploadError}</p>}

                  <h3 className="text-xl font-bold mb-1 text-on-surface">{user.name || 'Scholar'}</h3>
                  <p className="text-on-surface-variant text-sm mb-5">{user.profile?.major || 'Unspecified'}</p>

                  <div className="w-full rounded-2xl bg-surface-container/70 p-4 text-left mb-5">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Current Rank</p>
                        <p className="text-sm font-black text-secondary">{metrics.levelTitle}</p>
                      </div>
                      <div className="flex items-center gap-1 text-on-surface">
                        <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                        <span className="text-xl font-black">{metrics.currentStreakDays}</span>
                        <span className="text-[10px] font-bold text-on-surface-variant">days</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-on-surface-variant mb-1.5">
                      <span>{metrics.xpForCurrentLevel.toLocaleString()} / {metrics.xpForNextLevel.toLocaleString()} XP</span>
                      <span>{metrics.totalXp.toLocaleString()} total</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-tertiary"
                        style={{ width: `${metrics.levelProgressPercent}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="w-full flex justify-center gap-2">
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="px-6 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      {isUploading ? 'Uploading...' : 'Change Photo'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-10">
                <section className="glass-panel-subtle rounded-[28px] p-8">
                  <h4 className="text-lg font-bold mb-8 text-on-surface">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 md:col-span-1 space-y-2">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Full Name</label>
                      <input name="name" className="app-input py-3 px-4" type="text" defaultValue={user.name || ''} required />
                    </div>
                    <div className="col-span-2 md:col-span-1 space-y-2">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">College</label>
                      <input name="college" className="app-input py-3 px-4" type="text" defaultValue={user.profile?.college || ''} placeholder="e.g. BRAC University" />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Short Bio</label>
                      <textarea name="bio" className="app-input py-3 px-4 resize-none" rows={3} defaultValue={currentBio} placeholder="Share your study goals, collaboration style, and what you are working on."></textarea>
                    </div>
                  </div>
                </section>

                <section className="glass-panel-subtle rounded-[28px] p-8">
                  <h4 className="text-lg font-bold mb-8 text-on-surface">Academic Details</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 md:col-span-1 space-y-2">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Major</label>
                      <input name="major" className="app-input py-3 px-4" type="text" defaultValue={user.profile?.major || ''} placeholder="e.g. Computer Science" />
                    </div>
                    <div className="col-span-2 md:col-span-1 space-y-2">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Semester</label>
                      <select name="semester" className="app-input py-3 px-4" defaultValue={user.profile?.semester || ''}>
                        <option value="">Select semester</option>
                        {Array.from({ length: 12 }, (_, index) => index + 1).map((semester) => (
                          <option key={semester} value={semester}>Semester {semester}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Study Style</label>
                      <select name="studyStyle" className="app-input py-3 px-4" defaultValue={user.profile?.studyStyle || ''}>
                        <option value="">Select study style</option>
                        <option value="Focused solo work">Focused solo work</option>
                        <option value="Pair programming">Pair programming</option>
                        <option value="Group discussion">Group discussion</option>
                        <option value="Exam prep">Exam prep</option>
                        <option value="Project collaboration">Project collaboration</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section className="glass-panel-subtle rounded-[28px] p-8">
                  <h4 className="text-lg font-bold mb-8 text-on-surface">Matching Preferences</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Interests</label>
                      <input
                        name="interests"
                        className="app-input py-3 px-4"
                        type="text"
                        defaultValue={user.profile?.interests || ''}
                        placeholder="React, Algorithms, Physics"
                      />
                      <p className="text-xs leading-5 text-on-surface-variant">Use comma-separated topics so matching and search can rank study partners accurately.</p>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Availability</label>
                      <textarea
                        name="availability"
                        className="app-input py-3 px-4 resize-none"
                        rows={3}
                        defaultValue={user.profile?.availability || ''}
                        placeholder="Weeknights after 8 PM, Friday morning, weekend project sessions..."
                      ></textarea>
                    </div>
                    <label className="col-span-2 flex cursor-pointer items-start gap-4 rounded-2xl border border-outline-variant/30 bg-surface-container-low/50 p-4">
                      <input
                        name="matchingAvailable"
                        type="checkbox"
                        defaultChecked={currentMatchingAvailable}
                        className="mt-1 h-5 w-5 rounded border-outline-variant accent-primary"
                      />
                      <span>
                        <span className="block text-sm font-black text-on-surface">Available for matching</span>
                        <span className="mt-1 block text-xs leading-5 text-on-surface-variant">Turn this off to hide your profile from partner recommendations while keeping your account active.</span>
                      </span>
                    </label>
                    <div className="col-span-2 rounded-2xl bg-surface-container-low/60 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Public profile note</p>
                      <p className="mt-2 text-sm leading-6 text-on-surface-variant">Matched and discoverable students can review your public academic profile before sending or accepting a request. Email and private account details are not shown.</p>
                    </div>
                  </div>
                </section>

                <div className="flex flex-col items-stretch gap-4 pb-12 sm:flex-row sm:items-center sm:justify-end">
                  {saveResult && (
                    <p
                      className={`rounded-2xl px-4 py-3 text-sm font-bold ${
                        saveResult.success
                          ? 'bg-accent-green/10 text-accent-green'
                          : 'bg-error-container text-on-error-container'
                      }`}
                    >
                      {saveResult.success ? 'Profile saved successfully.' : saveResult.error || 'Failed to save profile.'}
                    </p>
                  )}
                  <button type="submit" disabled={isSaving} className="px-10 py-3 app-primary-button rounded-full font-bold disabled:opacity-60">
                    {isSaving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
  );
}
