import React from 'react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-surface animate-fade-in">
      <div className="relative mb-8">
        {/* Animated Rings */}
        <div className="absolute inset-0 w-32 h-32 border-4 border-primary/10 rounded-full animate-ping"></div>
        <div className="absolute inset-0 w-32 h-32 border-4 border-primary/20 rounded-full animate-pulse"></div>
        
        {/* Logo/Icon Container */}
        <div className="w-32 h-32 bg-surface-container-low rounded-full shadow-2xl flex items-center justify-center relative z-10 border border-outline-variant/10">
          <span className="material-symbols-outlined text-5xl text-primary animate-pulse-soft" style={{ fontVariationSettings: "'FILL' 1" }}>
            auto_stories
          </span>
        </div>
      </div>
      
      <div className="text-center group">
        <h2 className="text-2xl font-black text-on-surface tracking-tighter mb-2">
          Zenvy
        </h2>
        <div className="flex items-center gap-1 justify-center">
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0ms]"></div>
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:200ms]"></div>
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:400ms]"></div>
        </div>
        <p className="mt-6 text-on-surface-variant text-xs font-bold uppercase tracking-[0.2em] opacity-50">
          Preparing your Sanctuary...
        </p>
      </div>
      
      {/* Decorative Bottom Shape */}
      <div className="absolute bottom-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
    </div>
  );
}
