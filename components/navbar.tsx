"use client";

import { ThemeToggle } from "./theme-toggle";
import { RefreshCw, MapPin, ChevronDown } from "lucide-react";

const STATES = [
  { value: "kuala-lumpur", label: "Kuala Lumpur", enabled: true },
  { value: "selangor", label: "Selangor", enabled: false },
  { value: "penang", label: "Penang", enabled: false },
  { value: "johor", label: "Johor", enabled: false },
  { value: "perak", label: "Perak", enabled: false },
  { value: "melaka", label: "Melaka", enabled: false },
  { value: "negeri-sembilan", label: "Negeri Sembilan", enabled: false },
  { value: "pahang", label: "Pahang", enabled: false },
  { value: "kedah", label: "Kedah", enabled: false },
  { value: "kelantan", label: "Kelantan", enabled: false },
  { value: "terengganu", label: "Terengganu", enabled: false },
  { value: "perlis", label: "Perlis", enabled: false },
  { value: "sabah", label: "Sabah", enabled: false },
  { value: "sarawak", label: "Sarawak", enabled: false },
  { value: "putrajaya", label: "Putrajaya", enabled: false },
  { value: "labuan", label: "Labuan", enabled: false },
];

export function Navbar({
  onRefresh,
  refreshing,
}: {
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-accent text-accent-foreground shadow-brutal-sm">
            <MapPin className="size-4" strokeWidth={2.25} />
          </div>
          <span className="hidden font-display text-lg font-bold tracking-tight sm:block">
            Free Things
          </span>

          {/* State selector */}
          <div className="relative">
            <select
              defaultValue="kuala-lumpur"
              aria-label="Select state"
              className="h-8 cursor-pointer appearance-none rounded-lg border border-border bg-card pl-2.5 pr-7 font-mono text-xs font-semibold shadow-brutal-sm outline-none transition-all hover:-translate-y-px"
            >
              {STATES.map((s) => (
                <option key={s.value} value={s.value} disabled={!s.enabled}>
                  {s.label}
                  {s.enabled ? "" : " (soon)"}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium shadow-brutal-sm transition-all hover:-translate-y-px active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
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
