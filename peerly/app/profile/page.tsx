import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });

  if (!user) {
    redirect('/login');
  }

  async function updateProfile(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.email) return;

    const name = formData.get('name') as string;
    const bio = formData.get('bio') as string;
    const studyStyle = formData.get('studyStyle') as string;
    const meetingPreference = formData.get('meetingPreference') as string;
    const interests = `${studyStyle} | ${meetingPreference}`;

    await prisma.user.update({
      where: { email: session.user.email },
      data: { name: name }
    });

    await prisma.profile.upsert({
      where: { userId: user!.id },
      create: {
        userId: user!.id,
        college: 'University',
        major: 'Undeclared',
        semester: 1,
        bio: bio,
        interests: interests,
      },
      update: {
        bio: bio,
        interests: interests,
      }
    });
    
    // In a real app we'd revalidate path here, but layout is simple
  }

  const currentBio = user.profile?.bio || "Passionate about Distributed Systems and AI. Looking to collaborate on group projects and study for the upcoming GRE.";

  return (
    <div className="bg-surface text-on-surface antialiased overflow-x-hidden min-h-screen">
      {/* SideNavBar Shell */}
      <Sidebar />

      {/* Main Content Canvas */}
      <main className="md:ml-20 pb-20 md:pb-0 min-h-screen">
        {/* TopNavBar Shell */}
        <header className="sticky top-0 z-40 flex justify-between items-center px-4 md:px-8 w-full h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm dark:shadow-none font-sans text-sm">
          <div className="flex items-center gap-6 flex-1">
            <div className="relative w-full max-w-xs md:max-w-sm">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input className="w-full bg-surface-container border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 text-sm outline-none" placeholder="Search resources, groups, or people..." type="text" />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full p-2 text-on-surface-variant relative transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
            </button>
            <button className="hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full p-2 text-on-surface-variant transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="h-8 w-px bg-outline-variant/30 mx-2"></div>
            <div className="flex items-center gap-3">
              <img alt="User Profile Avatar" className="w-8 h-8 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuClZhjN-DIxtklCJchtAoLiZXMvE8kEZ5WJqwWFluFNef6CxQQtpwLxuiFWS0oGZHBjQLhNcANG9zh-oEqZi_BFBfwjFFJgb9Y7R1QdAJZIhjVwPTrUzEffz97oUI1r68Mpu7NijcVfNzXFRzMN3k-mKXL49mDobkci5-eIKfgo3zvM8ZcnXecdc3IfYU29A3OtAPf231R9DhcAYcnJV5Fp9VvkwXCsJHxDwKcO9ZjwcxnmL4uGLG6dIcGfvegnY7DgY6h2ckzz-S4" />
              <span className="font-bold text-on-surface">{user.name || 'Scholar'}</span>
            </div>
          </div>
        </header>

        {/* Profile Management Body */}
        <div className="p-4 md:p-12 max-w-6xl mx-auto">
          <div className="mb-8 md:mb-12">
            <h2 className="text-3xl md:text-[2.75rem] font-black tracking-tighter text-on-surface leading-tight mb-2">Profile Settings</h2>
            <p className="text-on-surface-variant text-base md:text-lg">Manage your digital presence and academic preferences.</p>
          </div>

          {/* Tabbed Interface Navigation */}
          <div className="flex gap-8 border-b border-outline-variant/10 mb-10 overflow-x-auto pb-1">
            <button className="pb-4 border-b-2 border-primary text-primary font-bold flex items-center gap-2 transition-all shrink-0">
              <span className="material-symbols-outlined text-sm">person</span>
              Account Info
            </button>
            <button className="pb-4 border-b-2 border-transparent text-on-surface-variant hover:text-on-surface font-medium flex items-center gap-2 transition-all shrink-0">
              <span className="material-symbols-outlined text-sm">auto_stories</span>
              Academic Interests
            </button>
            <button className="pb-4 border-b-2 border-transparent text-on-surface-variant hover:text-on-surface font-medium flex items-center gap-2 transition-all shrink-0">
              <span className="material-symbols-outlined text-sm">notifications</span>
              Notification Settings
            </button>
            <button className="pb-4 border-b-2 border-transparent text-on-surface-variant hover:text-on-surface font-medium flex items-center gap-2 transition-all shrink-0">
              <span className="material-symbols-outlined text-sm">lock</span>
              Privacy
            </button>
          </div>

          <form action={updateProfile}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left Column: Media & Bio */}
              <div className="lg:col-span-4 space-y-8">
                <div className="bg-surface-container-lowest rounded-lg p-8 shadow-[0_20px_40px_rgba(70,71,211,0.06)] flex flex-col items-center text-center">
                  <div className="relative group cursor-pointer mb-6">
                    <img alt="Profile Picture Large" className="w-32 h-32 rounded-xl object-cover ring-4 ring-primary-container/20 group-hover:opacity-80 transition-all" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD61efbUGRJh6dBwgsEJniH5egpuHfiYxjxHSK9e3kigkPsop_wnhLsf6iySRtdRDckY_WBQbFSQSoJ8bFl6z2qoxS4lf4_sH7OD-WbhXeS-wODoBbwir2JX61Gj4aDLTCOVNnpevBvbbUTZFn_ba_f4WIG9Vcw5enFUmD79k0PejqreC0zrFzaPt7n17VCisszklBZC4doSmCj6uAwUalg4v-PCGoHGds0vUjgcia0ete13XwUi9f2-K9_gjWmr74ISI6-AOX54ds" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-primary/80 text-white rounded-full p-2">
                        <span className="material-symbols-outlined">photo_camera</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{user.name || 'Scholar'}</h3>
                  <p className="text-on-surface-variant text-sm mb-6">Senior Computer Science Student</p>
                  <div className="w-full flex justify-center gap-2">
                    <button type="button" className="px-6 py-2 bg-primary-container text-on-primary-container rounded-full text-xs font-bold hover:bg-primary-fixed transition-colors">Change Photo</button>
                    <button type="button" className="p-2 border border-outline-variant/20 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
                
                <div className="bg-surface-container-low rounded-lg p-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold">Available for Matching</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-outline-variant rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    When enabled, other students can find and message you based on your academic interests and preferred subjects.
                  </p>
                </div>
              </div>

              {/* Right Column: Form Fields */}
              <div className="lg:col-span-8 space-y-10">
                <section className="bg-surface-container-lowest rounded-lg p-8 shadow-[0_20px_40px_rgba(70,71,211,0.06)]">
                  <h4 className="text-lg font-bold mb-8">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 md:col-span-1 space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Full Name</label>
                      <input name="name" className="w-full bg-surface-container border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none" type="text" defaultValue={user.name || ''} />
                    </div>
                    <div className="col-span-2 md:col-span-1 space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">University Email</label>
                      <input disabled className="w-full bg-surface-container border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none opacity-60 cursor-not-allowed" type="email" defaultValue={user.email || ''} />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Short Bio</label>
                      <textarea name="bio" className="w-full bg-surface-container border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 resize-none outline-none" rows={3} defaultValue={currentBio}></textarea>
                    </div>
                  </div>
                </section>
                
                <section className="bg-surface-container-lowest rounded-lg p-8 shadow-[0_20px_40px_rgba(70,71,211,0.06)]">
                  <h4 className="text-lg font-bold mb-8">Academic Preferences</h4>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Preferred Subjects</label>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-2 bg-primary px-4 py-2 rounded-full text-white text-sm font-medium">
                          Computer Science
                          <span className="material-symbols-outlined text-xs cursor-pointer">close</span>
                        </div>
                        <div className="flex items-center gap-2 bg-primary px-4 py-2 rounded-full text-white text-sm font-medium">
                          Discrete Math
                          <span className="material-symbols-outlined text-xs cursor-pointer">close</span>
                        </div>
                        <div className="flex items-center gap-2 bg-primary px-4 py-2 rounded-full text-white text-sm font-medium">
                          Algorithms
                          <span className="material-symbols-outlined text-xs cursor-pointer">close</span>
                        </div>
                        <button type="button" className="flex items-center gap-1 border-2 border-dashed border-outline-variant px-4 py-2 rounded-full text-on-surface-variant text-sm font-medium hover:border-primary hover:text-primary transition-all">
                          <span className="material-symbols-outlined text-sm">add</span>
                          Add Subject
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 pt-4">
                      <div className="col-span-2 md:col-span-1 space-y-2">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Study Style</label>
                        <select name="studyStyle" className="w-full bg-surface-container border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 appearance-none outline-none">
                          <option>Collaborative Discussion</option>
                          <option>Silent Pomodoro</option>
                          <option>Peer Teaching</option>
                        </select>
                      </div>
                      <div className="col-span-2 md:col-span-1 space-y-2">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Meeting Preference</label>
                        <select name="meetingPreference" className="w-full bg-surface-container border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 appearance-none outline-none">
                          <option>Hybrid (Mixed)</option>
                          <option>In-Person Only</option>
                          <option>Remote (Discord/Zoom)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="flex items-center justify-end gap-4 pb-12">
                  <button type="button" className="px-8 py-3 text-on-surface-variant font-bold hover:text-on-surface transition-colors">Discard Changes</button>
                  <button type="submit" className="px-10 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-full font-bold shadow-xl shadow-primary/30 active:scale-95 transition-transform">
                    Save Profile
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
