"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Event } from "@/lib/events";
import { filterEvents, DateRange, SortMode } from "@/lib/filter-events";
import { useFavorites } from "@/lib/use-favorites";
import { Hero, HeroStats } from "./hero";
import { Navbar } from "./navbar";
import { Filters, ViewMode } from "./filters";
import { EventGrid } from "./event-grid";
import { MapSection } from "./map-section";
import { CATEGORY_ORDER, FOCUS_CATEGORIES, focusEvents } from "@/lib/event-discovery";
import { cn } from "@/lib/utils";
import { Footer } from "./footer";
import { BackToTop } from "./back-to-top";
import { eventRegion, filterRegion, REGIONS } from "@/lib/regions";

interface DashboardProps {
  events: Event[];
  stats: HeroStats;
}

export function Dashboard({ events, stats }: DashboardProps) {
  const [focused, setFocused] = useState(true);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("all");
  const [category, setCategory] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>("upcoming");
  const [sort, setSort] = useState<SortMode>("recommended");
  const [view, setView] = useState<ViewMode>("list");
  const [showSaved, setShowSaved] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { favorites, toggle } = useFavorites();
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
    if (showSaved) result = result.filter((e) => favorites.has(e.link));
    return result;
  }, [regionalEvents, focused, query, source, category, dateRange, showSaved, favorites, now, sort]);

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

  const handleRefresh = () => {
    setRefreshing(true);
    window.location.reload();
  };

  // Sync section with URL hash so tabs are shareable (#events / #collect)
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
      <Navbar
        onRefresh={handleRefresh}
        refreshing={refreshing}
        region={region}
        onRegionChange={switchRegion}
        regionCounts={regionCounts}
        showRegions
      />
      <main>
          <Hero stats={regionalStats} />
          <nav aria-label="Event focus" className="page-shell flex flex-wrap gap-2 pb-5">
            {[{ value: true, label: 'Tech, startups & careers' }, { value: false, label: 'All events' }].map(option => (
              <button key={option.label} onClick={() => switchFocus(option.value)} aria-pressed={focused === option.value}
                className={cn('min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold', focused === option.value ? 'border-border bg-accent text-accent-foreground shadow-brutal-sm' : 'border-border/50 bg-card text-muted-foreground')}>
                {option.label}
              </button>
            ))}
            <Link href="/resources" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border/50 bg-card px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
              <GraduationCap className="size-4" /> Student resources
            </Link>
          </nav>
          <p className="page-shell pb-5 text-xs leading-relaxed text-muted-foreground sm:text-sm" role="status">
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
            savedCount={favorites.size}
            onClear={handleClear}
          />
          <div className="pt-6">
            {view === "map" ? (
              <MapSection events={filtered} />
            ) : (
              <EventGrid
                events={filtered}
                favorites={favorites}
                onToggleSave={toggle}
              />
            )}
          </div>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
