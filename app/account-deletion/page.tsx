import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Delete your account · Zenvy" };

// The "delete account URL" for the Play Console data safety section.
export default function AccountDeletionPage() {
  return (
    <LegalPage title="Delete your Zenvy account" updated="28 October 2026">
      <p>You can permanently delete your Zenvy account and its data yourself, at any time.</p>

      <h2>In the app</h2>
      <ul>
        <li>Open Zenvy and go to <strong>More</strong>.</li>
        <li>Under Settings, tap <strong>Delete account</strong>.</li>
        <li>Type DELETE, enter your password (not needed for Google sign-in), and tap <strong>Delete permanently</strong>.</li>
      </ul>

      <h2>On the web</h2>
      <ul>
        <li>
          <Link href="/login" className="font-bold underline">Sign in</Link> and open <Link href="/profile" className="font-bold underline">Profile settings</Link>.
        </li>
        <li>At the bottom, choose <strong>Delete my account</strong> and confirm.</li>
      </ul>

      <h2>Can&apos;t sign in?</h2>
      <p>
        Email <ContactEmail /> from the address on your account and ask us to delete it. We&apos;ll confirm and delete it within 30 days.
      </p>

      <h2>What gets deleted</h2>
      <ul>
        <li>Your account, profile and profile photos.</li>
        <li>Your messages, call notes, shared resources, job posts, events you created, focus sessions and study statistics.</li>
        <li>Your connections, group and channel memberships, notifications, blocks and reports.</li>
      </ul>
      <p>
        Deletion happens immediately and can&apos;t be undone. Study groups and channels you run aren&apos;t deleted if others are in them: they pass to their longest-standing member. Nothing is kept afterwards, apart from what service providers may hold briefly in their backups.
      </p>
    </LegalPage>
  );
}
