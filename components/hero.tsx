"use client";

export interface HeroStats {
  total: number;
  sources: number;
  today: number;
  closingSoon: number;
  generatedAt: Date;
}

/** Plain header: what this page is, and how fresh it is. */
export function Hero({ stats }: { stats: HeroStats }) {
  const updated = stats.generatedAt.toLocaleString("en-MY", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur",
  });
  const counts = [
    `${stats.total.toLocaleString("en-MY")} free listings`,
    stats.today ? `${stats.today} on today` : "",
    stats.closingSoon ? `${stats.closingSoon} closing soon` : "",
  ].filter(Boolean);

  return (
    <section className="page-shell pb-5 pt-8 sm:pt-12">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Free things worth your time
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        Events, hackathons, scholarships, internships, graduate roles and student tools across Malaysia, collected every day.
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        {counts.join(" · ")} · updated {updated}
      </p>
    </section>
  );
}
