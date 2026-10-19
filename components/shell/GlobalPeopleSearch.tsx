"use client";

import { Heart, MessageCircle, Search, SearchX, UserSearch } from "lucide-react";
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Avatar, Badge, ButtonLink, controlClasses, cx } from "@/components/ui";

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
    <div ref={rootRef} className={cx("relative", className)}>
      <div className="relative">
        <Search aria-hidden="true" size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-fg-muted" />
        <input
          ref={inputRef}
          aria-label="Search people"
          className={cx(controlClasses, "min-h-12 pr-4 pl-11 sm:pr-24")}
          placeholder="Search people by name, @ID, major or skill"
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
          aria-activedescendant={open && selected ? `${listboxId}-${selected.id}` : undefined}
        />
        <div aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 items-center gap-1 sm:flex">
          <kbd className="rounded-md border-2 border-line bg-card px-1.5 font-jetbrains text-[11px] font-bold">Ctrl</kbd>
          <kbd className="rounded-md border-2 border-line bg-card px-1.5 font-jetbrains text-[11px] font-bold">K</kbd>
        </div>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full z-[80] mt-3 overflow-hidden rounded-nb-lg border-nb bg-card font-grotesk text-fg shadow-nb-md animate-nb-pop-in">
          <div className="flex items-center justify-between border-b-2 border-line px-4 py-2.5">
            <p className="m-0 text-xs font-bold tracking-[0.08em] uppercase" aria-live="polite">
              {resultLabel}
            </p>
            {loading && <span aria-hidden="true" className="size-2.5 animate-pulse rounded-full bg-focus ring-2 ring-line" />}
          </div>

          <div id={listboxId} role="listbox" aria-label="People" className="max-h-[26rem] overflow-y-auto p-2">
            {results.length > 0 ? (
              results.map((person, index) => {
                const active = index === activeIndex;
                return (
                  <div
                    key={person.id}
                    id={`${listboxId}-${person.id}`}
                    role="option"
                    aria-selected={active}
                    className={cx("rounded-nb border-2 p-3", active ? "border-line bg-canvas" : "border-transparent")}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar name={person.name} src={person.avatar} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="m-0 truncate font-bold">{person.name}</p>
                            <p className="m-0 truncate text-sm text-fg-muted">
                              {person.uniqueId ? `@${person.uniqueId}` : person.major} · {person.major}
                            </p>
                          </div>
                          <Badge tone="match" size="sm">
                            <span className="font-jetbrains">{person.matchScore}%</span>
                          </Badge>
                        </div>

                        {person.reasons.length > 0 && (
                          <ul className="m-0 mt-2 flex list-none flex-wrap gap-1.5 p-0">
                            {person.reasons.map((reason) => (
                              <li key={reason}>
                                <Badge size="sm">{reason}</Badge>
                              </li>
                            ))}
                          </ul>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <ButtonLink href={`/users/${encodeURIComponent(person.id)}`} variant="secondary" size="sm" icon={<UserSearch size={16} />} onClick={() => setOpen(false)}>
                            View profile
                          </ButtonLink>
                          {person.connectionStatus === "ACCEPTED" ? (
                            <ButtonLink href={`/chat/personal?id=${encodeURIComponent(person.id)}`} variant="chat" size="sm" icon={<MessageCircle size={16} />} onClick={() => setOpen(false)}>
                              Message
                            </ButtonLink>
                          ) : (
                            <ButtonLink href={`/matching?q=${encodeURIComponent(person.name)}`} variant="match" size="sm" icon={<Heart size={16} />} onClick={() => setOpen(false)}>
                              {statusLabel(person.connectionStatus)}
                            </ButtonLink>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
                <SearchX aria-hidden="true" size={32} />
                <p className="m-0 font-bold">No people found</p>
                <p className="m-0 text-sm text-fg-muted">Try a name, @ID, department or skill.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
