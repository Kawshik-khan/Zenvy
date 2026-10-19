import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#matching", label: "Matching" },
  { href: "#calls", label: "Calls" },
  { href: "#communities", label: "Communities" },
];

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b-[length:var(--nb-border-width)] border-line bg-canvas">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Logo />
        <nav aria-label="Page sections" className="hidden items-center gap-6 font-grotesk font-medium lg:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="nb-focus rounded-nb px-1 text-fg no-underline hover:underline hover:decoration-2 hover:underline-offset-4">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <ButtonLink href="/login" variant="ghost" size="sm">
            Log in
          </ButtonLink>
          <ButtonLink href="/register" size="sm">
            Get started
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
