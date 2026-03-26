import React from 'react';
export const runtime = 'nodejs';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProfileClient from './ProfileClient';

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

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name }
    });

    await prisma.profile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        major: major || 'Undeclared',
        bio: bio,
      },
      update: {
        major: major,
        bio: bio,
      }
    });

    // In a real app, you might want to redirect or show a success toast.
  }

  return <ProfileClient user={user} updateProfile={updateProfile} />;
}
