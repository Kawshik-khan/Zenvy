import React from 'react';
export const runtime = 'nodejs';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import JoinGroupButton from '@/app/components/JoinGroupButton';
import CreateGroupModal from '@/app/components/CreateGroupModal';
import ErrorView from '@/app/components/ErrorView';

export default async function StudyGroupsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  let user;
  let groups;

  try {
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true },
    });

    if (!user) return redirect('/login');

    groups = await prisma.studyGroup.findMany({
      include: {
        members: {
          include: { user: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("Groups Page Error:", error);
    return <ErrorView error={error} />;
  }

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen">
      {/* SideNavBar Shell */}
      <Sidebar />

      {/* TopNavBar Shell */}
      <header className="sticky top-0 z-40 flex justify-between items-center px-4 md:px-8 h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm dark:shadow-none">
        <div className="flex items-center flex-1 max-w-sm md:max-w-xl">
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined">search</span>
            <input className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Search by subject, goal, or member..." type="text" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full p-2 transition-transform active:scale-95">
            <span className="material-symbols-outlined text-slate-500">notifications</span>
          </button>
          <button className="hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full p-2 transition-transform active:scale-95">
            <span className="material-symbols-outlined text-slate-500">settings</span>
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden ml-2 ring-2 ring-primary/10">
            <img alt="User Profile Avatar" className="w-full h-full object-cover" src={user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=random`} />
          </div>
        </div>
      </header>

      {/* Main Content Stage */}
      <main className="md:ml-20 pb-24 md:pb-0 p-4 md:p-12 min-h-screen">
        {/* Hero Section */}
        <div className="mb-8 md:mb-12">
          <h2 className="text-3xl md:text-[2.75rem] font-black text-on-surface leading-tight tracking-tighter mb-4">Find your tribe.</h2>
          <p className="text-on-surface-variant max-w-2xl text-base md:text-lg leading-relaxed">
            Connect with peers who share your academic drive. Join specialized study groups designed to help you master complex subjects through collaborative learning.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-surface-container-low rounded-xl p-4 mb-10 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant shadow-sm border border-outline-variant/10">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            <span>Filters:</span>
          </div>
          
          <div className="relative">
            <select className="appearance-none outline-none bg-white border-none rounded-lg text-xs font-semibold py-2 pl-4 pr-10 focus:ring-2 focus:ring-primary/10 shadow-sm min-w-[140px]">
              <option>Subject</option>
              <option>Computer Science</option>
              <option>Biology</option>
              <option>Physics</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] pointer-events-none">expand_more</span>
          </div>

          <div className="relative">
            <select className="appearance-none outline-none bg-white border-none rounded-lg text-xs font-semibold py-2 pl-4 pr-10 focus:ring-2 focus:ring-primary/10 shadow-sm min-w-[140px]">
              <option>Goals</option>
              <option>Exam Prep</option>
              <option>Project Work</option>
              <option>Discussion</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] pointer-events-none">expand_more</span>
          </div>

          <div className="relative">
            <select className="appearance-none outline-none bg-white border-none rounded-lg text-xs font-semibold py-2 pl-4 pr-10 focus:ring-2 focus:ring-primary/10 shadow-sm min-w-[140px]">
              <option>Members</option>
              <option>1-5</option>
              <option>5-10</option>
              <option>10+</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] pointer-events-none">expand_more</span>
          </div>

          <div className="relative">
            <select className="appearance-none outline-none bg-white border-none rounded-lg text-xs font-semibold py-2 pl-4 pr-10 focus:ring-2 focus:ring-primary/10 shadow-sm min-w-[140px]">
              <option>Difficulty</option>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] pointer-events-none">expand_more</span>
          </div>

          <button className="ml-auto text-xs font-bold text-primary hover:underline px-4">Clear All</button>
        </div>

        {/* Grid of Study Groups */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {groups.map((group) => {
            const isMember = group.members.some(m => m.userId === user.id);
            const memberCount = group.members.length;
            
            return (
              <div key={group.id} className="group bg-surface-container-lowest rounded-lg p-8 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(70,71,211,0.06)] relative flex flex-col h-full border border-outline-variant/5">
                <div className="flex justify-between items-start mb-8">
                  <span className="px-4 py-1.5 bg-tertiary-container text-on-tertiary-container text-xs font-bold rounded-full">Active</span>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{memberCount} Members</span>
                </div>
                <div className="mb-4">
                  <span className="text-xs font-bold text-primary mb-2 block uppercase tracking-tight">{group.subject || "General"}</span>
                  <Link href={`/groups/${group.id}`} className="block group/link">
                    <h3 className="text-xl font-bold text-on-surface mb-3 leading-tight group-hover/link:text-primary transition-colors">{group.name}</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-3">{group.description || "A study group to collaborate and learn together."}</p>
                  </Link>
                </div>
                <div className="mt-auto pt-8 flex items-center justify-between border-t border-outline-variant/10">
                  <div className="flex -space-x-3">
                    {group.members.slice(0, 3).map((member) => (
                      <img key={member.id} alt={member.user.name || "Member"} className="w-10 h-10 rounded-full border-4 border-white object-cover bg-slate-200" src={member.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user.name || "U")}&background=random`} />
                    ))}
                    {memberCount > 3 && (
                      <div className="w-10 h-10 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">+{memberCount - 3}</div>
                    )}
                  </div>
                  <JoinGroupButton groupId={group.id} isMember={isMember} />
                </div>
              </div>
            );
          })}

          {/* Empty / CTA Card */}
          <CreateGroupModal>
            <div className="bg-surface-container rounded-lg p-8 border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-surface-container-high transition-colors h-full min-h-[300px]">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-3xl">add_circle</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-2">Can't find your subject?</h3>
              <p className="text-sm text-on-surface-variant mb-6">Create a new group and lead the way for other students.</p>
              <button className="text-sm font-bold text-primary hover:underline">Start a New Group</button>
            </div>
          </CreateGroupModal>

        </div>
      </main>

      {/* Contextual FAB */}
      <CreateGroupModal>
        <button className="fixed bottom-24 md:bottom-10 right-6 md:right-10 w-14 h-14 md:w-16 md:h-16 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 z-50" style={{ background: 'linear-gradient(135deg, #4647d3 0%, #6a37d4 100%)'}}>
          <span className="material-symbols-outlined text-2xl md:text-3xl">add</span>
        </button>
      </CreateGroupModal>
    </div>
  );
}
