'use server';

import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';
import { getSafeFileExtension, validateChatAttachment } from '@/lib/upload-validation';

export async function uploadChatAttachment(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }

    const file = formData.get('file') as File;
    if (!file) {
      return { error: 'No file provided' };
    }

    const validationError = validateChatAttachment(file);
    if (validationError) return { error: validationError };

    const fileExt = getSafeFileExtension(file.name);
    const fileName = `${session.user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(fileName, buffer, {
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Supabase Upload Error:', uploadError);
      return { error: `Upload failed: ${uploadError.message}` };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(fileName);

    let fileType = 'generic';
    if (file.type.startsWith('image/')) fileType = 'image';
    if (file.type.startsWith('video/')) fileType = 'video';
    if (file.type === 'application/pdf') fileType = 'pdf';

    return { 
      success: true, 
      url: publicUrl,
      fileName: file.name.replace(/[^\w.\- ]/g, '').slice(0, 120) || 'attachment',
      fileType: fileType
    };
  } catch (error: any) {
    console.error('Attachment Upload Server Action Error:', error);
    return { error: error.message || 'An unexpected error occurred' };
  }
}
