'use server';

import { auth, signOut } from '@/auth';
import { checkDeletionRequest, deleteAccount } from '@/lib/account-deletion';

/** Deletes the signed-in account, then signs out. Returns an error message when the request is refused. */
export async function deleteAccountAction(formData: FormData): Promise<{ error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'You must be signed in to delete your account.' };

  const confirmation = String(formData.get('confirmation') ?? '');
  const password = String(formData.get('password') ?? '') || null;
  const problem = await checkDeletionRequest(session.user.id, confirmation, password);
  if (problem) return { error: problem };

  try {
    await deleteAccount(session.user.id);
  } catch (error) {
    console.error('Account deletion failed:', error);
    return { error: 'We could not delete your account. Please try again.' };
  }

  // Throws the redirect, so nothing after this runs.
  await signOut({ redirectTo: '/?accountDeleted=1' });
  return { error: '' };
}
