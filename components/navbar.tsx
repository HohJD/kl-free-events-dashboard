"use client";

import { ThemeToggle } from "./theme-toggle";
import { RefreshCw, MapPin, ChevronDown } from "lucide-react";
import { REGIONS } from "@/lib/regions";

export function Navbar({
  onRefresh,
  refreshing,
  region,
  onRegionChange,
  regionCounts,
  showRegions,
}: {
  onRefresh: () => void;
  refreshing: boolean;
  region: string;
  onRegionChange: (region: string) => void;
  regionCounts: Record<string, number>;
  showRegions: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="page-shell flex h-16 items-center justify-between gap-2 sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-accent text-accent-foreground shadow-brutal-sm">
            <MapPin className="size-4" strokeWidth={2.25} />
          </div>
          <span className={`${showRegions ? 'hidden sm:block' : 'block'} truncate font-display text-lg font-bold tracking-tight`}>
            Free Events
          </span>

          {/* State selector */}
          {showRegions && (
            <div className="relative min-w-0 max-w-[230px] flex-1 sm:ml-2 sm:flex-none">
              <select
                value={region}
                onChange={(event) => onRegionChange(event.target.value)}
                aria-label="Filter events by state"
                className="h-11 w-full min-w-0 cursor-pointer appearance-none truncate rounded-xl border border-input/70 bg-card pl-3 pr-8 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-[210px] sm:text-sm"
              >
                <option value="all">All locations</option>
                {Object.entries(REGIONS).filter(([value]) => value !== 'unknown').map(([value, label]) => (
                  <option key={value} value={value}>
                    {label} ({regionCounts[value] || 0})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh listings"
            className="flex h-11 min-w-11 items-center justify-center gap-2 rounded-xl text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 sm:px-3"
          >
            <RefreshCw
              className={refreshing ? "size-3.5 animate-spin" : "size-3.5"}
            />
            <span className="hidden sm:inline">
              {refreshing ? "Loading" : "Refresh"}
            </span>
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
