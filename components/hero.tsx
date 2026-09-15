"use client";

import { useEffect, useState } from "react";
import { motion, animate, useReducedMotion } from "framer-motion";

export interface HeroStats {
  total: number;
  sources: number;
  today: number;
  thisWeek: number;
  generatedAt: Date;
}

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (reduceMotion) return;
    const controls = animate(0, value, {
      duration: 1,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, reduceMotion]);
  return <>{reduceMotion ? value : display}</>;
}

export function Hero({ stats }: { stats: HeroStats }) {
  const updated = stats.generatedAt.toLocaleString("en-MY", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kuala_Lumpur",
  });

  const chips = [
    { label: "free events", value: stats.total, bg: "bg-accent" },
    { label: "today", value: stats.today, bg: "bg-[#7dd4fc]" },
    { label: "this week", value: stats.thisWeek, bg: "bg-[#86efac]" },
  ];

  return (
    <section className="pb-8 pt-8 sm:py-12">
      <div className="page-shell">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="font-mono text-xs leading-relaxed text-muted-foreground">
            Malaysia-wide discovery · checked {updated} · {stats.sources} sources
          </p>

          <h1 className="section-heading mt-4 max-w-3xl">
            Your next{" "}
            <span className="marker-highlight whitespace-nowrap">opportunity</span>
          </h1>

          <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
            Free tech meetups, startup communities, hackathons and career events across Malaysia — built for students and fresh graduates.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mt-6 grid max-w-lg grid-cols-3 gap-3 sm:mt-8 sm:gap-4"
          >
            {chips.map((chip) => (
              <div
                key={chip.label}
                className={`flex min-w-0 flex-col gap-1 rounded-xl border border-border/60 px-3 py-3 shadow-brutal-sm sm:px-4 ${chip.bg} text-black`}
              >
                <span className="font-display text-2xl font-bold leading-none tabular-nums sm:text-3xl">
                  <CountUp value={chip.value} />
                </span>
                <span className="whitespace-nowrap text-xs font-medium">
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
