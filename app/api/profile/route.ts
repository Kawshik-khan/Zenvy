import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const profileSchema = z.object({
  college: z.string().max(100).optional().nullable(),
  major: z.string().max(100).optional().nullable(),
  semester: z.coerce.number().min(1).max(12).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  interests: z.union([z.string().max(300), z.array(z.string().max(50))]).optional().nullable(),
  availability: z.string().max(200).optional().nullable(),
});

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
    const validation = profileSchema.safeParse(data);
    
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input data', details: validation.error.format() }, { status: 400 });
    }
    const validData = validation.data;

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
        college: validData.college,
        major: validData.major,
        semester: validData.semester || null,
        bio: validData.bio,
        interests: Array.isArray(validData.interests) ? validData.interests.join(', ') : validData.interests,
        availability: validData.availability,
      },
      update: {
        college: validData.college,
        major: validData.major,
        semester: validData.semester || null,
        bio: validData.bio,
        interests: Array.isArray(validData.interests) ? validData.interests.join(', ') : validData.interests,
        availability: validData.availability,
      }
    });

    return NextResponse.json({ message: 'Profile updated successfully', data: updatedProfile });
  } catch (error) {
    console.error('Profile POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
