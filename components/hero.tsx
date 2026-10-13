"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { OpportunityKind } from "@/lib/opportunities";
import { statusOf, useSaved } from "@/lib/use-saved";
import { daysUntil, nextUp } from "@/lib/tracker";

export interface HeroStats {
  total: number;
  sources: number;
  today: number;
  closingSoon: number;
  generatedAt: Date;
}

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.2, 0.8, 0.2, 1] as const },
});

/** Headline plus the visitor's own week: what they track, what's next. */
export function Hero({ stats, today, onExplore }: { stats: HeroStats; today: string; onExplore: (kind: OpportunityKind | "week") => void }) {
  const { saved, loaded } = useSaved();
  const updated = stats.generatedAt.toLocaleString("en-MY", {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur",
  });
  const active = saved;
  const applied = saved.filter((row) => statusOf(row) === "applied").length;
  const next = nextUp(saved, today);
  const nextDays = next ? daysUntil(next.date!, today) : null;

  return (
    <section className="page-shell pb-6 pt-8 sm:pb-10 sm:pt-16">
      <motion.p {...fade(0)} className="eyebrow flex items-center gap-2 whitespace-nowrap">
        <span className="relative flex size-2" aria-hidden><span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" /><span className="relative inline-flex size-2 rounded-full bg-primary" /></span>
        <span>{stats.total.toLocaleString("en-MY")} free opportunities<span className="max-[399px]:hidden"> · Updated {updated}</span></span>
      </motion.p>
      <motion.h1 {...fade(0.05)} className="mt-4 text-[2rem] min-[375px]:text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl md:text-7xl">
        Your student life,<br className="sm:hidden" />{" "}
        <span className="squiggle">sorted.<svg viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden><path d="M3 14 C 40 4, 70 18, 105 9 S 170 4, 197 11" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" /></svg></span>
      </motion.h1>
      <motion.p {...fade(0.1)} className="page-sub">
        Events, funding, careers and free tools. Your next opportunity in Malaysia starts here.
      </motion.p>

      <motion.div {...fade(0.12)} className="mt-6 grid grid-cols-2 gap-2 lg:grid-cols-4" aria-label="Explore by goal">
        {([
          ["week", "Make plans", "Events this week"],
          ["scholarship", "Fund your studies", "Scholarships & support"],
          ["internship", "Start your career", "Find an internship"],
          ["tool", "Build something", "Free tools for your ideas"],
        ] as const).map(([kind, title, description]) => (
          <button key={kind} type="button" onClick={() => onExplore(kind)} className="group rounded-2xl border border-border bg-card p-3 sm:p-4 text-left transition-colors hover:border-foreground/40 hover:bg-muted">
            <span className="flex items-start justify-between gap-2 text-sm font-semibold">{title}<ArrowRight className="mt-0.5 size-4 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden /></span>
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{description}</span>
          </button>
        ))}
      </motion.div>
      <motion.div {...fade(0.15)} className="mt-4 sm:mt-8">
        {loaded && saved.length ? (
          <div className="grid grid-cols-3 gap-2 sm:max-w-2xl sm:gap-3">
            <Link href="/saved" className="stat">
              <p className="stat-value">{active.length}</p>
              <p className="stat-label">Tracking</p>
            </Link>
            <Link href="/saved" className="stat">
              <p className="stat-value">{applied}</p>
              <p className="stat-label">Signed up</p>
            </Link>
            <Link href="/saved" className="stat">
              <p className="stat-value">{nextDays === null ? "–" : nextDays <= 0 ? "Today" : `${nextDays}d`}</p>
              <p className="stat-label">{next ? next.title : "Nothing dated"}</p>
            </Link>
          </div>
        ) : (
          <div className="flex max-w-xl items-center gap-3 sm:rounded-3xl sm:border sm:border-dashed sm:border-input sm:bg-card sm:p-4">
            <p className="min-w-0 text-sm leading-snug text-muted-foreground">
              Tap <span className="font-medium text-foreground">Track</span> to save an opportunity. No account needed.
            </p>
          </div>
        )}
        {stats.today || stats.closingSoon ? (
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {stats.today ? <span><span className="font-medium text-foreground">{stats.today}</span> happening today</span> : null}
            {stats.closingSoon ? <span><span className="font-medium text-foreground">{stats.closingSoon}</span> closing in 2 weeks</span> : null}
            {saved.length ? <Link href="/saved" className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline">Open tracker <ArrowRight className="size-3" aria-hidden /></Link> : null}
          </p>
        ) : null}
      </motion.div>
    </section>
  );
}
