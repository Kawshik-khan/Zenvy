import React from 'react';
export const runtime = 'nodejs';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProfileClient from './ProfileClient';
import Sidebar from '@/app/components/Sidebar';
import { getStudyMetrics } from '@/lib/study-metrics';
import { revalidatePath } from 'next/cache';

function cleanText(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : '';
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true },
  });

  if (!user) redirect('/login');

  async function updateProfile(formData: FormData) {
    "use server";
    try {
      const session = await auth();
      if (!session?.user?.id) return { success: false, error: 'You must be signed in to save your profile.' };

      const name = cleanText(formData.get('name'));
      const bio = cleanText(formData.get('bio'));
      const major = cleanText(formData.get('major'));
      const college = cleanText(formData.get('college'));
      const semesterValue = cleanText(formData.get('semester'));
      const studyStyle = cleanText(formData.get('studyStyle'));
      const interests = cleanText(formData.get('interests'));
      const availability = cleanText(formData.get('availability'));
      const matchingAvailable = formData.get('matchingAvailable') === 'on';
      const semester = semesterValue ? Number(semesterValue) : null;

      if (!name) return { success: false, error: 'Full name is required.' };
      if (semester !== null && (!Number.isInteger(semester) || semester < 1 || semester > 12)) {
        return { success: false, error: 'Semester must be between 1 and 12.' };
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: { name }
      });

      await prisma.profile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          college: college || null,
          major: major || 'Undeclared',
          semester,
          studyStyle: studyStyle || null,
          interests: interests || null,
          availability: availability || null,
          matchingAvailable,
          bio: bio || null,
        },
        update: {
          college: college || null,
          major: major || null,
          semester,
          studyStyle: studyStyle || null,
          interests: interests || null,
          availability: availability || null,
          matchingAvailable,
          bio: bio || null,
        }
      });

      revalidatePath('/profile');
      revalidatePath('/matching');
      return { success: true };
    } catch (error: any) {
      console.error('Profile save failed:', error);
      return { success: false, error: error.message || 'Unable to save profile.' };
    }
  }

  const metrics = await getStudyMetrics(user.id);

  return (
    <div className="app-aurora antialiased selection:bg-primary/30 selection:text-on-surface">
      <Sidebar />
      <ProfileClient user={user} metrics={metrics} updateProfile={updateProfile} />
    </div>
  );
}
