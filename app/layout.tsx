import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";

const display = Bricolage_Grotesque({
  weight: ["600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
});

const SITE_URL = "https://kl-free-events-dashboard.vercel.app";
const DESCRIPTION =
  "Find free tech meetups, hackathons, startup events and career opportunities across Malaysia. Built for students and fresh graduates, with other community events too.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Free Events Malaysia — tech, startups & careers",
  description: DESCRIPTION,
  manifest: "/manifest.json",
  openGraph: {
    title: "Free Events Malaysia — tech, startups & careers",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Free Events Malaysia",
    images: [{ url: "/icon.png", width: 512, height: 512 }],
    locale: "en_MY",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Events Malaysia — tech, startups & careers",
    description: DESCRIPTION,
    images: ["/icon.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf6ec" },
    { media: "(prefers-color-scheme: dark)", color: "#161412" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          display.variable,
          body.variable,
          mono.variable
        )}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
