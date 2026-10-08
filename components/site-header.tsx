"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ThemeToggle } from "./theme-toggle";
import { SECTIONS, SITE_BY, SITE_FULL_NAME, SITE_NAME, activeSection } from "@/lib/site";
import { statusOf, useSaved } from "@/lib/use-saved";
import { cn } from "@/lib/utils";

function Logo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.png" alt="" width={32} height={32}
      className="size-8 shrink-0 rounded-lg border border-border object-cover transition-transform group-hover:-rotate-6" />
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
      <header className="z-40 w-full border-b border-border bg-background/85 backdrop-blur-lg backdrop-saturate-150 md:sticky md:top-0">
        <div className="page-shell flex h-14 items-center gap-3 md:h-16">
          <Link href="/" className="group flex min-w-0 items-center gap-2.5" aria-label={`${SITE_FULL_NAME} home`}>
            <Logo />
            <span className="flex min-w-0 items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-[15px] font-semibold tracking-tight">{SITE_NAME}</span>
              <span className="text-xs text-muted-foreground">by {SITE_BY}</span>
            </span>
          </Link>
          <nav aria-label="Sections" className="ml-auto hidden items-center gap-1 md:flex">
            {SECTIONS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} aria-current={active === href ? "page" : undefined}
                className={cn("relative flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-semibold transition-colors",
                  active === href ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {active === href ? <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-muted" transition={{ type: "spring", bounce: 0, duration: 0.35 }} /> : null}
                <Icon className="relative size-4" aria-hidden />
                <span className="relative">{label}</span>
                {href === "/saved" && open ? <span className="relative text-xs tabular-nums text-muted-foreground">{open}</span> : null}
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
            {active === href ? <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", bounce: 0, duration: 0.35 }} /> : null}
            <Icon className="relative size-[18px]" aria-hidden />
            <span className="relative">{label}</span>
            {href === "/saved" && open ? <span className={cn("relative text-xs tabular-nums", active === href ? "text-primary-foreground/75" : "text-muted-foreground")}>{open}</span> : null}
          </Link>
        ))}
      </nav>
    </>
  );
}
