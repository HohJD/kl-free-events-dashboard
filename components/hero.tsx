"use client";

import { useEffect, useState } from "react";
import { motion, animate } from "framer-motion";

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
      duration: 1,
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
    { label: "free events", value: stats.total, bg: "bg-accent" },
    { label: "today", value: stats.today, bg: "bg-[#7dd4fc]" },
    { label: "this week", value: stats.thisWeek, bg: "bg-[#86efac]" },
  ];

  return (
    <section className="border-b border-border/50 px-4 pb-10 pt-12 md:pt-16">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="font-mono text-xs text-muted-foreground">
            Updated {updated} · {stats.sources} sources · always free
          </p>

          <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl md:text-6xl">
            Free things to{" "}
            <span className="marker-highlight whitespace-nowrap">do</span>
          </h1>

          <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
            Every free, public event in one simple view.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mt-7 flex flex-wrap gap-3"
          >
            {chips.map((chip) => (
              <div
                key={chip.label}
                className={`flex items-baseline gap-2 rounded-xl border border-border px-4 py-2.5 shadow-brutal ${chip.bg} text-black`}
              >
                <span className="font-display text-2xl font-bold tabular-nums md:text-3xl">
                  <CountUp value={chip.value} />
                </span>
                <span className="font-mono text-[11px] font-medium">
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
