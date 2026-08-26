"use client";

import { useEffect, useRef } from "react";
import { Search, X, LayoutGrid, Map, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { DateRange } from "@/lib/filter-events";
import { cn } from "@/lib/utils";

const dateTabs: { value: DateRange; label: string }[] = [
  { value: "upcoming", label: "All upcoming" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];

export type ViewMode = "list" | "map";

interface FiltersProps {
  query: string;
  setQuery: (q: string) => void;
  source: string;
  setSource: (s: string) => void;
  category: string;
  setCategory: (c: string) => void;
  dateRange: DateRange;
  setDateRange: (d: DateRange) => void;
  sources: string[];
  categories: string[];
  categoryCounts: Record<string, number>;
  view: ViewMode;
  setView: (v: ViewMode) => void;
  showSaved: boolean;
  setShowSaved: (s: boolean) => void;
  savedCount: number;
  onClear: () => void;
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 border-2 border-border px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide transition-all",
        active
          ? "bg-accent text-accent-foreground shadow-brutal-sm"
          : "bg-background text-muted-foreground hover:-translate-y-px hover:text-foreground hover:shadow-brutal-sm"
      )}
    >
      {children}
    </button>
  );
}

export function Filters({
  query,
  setQuery,
  source,
  setSource,
  category,
  setCategory,
  dateRange,
  setDateRange,
  sources,
  categories,
  categoryCounts,
  view,
  setView,
  showSaved,
  setShowSaved,
  savedCount,
  onClear,
}: FiltersProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  // Press "/" anywhere to focus search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") searchRef.current?.blur();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hasActive =
    query ||
    source !== "all" ||
    category !== "all" ||
    dateRange !== "upcoming" ||
    showSaved;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="z-30 border-b-2 border-border bg-background md:sticky md:top-16"
    >
      <div className="container mx-auto max-w-6xl space-y-2.5 px-4 py-3 md:space-y-3 md:py-4">
        {/* Search + saved + view switcher */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              placeholder="Search events, venues…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full border-2 border-border bg-card pl-9 pr-10 text-base outline-none transition-shadow placeholder:text-muted-foreground focus:shadow-brutal-sm md:text-sm"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold sm:block">
              /
            </kbd>
          </div>
          <button
            onClick={() => setShowSaved(!showSaved)}
            aria-label="Show saved events"
            className={cn(
              "flex h-10 shrink-0 items-center gap-1.5 border-2 border-border px-3 font-mono text-xs font-semibold uppercase transition-all",
              showSaved
                ? "bg-destructive text-destructive-foreground shadow-brutal-sm"
                : "bg-background text-muted-foreground hover:-translate-y-px hover:text-foreground hover:shadow-brutal-sm"
            )}
          >
            <Heart className={cn("size-4", showSaved && "fill-current")} />
            <span className="hidden sm:inline">Saved</span>
            {savedCount > 0 ? <span>{savedCount}</span> : null}
          </button>
          <div className="flex h-10 shrink-0 border-2 border-border">
            <button
              onClick={() => setView("list")}
              aria-label="List view"
              className={cn(
                "flex items-center gap-1.5 px-3 font-mono text-xs font-semibold uppercase transition-colors",
                view === "list"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="size-4" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setView("map")}
              aria-label="Map view"
              className={cn(
                "flex items-center gap-1.5 border-l-2 border-border px-3 font-mono text-xs font-semibold uppercase transition-colors",
                view === "map"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              <Map className="size-4" />
              <span className="hidden sm:inline">Map</span>
            </button>
          </div>
        </div>

        {/* Date tabs */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {dateTabs.map((t) => (
            <Pill
              key={t.value}
              active={dateRange === t.value}
              onClick={() => setDateRange(t.value)}
            >
              {t.label}
            </Pill>
          ))}
        </div>

        {/* Category + source tabs */}
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          <Pill active={category === "all"} onClick={() => setCategory("all")}>
            All
          </Pill>
          {categories.map((c) => (
            <Pill
              key={c}
              active={category === c}
              onClick={() => setCategory(category === c ? "all" : c)}
            >
              {c}
              <span className="ml-1.5 opacity-60">{categoryCounts[c] ?? 0}</span>
            </Pill>
          ))}
          <span className="mx-1 h-5 w-0.5 shrink-0 bg-border" />
          {sources.map((s) => (
            <Pill
              key={s}
              active={source === s}
              onClick={() => setSource(source === s ? "all" : s)}
            >
              {s}
            </Pill>
          ))}
          {hasActive ? (
            <button
              onClick={onClear}
              className="flex shrink-0 items-center gap-1 px-2 py-1.5 font-mono text-xs font-semibold uppercase text-muted-foreground underline decoration-2 underline-offset-2 transition-colors hover:text-foreground"
            >
              <X className="size-3.5" /> Clear
            </button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
