import React from 'react';
export const runtime = 'nodejs';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';

export default async function SchedulingPage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Stage */}
      <main className="md:ml-20 pb-20 md:pb-0 min-h-screen">
        {/* Top Navigation */}
        <header className="sticky top-0 z-40 flex justify-between items-center px-8 w-full h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm dark:shadow-none font-sans text-sm">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 text-sm outline-none" placeholder="Search events or groups..." type="text" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full p-2 relative">
              <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
            </button>
            <button className="hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full p-2">
              <span className="material-symbols-outlined text-on-surface-variant">settings</span>
            </button>
            <div className="h-8 w-px bg-outline-variant opacity-20 mx-2"></div>
            <div className="flex items-center gap-3">
              <span className="font-medium">{user?.name || 'Scholar'}</span>
              <img alt="User Profile Avatar" className="w-8 h-8 rounded-full border-2 border-primary-container object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuChj6X5PimRPbQy4iLf_eZ-fcCAuPF1gi-9pbTR7_BsQx0SPv3KE75P3iAcHgOyxVrsylNt4nLiCMGUFBhtTBkDwAYf-s2cMO7TwyR-2NF9WKUdiUaTq6i-QUmRvp8mrYHIzfeTwg3OUX-_pfaNvd-wXqG6oBgo7iYyUzaewm4ikQNknQl8UCEdhtJ9hgui-uUnKArT32CTBeFBQ8HILSVA1arwgTAE6qqwSZ0XXCGVKGUw23DQML8lY-6V0Ksshu2U3axwOfGilEE" />
            </div>
          </div>
        </header>

        {/* Content Canvas */}
        <div className="p-8">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-[2.75rem] font-bold tracking-tight text-on-surface leading-tight">Your Academic Calendar</h1>
              <p className="text-on-surface-variant mt-2 text-lg">Manage your study sessions and group syncs.</p>
            </div>
            <div className="flex gap-3">
              <div className="flex bg-surface-container rounded-full p-1">
                <button className="px-6 py-2 bg-surface-container-lowest shadow-sm rounded-full font-semibold text-primary">Monthly</button>
                <button className="px-6 py-2 text-on-surface-variant font-medium">Weekly</button>
              </div>
              <button className="flex items-center gap-2 bg-primary px-6 py-3 text-on-primary rounded-full font-bold active:scale-95 transition-transform">
                <span className="material-symbols-outlined">edit_calendar</span>
                Schedule Session
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8">
            {/* Monthly Calendar View */}
            <div className="col-span-8 bg-surface-container-lowest rounded-lg p-8 shadow-[0_20px_40px_rgba(70,71,211,0.06)]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold">September 2024</h2>
                  <div className="flex gap-1">
                    <button className="p-1 hover:bg-surface-container rounded-full transition-colors"><span className="material-symbols-outlined">chevron_left</span></button>
                    <button className="p-1 hover:bg-surface-container rounded-full transition-colors"><span className="material-symbols-outlined">chevron_right</span></button>
                  </div>
                </div>
                <div className="flex gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary"></span> Study Session</div>
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-secondary"></span> Exam Prep</div>
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-tertiary"></span> Project Meeting</div>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-px bg-outline-variant/10 rounded-xl overflow-hidden">
                {/* Days Header */}
                <div className="bg-surface-container-low p-4 text-center font-bold text-xs uppercase tracking-widest text-on-surface-variant">Mon</div>
                <div className="bg-surface-container-low p-4 text-center font-bold text-xs uppercase tracking-widest text-on-surface-variant">Tue</div>
                <div className="bg-surface-container-low p-4 text-center font-bold text-xs uppercase tracking-widest text-on-surface-variant">Wed</div>
                <div className="bg-surface-container-low p-4 text-center font-bold text-xs uppercase tracking-widest text-on-surface-variant">Thu</div>
                <div className="bg-surface-container-low p-4 text-center font-bold text-xs uppercase tracking-widest text-on-surface-variant">Fri</div>
                <div className="bg-surface-container-low p-4 text-center font-bold text-xs uppercase tracking-widest text-on-surface-variant">Sat</div>
                <div className="bg-surface-container-low p-4 text-center font-bold text-xs uppercase tracking-widest text-on-surface-variant">Sun</div>

                {/* Calendar Grid (Sample Week) */}
                {/* Week 1 */}
                <div className="bg-surface-container-lowest min-h-[140px] p-4 group hover:bg-surface-bright transition-colors opacity-30">26</div>
                <div className="bg-surface-container-lowest min-h-[140px] p-4 group hover:bg-surface-bright transition-colors opacity-30">27</div>
                <div className="bg-surface-container-lowest min-h-[140px] p-4 group hover:bg-surface-bright transition-colors opacity-30">28</div>
                <div className="bg-surface-container-lowest min-h-[140px] p-4 group hover:bg-surface-bright transition-colors opacity-30">29</div>
                <div className="bg-surface-container-lowest min-h-[140px] p-4 group hover:bg-surface-bright transition-colors opacity-30">30</div>
                <div className="bg-surface-container-lowest min-h-[140px] p-4 group hover:bg-surface-bright transition-colors opacity-30">31</div>
                <div className="bg-surface-container-lowest min-h-[140px] p-4 group hover:bg-surface-bright transition-colors">
                  <span className="font-bold">1</span>
                </div>

                {/* Week 2 */}
                <div className="bg-surface-container-lowest min-h-[140px] p-4 group hover:bg-surface-bright transition-colors">2</div>
                <div className="bg-surface-container-lowest min-h-[140px] p-4 group hover:bg-surface-bright transition-colors">
                  <span className="font-bold">3</span>
                  <div className="mt-2 space-y-1">
                    <div className="text-[10px] bg-primary-container text-on-primary-container px-2 py-1 rounded-full font-bold truncate">Intro to CS</div>
                  </div>
                </div>
                <div className="bg-surface-container-lowest min-h-[140px] p-4 group hover:bg-surface-bright transition-colors">4</div>
                <div className="bg-surface-container-lowest min-h-[140px] p-4 group hover:bg-surface-bright transition-colors">
                  <span className="font-bold">5</span>
                  <div className="mt-2 space-y-1">
                    <div className="text-[10px] bg-secondary-container text-on-secondary-container px-2 py-1 rounded-full font-bold truncate">Midterm Quiz</div>
                  </div>
                </div>
                <div className="bg-surface-container-lowest min-h-[140px] p-4 group hover:bg-surface-bright transition-colors">6</div>
                <div className="bg-surface-container-lowest min-h-[140px] p-4 group hover:bg-surface-bright transition-colors">7</div>
                <div className="bg-surface-container-lowest min-h-[140px] p-4 group hover:bg-surface-bright transition-colors">8</div>

                {/* Week 3 (Active Selection example) */}
                <div className="bg-surface-container-lowest min-h-[140px] p-4 group hover:bg-surface-bright transition-colors">9</div>
                <div className="bg-surface-container-lowest min-h-[140px] p-4 group hover:bg-surface-bright transition-colors">10</div>
                <div className="bg-primary/5 min-h-[140px] p-4 relative">
                  <span className="font-bold text-primary">11</span>
                  <div className="mt-2 space-y-1">
                    <div className="text-[10px] bg-tertiary-container text-on-tertiary-container px-2 py-1 rounded-full font-bold truncate">UX Workshop</div>
                    <div className="text-[10px] bg-primary-container text-on-primary-container px-2 py-1 rounded-full font-bold truncate">Group Sync</div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-primary"></div>
                </div>
                <div className="bg-surface-container-lowest min-h-[140px] p-4 group hover:bg-surface-bright transition-colors">12</div>
                <div className="bg-surface-container-lowest min-h-[140px] p-4 group hover:bg-surface-bright transition-colors">13</div>
                <div className="bg-surface-container-lowest min-h-[140px] p-4 group hover:bg-surface-bright transition-colors">14</div>
                <div className="bg-surface-container-lowest min-h-[140px] p-4 group hover:bg-surface-bright transition-colors">15</div>

                {/* Rest of the grid visualized simply */}
                <div className="bg-surface-container-lowest min-h-[140px] p-4 opacity-40">16</div>
                <div className="bg-surface-container-lowest min-h-[140px] p-4 opacity-40">17</div>
                <div className="bg-surface-container-lowest min-h-[140px] p-4 opacity-40">18</div>
                <div className="bg-surface-container-lowest min-h-[140px] p-4 opacity-40">19</div>
                <div className="bg-surface-container-lowest min-h-[140px] p-4 opacity-40">20</div>
                <div className="bg-surface-container-lowest min-h-[140px] p-4 opacity-40">21</div>
                <div className="bg-surface-container-lowest min-h-[140px] p-4 opacity-40">22</div>
              </div>
            </div>

            {/* Sidebar: Upcoming Events */}
            <div className="col-span-4 space-y-6">
              <div className="bg-surface-container-low rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg">Upcoming Events</h3>
                  <span className="text-xs bg-primary text-on-primary px-2 py-0.5 rounded-full">4 Active</span>
                </div>
                <div className="space-y-4">
                  {/* Event Card */}
                  <div className="bg-surface-container-lowest p-4 rounded-xl flex gap-4 hover:translate-x-1 transition-transform cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-primary-container flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] uppercase font-black text-primary">SEP</span>
                      <span className="text-lg font-bold text-primary">11</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">Advanced UX Workshop</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="material-symbols-outlined text-xs text-on-surface-variant">schedule</span>
                        <span className="text-xs text-on-surface-variant">2:00 PM • 90 min</span>
                      </div>
                      <div className="mt-2 inline-flex text-[10px] bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded-full font-bold">Project Meeting</div>
                    </div>
                  </div>
                  {/* Event Card */}
                  <div className="bg-surface-container-lowest p-4 rounded-xl flex gap-4 hover:translate-x-1 transition-transform cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-secondary-container flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] uppercase font-black text-secondary">SEP</span>
                      <span className="text-lg font-bold text-secondary">11</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">Macroeconomics Group Sync</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="material-symbols-outlined text-xs text-on-surface-variant">schedule</span>
                        <span className="text-xs text-on-surface-variant">4:30 PM • 60 min</span>
                      </div>
                      <div className="mt-2 inline-flex text-[10px] bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full font-bold">Study Session</div>
                    </div>
                  </div>
                  {/* Event Card */}
                  <div className="bg-surface-container-lowest p-4 rounded-xl flex gap-4 hover:translate-x-1 transition-transform cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-outline-variant/10 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] uppercase font-black text-on-surface-variant">SEP</span>
                      <span className="text-lg font-bold text-on-surface-variant">14</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">Data Structures Lab Prep</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="material-symbols-outlined text-xs text-on-surface-variant">schedule</span>
                        <span className="text-xs text-on-surface-variant">10:00 AM • 120 min</span>
                      </div>
                      <div className="mt-2 inline-flex text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-bold">Exam Prep</div>
                    </div>
                  </div>
                </div>
                <button className="w-full mt-6 py-3 border border-outline-variant/30 rounded-full text-xs font-bold hover:bg-surface transition-colors">View All Schedules</button>
              </div>

              <div className="bg-gradient-to-br from-primary to-secondary rounded-lg p-6 text-on-primary relative overflow-hidden group">
                <div className="relative z-10">
                  <h3 className="font-bold text-lg mb-2">Need a Tutor?</h3>
                  <p className="text-xs opacity-80 mb-4 leading-relaxed">Book a 1-on-1 session with a senior mentor to clear your doubts before the finals.</p>
                  <button className="bg-white text-primary px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md active:scale-95 transition-transform">Browse Tutors</button>
                </div>
                <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-500">school</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Mockup: Schedule Session Form */}
      <div className="fixed inset-0 z-[100] bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4 hidden">
        {/* Floating Glass Modal */}
        <div className="bg-white/95 backdrop-blur-xl w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-white/20">
          <div className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Schedule Session</h2>
                <p className="text-on-surface-variant text-sm">Organize a new study sync with your peers.</p>
              </div>
              <button className="p-2 hover:bg-surface-container rounded-full"><span className="material-symbols-outlined">close</span></button>
            </div>

            <form className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Session Title</label>
                <input className="w-full bg-surface-container border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="e.g., Calculus 101 Midterm Prep" type="text" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Date</label>
                  <input className="w-full bg-surface-container border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" type="date" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Time</label>
                  <input className="w-full bg-surface-container border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" type="time" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  <button className="py-2 px-3 rounded-xl border-2 border-primary bg-primary/5 text-primary text-xs font-bold" type="button">Study Session</button>
                  <button className="py-2 px-3 rounded-xl border-2 border-transparent bg-surface-container text-on-surface-variant text-xs font-bold hover:bg-surface-container-high transition-colors" type="button">Exam Prep</button>
                  <button className="py-2 px-3 rounded-xl border-2 border-transparent bg-surface-container text-on-surface-variant text-xs font-bold hover:bg-surface-container-high transition-colors" type="button">Project</button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Participants</label>
                <div className="flex -space-x-2">
                  <img alt="Student" className="w-8 h-8 rounded-full border-2 border-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKSHxiyr6fNTBtd1UZ14dkK1B9CPiWSvzRG4Dcys407qZYWdfkUpAzrBJ2VGZNOkYu03W77UzoH6TpSo6fQkltJdtvQHqm0aye0J05ty4iSO85ChGz3-2Xfq7YM3XGe28JM-h6AEi8jmbZmTc_-8U5H1aZTlIK-7fKhFapjf7o1KnYuoxnNFJ963luwiJ8oJvXtMI0RAwwGWXSQWOpYdHTbpyFH6Vz-XWOdIj9VXOFuPuABcNEtheGsMcIzjCARE2p_BmNxKAzd4g" />
                  <img alt="Student" className="w-8 h-8 rounded-full border-2 border-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSI_S5M0H3WXOd7iMSd63KMRox7nzsfiT3dA6UFbfFyFlutlPkKFK0Nx6OeY-FKuigBislwuZheISUhfxgPzcuduJVExAHl51BDfYqpjCFGZdK76pd31qbOnqwU-H89MOESmrCLGl7oJpP0l7idNI1wjqQ14fz6I0Si3A_KZZ9X4jR5InDmRms88s93HO1W0SO4_73hp3QMhU8LWHaSGWGBivPeRdIQWOe5kYek1Q6ARdkWHgCdJYLrs54jpjzAupJ4pvmfdCsL-A" />
                  <img alt="Student" className="w-8 h-8 rounded-full border-2 border-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9yQm9g-kjfGMCXvo_7UWB3zjc3BVLUgsiu1Ox-eoJAkn9ww-x04g6nlRgebwPB-ECkr5K0wbGU9CXnqCLjuOZY4_seDDJFmWkmOYgXt4VBdlYm4FTcPrv-Wn-RpS9phNmyI84yU04AcqGJMxHEMpJrsifq-HtQsM1IWPbu4Uf0MfYVT5mdVTE26betfy0N1qkQyYyBAfqePBfppZ5V8N1GjT5FWIUzJV3MUcaGJGWZtxp8Hr6O8o4mPyis3tKF1A3N9UlFNlu-Lc" />
                  <button className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border-2 border-white" type="button">
                    <span className="material-symbols-outlined text-xs">add</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button className="flex-1 py-4 text-on-surface-variant font-bold hover:bg-surface transition-colors rounded-full" type="button">Cancel</button>
                <button className="flex-1 py-4 bg-primary text-on-primary font-bold rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-transform" type="submit">Confirm Schedule</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
