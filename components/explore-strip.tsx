import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SECTIONS } from "@/lib/site";

export interface ExploreTeasers {
  resources: string;
  flights: string;
}

/** Home-page cards for the other three sections, each with a live teaser. */
export function ExploreStrip({ teasers }: { teasers: ExploreTeasers }) {
  const notes: Record<string, string> = {
    "/resources": teasers.resources,
    "/free-items": "Give away or pick up things for free",
    "/flights": teasers.flights,
  };
  return (
    <section aria-label="More on this site" className="page-shell pb-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {SECTIONS.filter((section) => section.href !== "/").map((section) => (
          <Link key={section.href} href={section.href}
            className="group flex min-h-[88px] min-w-0 items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-brutal-sm transition-transform hover:-translate-y-0.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted"><section.icon className="size-5" aria-hidden /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{section.label}</span>
              <span className="block truncate text-xs text-muted-foreground">{notes[section.href]}</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        ))}
      </div>
    </section>
  );
}
