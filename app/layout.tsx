import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "@livekit/components-styles";
import "./globals.css";
import PushManager from "./components/PushManager";
import PomodoroProvider from "./components/PomodoroProvider";
import CallProvider from "./components/CallProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Zenvy Brutal fonts, used through the `font-grotesk` / `font-jetbrains` utilities.
// Geist stays until every screen is migrated (Phase 4).
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zenvy",
  description: "Your personalized study partner matching platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PomodoroProvider>
          <CallProvider>
            <PushManager />
            {children}
          </CallProvider>
        </PomodoroProvider>
      </body>
    </html>
  );
}

