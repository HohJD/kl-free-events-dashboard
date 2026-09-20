"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Sparkles } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { SECTIONS, SITE_NAME, activeSection } from "@/lib/site";
import { useSaved } from "@/lib/use-saved";
import { cn } from "@/lib/utils";

/** Sticky header on every page; the phone tab bar mirrors its links. */
export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const active = activeSection(pathname);
  const { saved } = useSaved();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="page-shell flex h-16 items-center gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label={`${SITE_NAME} home`}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-accent text-accent-foreground shadow-brutal-sm">
            <Sparkles className="size-4" strokeWidth={2.25} />
          </span>
          <span className="truncate font-display text-lg font-bold tracking-tight">{SITE_NAME}</span>
        </Link>
        <nav aria-label="Sections" className="ml-auto hidden items-center gap-1 md:flex">
          {SECTIONS.map((section) => (
            <Link key={section.href} href={section.href} aria-current={active === section.href ? "page" : undefined}
              className={cn("inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors",
                active === section.href ? "bg-accent text-accent-foreground shadow-brutal-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <section.icon className="size-4" aria-hidden /> {section.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-0.5 md:ml-2">
          <Link href="/saved" aria-current={pathname === "/saved" ? "page" : undefined} aria-label={`Saved${saved.length ? `, ${saved.length} item${saved.length === 1 ? "" : "s"}` : ""}`}
            className={cn("relative flex size-11 items-center justify-center rounded-xl transition-colors",
              pathname === "/saved" ? "bg-accent text-accent-foreground shadow-brutal-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            <Heart className={cn("size-4", saved.length && "fill-current")} aria-hidden />
            {saved.length ? <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{saved.length}</span> : null}
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

/** App-style bottom tabs on phones. */
export function MobileTabs() {
  const active = activeSection(usePathname() ?? "/");
  return (
    <nav aria-label="Sections" className="site-tabs md:hidden" style={{ gridTemplateColumns: `repeat(${SECTIONS.length}, minmax(0, 1fr))` }}>
      {SECTIONS.map((section) => (
        <Link key={section.href} href={section.href} aria-current={active === section.href ? "page" : undefined}
          className={cn("site-tab", active === section.href && "site-tab-on")}>
          <section.icon className="size-5" aria-hidden />
          <span>{section.short}</span>
        </Link>
      ))}
    </nav>
  );
}
