import React, { Suspense } from 'react';
export const runtime = 'nodejs';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import SearchInput from '@/app/components/SearchInput';
import ConnectButton from './ConnectButton';

// Extracted Hardcoded Data
const PARTNERS = [
  {
    id: 'elena',
    name: 'Elena Vance',
    major: 'Applied Statistics',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAsTCrc0yN-lZtLIEOXMm7EIyn2mWqJn7WQpkRmCp8phBfNqvqBZoTtUT_3kqXJkLLtm05ei-g1kdRwegMu9R2c0L-XXwmGyGRbokCno79Gnp4u0aESt8Jtnm85rFELgC75fW2Is9G9l6z6d-KN3yOy1IOw0NOmn5jwAQoreMEwEcNZL1zTBMmfufC_4pXuVuQP01PIUEuPt-SkQJW7M0JznVNJFSQMU1IkB448YvFaBGV5NqvfSgiwcRHFAnA9ieTlPIE3X13ezXI',
    match: 98,
    category: 'top',
    skills: ['R Programming', 'Data Vis', 'SQL'],
    schedule: 'Mon, Wed: 4pm - 8pm'
  },
  {
    id: 'marcus',
    name: 'Marcus Chen',
    major: 'Data Science',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUHJUEVjIjPPvl7Yyz8FKqEqDEn6rTW_RLg79-knacdE3DU3M7aU6Qe-FIAhVSKnOOQPCjGgD89kWfyQ2613yBXDB_FixMfTnUvAfjSbg8xPniC-5BkhUaikOzP-SceRdZIzKHkV-6J5NzMGcK6m0LwxHdRFBUHUTBdfTiG3ImpGH3eUspChT-1xz5MvvmE_UWGB-aPc7hpmlHPYEkEnSpclreLrdRb_V1YcrM4GN0XIeI-Y2_or6ZEGWhC1K1yO92wFshiC9UpPs',
    match: 94,
    category: 'top',
    skills: ['Python', 'PyTorch'],
    schedule: 'Weekends: 10am - 4pm'
  },
  {
    id: 'sarah',
    name: 'Sarah Jenkins',
    major: 'Mathematics',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuBn4d_trSbvBQwBWPFljNtnq3bj2WntL1J6XTChwQM5BHCFJTY70Nu4dqDmTqloJN2pZR2rwv3TWVu9rvCaeBe19EWc21s2jRBKy7XhSCUmsXZcvGPVoMvkbiJTkmoH_vsP2wwk9goQvLpLLf-BOgStZ7RS76YMODH1Tx11oMEF3VkvnpGb5OcRD0ke93MnqMmRiNUg1Lj5zjG34efdGjlQjxCSfFM3m89FAL99yxAYpj7U87EpyPC0FJII3VHsNuoa2LKQAVX-A',
    match: 89,
    category: 'overlap',
    skills: ['Calculus III', 'Matlab'],
    schedule: 'Tues, Thurs: Morning'
  },
  {
    id: 'jordan',
    name: 'Jordan Smith',
    major: 'Economics',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWv66HxLmrUqQ7oP_cHXzYd3Yc0mH6x5j6UXO3otpJKhoQMIWydErjRKSnKfIhUTVlz0eHru9d25ENyrwUM2lyojsh8kTIupqrue-lAuxjeGu-UgkJRj6TiJPc2JBu8dUossXXdmoBa6cFeKQYQmmwRj3yQ9nGfdIxrxniM9Dg34n7GptK3qrG2019ExsCFKPOVBYcS-Lb9OQzQVzdiwQCwTRO2iyVmkFA0cykln_9FVmceqSGEOr3qRB14C_oSS1hcCpzr_jrMI8',
    match: 82,
    category: 'overlap',
    skills: ['Stata', 'Python'],
    schedule: 'Daily: 7pm - 10pm'
  },
  {
    id: 'maya',
    name: 'Maya Rodriguez',
    major: 'Biology & Genetics',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDaWzQ4VNIxoOeSYxlMjmQ6CD5ktSQn5rTS-u_0Ra_IbmKHME_E9o7NZs9Nne4AN9LVz8tVK3-EgDWWWWOdu0cCVqdRCjigK6NGnaGU9eR3-zPOEFr2yVHHZTr4Vy7jSvthRFzNO8SjqJI_uFXbb4xluemW-mvH8ynJKE9FFFS7avAGjlEphOfQe1u1SMt79wzASteUmxu58AGrIBXCnuzimqj0bAyj-sAGocYh3dpkwDw7CcBQKQzCqCc5n8xBZlpjSgoiAk2GH-Q',
    match: 78,
    category: 'active',
    skills: ['Bioinformatics', 'Statistics'],
    schedule: 'Studying at Main Library now'
  }
];

// Helper to render individual partner cards
function PartnerCard({ partner }: { partner: any }) {
  const isTertiary = partner.category === 'active';
  const colorClass = isTertiary ? 'tertiary' : partner.category === 'overlap' ? 'secondary' : 'primary';
  const matchColor = partner.match < 85 ? (isTertiary ? 'text-tertiary' : 'text-on-surface-variant/40') : `text-${colorClass}`;
  
  return (
    <div className={`bg-surface-container-lowest rounded-lg p-6 shadow-sm hover:shadow-xl hover:shadow-${colorClass}/5 transition-all group ${partner.category === 'overlap' ? `border-l-4 border-secondary` : ''} ${isTertiary ? 'border border-tertiary/10 ring-4 ring-tertiary-container/20' : ''}`}>
      <div className="flex justify-between items-start mb-6">
        <div className="relative">
          <img 
            className={`w-16 h-16 rounded-xl object-cover transition-all ${isTertiary ? 'group-hover:scale-105' : 'grayscale group-hover:grayscale-0'}`} 
            src={partner.avatar} 
            alt={partner.name} 
          />
          {isTertiary && <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-tertiary-fixed border-2 border-white rounded-full"></span>}
        </div>
        <div className="text-right">
          <div className={`text-2xl font-black ${matchColor} tracking-tighter`}>{partner.match}%</div>
          <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest leading-none">Match</div>
        </div>
      </div>
      <div className="mb-6">
        <h4 className="text-xl font-bold text-on-surface tracking-tight">{partner.name}</h4>
        <p className="text-sm text-on-surface-variant">{partner.major}</p>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-6">
        {partner.skills.map((skill: string) => (
          <span key={skill} className={isTertiary && skill === partner.skills[0] ? "bg-tertiary-container/20 text-tertiary-dim px-3 py-1 rounded-full text-xs font-bold" : "bg-surface-container px-3 py-1 rounded-full text-xs font-medium"}>
            {skill}
          </span>
        ))}
      </div>
      <div className={`flex items-center gap-2 text-xs mb-8 p-3 rounded-xl ${isTertiary ? 'text-tertiary-dim bg-tertiary-container/10 font-bold' : 'text-on-surface-variant bg-surface-container-low/50'}`}>
        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: isTertiary ? "'FILL' 1" : undefined }}>
          {isTertiary ? 'bolt' : 'schedule'}
        </span>
        {partner.schedule}
      </div>
      <div className="flex gap-2">
        {isTertiary ? (
          <Link href={`/chat/personal?name=${encodeURIComponent(partner.name)}&avatar=${encodeURIComponent(partner.avatar)}&major=${encodeURIComponent(partner.major)}`} className="flex-1 py-3 bg-gradient-to-r from-primary to-secondary text-on-primary rounded-full font-bold text-xs hover:shadow-lg transition-all text-center inline-block">Quick DM</Link>
        ) : (
          <>
            <Link href={`/chat/personal?name=${encodeURIComponent(partner.name)}&avatar=${encodeURIComponent(partner.avatar)}&major=${encodeURIComponent(partner.major)}`} className="flex-1 py-3 bg-primary-container text-on-primary-container rounded-full font-bold text-xs hover:bg-primary hover:text-white transition-colors text-center inline-block">DM</Link>
            <ConnectButton partnerId={partner.id} buttonText="Add to Group" />
          </>
        )}
      </div>
    </div>
  );
}

// NextJS expects searchParams pattern to be dynamic Promise for Page component params/searchParams
export default async function MatchingPage(props: { searchParams?: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams;
  const q = searchParams?.q || '';
  
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });

  const query = q.toLowerCase();
  const filteredPartners = PARTNERS.filter(p => 
    p.name.toLowerCase().includes(query) || 
    p.major.toLowerCase().includes(query) ||
    p.skills.some(s => s.toLowerCase().includes(query))
  );

  return (
    <div className="bg-surface text-on-surface min-h-screen antialiased overflow-x-hidden">
      <Sidebar />

      <header className="sticky top-0 z-40 flex justify-between items-center px-4 md:px-8 h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm dark:shadow-none font-sans text-sm">
        <div className="flex items-center flex-1 max-w-sm md:max-w-xl">
          <div className="relative w-full group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant z-10">search</span>
            <Suspense fallback={<input className="w-full bg-surface-container-low border-none rounded-full pl-10 pr-4 py-2 focus:ring-2 focus:ring-primary/20 transition-all outline-none" placeholder="Search for potential study partners..." type="text" />}>
               <SearchInput placeholder="Search by name, major, or skills..." />
            </Suspense>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 mr-4">
            <button className="hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full p-2 transition-all active:scale-95">
              <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
            </button>
            <button className="hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full p-2 transition-all active:scale-95">
              <span className="material-symbols-outlined text-on-surface-variant">settings</span>
            </button>
          </div>
          <div className="flex items-center gap-3 border-l pl-4 border-outline-variant/20">
            <div className="text-right hidden sm:block">
              <p className="font-bold text-on-surface">{user?.name || "Alex Rivera"}</p>
              <p className="text-xs text-on-surface-variant">{user?.profile?.major || "Computer Science"}</p>
            </div>
            <img className="w-10 h-10 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2cOqOiPj1l6qFzkTSxu_lWX2-9YGWDLkucM8ledDb2DJDFmZoz5oid8hlDTkMkU1EsKkTT5KiIfsc5zX5Qqv_xuvs4C0r2oa-Dgyrf1l0eh5JoQ4j5m-ltLwG9vbbm5M9hzr082EoK8d32PhGSxRLfZc-IvbXn1uxM1kjUoBcPn4JqHgowexA7OpOVsHwV3YgKs9hOM_YWDV1WZkyJ1aYUQSVc-V1iYasipHvio_6AkulbEDordxlgA4R17ejK5WaHBFAK1ueSx8" alt="Avatar" />
          </div>
        </div>
      </header>

      <main className="md:ml-20 pb-24 md:pb-0 p-4 md:p-12 min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 md:mb-12">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-on-surface mb-2">Find your tribe.</h2>
            <p className="text-on-surface-variant text-base md:text-lg">Connect with peers whose skills and schedules complement your own.</p>
          </div>

          {filteredPartners.length === 0 ? (
            <div className="py-20 text-center bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant/50">
               <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-50 mb-4">search_off</span>
               <h3 className="text-2xl font-bold text-on-surface mb-2">No matching peers found</h3>
               <p className="text-on-surface-variant max-w-md mx-auto">Try adjusting your search criteria. You can search by their name, their major, or specific skills like "Python".</p>
               <Link href="/matching" className="mt-6 inline-block px-6 py-2 bg-primary-container text-on-primary-container rounded-full font-bold text-sm hover:bg-primary hover:text-white transition-colors">Clear Search</Link>
            </div>
          ) : query ? (
            // Search Results Mode: Flattened Grid Layout
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPartners.map(partner => <PartnerCard key={partner.id} partner={partner} />)}
            </div>
          ) : (
            // Default Mode: 3 Categorized Columns
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
              {/* COLUMN Component helper */}
              {[{ id: 'top', title: 'Top Synergy', color: 'primary', count: 4 },
                { id: 'overlap', title: 'Skill Overlap', color: 'secondary', count: 12 },
                { id: 'active', title: 'Active Now', color: 'tertiary-fixed', count: 'LIVE', isBadge: true }].map(col => {
                const colPartners = filteredPartners.filter(p => p.category === col.id);
                if (colPartners.length === 0) return null;
                
                return (
                  <div key={col.id} className="space-y-6">
                    <div className="flex items-center justify-between mb-4 px-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full bg-${col.color}`}></span>
                        <h3 className="font-bold uppercase tracking-widest text-xs text-on-surface-variant">{col.title}</h3>
                      </div>
                      {col.isBadge ? (
                        <span className="bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded-full text-[10px] font-bold">{col.count}</span>
                      ) : (
                        <span className="bg-surface-container-high px-2 py-0.5 rounded-full text-[10px] font-bold">{col.count}</span>
                      )}
                    </div>
                    {colPartners.map(partner => <PartnerCard key={partner.id} partner={partner} />)}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900 rounded-xl p-8 flex items-center justify-between group overflow-hidden relative">
              <div className="z-10">
                <h4 className="text-white text-2xl font-bold mb-2">Automatch Beta</h4>
                <p className="text-slate-400 text-sm max-w-[280px]">Let our AI pair you with the perfect squad based on your syllabus.</p>
                <button className="mt-6 px-6 py-2 bg-white text-slate-900 rounded-full font-bold text-sm hover:bg-indigo-100 transition-colors">Start Automatch</button>
              </div>
              <span className="material-symbols-outlined text-[120px] absolute -right-4 -bottom-4 text-white/5 group-hover:text-primary/20 transition-all rotate-12">psychology</span>
            </div>
            <div className="bg-indigo-600 rounded-xl p-8 flex items-center justify-between group overflow-hidden relative">
              <div className="z-10">
                <h4 className="text-white text-2xl font-bold mb-2">Review Requests</h4>
                <p className="text-indigo-100 text-sm max-w-[280px]">You have 3 students waiting to join your Statistics group.</p>
                <button className="mt-6 px-6 py-2 bg-indigo-900 text-white rounded-full font-bold text-sm hover:bg-indigo-800 transition-colors">Open Requests</button>
              </div>
              <span className="material-symbols-outlined text-[120px] absolute -right-4 -bottom-4 text-white/5 group-hover:text-white/10 transition-all -rotate-12">notifications_active</span>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-24 md:bottom-10 right-6 md:right-10 z-50">
        <button className="flex items-center gap-2 md:gap-3 bg-gradient-to-br from-primary to-secondary text-on-primary px-6 md:px-8 py-4 md:py-5 rounded-full shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>add</span>
          <span className="font-bold tracking-tight hidden md:inline-block">Post Your Study Ad</span>
        </button>
      </div>
    </div>
  );
}
