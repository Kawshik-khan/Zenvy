import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export function LandingFooter() {
  return (
    <footer className="border-t-[length:var(--nb-border-width)] border-line bg-canvas text-fg">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex flex-col gap-2">
          <Logo />
          <p className="m-0 font-grotesk text-fg-muted">Study partners, groups and focus time in one place.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 font-grotesk font-bold">
          <Link href="/login" className="nb-focus rounded-nb text-fg underline-offset-4 hover:underline">
            Log in
          </Link>
          <Link href="/register" className="nb-focus rounded-nb text-fg underline-offset-4 hover:underline">
            Create account
          </Link>
          <a href="#features" className="nb-focus rounded-nb text-fg underline-offset-4 hover:underline">
            Features
          </a>
          <a href="#matching" className="nb-focus rounded-nb text-fg underline-offset-4 hover:underline">
            Matching
          </a>
        </nav>
      </div>
      <div className="border-t-2 border-line px-4 py-4 text-center font-grotesk text-sm text-fg-muted">© {new Date().getFullYear()} Zenvy</div>
    </footer>
  );
}
