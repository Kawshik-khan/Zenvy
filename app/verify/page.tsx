import React from 'react';
import { prisma } from "@/lib/prisma";
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const runtime = 'nodejs';

export default async function VerifyPage(
  props: {
    searchParams: Promise<{ token?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const token = searchParams.token;

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface p-4">
        <div className="bg-surface-container-low p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-outline-variant/20">
          <span className="material-symbols-outlined text-6xl text-error mb-4">error</span>
          <h1 className="text-2xl font-black mb-2">Missing Token</h1>
          <p className="text-on-surface-variant mb-6 text-sm">The verification link is invalid. Please check your email again.</p>
          <Link href="/login" className="px-8 py-3 bg-primary text-on-primary rounded-full font-bold inline-block">Back to Login</Link>
        </div>
      </div>
    );
  }

  const existingToken = await prisma.verificationToken.findUnique({
    where: { token }
  });

  if (!existingToken || existingToken.expires < new Date()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface p-4">
        <div className="bg-surface-container-low p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-outline-variant/20">
          <span className="material-symbols-outlined text-6xl text-error mb-4">expired</span>
          <h1 className="text-2xl font-black mb-2">Link Expired</h1>
          <p className="text-on-surface-variant mb-6 text-sm">This verification link has expired or has already been used.</p>
          <Link href="/register" className="px-8 py-3 bg-primary text-on-primary rounded-full font-bold inline-block">Try Registering Again</Link>
        </div>
      </div>
    );
  }

  // Update user and delete token
  const user = await prisma.user.findUnique({
    where: { email: existingToken.email }
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface p-4">
        <div className="bg-surface-container-low p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-outline-variant/20">
          <span className="material-symbols-outlined text-6xl text-error mb-4">person_off</span>
          <h1 className="text-2xl font-black mb-2">User Not Found</h1>
          <p className="text-on-surface-variant mb-6 text-sm">We couldn't find a user associated with this verification token.</p>
        </div>
      </div>
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() }
  });

  await prisma.verificationToken.delete({
    where: { id: existingToken.id }
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-surface p-4">
      <div className="bg-surface-container-lowest p-10 rounded-3xl shadow-2xl max-w-md w-full text-center border-4 border-primary-container/20">
        <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <span className="material-symbols-outlined text-4xl text-primary font-black">check_circle</span>
        </div>
        <h1 className="text-3xl font-black text-on-surface tracking-tighter mb-4 leading-tight">Account Verified!</h1>
        <p className="text-on-surface-variant mb-10 text-base leading-relaxed">Great news! Your Zenvy account is now active. You can now login and join your peers.</p>
        <Link href="/login" className="px-10 py-4 bg-primary text-on-primary rounded-full font-black text-sm shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all inline-block w-full">Sign In Now</Link>
      </div>
    </div>
  );
}
