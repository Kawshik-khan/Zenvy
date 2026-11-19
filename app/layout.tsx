import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@livekit/components-styles";
import "./globals.css";
import PushManager from "./components/PushManager";
import PomodoroProvider from "./components/PomodoroProvider";
import CallProvider from "./components/CallProvider";

// Zenvy Brutal fonts, used through the `font-grotesk` / `font-jetbrains` utilities.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

// Display serif for landing headlines (`font-display`).
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
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
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PomodoroProvider>
          <CallProvider>
            <PushManager />
            {children}
          </CallProvider>
        </PomodoroProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}

