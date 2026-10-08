import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";

// Geist for everything: one family, set apart by weight and tracking.
const sans = localFont({ src: "./fonts/GeistVF.woff", weight: "100 900", variable: "--font-body", display: "swap" });
const mono = localFont({ src: "./fonts/GeistMonoVF.woff", weight: "100 900", variable: "--font-mono", display: "swap" });

const SITE_URL = "https://kl-free-events-dashboard.vercel.app";
const DESCRIPTION =
  "Free events, hackathons, scholarships and internships for students in Malaysia, updated daily. Track what you apply to and get calendar reminders.";
const TITLE = "Student Repo by ATH · Your student life, sorted";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  manifest: "/manifest.json",
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Student Repo by ATH",
    images: [{ url: "/icon.png", width: 512, height: 512 }],
    locale: "en_MY",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/icon.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
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
          sans.variable,
          mono.variable
        )}
      >
        <Providers>
          <SiteHeader />
          <div className="pb-24 md:pb-0">
            {children}
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
