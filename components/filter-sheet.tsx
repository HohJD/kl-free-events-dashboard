"use client";

import { useEffect } from "react";
import { BookmarkCheck, X } from "lucide-react";
import type { DateRange, SortMode } from "@/lib/filter-events";
import { REGIONS } from "@/lib/regions";
import { cn } from "@/lib/utils";

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  region: string;
  setRegion: (value: string) => void;
  regionCounts: Record<string, number>;
  sort: SortMode;
  setSort: (value: SortMode) => void;
  dateRange: DateRange;
  setDateRange: (value: DateRange) => void;
  category: string;
  setCategory: (value: string) => void;
  categories: string[];
  categoryCounts: Record<string, number>;
  source: string;
  setSource: (value: string) => void;
  sources: string[];
  showSaved: boolean;
  setShowSaved: (value: boolean) => void;
  savedCount: number;
  resultCount: number;
  onClear: () => void;
  /** Heading for the category group, e.g. "Type" on the merged page. */
  categoryLabel?: string;
  /** Display names for category values. */
  categoryNames?: Record<string, string>;
}

function Option({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={cn("chip border border-border", active && "chip-on border-foreground")}>{children}</button>
  );
}

/** Phone-only panel holding the filters the desktop toolbar shows inline. */
export function FilterSheet(props: FilterSheetProps) {
  const { open, onClose } = props;
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = overflow; window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-labelledby="filter-title">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close filters" onClick={onClose} />
      <div className="sheet absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-3xl border-t border-border bg-background">
        <span className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30" aria-hidden />
        <div className="flex items-center justify-between px-4 pb-2 pt-1">
          <h2 id="filter-title" className="text-lg font-semibold tracking-tight">Filters</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-11 items-center justify-center rounded-xl hover:bg-muted"><X className="size-5" /></button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
          <section>
            <h3 className="eyebrow mb-2.5">When</h3>
            <div className="flex flex-wrap gap-2">
              {([["upcoming", "Any time"], ["today", "Today"], ["tomorrow", "Tomorrow"], ["week", "This week"], ["month", "This month"]] as const).map(([value, label]) => (
                <Option key={value} active={props.dateRange === value} onClick={() => props.setDateRange(value)}>{label}</Option>
              ))}
            </div>
          </section>
          <section>
            <h3 className="eyebrow mb-2.5">Location</h3>
            <select value={props.region} onChange={(event) => props.setRegion(event.target.value)} aria-label="Location"
              className="field px-3">
              <option value="all">All of Malaysia</option>
              {Object.entries(REGIONS).filter(([value]) => value !== "unknown").map(([value, label]) => (
                <option key={value} value={value}>{label} ({props.regionCounts[value] || 0})</option>
              ))}
            </select>
          </section>
          <section>
            <h3 className="eyebrow mb-2.5">Sort</h3>
            <div className="flex flex-wrap gap-2">
              <Option active={props.sort === "recommended"} onClick={() => props.setSort("recommended")}>Top picks</Option>
              <Option active={props.sort === "soonest"} onClick={() => props.setSort("soonest")}>Soonest first</Option>
            </div>
          </section>
          {props.categories.length ? <section>
            <h3 className="eyebrow mb-2.5">{props.categoryLabel ?? "Category"}</h3>
            <div className="flex flex-wrap gap-2">
              <Option active={props.category === "all"} onClick={() => props.setCategory("all")}>All</Option>
              {props.categories.map((item) => (
                <Option key={item} active={props.category === item} onClick={() => props.setCategory(props.category === item ? "all" : item)}>
                  {props.categoryNames?.[item] ?? item}<span className="ml-1 text-xs opacity-60">{props.categoryCounts[item] ?? 0}</span>
                </Option>
              ))}
            </div>
          </section> : null}
          {props.sources.length ? <section>
            <h3 className="eyebrow mb-2.5">Source</h3>
            <div className="flex flex-wrap gap-2">
              <Option active={props.source === "all"} onClick={() => props.setSource("all")}>All</Option>
              {props.sources.map((item) => (
                <Option key={item} active={props.source === item} onClick={() => props.setSource(props.source === item ? "all" : item)}>{item}</Option>
              ))}
            </div>
          </section> : null}
          <section>
            <Option active={props.showSaved} onClick={() => props.setShowSaved(!props.showSaved)}>
              <BookmarkCheck className="mr-1.5 size-4" aria-hidden /> Tracked only ({props.savedCount})
            </Option>
          </section>
        </div>
        <div className="flex gap-2 border-t border-border/60 px-4 py-3" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <button type="button" onClick={props.onClear} className="btn btn-quiet btn-lg">Clear all</button>
          <button type="button" onClick={onClose} className="btn btn-primary btn-lg flex-1">
            Show {props.resultCount} {props.resultCount === 1 ? "listing" : "listings"}
          </button>
        </div>
      </div>
    </div>
  );
}
