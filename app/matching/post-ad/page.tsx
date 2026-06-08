import React from "react";
export const runtime = "nodejs";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/app/components/Sidebar";
import NotificationBell from "@/app/components/NotificationBell";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createStudyAd } from "./actions";

export default async function PostStudyAdPage() {
  const session = await auth();
  if (!session?.user?.id && !session?.user?.email) redirect("/login");

  const user = session.user.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { profile: true },
      })
    : await prisma.user.findUnique({
        where: { email: session.user.email || "" },
        include: { profile: true },
      });

  if (!user) redirect("/login");

  return (
    <div className="app-aurora antialiased overflow-x-hidden">
      <Sidebar />

      <main className="app-main">
        <header className="app-topbar font-sans text-sm">
          <Link href="/matching" className="inline-flex items-center gap-2 rounded-full bg-surface-container px-4 py-2 text-xs font-bold text-on-surface-variant transition-colors hover:text-on-surface">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Matching
          </Link>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="hidden items-center gap-3 border-l pl-4 glass-divider sm:flex">
              <div className="text-right">
                <p className="font-bold text-on-surface">{user.name || "Student"}</p>
                <p className="text-xs text-on-surface-variant">{user.profile?.major || "Undecided"}</p>
              </div>
              <img
                className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20"
                src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=random`}
                alt=""
              />
            </div>
          </div>
        </header>

        <div className="app-content min-h-[calc(100vh-64px)] p-4 md:p-12">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <section className="glass-panel-subtle rounded-[28px] p-6 md:p-8">
              <div className="mb-8">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-primary">Study Ad</p>
                <h1 className="text-3xl font-black tracking-tight text-on-surface md:text-5xl">Post your study ad.</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant md:text-base">
                  Tell classmates what you are studying, when you are available, and what kind of partner or group you want.
                </p>
              </div>

              <form action={createStudyAd} className="grid gap-5">
                <label className="grid gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Title</span>
                  <input
                    name="title"
                    required
                    maxLength={100}
                    className="app-input px-4 py-3"
                    placeholder="Need a React study partner for finals"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Subjects or Skills</span>
                  <input
                    name="subjects"
                    required
                    maxLength={200}
                    defaultValue={user.profile?.interests || user.profile?.major || ""}
                    className="app-input px-4 py-3"
                    placeholder="AI, Data Science, Algorithms"
                  />
                </label>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Availability</span>
                    <input
                      name="availability"
                      required
                      maxLength={200}
                      defaultValue={user.profile?.availability || ""}
                      className="app-input px-4 py-3"
                      placeholder="Weeknights after 8 PM"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Mode</span>
                    <select name="mode" defaultValue="ANY" className="app-input px-4 py-3">
                      <option value="ANY">Any</option>
                      <option value="ONLINE">Online</option>
                      <option value="IN_PERSON">In person</option>
                      <option value="HYBRID">Hybrid</option>
                    </select>
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">What should partners know?</span>
                  <textarea
                    name="description"
                    required
                    maxLength={800}
                    className="app-input h-36 resize-none px-4 py-3"
                    placeholder="Share your goal, exam date, study style, and what kind of partner would be a good fit."
                  />
                </label>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button className="app-primary-button inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-black">
                    <span className="material-symbols-outlined text-base">add</span>
                    Publish Study Ad
                  </button>
                  <Link href="/matching" className="inline-flex items-center justify-center rounded-full bg-surface-container px-7 py-3 text-sm font-bold text-on-surface-variant transition-colors hover:text-on-surface">
                    Cancel
                  </Link>
                </div>
              </form>
            </section>

            <aside className="space-y-4">
              {[
                ["Good titles", "Mention the subject and your immediate goal."],
                ["Useful details", "Add schedule, study mode, and preferred pace."],
                ["Better matches", "Keep profile interests current so your card ranks well."],
              ].map(([title, body]) => (
                <div key={title} className="glass-panel-subtle rounded-[24px] p-5">
                  <h2 className="text-sm font-black text-on-surface">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">{body}</p>
                </div>
              ))}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
