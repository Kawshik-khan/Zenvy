import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';

export default async function StudyGroupsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });

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
            <img alt="User Profile Avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtbe80mc7G63GqQwqAnMRjXf5BRypBLwggEkIwa-cvBv8GyZS6Qg4rywvjv7seAWsEZpXihhdrV7iNzl3JAPkJHr05p3MNOXjgykpalJhu7DEDjV9EdipLw6V-qnSad_YF2ZI5cbGwIWwzMjuraaDfw91TjT0LV01Grs4p4cVAsJb7XKLF26leE2Cq0ZwGNzNKbxnL_Yo952z_JHw2R7vxIjSFRjKiyQETZyb2RKvNtFs4cdVPjrdqOvc16Qargl4OuFcolN1OTYc" />
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
          
          {/* Group Card 1 */}
          <div className="group bg-surface-container-lowest rounded-lg p-8 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(70,71,211,0.06)] relative flex flex-col h-full">
            <div className="flex justify-between items-start mb-8">
              <span className="px-4 py-1.5 bg-tertiary-container text-on-tertiary-container text-xs font-bold rounded-full">Active Now</span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">3h Daily</span>
            </div>
            <div className="mb-4">
              <span className="text-xs font-bold text-primary mb-2 block uppercase tracking-tight">Computer Science</span>
              <h3 className="text-xl font-bold text-on-surface mb-3 leading-tight">Neural Networks & Deep Learning</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">Focusing on PyTorch implementation of Transformer architectures. Midterm prep starting soon.</p>
            </div>
            <div className="mt-auto pt-8 flex items-center justify-between border-t border-outline-variant/10">
              <div className="flex -space-x-3">
                <img alt="Member" className="w-10 h-10 rounded-full border-4 border-white object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCk28nEJ38nfH_aAjKnxfq6dDwuH46stgcPElBw5jEBgbp4zCX6VP7fqJtdk5-7tuVWo4qgphrAHJDUv8ZO6q5PPnDwgeLnEJ8Sk5KkYQuEub7olxAOucN8tHz9vb1eMByNalbVe7JvMFn0ebqSX-ZFp-fXFH1fyDcIxf3PVFssylnVR64dLXryhu8uxw_Ey6SjajY9-gqVsKaaZ9NJ0xCF8xZLXFM-L9qtikAncwfpRya0dDkz3HKccjhj0LqcnIzSg0JMhD3IMCU" />
                <img alt="Member" className="w-10 h-10 rounded-full border-4 border-white object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHQC8uNnVdzlI9yszuJnNLMe-Be2e5bZSv5i9laPKSgfsfAKYr5ClHIMPvkAkDe-D9oEn0H5EAWqHDAGtLPsvjJ5ispxTDJgu7ueDrEZ41wesd07DOSz2ItFvAmhfxfW7zML7y4zBI7I25Z7Sf4PMWi8EiVMFzF3Yc1RVYhS2e5-yhQLAJLigkbZTUYbirChbdOPOPbGLcOvgcVBXq7RdIq5p3NDqEls62HC0hgfAFxTr77fZqsvFsSNvUSckbT9H9XsEZWt1o9Ho" />
                <img alt="Member" className="w-10 h-10 rounded-full border-4 border-white object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2y8u9Jbxatgmugq4quGUiEi8oXV-dXtK-3dkMwIQeUYkNAjbqJXNCxVk6_bQ9CWl3Fmik2F6UU4RMPLEGxsKqbpYndE8axMT0DwzRsR7WNW0hg5j4qlMhtgIGKGEJgmNZUtyxU3uqXx-nZU91BZy94d9elOlGgLnKqnvmHFczhRyvWwHexKsGEH0Hhm-SyD-nzMpg3IIy4ULphPJYZHpw0td-VQRRxnV-LC8JwSeIzqWu3j23PJidwX111tyAl16_NYe6hGeC-ig" />
                <div className="w-10 h-10 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">+8</div>
              </div>
              <button className="px-6 py-2 text-white rounded-full text-xs font-bold hover:scale-105 transition-transform active:scale-95 shadow-md" style={{ background: 'linear-gradient(135deg, #4647d3 0%, #6a37d4 100%)'}}>Join Group</button>
            </div>
          </div>

          {/* Group Card 2 */}
          <div className="group bg-surface-container-lowest rounded-lg p-8 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(70,71,211,0.06)] relative flex flex-col h-full">
            <div className="flex justify-between items-start mb-8">
              <span className="px-4 py-1.5 bg-primary-container text-on-primary-container text-xs font-bold rounded-full">Mid-Difficulty</span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Weekends</span>
            </div>
            <div className="mb-4">
              <span className="text-xs font-bold text-primary mb-2 block uppercase tracking-tight">Biology</span>
              <h3 className="text-xl font-bold text-on-surface mb-3 leading-tight">Advanced Molecular Genetics</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">Exploring CRISPR-Cas9 mechanisms and regulatory pathways in eukaryotic systems.</p>
            </div>
            <div className="mt-auto pt-8 flex items-center justify-between border-t border-outline-variant/10">
              <div className="flex -space-x-3">
                <img alt="Member" className="w-10 h-10 rounded-full border-4 border-white object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCAlTlwNP9c-byBlQiPYdp-r5vSYTyvceNjzdnA2BK9a4_1vl6lk5q1jZslWjIsxxWnMS-AJCOxd6YYGRbpnsiDJnyJXddDQCfzMfp-63dDrmurVcfaY9VlKpQTfSZiwAYOVHHZnAbF2KBRBeovbZG5ZR0J2u9wPVWZEsx-Dq2xXcfHwro5Jo01FVjfDsnK0PrdGiiVzsQREacxwMiGyn2-r_U81_jdrm9Gvh_I7jbxE5UIcm_xrzsLJPQRcS6gzva0o07DxZZlxeo" />
                <img alt="Member" className="w-10 h-10 rounded-full border-4 border-white object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLDzpHIdPeTDgi9wZMy5qewGVmO_ePBm4tEmKqF_XlnCnHt3tlORceKdoSWwSI4tCCQ8JJN6Dhzp9u20i-0EqOwyEVIRA5-JkxCiPGEdm5xNVCuFOUlQkeqJ13SzB91x0SE7E_Mo512XRT24FtEa0L8owNPaIT4c3WYgdoPtfCGxMU-azl2uXdS2Sg2qdt9yCCMo3RZ6NaTVyXspAQHUXdo13W-Hw563xCQK94ijY8rqYWGFg4DcuoINdnkq3sgRdhcOOYc7rxG-k" />
                <div className="w-10 h-10 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">+4</div>
              </div>
              <button className="px-6 py-2 border-2 border-primary text-primary rounded-full text-xs font-bold hover:bg-primary/5 transition-colors active:scale-95">Request Access</button>
            </div>
          </div>

          {/* Group Card 3 */}
          <div className="group bg-surface-container-lowest rounded-lg p-8 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(70,71,211,0.06)] relative flex flex-col h-full">
            <div className="flex justify-between items-start mb-8">
              <span className="px-4 py-1.5 bg-surface-container text-on-surface-variant text-xs font-bold rounded-full">Open Enrollment</span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Tue/Thu</span>
            </div>
            <div className="mb-4">
              <span className="text-xs font-bold text-primary mb-2 block uppercase tracking-tight">Business</span>
              <h3 className="text-xl font-bold text-on-surface mb-3 leading-tight">Strategic Market Dynamics</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">Case study analysis for MBA core curriculum. Looking for collaborative peer reviewers.</p>
            </div>
            <div className="mt-auto pt-8 flex items-center justify-between border-t border-outline-variant/10">
              <div className="flex -space-x-3">
                <img alt="Member" className="w-10 h-10 rounded-full border-4 border-white object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6MH-yURr30xJ2aMuX3jeHCf8mZU9WzqROnTkOXPMlS9iHdlNX7b_msaK8tXBQMa0R0Fi2_pq0hIWAQ3YRO73jAM0lv0U5pX_JZB3ecybjl1Up3xEj--VwVOiayRqIWvEn5jJ7uXt5HVSbA9ykSyb9WXZL3bYyp5YrO7i5l4aIqS8redy43AFG-JW07jVZRFCIc9vC0UuZCKFJ75OlguZRRsVzajb8WdTMhudZtMHw1rDorXDc3fVVB2Crm8GKnUM3pYfiUEswTyM" />
                <img alt="Member" className="w-10 h-10 rounded-full border-4 border-white object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNUKvtWjlkEs2dvCHTS4HDtYQAWUZ82N7ggkxJoR53_NbkTBiPKE8WgWz14LWPt54Llw9-CtM7Gs4Aj5HZV3EKg2VUdSwiUl5MhWK2TkvM3F_tyz2QvUVHUrd7bAhEekuY6d3uEriQHIANXLEnPsvTVdVqv8BNFR_LdffUlcP-ZsJuRD4WZG4ZYAAOEmT6e0PdIrdGOb3w9i2jnjef1EihtI0AqB_6YIFlbs4UY20jFLhsG3VOmrte-q9Yaqe2y7kXMl8FywTSyXg" />
                <img alt="Member" className="w-10 h-10 rounded-full border-4 border-white object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4-C6M7ZvMUS_DrM6BN7upD2ddlBmZrkLK05U7oaumWx24cJ1DXxrVyAdkID6x6eT2Qv595nn1neqHlp_fUHErn5LRcFhScuODMw3HHNEOc40d_KLAiQcVranG3DNZwYARrwTRvMwROQsCLmST1lLP_uOGdBYonxVbYtydDyt3ebf22QubuhPPKBlmklQAEvvVr-X4P-_gM3q6X4Sx-iHgaq7yIlxT_DbOe_gP_Lp_AlXd_D-vI0BFzRw17TuWrYLnAuIZXvOdLWE" />
                <img alt="Member" className="w-10 h-10 rounded-full border-4 border-white object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuByx0lw3ZsVGUDJPSTxROfXoO8aDJp-k4zp2qAsPUHkC5Bo9nJoQ8RHyMBSBeGHVR9ZGMEFg-uN4JdZCv1NfUopn_ZqWle9lxingF7ddme-k1t7wFK3oehkDxqLQ0cpRqh8akoRBEXQA1c-bLLDZm5NxjyncB0YQol6SV16S93MfSB6ytFMMcPzInbFU0MoHRcxAvOX93xZxu-aOI6dpx3YO3CteIbs2Ug6pDRVNAh6d9NnXT2XuQ6nbfICO-pdvPd3zG8hhWev6GU" />
              </div>
              <button className="px-6 py-2 text-white rounded-full text-xs font-bold hover:scale-105 transition-transform active:scale-95 shadow-md" style={{ background: 'linear-gradient(135deg, #4647d3 0%, #6a37d4 100%)'}}>Join Group</button>
            </div>
          </div>

          {/* Group Card 4 */}
          <div className="group bg-surface-container-lowest rounded-lg p-8 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(70,71,211,0.06)] relative flex flex-col h-full">
            <div className="flex justify-between items-start mb-8">
              <span className="px-4 py-1.5 bg-tertiary-container text-on-tertiary-container text-xs font-bold rounded-full">New Group</span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Mornings</span>
            </div>
            <div className="mb-4">
              <span className="text-xs font-bold text-primary mb-2 block uppercase tracking-tight">Philosophy</span>
              <h3 className="text-xl font-bold text-on-surface mb-3 leading-tight">Ethics in the Digital Age</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">Discussing the moral implications of artificial general intelligence and automated systems.</p>
            </div>
            <div className="mt-auto pt-8 flex items-center justify-between border-t border-outline-variant/10">
              <div className="flex -space-x-3">
                <img alt="Member" className="w-10 h-10 rounded-full border-4 border-white object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1gzK79kaXJehhD2VHh8l8JCJNt-3weNoPews0cCjnL55aUa6j47CwjpCKZBDbUNVI4eWu6USkhguLFcBRn-SIq3p2oaSetcCrOdAcVHDtIlegZnRZhwrp8KTRKbuF60FIU2z4EioRP6tVg2kcdfXQ-zfpPY2kVzkNuX6DBZFOhIX59yomXJaF7r1ZsrLp31TjJblvE6DSVOL0s7zxdaChrBHEu81-OD-DAYszszmpAFfE-lLzqq_iLO0nCOc5EgkI0OdcjzlAIZc" />
                <div className="w-10 h-10 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">1/6</div>
              </div>
              <button className="px-6 py-2 text-white rounded-full text-xs font-bold hover:scale-105 transition-transform active:scale-95 shadow-md" style={{ background: 'linear-gradient(135deg, #4647d3 0%, #6a37d4 100%)'}}>Join Group</button>
            </div>
          </div>

          {/* Group Card 5 */}
          <div className="group bg-surface-container-lowest rounded-lg p-8 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(70,71,211,0.06)] relative flex flex-col h-full">
            <div className="flex justify-between items-start mb-8">
              <span className="px-4 py-1.5 bg-primary-container text-on-primary-container text-xs font-bold rounded-full">Intensive</span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Daily</span>
            </div>
            <div className="mb-4">
              <span className="text-xs font-bold text-primary mb-2 block uppercase tracking-tight">Physics</span>
              <h3 className="text-xl font-bold text-on-surface mb-3 leading-tight">Quantum Mechanics II</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">Strict problem-set based study. Must have completed QM I with B+ or higher.</p>
            </div>
            <div className="mt-auto pt-8 flex items-center justify-between border-t border-outline-variant/10">
              <div className="flex -space-x-3">
                <img alt="Member" className="w-10 h-10 rounded-full border-4 border-white object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxTYPHbtKzFZ5o1TCcb1FwTONtxBtdIj9nxaF03Xv2T14BlHbXvr6ioI_KVUbAQTHp4EcI2lVBtKi9RE5TTu65HxGYhVZv1SkW2WM4Q6ZMtDbp7bwqf5F3zbOnlXQa8iBFYhwsc-kXek_cBp1FXUl0qM7uboFqkiZIqrggGCNvx1bn7GLmfGFafUZZNJgB0_h4gt3awg-xgNuMnbr3kjkr3nJGLXUjuBDSu5CXR5RJ2FCSor27p9HFlDMBDhakJYrhwwJTLv8GVKA" />
                <img alt="Member" className="w-10 h-10 rounded-full border-4 border-white object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNNmNIe8aS6PvXzisynq6YJFLC3Jrb-Yd7kB2_x92SqMDK57MeERudRGTIjKRLTtH-tztxmC097zM-N4emy2ZaxuZA4dt9DFjRLwoJhzVZvWzASNg1B8BRW1qun8nBKSGddRz-3rlO6912YIWD9uK_7w6dj7gFGQLKO0ObOO-M952cTn72a0zbMiHuUX82aStTLHOdGJ8DuQxiP_Vi_EvnCKjHwZ6X-JyHAjZ9yf2zwlWYwns2a7LAt20V4X1UXNvSI_YN5LcuDwg" />
              </div>
              <button className="px-6 py-2 border-2 border-primary text-primary rounded-full text-xs font-bold hover:bg-primary/5 transition-colors active:scale-95">Request Access</button>
            </div>
          </div>

          {/* Empty / CTA Card */}
          <div className="bg-surface-container rounded-lg p-8 border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-surface-container-high transition-colors">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-primary text-3xl">add_circle</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">Can't find your subject?</h3>
            <p className="text-sm text-on-surface-variant mb-6">Create a new group and lead the way for other students.</p>
            <button className="text-sm font-bold text-primary hover:underline">Start a New Group</button>
          </div>

        </div>
      </main>

      {/* Contextual FAB */}
      <button className="fixed bottom-24 md:bottom-10 right-6 md:right-10 w-14 h-14 md:w-16 md:h-16 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 z-50" style={{ background: 'linear-gradient(135deg, #4647d3 0%, #6a37d4 100%)'}}>
        <span className="material-symbols-outlined text-2xl md:text-3xl">add</span>
      </button>
    </div>
  );
}
