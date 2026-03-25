"use client";

import React, { useActionState } from 'react';
import { login } from '@/app/login/actions';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="bg-slate-950 font-body text-slate-100 flex flex-col min-h-screen selection:bg-indigo-500/30 selection:text-white">
      {/* TopNavBar */}
      <header className="bg-slate-950 z-50 border-b border-indigo-500/20">
        <nav className="flex justify-between items-center w-full px-6 md:px-12 py-4 md:py-6 max-w-[1440px] mx-auto">
          <div className="text-2xl font-bold tracking-tighter text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-500">shield</span>
            Zenvy <span className="text-indigo-500 font-light">Admin Portal</span>
          </div>
          <div>
            <Link href="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Return to main site
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-grow flex items-center justify-center relative overflow-hidden py-12 px-6">
        {/* Abstract Background Shapes */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
          <div className="absolute top-[10%] left-[20%] w-[30rem] h-[30rem] bg-indigo-600 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[10%] right-[20%] w-[25rem] h-[25rem] bg-slate-400 rounded-full blur-[100px]"></div>
        </div>

        {/* Login Card */}
        <div className="relative z-10 w-full max-w-[420px]">
          <div className="bg-slate-900 rounded-2xl p-8 md:p-10 shadow-2xl border border-indigo-500/30 relative overflow-hidden">
            {/* Top decorative bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            
            <div className="mb-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-indigo-400 text-3xl">admin_panel_settings</span>
              </div>
              <h1 className="font-headline text-2xl font-bold tracking-tight mb-2 text-white">System Access</h1>
              <p className="text-slate-400 text-sm">Authorized personnel only.</p>
            </div>

            <form action={formAction} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1" htmlFor="email">Admin Email</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl transition-colors group-focus-within:text-indigo-400">badge</span>
                  <input className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none text-white shadow-inner" id="email" name="email" placeholder="admin@zenvy.edu" type="email" required />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider" htmlFor="password">Security Key</label>
                </div>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl transition-colors group-focus-within:text-indigo-400">key</span>
                  <input className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none text-white shadow-inner" id="password" name="password" placeholder="••••••••" type="password" required />
                </div>
              </div>
              
              {/* Optional Redirect override for the server action */}
              <input type="hidden" name="callbackUrl" value="/zenvy-admin" />

              {state && (
                <div className="text-red-400 text-xs font-medium bg-red-950/50 p-3 rounded-lg border border-red-500/30 flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm shrink-0">warning</span>
                  {state}
                </div>
              )}

              {/* Sign In Action */}
              <div className="pt-4">
                <button disabled={pending} className="w-full bg-indigo-600 text-white flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-indigo-900/50 hover:bg-indigo-500 transition-all active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100" type="submit">
                  {pending ? (
                    'Verifying...'
                  ) : (
                    <>
                      <span>Authorize</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
