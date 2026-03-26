export const runtime = 'nodejs';
import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import { prisma } from '@/lib/prisma';
import QuickJoinButton from './QuickJoinButton';
import ThreeDotMenu from '@/app/components/ThreeDotMenu';
import ErrorView from '@/app/components/ErrorView';

export default async function DashboardPage() {
  let session;
  try {
    session = await auth();
  } catch (error) {
    console.error("AUTH INITIALIZATION ERROR:", error);
    return <ErrorView 
      error={error} 
      title="Authentication Failure" 
      message="The authentication system failed to initialize. Please ensure you have added the AUTH_SECRET environment variable to your Vercel project settings."
    />;
  }

  if (!session?.user?.email) {
    redirect('/login');
  }

  let user;
  let popularGroups;

  try {
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        groupMemberships: {
          include: { group: true }
        }
      }
    });

    if (!user) {
      console.error("Dashboard: User session exists but DB user not found:", session.user.email);
      redirect('/login');
    }

    // Fetch up to 3 popular groups the user is not in
    popularGroups = await prisma.studyGroup.findMany({
      where: {
        members: {
          none: { userId: user.id }
        }
      },
      take: 3,
      orderBy: { members: { _count: 'desc' } }
    });
  } catch (error) {
    console.error("CRITICAL DASHBOARD ERROR:", error);
    return <ErrorView error={error} />;
  }

  const userName = user?.name || 'Scholar';
  const activeGroupCount = user?.groupMemberships.length || 0;

  return (
    <div className="bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container flex min-h-screen">
      {/* SideNavBar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="md:ml-20 pb-20 md:pb-0 min-h-screen w-full">
        {/* TopNavBar */}
        <header className="sticky top-0 z-40 flex justify-between items-center px-4 md:px-8 h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm dark:shadow-none font-sans text-sm">
          <div className="flex items-center flex-1 max-w-sm md:max-w-xl">
            <div className="relative w-full group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">search</span>
              <input className="w-full bg-surface-container border-none rounded-full py-2.5 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all outline-none" placeholder="Search for subjects, groups, or students..." type="text" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full p-2 transition-transform active:scale-95 text-on-surface-variant">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full p-2 transition-transform active:scale-95 text-on-surface-variant">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="h-8 w-[1px] bg-outline-variant/20 mx-2"></div>

            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="font-bold leading-none">{userName}</p>
                <p className="text-[10px] text-on-surface-variant font-medium">Logged In</p>
              </div>
              <img alt="User Profile Avatar" className="w-10 h-10 rounded-full object-cover ring-2 ring-white ring-offset-2 ring-offset-primary" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEgEYZ81wFhxOgX_dHZ9mUxj-SjdIHtogOiWALKAx_sJpU8YIGOMl1uQ6uB7SL4nD8YSMd48ZMJsGJB3kYw5C-fDiEkcCUqFegSufheOcyBdF4tNbdBgD23V5p1UU20R8R9BcCurXr-1S8zK3E_pydrHWcY1NS7oMzV-7KIle39-7dC0sIMgiodZKFy2aj-5mCEsV2BtPqYYiL7Rses5FOFOonDxif5zei45sNOsUWS_MWeARNqTRc8X3x3schsOy499kNXGFumaY" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 md:p-12 max-w-[1440px] mx-auto space-y-8 md:space-y-12">
          {/* Welcome Header & Stats Bento */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-2">
              <h2 className="text-display-md text-3xl md:text-5xl font-black tracking-tighter text-on-surface">Welcome Back, {userName}.</h2>
              <p className="text-on-surface-variant text-base md:text-lg">Your academic sanctuary is ready for today's focus session.</p>
            </div>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 lg:justify-end">
              <div className="flex-1 text-center p-4 rounded-xl bg-surface-container-low border border-white/50">
                <p className="text-3xl font-black text-primary">{activeGroupCount}</p>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Active Groups</p>
              </div>
              <div className="flex-1 text-center p-4 rounded-xl bg-surface-container-low border border-white/50">
                <p className="text-3xl font-black text-secondary">24.5</p>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Hours This Week</p>
              </div>
              <div className="flex-1 text-center p-4 rounded-xl bg-surface-container-low border border-white/50">
                <p className="text-3xl font-black text-tertiary">98%</p>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Attendance</p>
              </div>
            </div>
          </section>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-12 gap-8 items-start">
            {/* Left Column: Primary Actions & Groups */}
            <div className="col-span-12 lg:col-span-8 space-y-12">
              {/* Next Session Card */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-secondary p-10 text-on-primary shadow-2xl shadow-primary/20">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                  <div className="space-y-4">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-widest uppercase">Up Next in 14:02</span>
                    <h3 className="text-3xl font-black leading-tight">Advanced Algorithms &amp;<br />Data Structures</h3>
                    <div className="flex items-center gap-4 text-on-primary/80">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-lg">schedule</span>
                        <span className="text-sm font-medium">Starts at 2:00 PM</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-lg">groups</span>
                        <span className="text-sm font-medium">8 Members joined</span>
                      </div>
                    </div>
                  </div>

                  <button className="px-8 py-4 bg-white text-primary rounded-full font-black text-sm hover:scale-105 transition-transform active:scale-95 flex items-center gap-2">
                    <span className="material-symbols-outlined">video_call</span>
                    Join Session
                  </button>
                </div>
                {/* Abstract Background Decoration */}
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -left-10 -top-10 w-40 h-40 bg-secondary/30 rounded-full blur-2xl"></div>
              </div>

              {/* My Groups Section */}
              <section className="space-y-6">
                <div className="flex justify-between items-end">
                  <h3 className="text-2xl font-black tracking-tight">My Groups</h3>
                  <Link className="text-primary font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all" href="#">View all groups <span className="material-symbols-outlined text-sm">arrow_forward</span></Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {user.groupMemberships.length === 0 ? (
                    <div className="col-span-12 p-8 text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant/30">
                      <p className="text-on-surface-variant mb-2">You haven't joined any groups yet.</p>
                      <Link href="/groups" className="text-primary font-bold text-sm hover:underline">Explore Study Groups</Link>
                    </div>
                  ) : (
                    user.groupMemberships.slice(0, 4).map((membership) => (
                      <div key={membership.groupId} className="group bg-surface-container-lowest p-6 rounded-lg shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                        <div className="flex justify-between items-start mb-6">
                          <div className="p-3 bg-primary-container/30 rounded-lg text-primary">
                            <span className="material-symbols-outlined">school</span>
                          </div>
                          <span className="px-3 py-1 bg-tertiary-container text-on-tertiary-container text-[10px] font-black uppercase rounded-full tracking-wider">Active Now</span>
                        </div>
                        <h4 className="text-lg font-black mb-1 line-clamp-1">{membership.group.name}</h4>
                        <p className="text-on-surface-variant text-sm mb-6 line-clamp-1">{membership.group.subject || 'General Studies'}</p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-primary">View Group &rarr;</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* Right Column: Sidebar Feeds */}
            <div className="col-span-12 lg:col-span-4 space-y-12">
              {/* Activity Feed */}
              <section className="bg-surface-container-low p-8 rounded-lg space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black tracking-tight">Activity Feed</h3>
                  <ThreeDotMenu targetId="system-feed" />
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-primary ring-4 ring-primary/10"></div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-on-surface">New study materials added</p>
                      <p className="text-xs text-on-surface-variant">Sarah uploaded 'Neural Networks Pt.2' to React Masters.</p>
                      <p className="text-[10px] text-on-surface-variant font-medium">10 mins ago</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-secondary ring-4 ring-secondary/10"></div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-on-surface">Group goal achieved!</p>
                      <p className="text-xs text-on-surface-variant">Quantum Theory completed 100 hours of focus time this month.</p>
                      <p className="text-[10px] text-on-surface-variant font-medium">2 hours ago</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-outline-variant"></div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-on-surface">Scheduled Session</p>
                      <p className="text-xs text-on-surface-variant">James set a new session for tomorrow at 10 AM.</p>
                      <p className="text-[10px] text-on-surface-variant font-medium">5 hours ago</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Popular Study Groups */}
              <section className="space-y-6">
                <h3 className="text-xl font-black tracking-tight px-2">Popular Nearby</h3>
                <div className="space-y-4">
                  {popularGroups.length === 0 ? (
                    <p className="text-sm text-on-surface-variant px-2">No recommendations available right now.</p>
                  ) : (
                    popularGroups.map((group) => (
                      <div key={group.id} className="flex items-center gap-4 p-4 rounded-lg hover:bg-surface-container transition-colors cursor-pointer border border-transparent hover:border-white/50">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                          {group.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold truncate max-w-[150px]">{group.name}</p>
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                            <p className="text-[10px] font-bold text-on-surface-variant">{group.subject || 'General'}</p>
                          </div>
                        </div>
                        <QuickJoinButton groupId={group.id} />
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Contextual FAB (Only for Main Dashboards) */}
      <div className="fixed bottom-8 right-8 z-50">
        <Link href="/matching" className="flex items-center gap-3 px-6 py-4 rounded-full bg-inverse-surface text-background shadow-2xl hover:scale-110 active:scale-95 transition-all">
          <span className="material-symbols-outlined">bolt</span>
          <span className="font-bold text-sm">Quick Match</span>
        </Link>
      </div>
    </div>
  );
}
