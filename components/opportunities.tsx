"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Toolbar, type ViewMode } from "./toolbar";
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
        <nav aria-label="Event focus" className="no-scrollbar page-shell flex items-center gap-1.5 overflow-x-auto pb-4">
          <button type="button" onClick={() => chooseKind("all")} aria-pressed={kind === "all"} className={cn("chip", kind === "all" && "chip-on")}>
            All<span className="chip-count">{Object.values(kindCounts).reduce((sum, value) => sum + value, 0)}</span>
          </button>
          {KIND_ORDER.filter((value) => kindCounts[value] || kind === value).map((value) => (
            <button key={value} type="button" onClick={() => chooseKind(value)} aria-pressed={kind === value} className={cn("chip", kind === value && "chip-on")}>
              {KIND_LABELS[value].many}<span className="chip-count">{kindCounts[value] ?? 0}</span>
            </button>
          ))}
          <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />
          <button type="button" onClick={() => { setFocused(!focused); setUrl("browse", focused ? "all" : null); }} aria-pressed={focused}
            className={cn("chip", focused && "chip-on")}>
            Tech &amp; careers only
          </button>
        </nav>

        <Toolbar
          query={query} setQuery={setQuery}
          dateRange={dateRange} setDateRange={setDateRange}
          sort={sort} setSort={setSort}
          region={region} setRegion={chooseRegion} regionCounts={regionCounts}
          showSaved={showSaved} setShowSaved={setShowSaved} savedCount={savedIds.size}
          view={view} setView={setView} canMap={canMap}
          onOpenSheet={() => setSheetOpen(true)}
          sheetCount={[region !== "all", source !== "all", showSaved, sort !== "recommended", dateRange !== "upcoming"].filter(Boolean).length}
        />
        <FilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)} region={region} setRegion={chooseRegion} regionCounts={regionCounts}
          sort={sort} setSort={setSort} category={kind} setCategory={(value) => chooseKind(value as OpportunityKind | "all")}
          categories={KIND_ORDER.filter((value) => kindCounts[value])} categoryCounts={kindCounts} categoryLabel="Type"
          categoryNames={Object.fromEntries(KIND_ORDER.map((value) => [value, KIND_LABELS[value].many]))}
          source={source} setSource={setSource} sources={sourceList} showSaved={showSaved} setShowSaved={setShowSaved}
          savedCount={savedIds.size} resultCount={shown.length} onClear={clearAll} />

        <div className="page-shell pb-16">
          <p className="mb-4 font-mono text-xs text-muted-foreground" aria-live="polite">
            Showing <span className="text-foreground">{shown.length}</span> {shown.length === 1 ? "listing" : "listings"}
            {focused ? " · tech, startups and careers" : ""}
          </p>
          {view === "map" && canMap ? (
            <MapSection events={mapEvents} />
          ) : shown.length ? (
            <div className="grid items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
