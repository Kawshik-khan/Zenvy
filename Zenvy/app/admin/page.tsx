import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });

  return (
    <div className="bg-surface text-on-surface selection:bg-primary-container min-h-screen antialiased">
      {/* SideNavBar Shell */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="md:ml-20 pb-20 md:pb-0 min-h-screen">
        {/* TopNavBar */}
        <header className="sticky top-0 z-40 flex justify-between items-center px-4 md:px-8 w-full h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm dark:shadow-none">
          <div className="flex items-center gap-6 w-full max-w-sm md:w-1/2 md:max-w-md">
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Search analytics or users..." type="text" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full p-2 text-slate-500">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full p-2 text-slate-500">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="h-8 w-[1px] bg-outline-variant/20 mx-2"></div>
            <div className="flex items-center gap-3">
              <img alt="User Profile Avatar" className="w-8 h-8 rounded-full border border-primary/20 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvYMk2WBI2_bFYLJ0Xd2tYgAxKDr3TlsksHuWbZFt0Uw2312HyOYdp5wGTzhDTLVuV9WcHHjjJM4kq7tajKhVR1VMCMJ2r6yIYCG-xh45xQ058RrdHLhnumk2alqME8deenUEh1ZMEYeKl6xhepRiQrJJPy_i36GOwSHrd0ql2ZUeXHjySSAb_j1fCdSKyfJu8CJ1gobOhJhlvHZiDsDBxA3oDqdSH-kGUBzneJ_mYKofgATDrpD3IiQrHMSaY5yC_bM6sW4j4MYs" />
              <span className="text-sm font-semibold">{user?.name || 'Admin Panel'}</span>
            </div>
          </div>
        </header>

        {/* Dashboard Canvas */}
        <div className="p-4 md:p-10 space-y-6 md:space-y-10">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-on-surface tracking-tight mb-1">Administrative Overview</h2>
              <p className="text-on-surface-variant font-medium text-sm md:text-base">Real-time health and engagement of the academic ecosystem.</p>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3">
              <button className="flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-full bg-surface-container-highest text-on-surface font-bold text-xs md:text-sm text-center">Export Report</button>
              <button className="flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs md:text-sm shadow-lg text-center">Refresh Data</button>
            </div>
          </div>

          {/* KPI Cards Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Users */}
            <div className="bg-surface-container-lowest p-8 rounded-lg shadow-[0_20px_40px_rgba(70,71,211,0.06)] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary-container/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">groups</span>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">+12.5%</span>
              </div>
              <div>
                <p className="text-on-surface-variant text-sm font-medium">Total Users</p>
                <p className="text-3xl font-black text-on-surface mt-1">24,592</p>
              </div>
            </div>

            {/* Active Groups */}
            <div className="bg-surface-container-lowest p-8 rounded-lg shadow-[0_20px_40px_rgba(70,71,211,0.06)] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-secondary-container/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary">hub</span>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">+8.2%</span>
              </div>
              <div>
                <p className="text-on-surface-variant text-sm font-medium">Active Groups</p>
                <p className="text-3xl font-black text-on-surface mt-1">1,840</p>
              </div>
            </div>

            {/* Reported Issues */}
            <div className="bg-surface-container-lowest p-8 rounded-lg shadow-[0_20px_40px_rgba(70,71,211,0.06)] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-tertiary-container/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary">warning</span>
                </div>
                <span className="text-xs font-bold text-error bg-error-container/10 px-2 py-1 rounded-md">14 Priority</span>
              </div>
              <div>
                <p className="text-on-surface-variant text-sm font-medium">Reported Issues</p>
                <p className="text-3xl font-black text-on-surface mt-1">42</p>
              </div>
            </div>

            {/* Platform Growth */}
            <div className="bg-surface-container-lowest p-8 rounded-lg shadow-[0_20px_40px_rgba(70,71,211,0.06)] flex flex-col justify-between border-2 border-primary-container/10">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-on-primary">trending_up</span>
                </div>
                <span className="text-xs font-bold text-primary bg-primary-container/30 px-2 py-1 rounded-md">Target Met</span>
              </div>
              <div>
                <p className="text-on-surface-variant text-sm font-medium">Monthly Growth</p>
                <p className="text-3xl font-black text-on-surface mt-1">28.4%</p>
              </div>
            </div>
          </div>

          {/* engagement Graph & Moderation Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Engagement Graph Area */}
            <div className="lg:col-span-2 bg-surface-container-lowest rounded-lg p-6 md:p-8 shadow-[0_20px_40px_rgba(70,71,211,0.06)]">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 md:mb-8">
                <div>
                  <h3 className="text-xl font-bold text-on-surface">Engagement Analytics</h3>
                  <p className="text-sm text-on-surface-variant">Daily active users over last 30 days</p>
                </div>
                <div className="flex gap-2 self-start sm:self-auto">
                  <button className="text-xs font-bold px-3 py-1.5 rounded-full bg-primary text-on-primary">Daily</button>
                  <button className="text-xs font-bold px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant">Weekly</button>
                </div>
              </div>
              <div className="h-64 flex items-end justify-between gap-2">
                {/* Simulated Chart Bars */}
                <div className="w-full bg-primary/10 rounded-t-full h-[40%]"></div>
                <div className="w-full bg-primary/20 rounded-t-full h-[55%]"></div>
                <div className="w-full bg-primary/10 rounded-t-full h-[45%]"></div>
                <div className="w-full bg-primary/30 rounded-t-full h-[70%]"></div>
                <div className="w-full bg-primary/20 rounded-t-full h-[60%]"></div>
                <div className="w-full bg-gradient-to-t from-primary to-secondary rounded-t-full h-[95%]"></div>
                <div className="w-full bg-primary/40 rounded-t-full h-[75%]"></div>
                <div className="w-full bg-primary/20 rounded-t-full h-[50%]"></div>
                <div className="w-full bg-primary/15 rounded-t-full h-[40%]"></div>
                <div className="w-full bg-primary/30 rounded-t-full h-[65%]"></div>
                <div className="w-full bg-primary/10 rounded-t-full h-[35%]"></div>
                <div className="w-full bg-primary/50 rounded-t-full h-[80%]"></div>
                <div className="w-full bg-primary/20 rounded-t-full h-[55%]"></div>
                <div className="w-full bg-gradient-to-t from-primary to-secondary rounded-t-full h-[100%]"></div>
              </div>
              <div className="flex justify-between mt-4 px-2">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Oct 01</span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Oct 15</span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Today</span>
              </div>
            </div>

            {/* Flagged Content Sidebar */}
            <div className="bg-surface-container-lowest rounded-lg p-8 shadow-[0_20px_40px_rgba(70,71,211,0.06)]">
              <h3 className="text-xl font-bold text-on-surface mb-6">Moderation Queue</h3>
              <div className="space-y-6">
                {/* Flagged Item 1 */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-error text-lg">flag</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">Spam in "Calculus III"</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">Reported by Sarah J. • 5m ago</p>
                    <div className="flex gap-2 mt-3">
                      <button className="text-[10px] font-bold px-3 py-1 rounded bg-error text-white uppercase tracking-tighter">Remove</button>
                      <button className="text-[10px] font-bold px-3 py-1 rounded bg-surface-container text-on-surface-variant uppercase tracking-tighter">Dismiss</button>
                    </div>
                  </div>
                </div>
                {/* Flagged Item 2 */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-tertiary-container/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-tertiary text-lg">person_cancel</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">Toxic Behavior: @user_491</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">Reported by Auto-Mod • 22m ago</p>
                    <div className="flex gap-2 mt-3">
                      <button className="text-[10px] font-bold px-3 py-1 rounded bg-primary text-white uppercase tracking-tighter">Suspend</button>
                      <button className="text-[10px] font-bold px-3 py-1 rounded bg-surface-container text-on-surface-variant uppercase tracking-tighter">View Log</button>
                    </div>
                  </div>
                </div>
              </div>
              <button className="w-full mt-8 py-3 rounded-xl border border-outline-variant/20 text-xs font-bold text-primary hover:bg-primary/5 transition-colors uppercase tracking-widest">View All Reports (14)</button>
            </div>
          </div>

          {/* Recent Registrations Table */}
          <div className="bg-surface-container-lowest rounded-lg overflow-hidden shadow-[0_20px_40px_rgba(70,71,211,0.06)]">
            <div className="p-8 border-b border-surface-container flex justify-between items-center">
              <h3 className="text-xl font-bold text-on-surface">Recent User Registrations</h3>
              <button className="text-primary text-sm font-bold hover:underline">View Full Directory</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low">
                    <th className="px-8 py-4 text-xs font-black text-on-surface-variant uppercase tracking-widest">Student</th>
                    <th className="px-8 py-4 text-xs font-black text-on-surface-variant uppercase tracking-widest">Major</th>
                    <th className="px-8 py-4 text-xs font-black text-on-surface-variant uppercase tracking-widest">Joined</th>
                    <th className="px-8 py-4 text-xs font-black text-on-surface-variant uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-xs font-black text-on-surface-variant uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs">AM</div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">Alex Morgan</p>
                          <p className="text-[11px] text-on-surface-variant">alex.m@university.edu</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm text-on-surface-variant">Computer Science</td>
                    <td className="px-8 py-5 text-sm text-on-surface-variant">Oct 18, 2023</td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-tight">Verified</span>
                    </td>
                    <td className="px-8 py-5">
                      <button className="material-symbols-outlined text-on-surface-variant hover:text-primary">more_vert</button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">LC</div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">Liam Chen</p>
                          <p className="text-[11px] text-on-surface-variant">l.chen@polytech.edu</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm text-on-surface-variant">Bio-Engineering</td>
                    <td className="px-8 py-5 text-sm text-on-surface-variant">Oct 18, 2023</td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-tight">Pending</span>
                    </td>
                    <td className="px-8 py-5">
                      <button className="material-symbols-outlined text-on-surface-variant hover:text-primary">more_vert</button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-bold text-xs">SK</div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">Sofia Kovic</p>
                          <p className="text-[11px] text-on-surface-variant">sofia.k@arts.edu</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm text-on-surface-variant">Liberal Arts</td>
                    <td className="px-8 py-5 text-sm text-on-surface-variant">Oct 17, 2023</td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-tight">Verified</span>
                    </td>
                    <td className="px-8 py-5">
                      <button className="material-symbols-outlined text-on-surface-variant hover:text-primary">more_vert</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
