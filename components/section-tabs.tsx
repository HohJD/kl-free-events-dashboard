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
    <div className="border-b border-border/50 bg-background px-4 pt-4">
      <div className="container mx-auto flex max-w-6xl gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSection(tab.value)}
            className={cn(
              "flex items-center gap-2 rounded-t-xl border border-b-0 px-4 py-2.5 text-sm font-semibold transition-all",
              section === tab.value
                ? "border-border bg-accent text-accent-foreground shadow-brutal-sm"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            <tab.icon className="size-4" />
            <span className="whitespace-nowrap">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
