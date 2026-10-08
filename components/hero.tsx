"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookmarkPlus } from "lucide-react";
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
export function Hero({ stats, today }: { stats: HeroStats; today: string }) {
  const { saved, loaded } = useSaved();
  const updated = stats.generatedAt.toLocaleString("en-MY", {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur",
  });
  const active = saved.filter((row) => statusOf(row) !== "done");
  const applied = saved.filter((row) => statusOf(row) === "applied").length;
  const next = nextUp(saved, today);
  const nextDays = next ? daysUntil(next.date!, today) : null;

  return (
    <section className="page-shell pb-6 pt-8 sm:pb-10 sm:pt-16">
      <motion.p {...fade(0)} className="eyebrow flex items-center gap-2 whitespace-nowrap">
        <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
        <span>{stats.total.toLocaleString("en-MY")} free opportunities<span className="max-[399px]:hidden"> · Updated {updated}</span></span>
      </motion.p>
      <motion.h1 {...fade(0.05)} className="mt-4 text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl md:text-7xl">
        Your student life,<br className="sm:hidden" /> <span className="text-muted-foreground">sorted.</span>
      </motion.h1>
      <motion.p {...fade(0.1)} className="page-sub">
        Free events, hackathons, scholarships and internships across Malaysia. Track what matters and get reminded before it closes.
      </motion.p>

      <motion.div {...fade(0.15)} className="mt-6 sm:mt-8">
        {loaded && saved.length ? (
          <div className="grid grid-cols-3 gap-2 sm:max-w-2xl sm:gap-3">
            <Link href="/saved" className="stat">
              <p className="stat-value">{active.length}</p>
              <p className="stat-label">Tracking</p>
            </Link>
            <Link href="/saved" className="stat">
              <p className="stat-value">{applied}</p>
              <p className="stat-label">Applied</p>
            </Link>
            <Link href="/saved" className="stat">
              <p className="stat-value">{nextDays === null ? "–" : nextDays <= 0 ? "Today" : `${nextDays}d`}</p>
              <p className="stat-label">{next ? next.title : "Nothing dated"}</p>
            </Link>
          </div>
        ) : (
          <div className="flex max-w-xl items-center gap-3 rounded-2xl border border-border bg-card p-3.5 sm:p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
              <BookmarkPlus className="size-5" aria-hidden />
            </span>
            <p className="min-w-0 text-sm leading-snug text-muted-foreground">
              <span className="font-medium text-foreground">Start your tracker.</span> Tap <span className="font-medium text-foreground">Track</span> on anything below to get countdowns and calendar reminders.
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
