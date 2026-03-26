'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function uploadProfilePicture(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }

    const file = formData.get('file') as File;
    if (!file) {
      return { error: 'No file provided' };
    }

    const userId = session.user.id;
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Convert File to ArrayBuffer for Supabase Upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase Upload Error:', uploadError);
      return { error: `Upload failed: ${uploadError.message}` };
    }

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update Prisma User & Profile
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { image: publicUrl },
      }),
      prisma.profile.update({
        where: { userId: userId },
        data: { profileImage: publicUrl },
      }),
    ]);

    revalidatePath('/profile');
    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error('Profile Upload Server Action Error:', error);
    return { error: error.message || 'An unexpected error occurred' };
  }
}
