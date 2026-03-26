"use client";

import React, { useActionState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { login } from './actions';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);
  const searchParams = useSearchParams();
  const message = searchParams?.get('message');
  const error = searchParams?.get('error');


  return (
    <div className="bg-background font-body text-on-surface flex flex-col min-h-screen selection:bg-primary-container selection:text-on-primary-container">
      {/* TopNavBar */}
      <header className="bg-[#f5f7f9] dark:bg-slate-950 z-50 animate-fade-in mb-4">
        <nav className="flex justify-between items-center w-full px-6 md:px-12 py-4 md:py-6 max-w-[1440px] mx-auto">
          <div className="text-2xl font-bold tracking-tighter text-[#2c2f31] dark:text-slate-100">
            Zenvy
          </div>
          <div className="hidden md:flex items-center gap-8 font-['Inter'] text-sm font-medium tracking-tight">
            <Link className="text-[#595c5e] dark:text-slate-400 hover:text-[#4647d3] transition-colors duration-200" href="/">Explore</Link>
            <Link className="text-[#595c5e] dark:text-slate-400 hover:text-[#4647d3] transition-colors duration-200" href="/">Community</Link>
            <Link className="text-[#595c5e] dark:text-slate-400 hover:text-[#4647d3] transition-colors duration-200" href="/">Resources</Link>
          </div>
          <div>
            <Link href="/register" className="inline-block bg-gradient-to-r from-primary to-secondary text-on-primary px-6 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-all active:scale-95 shadow-md shadow-primary/10">
              Create Account
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-grow flex items-center justify-center relative overflow-hidden py-12 px-6">
        {/* Abstract Academic Background Shapes */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-5%] w-[35rem] h-[35rem] bg-secondary/5 rounded-full blur-[100px]"></div>
          <div className="absolute top-1/4 right-10 opacity-10">
            <span className="material-symbols-outlined text-[12rem] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
          </div>
          <div className="absolute bottom-1/4 left-10 opacity-10">
            <span className="material-symbols-outlined text-[10rem] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="relative z-10 w-full max-w-[480px] animate-scale-in">
          <div className="bg-surface-container-lowest rounded-xl p-6 md:p-14 shadow-[0_20px_40px_rgba(70,71,211,0.06)] border border-outline-variant/10 hover-lift transition-all duration-500">
            <div className="mb-10 text-center">
              <h1 className="text-on-surface font-headline text-3xl font-bold tracking-tight mb-2">Welcome Back</h1>
              <p className="text-on-surface-variant text-sm">Enter your credentials to access your sanctuary.</p>
            </div>

            <form action={formAction} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1" htmlFor="email">Email Address</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl transition-colors group-focus-within:text-primary">alternate_email</span>
                  <input className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-transparent rounded-full text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-none text-on-surface" id="email" name="email" placeholder="scholar@nexus.edu" type="email" required />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="password">Password</label>
                  <a className="text-xs text-primary font-medium hover:underline" href="#">Forgot?</a>
                </div>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl transition-colors group-focus-within:text-primary">lock</span>
                  <input className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-transparent rounded-full text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-none text-on-surface" id="password" name="password" placeholder="••••••••" type="password" required />
                </div>
              </div>
              
              {message === 'check-email' && (
                <div className="text-emerald-600 text-sm font-medium bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-start gap-3">
                  <span className="material-symbols-outlined text-xl">mark_email_read</span>
                  <div>
                    <p className="font-bold">Check your inbox!</p>
                    <p className="text-xs opacity-90">We've sent a verification link to your email. Please click it to activate your account.</p>
                  </div>
                </div>
              )}

              {state && (
                <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">error</span>
                  {state}
                </div>
              )}

              {error === 'Verification' && (
                <div className="text-amber-600 text-sm font-medium bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">warning</span>
                  Verification failed or link expired.
                </div>
              )}

              {/* Sign In Action */}
              <div className="pt-2">
                <button disabled={pending} className="w-full bg-gradient-to-r from-primary to-secondary text-on-primary py-4 rounded-full font-bold text-base shadow-lg shadow-primary/20 hover:opacity-95 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-70" type="submit">
                  {pending ? 'Signing In...' : 'Sign In'}
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-outline-variant/15"></div>
                <span className="flex-shrink mx-4 text-xs font-medium text-on-surface-variant uppercase tracking-widest">or</span>
                <div className="flex-grow border-t border-outline-variant/15"></div>
              </div>

              {/* Social Login */}
              <button className="w-full flex items-center justify-center gap-3 bg-surface-container-low text-on-surface py-4 rounded-full font-semibold text-sm hover:bg-surface-container transition-colors border border-outline-variant/5" type="button">
                <img alt="Google Logo" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSVQwVdlAuQpxJ1ysyDo0VFTfa1_KXYWj98Tqoret-hkztzjqxCUenCrLzMrpp1A0swDEPtAn9XO9uPIOwSRimOk_mVY5c6Mxn6U2S9WNq0segh9ghfnq070alUkSnPzr_0LOvc7ntq3WkzCU4Cl2ovG3XR821P8m6Vpehf-9eQBPPKNJq_LytKkfvLBzZ0aDk71Z1lYHXwhrsFLQu4MI7rSGXY32MnXVikCWr7q83TStNWGQTnz0bHYU_zpJDowBfk9WUkki4cuY" />
                Continue with Google
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-sm text-on-surface-variant">
                Don't have an account? 
                <Link className="text-primary font-bold hover:underline ml-1" href="/register">Sign Up</Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#f5f7f9] dark:bg-slate-950 border-t border-[#abadaf]/15">
        <div className="w-full py-8 md:py-12 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4 max-w-[1440px] mx-auto text-center md:text-left">
          <div className="font-['Inter'] text-xs font-normal text-[#595c5e] dark:text-slate-500">
            &copy; 2024 Zenvy. The Digital Commons for modern scholars.
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-4 md:gap-8 font-['Inter'] text-xs font-normal text-[#595c5e]">
            <a className="hover:text-[#4647d3] dark:hover:text-indigo-300 transition-colors opacity-80 hover:opacity-100" href="#">Privacy Policy</a>
            <a className="hover:text-[#4647d3] dark:hover:text-indigo-300 transition-colors opacity-80 hover:opacity-100" href="#">Terms of Service</a>
            <a className="hover:text-[#4647d3] dark:hover:text-indigo-300 transition-colors opacity-80 hover:opacity-100" href="#">Help Center</a>
            <a className="hover:text-[#4647d3] dark:hover:text-indigo-300 transition-colors opacity-80 hover:opacity-100" href="#">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
