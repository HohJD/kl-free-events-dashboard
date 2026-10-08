"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarPlus, X } from "lucide-react";
import type { Event } from "@/lib/events";
import type { Resource } from "@/lib/resources";
import { malaysiaDay, type DateRange, type SortMode } from "@/lib/filter-events";
import { forStudents } from "@/lib/event-discovery";
import { REGIONS, eventRegion, filterRegion } from "@/lib/regions";
import {
  KIND_EMOJI, KIND_LABELS, KIND_ORDER, countByKind, eventsOf, filterOpportunities, fromEvent, fromResource,
  type OpportunityKind,
} from "@/lib/opportunities";
import { reminderUrl } from "@/lib/calendar";
import { useSaved, type SavedEntry } from "@/lib/use-saved";
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

const PAGE = 24;

/** Everything free in one list: events, hackathons, scholarships, internships, graduate roles and tools. */
export function Opportunities({ events, resources, generatedAt, sources }: OpportunitiesProps) {
  const [kind, setKind] = useState<OpportunityKind | "all">("all");
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>("upcoming");
  const [sort, setSort] = useState<SortMode>("recommended");
  const [source, setSource] = useState("all");
  const [showSaved, setShowSaved] = useState(false);
  const [view, setView] = useState<ViewMode>("list");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const [today, setToday] = useState(() => malaysiaDay(new Date(generatedAt)));
  const { ids: savedIds, toggle } = useSaved();
  const [toast, setToast] = useState<{ title: string; calendar: string | null } | null>(null);
  const toastTimer = useRef<number>();
  const toggleSaved = useCallback((entry: Omit<SavedEntry, "savedAt">) => {
    const adding = !savedIds.has(entry.id);
    toggle(entry);
    window.clearTimeout(toastTimer.current);
    if (!adding) { setToast(null); return; }
    setToast({ title: entry.title, calendar: entry.date ? reminderUrl({ ...entry, date: entry.date, link: entry.href }) : null });
    toastTimer.current = window.setTimeout(() => setToast(null), 5000);
  }, [savedIds, toggle]);

  useEffect(() => {
    setToday(malaysiaDay());
    const timer = window.setInterval(() => setToday(malaysiaDay()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  // Old shared links pointed at the giveaway tab; they now land on the home page.
  useEffect(() => {
    const redirect = () => { if (window.location.hash === "#collect") window.location.replace("/"); };
    redirect();
    window.addEventListener("hashchange", redirect);
    return () => window.removeEventListener("hashchange", redirect);
  }, []);

  // Read /?type= & /?state= once so old links and the tab bar keep working.
  useEffect(() => {
    const params = new URL(window.location.href).searchParams;
    const type = params.get("type");
    if (type && (KIND_ORDER as string[]).includes(type)) setKind(type as OpportunityKind);
    const state = params.get("state");
    if (state && Object.hasOwn(REGIONS, state)) setRegion(state);
    if (params.get("category") === "Hackathon") setKind("hackathon");
  }, []);

  const all = useMemo(() => [...events.map(fromEvent), ...resources.map(fromResource)], [events, resources]);
  // Built for uni students: events outside tech, business, careers and hackathons stay off the board.
  const inFocus = useMemo(() => all.filter((row) => !row.event || forStudents(row.event)), [all]);
  const filters = useMemo(
    () => ({ kind, query, region, dateRange, sort, source, savedIds, onlySaved: showSaved }),
    [kind, query, region, dateRange, sort, source, savedIds, showSaved],
  );
  const shown = useMemo(() => filterOpportunities(inFocus, filters, today), [inFocus, filters, today]);
  // A new filter starts the list from the top again.
  useEffect(() => setLimit(PAGE), [kind, query, region, dateRange, sort, source, showSaved]);
  // Load the next page well before the visitor reaches the end, one page per approach,
  // so new cards are already laid out off-screen and the bottom of the page never jumps.
  const more = useRef<HTMLDivElement>(null);
  const hasMore = view === "list" && shown.length > limit;
  useEffect(() => {
    const node = more.current;
    if (!hasMore || !node || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      setLimit((n) => n + PAGE);
    }, { rootMargin: "0px 0px 1600px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, limit]);
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
        <Hero stats={stats} today={today} />
        <div className="sticky top-0 z-30 border-b border-border bg-background/85 pt-2 backdrop-blur-lg backdrop-saturate-150 md:top-16">
          <nav aria-label="Type" className="no-scrollbar fade-x page-shell flex items-center gap-1 overflow-x-auto pb-2">
            {(["all", ...KIND_ORDER.filter((value) => kindCounts[value] || kind === value)] as const).map((value) => {
              const on = kind === value;
              const count = value === "all" ? Object.values(kindCounts).reduce((sum, n) => sum + n, 0) : kindCounts[value] ?? 0;
              return (
                <button key={value} type="button" onClick={() => chooseKind(value)} aria-pressed={on}
                  className={cn("chip", on && "font-semibold text-primary-foreground hover:text-primary-foreground")}>
                  {on ? <motion.span layoutId="kind-pill" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", bounce: 0.25, duration: 0.4 }} /> : null}
                  {value !== "all" ? <span className="relative mr-1.5" aria-hidden>{KIND_EMOJI[value]}</span> : null}
                  <span className="relative">{value === "all" ? "All" : KIND_LABELS[value].many}</span>
                  <span className="chip-count relative">{count}</span>
                </button>
              );
            })}
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
        </div>
        <FilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)} region={region} setRegion={chooseRegion} regionCounts={regionCounts}
          sort={sort} setSort={setSort} dateRange={dateRange} setDateRange={setDateRange} category={kind} setCategory={(value) => chooseKind(value as OpportunityKind | "all")}
          categories={[]} categoryCounts={kindCounts} categoryLabel="Type"
          categoryNames={Object.fromEntries(KIND_ORDER.map((value) => [value, KIND_LABELS[value].many]))}
          source={source} setSource={setSource} sources={[]} showSaved={showSaved} setShowSaved={setShowSaved}
          savedCount={savedIds.size} resultCount={shown.length} onClear={clearAll} />

        <div className="page-shell pb-16 pt-4">
          <p className="mb-3 text-xs text-muted-foreground" aria-live="polite">
            <span className="font-medium text-foreground">{shown.length}</span> {shown.length === 1 ? "result" : "results"}
          </p>
          {view === "map" && canMap ? (
            <MapSection events={mapEvents} />
          ) : shown.length ? (
            <div className="grid items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shown.slice(0, limit).map((row, index) => (
                <OpportunityCard key={row.id} row={row} today={today} index={index} saved={savedIds.has(row.id) || savedIds.has(row.link)} onToggleSave={toggleSaved} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
              <p className="text-4xl" aria-hidden>🔍</p>
              <h2 className="mt-2 text-lg font-semibold tracking-tight">Nothing matches yet</h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Try another type, place or date. Only listings that are confirmed free show up here.
              </p>
              <button type="button" onClick={clearAll} className="btn btn-primary btn-lg mt-5">Clear search and filters</button>
            </div>
          )}
          {hasMore ? (
            <div ref={more} className="mt-6 flex justify-center">
              <button type="button" onClick={() => setLimit((n) => n + PAGE)} className="btn btn-quiet btn-lg">
                Show more <span className="text-muted-foreground">({shown.length - limit} left)</span>
              </button>
            </div>
          ) : null}
        </div>
      </main>
      <BackToTop />
      <AnimatePresence>
        {toast ? (
          <motion.div role="status" initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
            className="toast fixed inset-x-4 z-[55] mx-auto flex max-w-sm items-center gap-2 rounded-full bg-foreground p-1.5 pl-5 text-background shadow-xl">
            <p className="min-w-0 flex-1 text-sm"><span className="font-semibold">Tracked ✨</span> <span className="line-clamp-1 opacity-70">{toast.title}</span></p>
            {toast.calendar ? (
              <a href={toast.calendar} target="_blank" rel="noopener noreferrer" className="btn bg-background text-foreground">
                <CalendarPlus className="size-4" aria-hidden /> Remind me
              </a>
            ) : (
              <Link href="/saved" className="btn bg-background text-foreground">Open</Link>
            )}
            <button type="button" onClick={() => setToast(null)} aria-label="Dismiss" className="flex size-10 items-center justify-center rounded-full opacity-70 hover:opacity-100">
              <X className="size-4" aria-hidden />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
