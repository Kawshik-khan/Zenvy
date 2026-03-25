import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true }
    });

    if (!user?.profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Transform interests from string to array for the frontend
    const profile = {
      ...user.profile,
      name: user.name,
      interests: user.profile.interests ? user.profile.interests.split(',').map((i: string) => i.trim()) : []
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Profile GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedProfile = await prisma.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        college: data.college,
        major: data.major,
        semester: parseInt(data.semester),
        bio: data.bio,
        interests: Array.isArray(data.interests) ? data.interests.join(', ') : data.interests,
        availability: data.availability,
      },
      update: {
        college: data.college,
        major: data.major,
        semester: parseInt(data.semester),
        bio: data.bio,
        interests: Array.isArray(data.interests) ? data.interests.join(', ') : data.interests,
        availability: data.availability,
      }
    });

    return NextResponse.json({ message: 'Profile updated successfully', data: updatedProfile });
  } catch (error) {
    console.error('Profile POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
