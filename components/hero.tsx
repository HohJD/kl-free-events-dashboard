"use client";

import { useEffect, useState } from "react";
import { motion, animate } from "framer-motion";
import { Sparkles, CalendarDays, CalendarRange, Layers } from "lucide-react";

export interface HeroStats {
  total: number;
  sources: number;
  today: number;
  thisWeek: number;
  generatedAt: Date;
}

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value]);
  return <>{display}</>;
}

export function Hero({ stats }: { stats: HeroStats }) {
  const updated = stats.generatedAt.toLocaleString("en-MY", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const chips = [
    { label: "free events", value: stats.total, icon: Layers },
    { label: "today", value: stats.today, icon: CalendarDays },
    { label: "this week", value: stats.thisWeek, icon: CalendarRange },
  ];

  return (
    <section className="relative overflow-hidden px-4 pb-8 pt-12 md:pt-20">
      {/* Backdrop: grid + floating gradient blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]" />
        <div className="animate-float absolute -left-24 -top-24 size-96 rounded-full bg-rose-500/20 blur-3xl dark:bg-rose-500/15" />
        <div className="animate-float-delayed absolute -right-20 top-4 size-80 rounded-full bg-indigo-500/20 blur-3xl dark:bg-indigo-500/15" />
        <div className="animate-float absolute bottom-0 left-1/2 size-64 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-md">
            <Sparkles className="size-3.5 text-rose-500" />
            Updated {updated} · scraped from 4 sources daily
          </div>

          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Free things to do in{" "}
            <span className="animate-gradient bg-gradient-to-r from-rose-500 via-orange-400 to-indigo-500 bg-clip-text text-transparent">
              Kuala Lumpur
            </span>
          </h1>

          <p className="max-w-xl text-sm text-muted-foreground md:text-base">
            Every free, public event in the city — one simple view.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-1 flex flex-wrap items-center justify-center gap-2.5"
          >
            {chips.map((chip) => (
              <div
                key={chip.label}
                className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background/60 px-4 py-2.5 shadow-sm backdrop-blur-md"
              >
                <chip.icon className="size-4 text-rose-500" />
                <span className="text-lg font-bold tabular-nums tracking-tight">
                  <CountUp value={chip.value} />
                </span>
                <span className="text-xs text-muted-foreground">
                  {chip.label}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
