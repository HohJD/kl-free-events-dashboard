import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SECTIONS } from "@/lib/site";

/** Cards for the other sections of the site. */
export function ExploreStrip() {
  const notes: Record<string, string> = {
    "/free-items": "Give away or pick up things for free",
    "/flights": "Cheapest KL ⇄ London fares for every date",
  };
  return (
    <section aria-label="More on this site" className="page-shell pb-6">
      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0">
        {SECTIONS.filter((section) => section.href !== "/").map((section) => (
          <Link key={section.href} href={section.href}
            className="group flex min-h-[76px] w-[78%] min-w-0 shrink-0 snap-start items-center gap-3 sm:min-h-[88px] sm:w-auto rounded-2xl border border-border/60 bg-card p-4 shadow-brutal-sm transition-transform hover:-translate-y-0.5">
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
