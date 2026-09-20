"use client";

import { useEffect, useRef } from "react";
import { Search, X, LayoutGrid, Map, Heart, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { DateRange, SortMode } from "@/lib/filter-events";
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
  sort: SortMode;
  setSort: (s: SortMode) => void;
  sources: string[];
  categories: string[];
  categoryCounts: Record<string, number>;
  view: ViewMode;
  setView: (v: ViewMode) => void;
  showSaved: boolean;
  setShowSaved: (s: boolean) => void;
  savedCount: number;
  onClear: () => void;
  /** Phones: open the filter panel; `sheetCount` badges the active filters inside it. */
  onOpenSheet: () => void;
  sheetCount: number;
  /** The merged page filters by type elsewhere, so its category row is off. */
  showCategories?: boolean;
  /** Map view only makes sense while events are in the list. */
  canMap?: boolean;
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
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
        active
          ? "border-border bg-accent text-accent-foreground shadow-brutal-sm"
          : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
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
  sort,
  setSort,
  sources,
  categories,
  categoryCounts,
  view,
  setView,
  showSaved,
  setShowSaved,
  savedCount,
  onClear,
  onOpenSheet,
  sheetCount,
  showCategories = true,
  canMap = true,
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
      className="z-30 border-y border-border/40 bg-background/95 backdrop-blur-sm md:sticky md:top-16"
    >
      <div className="page-shell space-y-1 py-4 sm:py-5">
        {/* Search + saved + view switcher */}
        <div className="flex flex-wrap items-center gap-2.5 pb-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              aria-label="Search listings"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 w-full min-w-0 rounded-xl border border-input/70 bg-card pl-10 pr-10 text-base transition-colors placeholder:text-muted-foreground focus:border-ring md:text-sm"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">
              /
            </kbd>
          </div>
          <button
            onClick={() => setShowSaved(!showSaved)}
            aria-label="Show saved events"
            aria-pressed={showSaved}
            className={cn(
              "hidden h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors md:flex",
              showSaved
                ? "bg-primary text-primary-foreground"
                : "border border-input text-muted-foreground hover:text-foreground"
            )}
          >
            <Heart className={cn("size-4", showSaved && "fill-current")} />
            <span>Saved</span>
            {savedCount > 0 ? (
              <span className="tabular-nums">{savedCount}</span>
            ) : null}
          </button>
          <button type="button" onClick={onOpenSheet} aria-label={`Filters${sheetCount ? `, ${sheetCount} active` : ""}`}
            className="relative flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-input/70 bg-card px-3 text-sm font-semibold md:hidden">
            <SlidersHorizontal className="size-4" aria-hidden /> Filters
            {sheetCount ? <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">{sheetCount}</span> : null}
          </button>
          <div className={cn("h-11 shrink-0 items-center rounded-xl border border-input/70 bg-card p-0.5", canMap ? "flex" : "hidden")}>
            <button
              onClick={() => setView("list")}
              aria-label="List view"
              aria-pressed={view === "list"}
              className={cn(
                "flex h-full items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors",
                view === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="size-4" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setView("map")}
              aria-label="Map view"
              aria-pressed={view === "map"}
              className={cn(
                "flex h-full items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors",
                view === "map"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Map className="size-4" />
              <span className="hidden sm:inline">Map</span>
            </button>
          </div>
        </div>

        {/* Date tabs */}
        <div aria-label="Filter by date" className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 py-1.5">
          {dateTabs.map((t) => (
            <Pill
              key={t.value}
              active={dateRange === t.value}
              onClick={() => setDateRange(t.value)}
            >
              {t.label}
            </Pill>
          ))}
          <span className="mx-1.5 hidden h-4 w-px shrink-0 self-center bg-border md:block" />
          <div role="group" aria-label="Sort events" className="hidden shrink-0 gap-1 md:flex">
            <Pill active={sort === "recommended"} onClick={() => setSort("recommended")}>
              Top picks
            </Pill>
            <Pill active={sort === "soonest"} onClick={() => setSort("soonest")}>
              Soonest
            </Pill>
          </div>
        </div>

        {/* Category + source tabs */}
        <div aria-label="Filter by category or source" className={cn("no-scrollbar -mx-1 items-center gap-1 overflow-x-auto px-1 py-1.5", showCategories ? "hidden md:flex" : "hidden")}>
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
              <span className="ml-1 text-xs tabular-nums opacity-50">
                {categoryCounts[c] ?? 0}
              </span>
            </Pill>
          ))}
          <span className="mx-1.5 h-4 w-px shrink-0 bg-border" />
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
              className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" /> Clear
            </button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
