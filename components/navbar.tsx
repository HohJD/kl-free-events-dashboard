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
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <MapPin className="size-4" strokeWidth={2.25} />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            KL Free Events
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
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
