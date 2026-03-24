'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function IncomingCallContent() {
  const searchParams = useSearchParams();
  const callerName = searchParams?.get('name') || 'Elena Vance';
  const callerAvatar = searchParams?.get('avatar') || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAsTCrc0yN-lZtLIEOXMm7EIyn2mWqJn7WQpkRmCp8phBfNqvqBZoTtUT_3kqXJkLLtm05ei-g1kdRwegMu9R2c0L-XXwmGyGRbokCno79Gnp4u0aESt8Jtnm85rFELgC75fW2Is9G9l6z6d-KN3yOy1IOw0NOmn5jwAQoreMEwEcNZL1zTBMmfufC_4pXuVuQP01PIUEuPt-SkQJW7M0JznVNJFSQMU1IkB448YvFaBGV5NqvfSgiwcRHFAnA9ieTlPIE3X13ezXI';
  const isVideo = searchParams?.get('type') === 'video';
  const roomId = searchParams?.get('roomId') || `call_${callerName.replace(/\s+/g, '_')}`;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white overflow-hidden font-sans">
      {/* Dynamic Blurred Background using the Caller's Avatar */}
      <div 
        className="absolute inset-0 z-0 opacity-40 blur-[100px] scale-125 bg-center bg-cover transition-all"
        style={{ backgroundImage: `url('${callerAvatar}')` }}
      />
      
      {/* Subtle Overlay to ensure contrast */}
      <div className="absolute inset-0 z-0 bg-slate-950/60" />

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center h-full w-full max-w-lg px-6 py-20 justify-between">
        
        {/* Top Section: Caller Info */}
        <div className="flex flex-col items-center mt-12 animate-in slide-in-from-top-10 fade-in duration-700">
          <div className="relative mb-8">
            {/* Pulsing Ripple Rings */}
            <div className="absolute inset-0 rounded-full animate-ping bg-emerald-500/20 scale-150" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-0 rounded-full animate-ping bg-emerald-500/30 scale-125 delay-150" style={{ animationDuration: '2.5s' }} />
            
            {/* Avatar */}
            <img 
              src={callerAvatar} 
              alt={callerName} 
              className="w-40 h-40 rounded-full object-cover shadow-2xl ring-4 ring-emerald-500/50 relative z-10" 
            />
          </div>
          
          <h1 className="text-4xl font-black tracking-tight drop-shadow-lg mb-2 text-center">{callerName}</h1>
          <p className="text-lg text-slate-300 font-medium tracking-wide flex items-center gap-2 uppercase text-[11px]">
            {isVideo ? (
              <><span className="material-symbols-outlined text-[16px]">videocam</span> Incoming Video Call...</>
            ) : (
              <><span className="material-symbols-outlined text-[16px]">call</span> Incoming Voice Call...</>
            )}
          </p>
        </div>

        {/* Bottom Section: Action Buttons */}
        <div className="flex w-full justify-center gap-12 mt-auto mb-12 animate-in slide-in-from-bottom-10 fade-in duration-700 delay-300">
          {/* Decline Button */}
          <div className="flex flex-col items-center gap-4">
            <Link 
              href="/chat"
              className="w-20 h-20 rounded-full bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/30 hover:bg-rose-600 hover:scale-110 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-4xl text-white">call_end</span>
            </Link>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Decline</span>
          </div>

          {/* Accept Button */}
          <div className="flex flex-col items-center gap-4">
            <Link 
              href={`/call/active?name=${encodeURIComponent(callerName)}&avatar=${encodeURIComponent(callerAvatar)}&type=${isVideo ? 'video' : 'voice'}&isCaller=false&roomId=${roomId}`}
              className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 hover:scale-110 active:scale-95 transition-all relative group"
            >
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75 hidden group-hover:block" />
              <span className="material-symbols-outlined text-4xl text-white relative z-10">
                {isVideo ? 'videocam' : 'call'}
              </span>
            </Link>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Accept</span>
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default function IncomingCallPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen w-full items-center justify-center bg-slate-950 text-white">Loading...</div>}>
      <IncomingCallContent />
    </Suspense>
  );
}
