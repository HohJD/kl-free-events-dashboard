"use client";

import Link from "next/link";
import { OxfordGuide } from "./oxford-guide";
import { EDITIONS, type Edition } from "@/lib/edition";
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
export function Hero({ stats, today, edition, onEditionChange, onExplore }: { stats: HeroStats; today: string; edition: Edition; onEditionChange: (edition: Edition) => void; onExplore: (kind: OpportunityKind | "week" | "local" | "closing") => void }) {
  const { saved, loaded } = useSaved();
  const updated = stats.generatedAt.toLocaleString("en-MY", {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: EDITIONS[edition].timezone,
  });
  const active = saved;
  const applied = saved.filter((row) => statusOf(row) === "applied").length;
  const next = nextUp(saved, today);
  const nextDays = next ? daysUntil(next.date!, today) : null;

  return (
    <section className="page-shell pb-6 pt-8 sm:pb-10 sm:pt-16">
      <div className={edition === "uk" ? "grid items-start gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-12" : ""}>
      <div className="min-w-0">
      <motion.p {...fade(0)} className="eyebrow flex items-center gap-2 whitespace-nowrap">
        <span className="relative flex size-2" aria-hidden><span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" /><span className="relative inline-flex size-2 rounded-full bg-primary" /></span>
        <span>{stats.total.toLocaleString("en-MY")} opportunities<span className="max-[399px]:hidden"> · Updated {updated}</span></span>
      </motion.p>
      <motion.h1 {...fade(0.05)} className="mt-4 text-[2rem] min-[375px]:text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl md:text-7xl">
        {edition === "uk" ? <>Your Oxford life,<br /></> : <>Your student life,<br className="sm:hidden" />{" "}</>}
        <span className="squiggle">sorted.<svg viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden><path d="M3 14 C 40 4, 70 18, 105 9 S 170 4, 197 11" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" /></svg></span>
      </motion.h1>
      <motion.p {...fade(0.1)} className="page-sub">
        {EDITIONS[edition].tagline}
      </motion.p>

      <div role="group" aria-label="Country" className="mt-4 inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
        {(["my", "uk"] as const).map((value) => (
          <button key={value} type="button" onClick={() => onEditionChange(value)} aria-pressed={edition === value}
            className={`min-h-11 rounded-full px-4 text-xs font-semibold transition-colors ${edition === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
            {EDITIONS[value].label}
          </button>
        ))}
      </div>

      </div>
      {edition === "uk" ? <OxfordGuide /> : null}
      </div>

      <motion.div {...fade(0.12)} className="mt-7 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4" aria-label="Explore by goal">
        {(edition === "uk" ? [
          ["week", "Between lectures", "Local events this week"],
          ["closing", "Don’t miss out", "Deadlines in the next 14 days"],
          ["internship", "Try something new", "Internships & placements"],
          ["local", "Stay closer", "Oxford & nearby opportunities"],
        ] as const : [
          ["week", "Make plans", "Events this week"],
          ["scholarship", "Fund your studies", "Scholarships & support"],
          ["internship", "Start your career", "Find an internship"],
          ["tool", "Build something", "Free tools for your ideas"],
        ] as const).map(([kind, title, description], index) => (
          <button key={kind} type="button" onClick={() => onExplore(kind)} className="goal-card group flex flex-col items-start rounded-2xl border border-border bg-card p-3 sm:p-4 text-left transition-colors hover:border-foreground/40 hover:bg-muted">
            <span className="mb-4 hidden w-full items-center justify-between sm:flex text-[11px] font-medium tabular-nums text-muted-foreground" aria-hidden>
              <span>0{index + 1}</span><ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
            <span className="block text-sm font-semibold">{title}</span>
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
          <div className="flex items-center gap-3">
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
