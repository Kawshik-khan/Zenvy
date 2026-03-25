"use client";

import { useState, useRef, useEffect } from "react";
import { reportUser } from "@/app/actions/connection";

export default function ThreeDotMenu({ targetId = "general" }: { targetId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleReport = async () => {
    if (confirm("Are you sure you want to report this activity?")) {
      await reportUser(targetId, "Inappropriate activity detected via dashboard menu.");
      alert("Report submitted successfully.");
      setIsOpen(false);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-2 hover:bg-surface-container rounded-full transition-colors flex items-center justify-center text-on-surface-variant focus:text-primary outline-none"
      >
        <span className="material-symbols-outlined text-sm">more_horiz</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-outline-variant/10 py-2 z-50 overflow-hidden text-sm">
          <button 
            onClick={handleDismiss} 
            className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-3 text-on-surface font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">visibility_off</span>
            Hide Activity
          </button>
          <div className="h-[1px] bg-outline-variant/10 my-1 w-full"></div>
          <button 
            onClick={handleReport} 
            className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors flex items-center gap-3 font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">flag</span>
            Report
          </button>
        </div>
      )}
    </div>
  );
}
