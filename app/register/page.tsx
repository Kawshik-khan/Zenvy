"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { signUp } from "./actions";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(signUp, null);

  return (
    <div className="app-aurora selection:bg-primary/30 selection:text-on-surface">
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-6 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-secondary font-black text-white shadow-[0_0_18px_rgba(124,131,255,0.45)]">
            Z
          </div>
          <span className="text-2xl font-bold tracking-tight text-on-surface">Zenvy</span>
        </Link>
        <Link className="text-sm font-bold text-on-surface-variant transition-colors hover:text-primary" href="/login">
          Sign In
        </Link>
      </nav>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-96px)] max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-12 md:grid-cols-[0.9fr_1.1fr] md:px-8">
        <section className="hidden md:block">
          <div className="glass-panel rounded-[32px] p-8">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-tertiary">Student Commons</p>
            <h1 className="text-5xl font-black leading-tight tracking-tight text-on-surface">
              Build your study network in minutes.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-on-surface-variant">
              Create a profile, join groups, discover channels, and start finding students who match your academic rhythm.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-3">
              {[
                ["10K+", "students"],
                ["Live", "sessions"],
                ["AI", "matching"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-outline-variant/30 bg-surface/45 p-4">
                  <p className="text-2xl font-black text-gradient">{value}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="glass-panel mx-auto w-full max-w-2xl rounded-[32px] p-6 md:p-10">
          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Registration</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-on-surface md:text-4xl">Create your account</h2>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
              Start with your account. You will add academic and matching details right after sign in.
            </p>
          </div>

          <form action={formAction} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant" htmlFor="name">
                Full Name
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">badge</span>
                <input className="app-input py-4 pl-12 pr-4" id="name" name="name" placeholder="Enter your full name" type="text" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">alternate_email</span>
                <input className="app-input py-4 pl-12 pr-4" id="email" name="email" placeholder="you@university.edu" type="email" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">lock</span>
                <input className="app-input py-4 pl-12 pr-4" id="password" name="password" placeholder="Minimum 8 characters" type="password" required />
              </div>
              <p className="text-xs text-on-surface-variant">Use at least 8 characters with one uppercase letter and one number.</p>
            </div>

            {state?.error && (
              <div className="rounded-2xl border border-error/20 bg-error-container/80 p-4 text-sm font-semibold text-on-error-container">
                {state.error}
              </div>
            )}

            <button disabled={pending} className="app-primary-button flex w-full items-center justify-center gap-3 rounded-full py-4 font-black disabled:opacity-60" type="submit">
              <span>{pending ? "Creating account..." : "Create Account"}</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-on-surface-variant">
            Already have an account?
            <Link className="ml-1 font-bold text-primary hover:underline" href="/login">
              Sign in
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
