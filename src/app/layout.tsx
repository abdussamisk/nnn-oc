import type { Metadata } from "next";
import { IBM_Plex_Mono, Instrument_Serif, Manrope } from "next/font/google";

import { siteUrl } from "@/lib/env";

import "./globals.css";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "NNN — Thirty days. One decision.",
    template: "%s · NNN",
  },
  description:
    "A daily discipline challenge for November 2026. One mark a day. Miss a day and the run resets. The board is public.",
  openGraph: {
    title: "NNN — Thirty days. One decision.",
    description:
      "A daily discipline challenge for November 2026. One mark a day. Miss a day and the run resets.",
    type: "website",
    siteName: "NNN",
  },
  twitter: {
    card: "summary_large_image",
    title: "NNN — Thirty days. One decision.",
    description: "One mark a day. Miss a day and the run resets.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
