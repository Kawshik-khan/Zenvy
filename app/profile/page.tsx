import React from 'react';
export const runtime = 'nodejs';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProfileClient from './ProfileClient';
import Sidebar from '@/app/components/Sidebar';
import { getStudyMetrics } from '@/lib/study-metrics';
import { revalidatePath } from 'next/cache';

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
    const session = await auth();
    if (!session?.user?.id) return;

    const name = formData.get('name') as string;
    const bio = formData.get('bio') as string;
    const major = formData.get('major') as string;
    const college = formData.get('college') as string;
    const semesterValue = formData.get('semester') as string;
    const studyStyle = formData.get('studyStyle') as string;
    const interests = formData.get('interests') as string;
    const availability = formData.get('availability') as string;
    const matchingAvailable = formData.get('matchingAvailable') === 'on';
    const semester = semesterValue ? Number(semesterValue) : null;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name.trim() || null }
    });

    await prisma.profile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        college: college.trim() || null,
        major: major.trim() || 'Undeclared',
        semester,
        studyStyle: studyStyle.trim() || null,
        interests: interests.trim() || null,
        availability: availability.trim() || null,
        matchingAvailable,
        bio: bio.trim() || null,
      },
      update: {
        college: college.trim() || null,
        major: major.trim() || null,
        semester,
        studyStyle: studyStyle.trim() || null,
        interests: interests.trim() || null,
        availability: availability.trim() || null,
        matchingAvailable,
        bio: bio.trim() || null,
      }
    });

    revalidatePath('/profile');
    revalidatePath('/matching');
  }

  const metrics = await getStudyMetrics(user.id);

  return (
    <div className="app-aurora antialiased selection:bg-primary/30 selection:text-on-surface">
      <Sidebar />
      <ProfileClient user={user} metrics={metrics} updateProfile={updateProfile} />
    </div>
  );
}
