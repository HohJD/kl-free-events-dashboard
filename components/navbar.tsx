"use client";

import { ThemeToggle } from "./theme-toggle";
import { RefreshCw, MapPin } from "lucide-react";

export function Navbar({
  onRefresh,
  refreshing,
}: {
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-border bg-background">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center border-2 border-border bg-accent text-accent-foreground shadow-brutal-sm">
            <MapPin className="size-5" strokeWidth={2.5} />
          </div>
          <span className="font-display text-base uppercase tracking-tight md:text-lg">
            KL Free Events
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex h-8 items-center gap-1.5 border-2 border-border bg-background px-2.5 font-mono text-xs font-semibold uppercase shadow-brutal-sm transition-all hover:-translate-y-px active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
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
