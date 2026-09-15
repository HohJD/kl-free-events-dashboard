"use client";

import { Gift, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export type Section = "collect" | "events";

export function SectionTabs({
  section,
  setSection,
}: {
  section: Section;
  setSection: (s: Section) => void;
}) {
  const tabs: { value: Section; label: string; icon: typeof Gift }[] = [
    { value: "collect", label: "Free things to collect", icon: Gift },
    { value: "events", label: "Free things to do", icon: CalendarDays },
  ];

  return (
    <nav aria-label="Browse free things" className="bg-background pt-5 sm:pt-6">
      <div className="page-shell">
        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border/50 bg-muted/40 p-1.5 sm:inline-flex">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSection(tab.value)}
              aria-pressed={section === tab.value}
              className={cn(
                "flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-center text-[13px] font-semibold leading-5 transition-colors sm:px-5 sm:text-sm",
                section === tab.value
                  ? "border-border/60 bg-accent text-accent-foreground shadow-brutal-sm"
                  : "border-transparent text-muted-foreground hover:bg-card hover:text-foreground"
              )}
            >
              <tab.icon className="hidden size-4 shrink-0 sm:block" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
