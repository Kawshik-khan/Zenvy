"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink, cx } from "@/components/ui";

export function LandingNav({ jobsEnabled }: { jobsEnabled: boolean }) {
  const links = [
    { href: "#how-it-works", label: "How it works" },
    { href: "#features", label: "Features" },
    { href: "#matching", label: "Matching" },
    { href: "#focus", label: "Focus" },
    ...(jobsEnabled ? [{ href: "#jobs", label: "Jobs" }] : []),
    { href: "#communities", label: "Communities" },
  ];
  const [active, setActive] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  // Highlight the section in view, with a sliding sticker behind its link.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    if (typeof IntersectionObserver === "undefined") return () => window.removeEventListener("scroll", onScroll);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(`#${entry.target.id}`);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const id of ["top", "how-it-works", "features", "matching", "focus", "jobs", "communities"]) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const link = active ? navRef.current?.querySelector<HTMLAnchorElement>(`a[href="${active}"]`) : null;
    setPill(link ? { left: link.offsetLeft, width: link.offsetWidth } : null);
  }, [active]);

  return (
    <header className={cx("sticky top-0 z-50 border-b-[length:var(--nb-border-width)] border-line bg-canvas transition-shadow duration-200", scrolled && "shadow-[0_4px_0_0_var(--nb-line)]")}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Logo />
        <nav ref={navRef} aria-label="Page sections" className="relative hidden items-center gap-1 font-grotesk font-medium lg:flex">
          <span
            aria-hidden="true"
            className="absolute top-1/2 h-10 -translate-y-1/2 rounded-nb border-2 border-line bg-focus shadow-nb-sm transition-[left,width,opacity] duration-[380ms] ease-[var(--ease-nb-spring)]"
            style={{ left: pill?.left ?? 0, width: pill?.width ?? 0, opacity: pill ? 1 : 0 }}
          />
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={active === link.href ? "true" : undefined}
              className="nb-focus relative inline-flex min-h-11 items-center rounded-nb px-3 text-fg no-underline"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <ButtonLink href="/login" variant="ghost" size="sm" className="max-sm:hidden">
            Log in
          </ButtonLink>
          <ButtonLink href="/register" size="sm">
            Get started
          </ButtonLink>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="landing-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
            className="nb-focus nb-press inline-flex size-11 cursor-pointer items-center justify-center rounded-nb border-nb bg-card text-fg shadow-nb-sm lg:hidden"
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="landing-menu" aria-label="Page sections, mobile" className="animate-nb-slide-in-bottom border-t-2 border-line bg-canvas px-4 pt-3 pb-5 lg:hidden">
          <ul className="m-0 grid list-none gap-2 p-0">
            {[...links, { href: "/login", label: "Log in" }].map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={() => setOpen(false)} className="nb-focus flex min-h-12 items-center rounded-nb border-2 border-line bg-card px-4 font-bold text-fg no-underline">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
