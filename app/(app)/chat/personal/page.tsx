import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { resolveDmConversation } from '@/lib/conversations';

export const runtime = 'nodejs';

export default async function PersonalInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const resolvedParams = await searchParams;
  if (!resolvedParams.id) redirect('/chat');

  try {
    const conversation = await resolveDmConversation(session.user.id, resolvedParams.id);
    redirect(`/chat?conversation=${conversation.id}`);
  } catch {
    redirect('/chat');
  }
}
