"use client";

import React, { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { login } from "./actions";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="app-aurora min-h-screen" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);
  const searchParams = useSearchParams();
  const message = searchParams?.get("message");
  const error = searchParams?.get("error");

  return (
    <div className="app-aurora flex min-h-screen flex-col font-body selection:bg-primary/30 selection:text-on-surface">
      <header className="relative z-50 mb-4 animate-fade-in">
        <nav className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-4 md:px-12 md:py-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-secondary font-black text-white shadow-[0_0_18px_rgba(124,131,255,0.45)]">
              Z
            </div>
            <span className="text-2xl font-bold tracking-tight text-on-surface">Zenvy</span>
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium tracking-tight md:flex">
            <Link className="text-on-surface-variant transition-colors hover:text-primary" href="/">Explore</Link>
            <Link className="text-on-surface-variant transition-colors hover:text-primary" href="/">Community</Link>
            <Link className="text-on-surface-variant transition-colors hover:text-primary" href="/">Resources</Link>
          </div>
          <Link href="/register" className="app-primary-button inline-block rounded-full px-6 py-2.5 text-sm font-semibold">
            Create Account
          </Link>
        </nav>
      </header>

      <main className="relative z-10 flex flex-grow items-center justify-center overflow-hidden px-6 py-12">
        <div className="pointer-events-none absolute inset-0">
          <span className="material-symbols-outlined absolute right-10 top-1/4 text-[12rem] text-primary/10" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
          <span className="material-symbols-outlined absolute bottom-1/4 left-10 text-[10rem] text-secondary/10" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
        </div>

        <section className="relative z-10 w-full max-w-[480px] animate-scale-in">
          <div className="glass-panel rounded-[28px] p-6 md:p-14">
            <div className="mb-10 text-center">
              <h1 className="mb-2 font-headline text-3xl font-bold tracking-tight text-on-surface">Welcome Back</h1>
              <p className="text-sm text-on-surface-variant">Enter your credentials to access your sanctuary.</p>
            </div>

            <form action={formAction} className="space-y-6">
              <div className="space-y-2">
                <label className="ml-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" htmlFor="email">
                  Email Address
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant transition-colors group-focus-within:text-primary">alternate_email</span>
                  <input className="app-input py-4 pl-12 pr-4 text-sm" id="email" name="email" placeholder="scholar@nexus.edu" type="email" required />
                </div>
              </div>

              <div className="space-y-2">
                <div className="ml-1 flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" htmlFor="password">
                    Password
                  </label>
                  <a className="text-xs font-medium text-primary hover:underline" href="#">Forgot?</a>
                </div>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant transition-colors group-focus-within:text-primary">lock</span>
                  <input className="app-input py-4 pl-12 pr-4 text-sm" id="password" name="password" placeholder="Password" type="password" required />
                </div>
              </div>

              {message === "check-email" && (
                <div className="flex items-start gap-3 rounded-xl border border-accent-green/20 bg-accent-green/10 p-4 text-sm font-medium text-accent-green">
                  <span className="material-symbols-outlined text-xl">mark_email_read</span>
                  <div>
                    <p className="font-bold">Check your inbox!</p>
                    <p className="text-xs opacity-90">We sent a verification link to your email.</p>
                  </div>
                </div>
              )}

              {state && (
                <div className="flex items-center gap-2 rounded-xl border border-error/20 bg-error-container p-3 text-sm font-medium text-on-error-container">
                  <span className="material-symbols-outlined text-lg">error</span>
                  {state}
                </div>
              )}

              {error === "Verification" && (
                <div className="flex items-center gap-2 rounded-xl border border-accent-yellow/20 bg-accent-yellow/10 p-3 text-sm font-medium text-accent-yellow">
                  <span className="material-symbols-outlined text-lg">warning</span>
                  Verification failed or link expired.
                </div>
              )}

              <button disabled={pending} className="app-primary-button w-full rounded-full py-4 text-base font-bold disabled:opacity-70" type="submit">
                {pending ? "Signing In..." : "Sign In"}
              </button>

              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t glass-divider" />
                <span className="mx-4 flex-shrink text-xs font-medium uppercase tracking-widest text-on-surface-variant">or</span>
                <div className="flex-grow border-t glass-divider" />
              </div>

              <button className="flex w-full items-center justify-center gap-3 rounded-full border border-outline-variant/30 bg-surface-container py-4 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high" type="button">
                Continue with Google
              </button>
            </form>

            <p className="mt-10 text-center text-sm text-on-surface-variant">
              Don&apos;t have an account?
              <Link className="ml-1 font-bold text-primary hover:underline" href="/register">Sign Up</Link>
            </p>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t glass-divider">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-between gap-4 px-6 py-8 text-center md:flex-row md:px-12 md:py-12 md:text-left">
          <div className="text-xs font-normal text-on-surface-variant">
            &copy; 2024 Zenvy. The Digital Commons for modern scholars.
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs font-normal text-on-surface-variant md:justify-end md:gap-8">
            {["Privacy Policy", "Terms of Service", "Help Center", "Contact Us"].map((item) => (
              <a key={item} className="transition-colors hover:text-primary" href="#">{item}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
