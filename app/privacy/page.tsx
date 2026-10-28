import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Privacy policy · Zenvy" };

// Keep in sync with the Play Console data safety form. Have it reviewed before relying on it legally.
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="28 October 2026">
      <p>
        Zenvy helps students find study partners, focus together and talk things through. This policy explains what we collect when you use the Zenvy website and the Zenvy apps for Android and iOS, why, and the choices you have.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account details:</strong> your name, email address and password. Passwords are stored only as a one-way hash. If you sign in with Google, we receive your name, email and profile photo from Google.
        </li>
        <li>
          <strong>Profile:</strong> what you choose to add, such as your college, major, semester, bio, study style, interests, availability and profile photo.
        </li>
        <li>
          <strong>Content you create:</strong> direct messages, group and channel messages, call notes, shared resources, events, job posts, reports and blocks.
        </li>
        <li>
          <strong>Study activity:</strong> focus sessions, streaks and the statistics built from them.
        </li>
        <li>
          <strong>Camera and microphone:</strong> used only during a voice or video call you join, to stream to the other people in that call. Calls are not recorded.
        </li>
        <li>
          <strong>Technical data:</strong> your IP address (to limit abuse, such as repeated login attempts), and push notification tokens if you turn notifications on.
        </li>
      </ul>
      <p>We don&apos;t use advertising trackers or third-party analytics, and we don&apos;t sell your data.</p>

      <h2>How we use it</h2>
      <ul>
        <li>To run your account and show your profile to other students for matching and search.</li>
        <li>To deliver messages, calls, notifications and email (such as verification and password reset).</li>
        <li>To calculate your study statistics and suggest study partners, groups and channels.</li>
        <li>To keep Zenvy safe: preventing abuse, and reviewing reports.</li>
      </ul>

      <h2>Who can see it</h2>
      <p>
        Other students can see your public profile (name, photo, college, major, semester, bio, interests and availability). Your email address and password are never shown. Messages are visible to the people in that conversation, group or channel. You can turn off &ldquo;Available for matching&rdquo; to hide your profile from recommendations.
      </p>

      <h2>Services we rely on</h2>
      <p>We share data only with the providers that run Zenvy for us, and only what they need:</p>
      <ul>
        <li>Vercel (website and API hosting) and a managed PostgreSQL database (your account and content).</li>
        <li>Supabase Storage (profile photos and chat attachments).</li>
        <li>LiveKit (relaying voice and video calls in real time).</li>
        <li>Upstash Redis (short-lived caching and rate limiting).</li>
        <li>Resend (sending account emails).</li>
        <li>Google (if you choose Google sign-in).</li>
      </ul>

      <h2>Keeping and deleting your data</h2>
      <p>
        We keep your data while your account exists. You can delete your account at any time from your profile on the web or from More → Delete account in the app. Deleting your account permanently removes your account, profile, messages, study history and photos. Study groups and channels you run pass to their longest-standing member. See <Link href="/account-deletion" className="font-bold underline">how to delete your account</Link>.
      </p>

      <h2>Security</h2>
      <p>Data is encrypted in transit (HTTPS). Passwords are hashed, accounts lock after repeated wrong passwords, and access to production systems is restricted.</p>

      <h2>Children</h2>
      <p>Zenvy is for students aged 13 and over. We don&apos;t knowingly collect data from children under 13. If you believe a child has an account, contact us and we&apos;ll delete it.</p>

      <h2>Changes</h2>
      <p>If we change this policy, we&apos;ll update the date above, and tell you in the app for significant changes.</p>

      <h2>Contact</h2>
      <p>
        Questions or requests about your data: <ContactEmail />.
      </p>
    </LegalPage>
  );
}
