import Link from "next/link";
import type { ReactNode } from "react";

/** Contact address shown on the legal pages. Set NEXT_PUBLIC_CONTACT_EMAIL before publishing to the app stores. */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";

export function ContactEmail() {
  if (!CONTACT_EMAIL) return <strong>[contact email not configured: set NEXT_PUBLIC_CONTACT_EMAIL]</strong>;
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold underline">
      {CONTACT_EMAIL}
    </a>
  );
}

/** Long-form public page (privacy policy, account deletion) on the paper background. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas font-grotesk text-fg">
      <header className="mx-auto flex max-w-3xl items-center px-4 py-6 md:px-8">
        <Link href="/" className="inline-flex items-center gap-2.5 font-bold no-underline" aria-label="Zenvy home">
          <span aria-hidden="true" className="inline-flex size-10 items-center justify-center rounded-[10px] border-nb bg-focus text-xl text-ink shadow-nb-sm">
            Z
          </span>
          <span className="text-2xl tracking-tight">zenvy</span>
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-20 md:px-8">
        <h1 className="m-0 text-4xl font-bold tracking-tight md:text-5xl">{title}</h1>
        <p className="m-0 mt-2 text-fg-muted">Last updated {updated}</p>
        <div className="mt-8 flex flex-col gap-4 text-[17px] leading-relaxed [&_h2]:m-0 [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-bold [&_li]:mt-1.5 [&_p]:m-0 [&_ul]:m-0 [&_ul]:pl-6 [&_ul]:list-disc">
          {children}
        </div>
      </main>
    </div>
  );
}
