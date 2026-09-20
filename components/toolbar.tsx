"use client";

import { useEffect, useRef } from "react";
import { Heart, LayoutGrid, Map, Search, SlidersHorizontal } from "lucide-react";
import type { DateRange, SortMode } from "@/lib/filter-events";
import { REGIONS } from "@/lib/regions";
import { cn } from "@/lib/utils";

export type ViewMode = "list" | "map";

const DATE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "upcoming", label: "Any date" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "recommended", label: "Top picks" },
  { value: "soonest", label: "Soonest" },
];

function Select<T extends string>({ label, value, onChange, options, counts }: {
  label: string; value: T; onChange: (value: T) => void;
  options: { value: T; label: string }[]; counts?: Record<string, number>;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as T)} aria-label={label} className="toolbar-select">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}{counts && counts[option.value] !== undefined ? ` (${counts[option.value]})` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

/** One row of controls for the opportunities list; phones move most of it into the Filters panel. */
export function Toolbar({
  query, setQuery, dateRange, setDateRange, sort, setSort, region, setRegion, regionCounts,
  showSaved, setShowSaved, savedCount, view, setView, canMap, onOpenSheet, sheetCount,
}: {
  query: string; setQuery: (value: string) => void;
  dateRange: DateRange; setDateRange: (value: DateRange) => void;
  sort: SortMode; setSort: (value: SortMode) => void;
  region: string; setRegion: (value: string) => void; regionCounts: Record<string, number>;
  showSaved: boolean; setShowSaved: (value: boolean) => void; savedCount: number;
  view: ViewMode; setView: (value: ViewMode) => void; canMap: boolean;
  onOpenSheet: () => void; sheetCount: number;
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT") { event.preventDefault(); searchRef.current?.focus(); }
      if (event.key === "Escape") searchRef.current?.blur();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const regionOptions = [{ value: "all", label: "All of Malaysia" },
    ...Object.entries(REGIONS).filter(([value]) => value !== "unknown").map(([value, label]) => ({ value, label }))];

  return (
    <div className="page-shell flex flex-wrap items-center gap-2 pb-4">
      <div className="relative min-w-0 flex-1 basis-40 sm:basis-56">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search listings" placeholder="Search"
          className="h-11 w-full min-w-0 rounded-xl border border-input/70 bg-card pl-10 pr-3 text-base placeholder:text-muted-foreground focus:border-ring md:text-sm" />
      </div>

      <div className="hidden items-center gap-2 md:flex">
        <Select label="Date" value={dateRange} onChange={setDateRange} options={DATE_OPTIONS} />
        <Select label="Sort" value={sort} onChange={setSort} options={SORT_OPTIONS} />
        <Select label="Location" value={region} onChange={setRegion} options={regionOptions} counts={regionCounts} />
        <button type="button" onClick={() => setShowSaved(!showSaved)} aria-pressed={showSaved} aria-label="Saved only"
          className={cn("flex h-11 items-center gap-2 rounded-xl border px-3 text-sm font-medium",
            showSaved ? "border-border bg-accent text-accent-foreground" : "border-input/70 bg-card text-muted-foreground hover:text-foreground")}>
          <Heart className={cn("size-4", showSaved && "fill-current")} aria-hidden /> {savedCount || ""}
        </button>
      </div>

      <button type="button" onClick={onOpenSheet} aria-label={`Filters${sheetCount ? `, ${sheetCount} active` : ""}`}
        className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-input/70 bg-card px-3 text-sm font-semibold md:hidden">
        <SlidersHorizontal className="size-4" aria-hidden /> Filters
        {sheetCount ? <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">{sheetCount}</span> : null}
      </button>

      {canMap ? (
        <div className="flex h-11 shrink-0 items-center rounded-xl border border-input/70 bg-card p-0.5">
          {([["list", LayoutGrid, "List view"], ["map", Map, "Map view"]] as const).map(([value, Icon, label]) => (
            <button key={value} type="button" onClick={() => setView(value)} aria-pressed={view === value} aria-label={label}
              className={cn("flex h-full items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium",
                view === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              <Icon className="size-4" aria-hidden /><span className="hidden sm:inline">{label.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
