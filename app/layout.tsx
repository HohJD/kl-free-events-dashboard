import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";

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
  "Free events, hackathons, scholarships and internships for students in Malaysia, updated daily. Track what you apply to and get calendar reminders.";
const TITLE = "Students Repo: your student life, sorted";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  manifest: "/manifest.json",
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Students Repo",
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
    { media: "(prefers-color-scheme: light)", color: "#f5f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0c14" },
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
        <Providers>
          <div className="aurora" aria-hidden />
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
