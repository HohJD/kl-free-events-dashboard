"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ThemeToggle } from "./theme-toggle";
import { SECTIONS, SITE_NAME, activeSection } from "@/lib/site";
import { statusOf, useSaved } from "@/lib/use-saved";
import { cn } from "@/lib/utils";

function Logo() {
  return (
    <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand to-brand-2 font-display text-sm font-extrabold text-white">
      SR
    </span>
  );
}

/** Sticky header on every page, plus a floating tab bar on phones. */
export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const active = activeSection(pathname);
  const { saved } = useSaved();
  const open = saved.filter((row) => statusOf(row) !== "done").length;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="page-shell flex h-16 items-center gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label={`${SITE_NAME} home`}>
            <Logo />
            <span className="truncate font-display text-lg font-extrabold tracking-tight">{SITE_NAME}</span>
          </Link>
          <nav aria-label="Sections" className="ml-auto hidden items-center gap-1 rounded-2xl border border-border/70 bg-card/60 p-1 md:flex">
            {SECTIONS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} aria-current={active === href ? "page" : undefined}
                className={cn("relative flex h-9 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition-colors",
                  active === href ? "text-background" : "text-muted-foreground hover:text-foreground")}>
                {active === href ? <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl bg-foreground" transition={{ type: "spring", bounce: 0.2, duration: 0.45 }} /> : null}
                <Icon className="relative size-4" aria-hidden />
                <span className="relative">{label}</span>
                {href === "/saved" && open ? <span className="relative rounded-full bg-accent px-1.5 text-[11px] font-bold tabular-nums text-accent-foreground">{open}</span> : null}
              </Link>
            ))}
          </nav>
          <div className="ml-auto md:ml-0">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <nav aria-label="Sections" className="site-tabs glass">
        {SECTIONS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-current={active === href ? "page" : undefined}
            className={cn("site-tab", active === href && "site-tab-on")}>
            {active === href ? <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-xl bg-foreground" transition={{ type: "spring", bounce: 0.2, duration: 0.45 }} /> : null}
            <Icon className="relative size-[18px]" aria-hidden />
            <span className="relative">{label}</span>
            {href === "/saved" && open ? <span className="relative rounded-full bg-accent px-1.5 text-[11px] font-bold tabular-nums text-accent-foreground">{open}</span> : null}
          </Link>
        ))}
      </nav>
    </>
  );
}
