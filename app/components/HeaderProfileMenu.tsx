"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";

type HeaderProfileMenuProps = {
  userName: string;
  imageUrl: string | null;
};

export default function HeaderProfileMenu({ userName, imageUrl }: HeaderProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const avatarSrc =
    imageUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || "U")}&background=random&size=128`;

  useEffect(() => {
    if (!open) return;

    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="flex flex-wrap items-center gap-3 cursor-pointer border-none shadow-none bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg"
      >
        <div className="text-right hidden sm:block">
          <p className="font-bold leading-none">{userName}</p>
          <p className="text-[10px] text-on-surface-variant font-medium">Logged In</p>
        </div>
        <img
          alt=""
          className="w-10 h-10 rounded-full object-cover ring-2 ring-white ring-offset-2 ring-offset-primary shrink-0"
          src={avatarSrc}
        />
        <span className="material-symbols-outlined text-on-surface-variant text-xl hidden sm:inline">
          expand_more
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-[220px] rounded-xl border border-outline-variant/20 bg-white/95 py-1 shadow-lg backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-950/95"
        >
          <Link
            role="menuitem"
            href="/profile"
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low dark:hover:bg-slate-900"
            onClick={() => setOpen(false)}
          >
            <span className="material-symbols-outlined text-lg text-on-surface-variant">person</span>
            Profile
          </Link>
          <Link
            role="menuitem"
            href="/profile#account-settings"
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low dark:hover:bg-slate-900"
            onClick={() => setOpen(false)}
          >
            <span className="material-symbols-outlined text-lg text-on-surface-variant">settings</span>
            Settings
          </Link>
          <div className="my-1 h-px bg-outline-variant/20" />
          <form action={logoutAction}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
