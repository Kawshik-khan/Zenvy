"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";

type PeopleSearchResult = {
  id: string;
  name: string;
  uniqueId: string | null;
  avatar: string;
  major: string;
  college: string;
  interests: string[];
  availability: string | null;
  matchScore: number;
  connectionStatus: string | null;
  sharedGroups: number;
  sharedChannels: number;
  reasons: string[];
};

type GlobalPeopleSearchProps = {
  className?: string;
};

function statusLabel(status: string | null) {
  if (status === "ACCEPTED") return "Matched";
  if (status === "PENDING") return "Pending";
  if (status === "REJECTED") return "Rejected";
  return "Connect";
}

export default function GlobalPeopleSearch({ className = "" }: GlobalPeopleSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PeopleSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const trimmedQuery = query.trim();
  const selected = results[activeIndex];
  const resultLabel = useMemo(() => {
    if (!trimmedQuery) return "Recommended people";
    if (loading) return "Searching";
    return `${results.length} result${results.length === 1 ? "" : "s"}`;
  }, [loading, results.length, trimmedQuery]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const isSearchShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
      if (isSearchShortcut) {
        event.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/search/people?q=${encodeURIComponent(trimmedQuery)}&limit=10`, {
        cache: "no-store",
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : { people: [] }))
        .then((payload: { people?: PeopleSearchResult[] }) => {
          if (!active) return;
          setResults(payload.people || []);
          setActiveIndex(0);
        })
        .catch(() => {
          if (active) setResults([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, trimmedQuery ? 180 : 80);

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [trimmedQuery]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (!open) setOpen(true);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }

    if (event.key === "Enter" && selected) {
      event.preventDefault();
      window.location.href = `/chat/personal?id=${encodeURIComponent(selected.id)}`;
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div className="group relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[#94A3B8] transition-colors group-focus-within:text-[#7C83FF]">
          search
        </span>
        <input
          ref={inputRef}
          className="w-full rounded-2xl border border-white/5 bg-[#0E1525]/80 py-3.5 pl-12 pr-12 text-sm text-[#F8FAFC] shadow-[0_4px_20px_rgba(0,0,0,0.2)] outline-none backdrop-blur-md transition-all placeholder:text-[#94A3B8] focus:border-[#7C83FF]/50 focus:ring-1 focus:ring-[#7C83FF]/50"
          placeholder="Search people by name, @ID, major, or skill..."
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
        />
        <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 items-center gap-1 opacity-50 sm:flex">
          <span className="rounded border border-white/10 bg-[#141C30] px-1.5 py-0.5 font-mono text-[10px] font-bold">Ctrl</span>
          <span className="rounded border border-white/10 bg-[#141C30] px-1.5 py-0.5 font-mono text-[10px] font-bold">K</span>
        </div>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-[80] mt-3 overflow-hidden rounded-3xl border border-white/10 bg-[#0B1020]/95 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#94A3B8]">{resultLabel}</p>
            {loading && <span className="h-2 w-2 animate-pulse rounded-full bg-[#22D3EE]" />}
          </div>

          <div id={listboxId} role="listbox" className="max-h-[26rem] overflow-y-auto p-2">
            {results.length > 0 ? (
              results.map((person, index) => {
                const active = index === activeIndex;
                return (
                  <div
                    key={person.id}
                    role="option"
                    aria-selected={active}
                    className={`rounded-2xl p-3 transition-colors ${active ? "bg-[#141C30]" : "hover:bg-[#101827]"}`}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <div className="flex items-start gap-3">
                      <img className="h-11 w-11 shrink-0 rounded-2xl object-cover" src={person.avatar} alt="" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-[#F8FAFC]">{person.name}</p>
                            <p className="truncate text-xs text-[#94A3B8]">
                              {person.uniqueId ? `@${person.uniqueId}` : person.major} · {person.major}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-[#7C83FF]/15 px-2.5 py-1 text-[10px] font-black text-[#AEB3FF]">
                            {person.matchScore}%
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {person.reasons.map((reason) => (
                            <span key={reason} className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-bold text-[#94A3B8]">
                              {reason}
                            </span>
                          ))}
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <Link
                            href={`/users/${encodeURIComponent(person.id)}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-black text-[#CBD5E1] transition-colors hover:bg-white/10"
                            onClick={() => setOpen(false)}
                          >
                            <span className="material-symbols-outlined text-sm">person_search</span>
                            View Profile
                          </Link>
                          {person.connectionStatus === "ACCEPTED" ? (
                            <Link
                              href={`/chat/personal?id=${encodeURIComponent(person.id)}`}
                              className="inline-flex items-center gap-1.5 rounded-full bg-[#7C83FF] px-3 py-1.5 text-[11px] font-black text-white transition-colors hover:bg-[#6871ff]"
                              onClick={() => setOpen(false)}
                            >
                              <span className="material-symbols-outlined text-sm">chat_bubble</span>
                              Message
                            </Link>
                          ) : (
                            <Link
                              href={`/matching?q=${encodeURIComponent(person.name)}`}
                              className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-black text-[#CBD5E1] transition-colors hover:bg-white/10"
                              onClick={() => setOpen(false)}
                            >
                              <span className="material-symbols-outlined text-sm">favorite</span>
                              {statusLabel(person.connectionStatus)}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-10 text-center">
                <span className="material-symbols-outlined mb-3 block text-4xl text-[#94A3B8]/60">search_off</span>
                <p className="text-sm font-bold text-[#F8FAFC]">No people found</p>
                <p className="mt-1 text-xs text-[#94A3B8]">Try a name, @ID, department, or skill.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
