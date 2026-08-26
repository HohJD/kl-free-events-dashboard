"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
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
        "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
        active
          ? "border-transparent bg-primary text-primary-foreground shadow-sm"
          : "border-border/70 bg-transparent text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground"
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="z-30 border-b border-border/40 bg-background/90 backdrop-blur-md md:sticky md:top-16"
    >
      <div className="container mx-auto max-w-6xl space-y-2.5 px-4 py-3 md:space-y-3 md:py-4">
        {/* Search + view switcher */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              placeholder="Search events, venues…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 rounded-full pl-9 pr-10"
            />
            <kbd className="pointer-events-none absolute right-3.5 top-1/2 hidden -translate-y-1/2 rounded border border-border/70 bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:block">
              /
            </kbd>
          </div>
          <button
            onClick={() => setShowSaved(!showSaved)}
            aria-label="Show saved events"
            className={cn(
              "flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-all",
              showSaved
                ? "border-transparent bg-rose-500 text-white shadow-sm"
                : "border-border/70 text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            <Heart className={cn("size-4", showSaved && "fill-current")} />
            <span className="hidden sm:inline">Saved</span>
            {savedCount > 0 ? (
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  showSaved ? "bg-white/20" : "bg-muted"
                )}
              >
                {savedCount}
              </span>
            ) : null}
          </button>
          <div className="flex shrink-0 rounded-full border border-border/70 p-0.5">
            <button
              onClick={() => setView("list")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                view === "list"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="size-4" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setView("map")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                view === "map"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
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

        {/* Category tabs */}
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
              <span className="ml-1.5 text-xs opacity-60">
                {categoryCounts[c] ?? 0}
              </span>
            </Pill>
          ))}
          <span className="mx-1 h-5 w-px shrink-0 bg-border" />
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
