"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { Event } from "@/lib/events";
import { filterEvents, DateRange, SortMode } from "@/lib/filter-events";
import { useSaved } from "@/lib/use-saved";
import { Hero, HeroStats } from "./hero";
import { Filters, ViewMode } from "./filters";
import { EventGrid } from "./event-grid";
import { MapSection } from "./map-section";
import { CATEGORY_ORDER, FOCUS_CATEGORIES, focusEvents } from "@/lib/event-discovery";
import { cn } from "@/lib/utils";
import { BackToTop } from "./back-to-top";
import { eventRegion, filterRegion, REGIONS } from "@/lib/regions";
import { ExploreStrip, type ExploreTeasers } from "./explore-strip";
import { FilterSheet } from "./filter-sheet";

interface DashboardProps {
  events: Event[];
  stats: HeroStats;
  teasers: ExploreTeasers;
}

export function Dashboard({ events, stats, teasers }: DashboardProps) {
  const [focused, setFocused] = useState(true);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("all");
  const [category, setCategory] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>("upcoming");
  const [sort, setSort] = useState<SortMode>("recommended");
  const [view, setView] = useState<ViewMode>("list");
  const [showSaved, setShowSaved] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { ids: savedIds, toggle: toggleSaved } = useSaved();
  const [region, setRegion] = useState("all");
  const [now, setNow] = useState(() => new Date(stats.generatedAt));

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 60000);
    return () => window.clearInterval(timer);
  }, []);

  const upcoming = useMemo(() => filterEvents(events, "", "all", "all", "upcoming", now), [events, now]);
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const event of upcoming) {
      const key = eventRegion(event);
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [upcoming]);
  const regionalEvents = useMemo(() => filterRegion(upcoming, region), [upcoming, region]);
  const regionalStats = useMemo(() => ({
    ...stats,
    total: regionalEvents.length,
    sources: new Set(regionalEvents.map((event) => event.source)).size,
    today: filterEvents(regionalEvents, "", "all", "all", "today", now).length,
    thisWeek: filterEvents(regionalEvents, "", "all", "all", "week", now).length,
  }), [stats, regionalEvents, now]);

  const sources = useMemo(
    () => Array.from(new Set(regionalEvents.map((e) => e.source))).sort(),
    [regionalEvents]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of regionalEvents) counts[e.category] = (counts[e.category] || 0) + 1;
    return counts;
  }, [regionalEvents]);

  const categories = useMemo(() => {
    const list = Array.from(new Set([...FOCUS_CATEGORIES, ...Object.keys(categoryCounts)]))
      .sort((a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b));
    // Hackathon tab is always available, even when empty
    if (!list.includes("Hackathon")) list.push("Hackathon");
    return list;
  }, [categoryCounts]);

  const filtered = useMemo(() => {
    let result = filterEvents(focusEvents(regionalEvents, focused), query, source, category, dateRange, now, sort);
    if (showSaved) result = result.filter((e) => savedIds.has(e.link));
    return result;
  }, [regionalEvents, focused, query, source, category, dateRange, showSaved, savedIds, now, sort]);

  const handleClear = () => {
    setQuery("");
    setSource("all");
    setCategory("all");
    setDateRange("upcoming");
    setShowSaved(false);
  };

  const switchRegion = (value: string) => {
    setRegion(value);
    setSource("all");
    setCategory("all");
    const url = new URL(window.location.href);
    if (value === "all") url.searchParams.delete("state");
    else url.searchParams.set("state", value);
    window.history.replaceState(null, "", url);
  };

  // Old shared links pointed at the giveaway tab (#collect); it is now /free-items.
  useEffect(() => {
    const redirect = () => { if (window.location.hash === "#collect") window.location.replace("/free-items"); };
    redirect();
    window.addEventListener("hashchange", redirect);
    return () => window.removeEventListener("hashchange", redirect);
  }, []);

  useEffect(() => {
    const sync = () => {
      setFocused(new URL(window.location.href).searchParams.get("browse") !== "all");
      const value = new URL(window.location.href).searchParams.get("state");
      setRegion(value && Object.hasOwn(REGIONS, value) ? value : "all");
      const linkedCategory = new URL(window.location.href).searchParams.get("category");
      if (linkedCategory && CATEGORY_ORDER.includes(linkedCategory)) setCategory(linkedCategory);
    };
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);
  const switchFocus = (value: boolean) => {
    setFocused(value);
    setCategory("all");
    const url = new URL(window.location.href);
    if (value) url.searchParams.delete("browse");
    else url.searchParams.set("browse", "all");
    window.history.replaceState(null, "", url);
  };
  const chooseCategory = (value: string) => {
    if (value !== "all" && !FOCUS_CATEGORIES.includes(value)) switchFocus(false);
    setCategory(value);
  };

  return (
    <div className="min-h-screen bg-background">
      <main>
          <Hero stats={regionalStats} />
          <ExploreStrip teasers={teasers} />
          <nav aria-label="Event focus" className="page-shell flex flex-wrap gap-2 pb-5">
            {[{ value: true, label: 'Tech, startups & careers' }, { value: false, label: 'All events' }].map(option => (
              <button key={option.label} onClick={() => switchFocus(option.value)} aria-pressed={focused === option.value}
                className={cn('min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold', focused === option.value ? 'border-border bg-accent text-accent-foreground shadow-brutal-sm' : 'border-border/50 bg-card text-muted-foreground')}>
                {option.label}
              </button>
            ))}
            <label className="relative ml-auto hidden min-w-[180px] flex-1 sm:flex-none md:block">
              <span className="sr-only">Location</span>
              <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <select value={region} onChange={(event) => switchRegion(event.target.value)} aria-label="Filter events by state"
                className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-input/70 bg-card pl-9 pr-8 text-base sm:w-[220px] sm:text-sm">
                <option value="all">All of Malaysia</option>
                {Object.entries(REGIONS).filter(([value]) => value !== "unknown").map(([value, label]) => (
                  <option key={value} value={value}>{label} ({regionCounts[value] || 0})</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            </label>
          </nav>
          <p className="page-shell hidden pb-5 text-xs leading-relaxed text-muted-foreground sm:block sm:text-sm" role="status">
            {region === "all" ? "All locations" : REGIONS[region]} · {regionalEvents.length} upcoming listings.
            {regionalEvents.length === 0 ? " No dated listings found here yet. Try another location." : " Confirm admission and eligibility with the organizer."}
            {now.getTime() - new Date(stats.generatedAt).getTime() > 48 * 3600000 && " Updates are delayed; some details may have changed."}
          </p>
          <Filters
            query={query}
            setQuery={setQuery}
            source={source}
            setSource={setSource}
            category={category}
            setCategory={chooseCategory}
            dateRange={dateRange}
            setDateRange={setDateRange}
            sort={sort}
            setSort={setSort}
            sources={sources}
            categories={categories}
            categoryCounts={categoryCounts}
            view={view}
            setView={setView}
            showSaved={showSaved}
            setShowSaved={setShowSaved}
            savedCount={savedIds.size}
            onClear={handleClear}
            onOpenSheet={() => setSheetOpen(true)}
            sheetCount={[region !== "all", category !== "all", source !== "all", showSaved, sort !== "recommended"].filter(Boolean).length}
          />
          <FilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)} region={region} setRegion={switchRegion} regionCounts={regionCounts}
            sort={sort} setSort={setSort} category={category} setCategory={chooseCategory} categories={categories} categoryCounts={categoryCounts}
            source={source} setSource={setSource} sources={sources} showSaved={showSaved} setShowSaved={setShowSaved}
            savedCount={savedIds.size} resultCount={filtered.length} onClear={() => { handleClear(); switchRegion("all"); setSort("recommended"); }} />
          <div className="pt-6">
            {view === "map" ? (
              <MapSection events={filtered} />
            ) : (
              <EventGrid
                events={filtered}
                favorites={savedIds}
                onToggleSave={toggleSaved}
                onClear={() => { handleClear(); switchRegion("all"); }}
              />
            )}
          </div>
      </main>
      <BackToTop />
    </div>
  );
}
