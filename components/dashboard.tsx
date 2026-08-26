"use client";

import { useMemo, useState } from "react";
import { Event } from "@/lib/events";
import { filterEvents, DateRange } from "@/lib/filter-events";
import { useFavorites } from "@/lib/use-favorites";
import { Hero, HeroStats } from "./hero";
import { Navbar } from "./navbar";
import { Filters, ViewMode } from "./filters";
import { EventGrid } from "./event-grid";
import { MapSection } from "./map-section";
import { Footer } from "./footer";
import { BackToTop } from "./back-to-top";

interface DashboardProps {
  events: Event[];
  stats: HeroStats;
}

export function Dashboard({ events, stats }: DashboardProps) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("all");
  const [category, setCategory] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>("upcoming");
  const [view, setView] = useState<ViewMode>("list");
  const [showSaved, setShowSaved] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { favorites, toggle } = useFavorites();

  const sources = useMemo(
    () => Array.from(new Set(events.map((e) => e.source))).sort(),
    [events]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of events) counts[e.category] = (counts[e.category] || 0) + 1;
    return counts;
  }, [events]);

  const categories = useMemo(() => {
    const list = Object.keys(categoryCounts).sort(
      (a, b) => categoryCounts[b] - categoryCounts[a]
    );
    // Hackathon tab is always available, even when empty
    if (!list.includes("Hackathon")) list.push("Hackathon");
    return list;
  }, [categoryCounts]);

  const filtered = useMemo(() => {
    let result = filterEvents(events, query, source, category, dateRange);
    if (showSaved) result = result.filter((e) => favorites.has(e.link));
    return result;
  }, [events, query, source, category, dateRange, showSaved, favorites]);

  const handleClear = () => {
    setQuery("");
    setSource("all");
    setCategory("all");
    setDateRange("upcoming");
    setShowSaved(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onRefresh={handleRefresh} refreshing={refreshing} />
      <Hero stats={stats} />
      <Filters
        query={query}
        setQuery={setQuery}
        source={source}
        setSource={setSource}
        category={category}
        setCategory={setCategory}
        dateRange={dateRange}
        setDateRange={setDateRange}
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
      <Footer />
      <BackToTop />
    </div>
  );
}
