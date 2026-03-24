"use client";

import React, { useActionState } from 'react';
import { signUp } from './actions';
import Link from 'next/link';

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(signUp, null);

  return (
    <div className="bg-surface text-on-surface min-h-screen selection:bg-primary-container selection:text-on-primary-container">
      {/* Top Navigation */}
      <nav className="w-full top-0 z-40 no-border bg-[#f5f7f9] dark:bg-slate-950">
        <div className="flex justify-between items-center px-4 md:px-8 py-4 md:py-6 max-w-[1440px] mx-auto">
          <div className="text-2xl font-bold tracking-tighter text-[#2c2f31] dark:text-slate-100 font-['Inter']">Zenvy</div>
          <div className="flex items-center gap-8">
            <Link className="text-[#595c5e] dark:text-slate-400 font-semibold hover:text-[#4647d3] dark:hover:text-[#9396ff] transition-colors" href="/login">Sign In</Link>
          </div>
        </div>
      </nav>

      {/* Main Layout Wrapper */}
      <div className="flex flex-col md:flex-row max-w-[1440px] mx-auto" style={{ background: "radial-gradient(circle at top right, #9396ff20, transparent), radial-gradient(circle at bottom left, #dac9ff20, transparent)" }}>
        {/* Sidebar Navigation */}
        <aside className="h-screen w-80 rounded-r-[3rem] sticky top-0 bg-[#eef1f3] dark:bg-slate-900 hidden md:block">
          <div className="flex flex-col gap-8 p-12 h-full">
            <div>
              <h2 className="text-on-surface font-headline font-extrabold text-2xl tracking-tight">Registration</h2>
              <p className="text-on-surface-variant text-sm mt-1">Step 1 of 3</p>
            </div>
            
            <nav className="flex flex-col gap-4 mt-8">
              {/* Active Tab */}
              <div className="flex items-center gap-4 text-[#4647d3] dark:text-[#9396ff] font-bold border-l-4 border-[#4647d3] pl-4 font-['Inter'] text-sm font-medium">
                <span className="material-symbols-outlined">person</span>
                <span>Personal Info</span>
              </div>
              <div className="flex items-center gap-4 text-[#595c5e] dark:text-slate-400 pl-5 hover:bg-[#e5e9eb] dark:hover:bg-slate-800 transition-all rounded-xl font-['Inter'] text-sm font-medium cursor-pointer">
                <span className="material-symbols-outlined">school</span>
                <span>Academic Info</span>
              </div>
              <div className="flex items-center gap-4 text-[#595c5e] dark:text-slate-400 pl-5 hover:bg-[#e5e9eb] dark:hover:bg-slate-800 transition-all rounded-xl font-['Inter'] text-sm font-medium cursor-pointer">
                <span className="material-symbols-outlined">schedule</span>
                <span>Availability</span>
              </div>
            </nav>

            <div className="mt-auto pt-10">
              <div className="bg-surface-container rounded-lg p-6 relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Join the Community</p>
                  <p className="text-sm text-on-surface-variant leading-relaxed">Connect with over 10,000 students worldwide.</p>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Stage */}
        <main className="flex-1 px-4 md:px-20 py-8 md:py-12 w-full">
          {/* Welcome Header */}
          <header className="mb-8 md:mb-12">
            <h1 className="text-3xl md:text-[2.75rem] font-bold text-on-surface tracking-tighter leading-tight mb-4">Create your account.</h1>
            <p className="text-on-surface-variant text-base md:text-lg max-w-xl">Join Zenvy to find study partners, share resources, and excel in your university journey.</p>
          </header>

          {/* Registration Form Card */}
          <div className="bg-surface-container-lowest rounded-lg p-6 md:p-16 shadow-[0_20px_40px_rgba(70,71,211,0.06)] max-w-3xl">
            <div className="flex items-center justify-between mb-8 md:mb-12">
              <h3 className="text-xl font-bold text-on-surface">Step 1: Personal Info</h3>
              <div className="flex gap-2">
                <div className="w-12 h-1.5 rounded-full bg-primary"></div>
                <div className="w-12 h-1.5 rounded-full bg-surface-container"></div>
                <div className="w-12 h-1.5 rounded-full bg-surface-container"></div>
              </div>
            </div>

            <form action={formAction} className="space-y-8">
              {/* HIDDEN INPUTS FOR DB SCHEMA (matching UI constraint of missing fields) */}
              <input type="hidden" name="college" value="University" />
              <input type="hidden" name="major" value="Undeclared" />
              <input type="hidden" name="semester" value="1" />

              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface-variant ml-1" htmlFor="name">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined">badge</span>
                  </div>
                  <input className="w-full pl-12 pr-4 py-4 bg-surface border-none ring-1 ring-outline-variant/15 focus:ring-2 focus:ring-primary rounded-xl text-on-surface transition-all" id="name" name="name" placeholder="Enter your full name" type="text" required />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface-variant ml-1" htmlFor="email">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined">alternate_email</span>
                  </div>
                  <input className="w-full pl-12 pr-4 py-4 bg-surface border-none ring-1 ring-outline-variant/15 focus:ring-2 focus:ring-primary rounded-xl text-on-surface transition-all" id="email" name="email" placeholder="you@university.edu" type="email" required />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface-variant ml-1" htmlFor="password">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined">lock</span>
                  </div>
                  <input className="w-full pl-12 pr-4 py-4 bg-surface border-none ring-1 ring-outline-variant/15 focus:ring-2 focus:ring-primary rounded-xl text-on-surface transition-all" id="password" name="password" placeholder="••••••••" type="password" required />
                </div>
                <p className="text-xs text-on-surface-variant px-1 mt-2">Minimum 8 characters with a mix of letters and numbers.</p>
              </div>

              {state?.error && (
                <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg border border-red-100">{state.error}</div>
              )}

              <div className="pt-6">
                <button disabled={pending} className="w-full bg-gradient-to-r from-primary to-secondary text-on-primary font-bold py-5 rounded-full hover:shadow-[0_10px_30px_rgba(70,71,211,0.25)] transition-all flex items-center justify-center gap-3 disabled:opacity-70" type="submit">
                  <span>{pending ? 'Registering...' : 'Continue to Academic Info'}</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </form>
          </div>

          {/* Supporting Illustration Section */}
          <section className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <div className="flex flex-col gap-6">
              <div className="w-16 h-16 bg-tertiary-container text-on-tertiary-container rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">workspace_premium</span>
              </div>
              <h4 className="text-2xl font-bold">University Verified</h4>
              <p className="text-on-surface-variant leading-relaxed">We verify all university email addresses to ensure you're connecting with real students from your campus.</p>
            </div>
            
            <div className="relative h-64 rounded-xl overflow-hidden shadow-lg">
              <img alt="Modern University Campus Library" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuClF_XiquFC3TrrccPB2SrNuUT5IqoG6r2JA0cvIrE4xcvXnCX3SQQOgzYnBx3uiHl-Ah-u5nWKI93U1xsdShaBhe0S9IeuBo6vtg6HO9xrz7QS8vsr_2QGDF4-YrNLfWbTLFSZIdztY_y7ZNiHhO6lL8TEFX0fqG7OrQameZ9GP5LUvfkDyaoJzJYgyNW543n3k9A_H4FYUhKBBXgmSCqfR8dNDvbTAEyCh-BL0phCG-sz6Xtn6MXnA01AnuCgI6BnJfEcvOD0A2o" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent"></div>
              <div className="absolute bottom-6 left-6 text-on-primary">
                <p className="text-xs uppercase tracking-widest font-bold">Featured Destination</p>
                <p className="text-xl font-bold">The Digital Library Hub</p>
              </div>
            </div>
          </section>

          <footer className="mt-24 pt-12 border-t border-outline-variant/10 text-on-surface-variant text-sm flex justify-between items-center">
            <p>&copy; 2024 Zenvy. All rights reserved.</p>
            <div className="flex gap-8">
              <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
              <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
