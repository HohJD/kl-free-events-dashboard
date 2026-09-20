"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import type { Event } from "@/lib/events";
import type { Resource } from "@/lib/resources";
import { malaysiaDay, type DateRange, type SortMode } from "@/lib/filter-events";
import { FOCUS_CATEGORIES } from "@/lib/event-discovery";
import { REGIONS, eventRegion, filterRegion } from "@/lib/regions";
import {
  KIND_LABELS, KIND_ORDER, countByKind, eventsOf, filterOpportunities, fromEvent, fromResource,
  type OpportunityKind,
} from "@/lib/opportunities";
import { useSaved } from "@/lib/use-saved";
import { cn } from "@/lib/utils";
import { Hero, type HeroStats } from "./hero";
import { ExploreStrip } from "./explore-strip";
import { Filters, type ViewMode } from "./filters";
import { FilterSheet } from "./filter-sheet";
import { OpportunityCard } from "./opportunity-card";
import { MapSection } from "./map-section";
import { BackToTop } from "./back-to-top";

interface OpportunitiesProps {
  events: Event[];
  resources: Resource[];
  generatedAt: string;
  sources: number;
}

/** Everything free in one list: events, hackathons, scholarships, internships, graduate roles and tools. */
export function Opportunities({ events, resources, generatedAt, sources }: OpportunitiesProps) {
  const [kind, setKind] = useState<OpportunityKind | "all">("all");
  const [focused, setFocused] = useState(true);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>("upcoming");
  const [sort, setSort] = useState<SortMode>("recommended");
  const [source, setSource] = useState("all");
  const [showSaved, setShowSaved] = useState(false);
  const [view, setView] = useState<ViewMode>("list");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [today, setToday] = useState(() => malaysiaDay(new Date(generatedAt)));
  const { ids: savedIds, toggle: toggleSaved } = useSaved();

  useEffect(() => {
    setToday(malaysiaDay());
    const timer = window.setInterval(() => setToday(malaysiaDay()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  // Old shared links pointed at the giveaway tab (#collect); it is now /free-items.
  useEffect(() => {
    const redirect = () => { if (window.location.hash === "#collect") window.location.replace("/free-items"); };
    redirect();
    window.addEventListener("hashchange", redirect);
    return () => window.removeEventListener("hashchange", redirect);
  }, []);

  // Read /?type= & /?state= once so old links and the tab bar keep working.
  useEffect(() => {
    const params = new URL(window.location.href).searchParams;
    const type = params.get("type");
    if (type && (KIND_ORDER as string[]).includes(type)) { setKind(type as OpportunityKind); setFocused(false); }
    const state = params.get("state");
    if (state && Object.hasOwn(REGIONS, state)) setRegion(state);
    if (params.get("browse") === "all") setFocused(false);
    if (params.get("category") === "Hackathon") setKind("hackathon");
  }, []);

  const all = useMemo(() => [...events.map(fromEvent), ...resources.map(fromResource)], [events, resources]);
  // "Tech & careers" keeps the focused event categories; resources always stay.
  const inFocus = useMemo(
    () => (focused ? all.filter((row) => !row.event || FOCUS_CATEGORIES.includes(row.event.category)) : all),
    [all, focused],
  );
  const filters = useMemo(
    () => ({ kind, query, region, dateRange, sort, source, savedIds, onlySaved: showSaved }),
    [kind, query, region, dateRange, sort, source, savedIds, showSaved],
  );
  const shown = useMemo(() => filterOpportunities(inFocus, filters, today), [inFocus, filters, today]);
  // Counts ignore the filter they label, so each chip shows what picking it would give.
  const upcoming = useMemo(() => filterOpportunities(inFocus, { ...filters, kind: "all", query: "", source: "all", onlySaved: false }, today), [inFocus, filters, today]);
  const kindCounts = useMemo(() => countByKind(filterOpportunities(inFocus, { ...filters, kind: "all", onlySaved: false }, today)), [inFocus, filters, today]);
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const event of eventsOf(filterOpportunities(inFocus, { ...filters, kind: "all", region: "all", onlySaved: false }, today))) {
      const key = eventRegion(event);
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [inFocus, filters, today]);
  const sourceList = useMemo(() => Array.from(new Set(inFocus.map((row) => row.source))).sort(), [inFocus]);

  const stats: HeroStats = {
    total: upcoming.length,
    sources,
    today: upcoming.filter((row) => !row.isDeadline && row.date === today).length,
    closingSoon: upcoming.filter((row) => row.isDeadline && row.date && !row.alwaysOpen
      && row.date <= new Date(Date.parse(`${today}T00:00:00Z`) + 14 * 86400000).toISOString().slice(0, 10)).length,
    generatedAt: new Date(generatedAt),
  };

  const setUrl = (key: string, value: string | null) => {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
    window.history.replaceState(null, "", url);
  };
  const chooseKind = (value: OpportunityKind | "all") => {
    setKind(value);
    setUrl("type", value === "all" ? null : value);
    if (value !== "all" && value !== "event") setFocused(false);
  };
  const chooseRegion = (value: string) => { setRegion(value); setUrl("state", value === "all" ? null : value); };
  const clearAll = () => {
    setQuery(""); setSource("all"); setDateRange("upcoming"); setShowSaved(false); setKind("all"); chooseRegion("all"); setSort("recommended");
  };

  const mapEvents = filterRegion(eventsOf(shown), region);
  const canMap = kind === "all" || kind === "event" || kind === "hackathon";

  return (
    <div className="min-h-screen bg-background">
      <main>
        <Hero stats={stats} />
        <ExploreStrip />

        <nav aria-label="Event focus" className="page-shell flex flex-wrap items-center gap-2 pb-4">
          {[{ value: true, label: "Tech, startups & careers" }, { value: false, label: "Everything free" }].map((option) => (
            <button key={option.label} type="button" onClick={() => { setFocused(option.value); setUrl("browse", option.value ? null : "all"); }}
              aria-pressed={focused === option.value}
              className={cn("min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold",
                focused === option.value ? "border-border bg-accent text-accent-foreground shadow-brutal-sm" : "border-border/50 bg-card text-muted-foreground")}>
              {option.label}
            </button>
          ))}
          <label className="relative ml-auto hidden min-w-[180px] flex-1 sm:flex-none md:block">
            <span className="sr-only">Location</span>
            <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <select value={region} onChange={(event) => chooseRegion(event.target.value)} aria-label="Filter events by state"
              className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-input/70 bg-card pl-9 pr-8 text-base sm:w-[220px] sm:text-sm">
              <option value="all">All of Malaysia</option>
              {Object.entries(REGIONS).filter(([value]) => value !== "unknown").map(([value, label]) => (
                <option key={value} value={value}>{label} ({regionCounts[value] || 0})</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          </label>
        </nav>

        <div className="no-scrollbar page-shell -mx-0 flex gap-1.5 overflow-x-auto pb-4" role="group" aria-label="Type">
          <button type="button" onClick={() => chooseKind("all")} aria-pressed={kind === "all"} className={cn("fx-chip", kind === "all" && "fx-chip-on")}>
            All<span className="ml-1 text-xs opacity-60">{Object.values(kindCounts).reduce((sum, value) => sum + value, 0)}</span>
          </button>
          {KIND_ORDER.filter((value) => kindCounts[value] || kind === value).map((value) => (
            <button key={value} type="button" onClick={() => chooseKind(value)} aria-pressed={kind === value} className={cn("fx-chip", kind === value && "fx-chip-on")}>
              {KIND_LABELS[value].many}<span className="ml-1 text-xs opacity-60">{kindCounts[value] ?? 0}</span>
            </button>
          ))}
        </div>

        <Filters
          query={query} setQuery={setQuery}
          source={source} setSource={setSource}
          category="all" setCategory={() => {}}
          dateRange={dateRange} setDateRange={setDateRange}
          sort={sort} setSort={setSort}
          sources={sourceList} categories={[]} categoryCounts={{}}
          view={view} setView={setView}
          showSaved={showSaved} setShowSaved={setShowSaved} savedCount={savedIds.size}
          onClear={clearAll}
          onOpenSheet={() => setSheetOpen(true)}
          sheetCount={[region !== "all", source !== "all", showSaved, sort !== "recommended", dateRange !== "upcoming"].filter(Boolean).length}
          showCategories={false}
          canMap={canMap}
        />
        <FilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)} region={region} setRegion={chooseRegion} regionCounts={regionCounts}
          sort={sort} setSort={setSort} category={kind} setCategory={(value) => chooseKind(value as OpportunityKind | "all")}
          categories={KIND_ORDER.filter((value) => kindCounts[value])} categoryCounts={kindCounts} categoryLabel="Type"
          categoryNames={Object.fromEntries(KIND_ORDER.map((value) => [value, KIND_LABELS[value].many]))}
          source={source} setSource={setSource} sources={sourceList} showSaved={showSaved} setShowSaved={setShowSaved}
          savedCount={savedIds.size} resultCount={shown.length} onClear={clearAll} />

        <div className="page-shell pb-16 pt-6">
          <p className="mb-4 font-mono text-xs text-muted-foreground" aria-live="polite">
            Showing <span className="text-foreground">{shown.length}</span> {shown.length === 1 ? "listing" : "listings"}
            {focused ? " · tech, startups and careers" : ""}
          </p>
          {view === "map" && canMap ? (
            <MapSection events={mapEvents} />
          ) : shown.length ? (
            <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((row) => (
                <OpportunityCard key={row.id} row={row} today={today} saved={savedIds.has(row.id) || savedIds.has(row.link)} onToggleSave={toggleSaved} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-input/60 bg-muted/20 px-6 py-16 text-center">
              <h2 className="font-display text-lg font-bold">Nothing matches yet</h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Try another type, state or date, or switch to Everything free. Only listings that pass our free-admission, date and location checks appear here.
              </p>
              <button type="button" onClick={clearAll}
                className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-border bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-brutal-sm">
                Clear search and filters
              </button>
            </div>
          )}
        </div>
      </main>
      <BackToTop />
    </div>
  );
}
