'use client';

import React, { useState, useRef } from 'react';
import Sidebar from '@/app/components/Sidebar';
import { uploadProfilePicture } from './upload-action';

export default function ProfileClient({ user, updateProfile }: { user: any, updateProfile: any }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentBio = user.profile?.bio || "Passionate about Distributed Systems and AI. Looking to collaborate on group projects and study for the upcoming GRE.";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    const result = await uploadProfilePicture(formData);

    if (result.error) {
      setUploadError(result.error);
    }
    
    setIsUploading(false);
  };

  return (
    <div className="bg-surface text-on-surface antialiased overflow-x-hidden min-h-screen">
      <Sidebar />

      <main className="md:ml-20 pb-20 md:pb-0 min-h-screen">
        <header className="sticky top-0 z-40 flex justify-between items-center px-4 md:px-8 w-full h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm dark:shadow-none font-sans text-sm">
          <div className="flex items-center gap-6 flex-1">
            <div className="relative w-full max-w-xs md:max-w-sm">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input className="w-full bg-surface-container border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 text-sm outline-none" placeholder="Search resources..." type="text" />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img alt="User" className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20" src={user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=random`} />
              <span className="font-bold text-on-surface">{user.name || 'Scholar'}</span>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-12 max-w-6xl mx-auto">
          <div className="mb-8 md:mb-12">
            <h2 className="text-3xl md:text-[2.75rem] font-black tracking-tighter text-on-surface leading-tight mb-2">Profile Settings</h2>
            <p className="text-on-surface-variant text-base md:text-lg">Manage your digital presence and academic preferences.</p>
          </div>

          <form id="account-settings" action={updateProfile} className="scroll-mt-28">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4 space-y-8">
                <div className="bg-surface-container-lowest rounded-lg p-8 shadow-[0_20px_40px_rgba(70,71,211,0.06)] flex flex-col items-center text-center">
                  <div className="relative group cursor-pointer mb-6" onClick={() => fileInputRef.current?.click()}>
                    <img alt="Profile" className="w-32 h-32 rounded-xl object-cover ring-4 ring-primary-container/20 group-hover:opacity-80 transition-all" src={user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=random&size=128`} />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-primary/80 text-white rounded-full p-2">
                        <span className="material-symbols-outlined">photo_camera</span>
                      </div>
                    </div>
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 flex items-center justify-center rounded-xl">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
                      </div>
                    )}
                  </div>

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />

                  {uploadError && <p className="text-error text-[10px] mb-2 font-bold">{uploadError}</p>}

                  <h3 className="text-xl font-bold mb-1">{user.name || 'Scholar'}</h3>
                  <p className="text-on-surface-variant text-sm mb-6">{user.profile?.major || 'Unspecified'}</p>
                  
                  <div className="w-full flex justify-center gap-2">
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="px-6 py-2 bg-primary-container text-on-primary-container rounded-full text-xs font-bold hover:bg-primary-fixed transition-colors disabled:opacity-50"
                    >
                      {isUploading ? 'Uploading...' : 'Change Photo'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-10">
                <section className="bg-surface-container-lowest rounded-lg p-8 shadow-[0_20px_40px_rgba(70,71,211,0.06)]">
                  <h4 className="text-lg font-bold mb-8">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 md:col-span-1 space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Full Name</label>
                      <input name="name" className="w-full bg-surface-container border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none" type="text" defaultValue={user.name || ''} required />
                    </div>
                    <div className="col-span-2 md:col-span-1 space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Major</label>
                      <input name="major" className="w-full bg-surface-container border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none" type="text" defaultValue={user.profile?.major || ''} />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Short Bio</label>
                      <textarea name="bio" className="w-full bg-surface-container border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 resize-none outline-none" rows={3} defaultValue={currentBio}></textarea>
                    </div>
                  </div>
                </section>

                <div className="flex items-center justify-end gap-4 pb-12">
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
