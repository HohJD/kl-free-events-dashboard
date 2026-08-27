"use client";

import { useEffect, useMemo, useState } from "react";
import { Event } from "@/lib/events";
import { FreeItem } from "@/lib/items";
import { filterEvents, DateRange } from "@/lib/filter-events";
import { useFavorites } from "@/lib/use-favorites";
import { Hero, HeroStats } from "./hero";
import { Navbar } from "./navbar";
import { Filters, ViewMode } from "./filters";
import { EventGrid } from "./event-grid";
import { MapSection } from "./map-section";
import { CollectSection } from "./collect-section";
import { SectionTabs, Section } from "./section-tabs";
import { Footer } from "./footer";
import { BackToTop } from "./back-to-top";

interface DashboardProps {
  events: Event[];
  stats: HeroStats;
  items: FreeItem[];
}

export function Dashboard({ events, stats, items }: DashboardProps) {
  const [section, setSection] = useState<Section>("collect");
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

  // Sync section with URL hash so tabs are shareable (#events / #collect)
  useEffect(() => {
    if (window.location.hash === "#events") setSection("events");
  }, []);
  const switchSection = (s: Section) => {
    setSection(s);
    window.history.replaceState(null, "", s === "events" ? "#events" : "#collect");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onRefresh={handleRefresh} refreshing={refreshing} />
      <SectionTabs section={section} setSection={switchSection} />
      {section === "collect" ? (
        <CollectSection items={items} />
      ) : (
        <>
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
        </>
      )}
      <Footer />
      <BackToTop />
    </div>
  );
}
