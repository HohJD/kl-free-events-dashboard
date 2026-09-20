"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, Clock, Minus, Plane, PlaneLanding, PlaneTakeoff, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSaved, type SavedEntry } from "@/lib/use-saved";
import { SaveButton } from "./save-button";
import {
  ADVICE_TEXT, type AdviceCode, type Calendar, type Day, type FlightData, type LegDetail, addDays, bookingOutlook, dayLabel, daysBetween,
  duration, googleFlightsLink, median, money, monthLabel, nearbyCheaper, plain, priceStep, stayLabel, toDays,
} from "@/lib/flights";

const STEPS = 7;

function AdviceBadge({ advice, large = false }: { advice: AdviceCode; large?: boolean }) {
  const Icon = advice === "B" ? Check : advice === "W" ? Clock : Minus;
  return (
    <span className={cn("fx-badge", `fx-badge-${advice}`, large && "fx-badge-lg")}>
      <Icon className={large ? "size-4" : "size-3.5"} strokeWidth={2.5} aria-hidden /> {ADVICE_TEXT[advice]}
    </span>
  );
}

function Chip({ active, onClick, children, label }: { active: boolean; onClick: () => void; children: React.ReactNode; label?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} aria-label={label}
      className={cn("fx-chip", active && "fx-chip-on")}>
      {children}
    </button>
  );
}

/* ---------- Calendar ---------- */

function MonthGrid({ month, today, byDate, prices, monthMin, selected, hovered, stay, onSelect, onHover }: {
  month: string; today: string; byDate: Map<string, Day>; prices: number[]; monthMin: number | null; selected: string; hovered: string;
  stay: number | null; onSelect: (date: string) => void; onHover: (date: string) => void;
}) {
  const [year, mon] = month.split("-").map(Number);
  const count = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const lead = (new Date(Date.UTC(year, mon - 1, 1)).getUTCDay() + 6) % 7;
  // Leading blanks then day indexes; whole weeks already past are skipped.
  const cells: (number | null)[] = [...Array.from({ length: lead }, () => null), ...Array.from({ length: count }, (_, i) => i)];
  let pastWeeks = 0;
  while (cells.slice(pastWeeks * 7, pastWeeks * 7 + 7).every((i) => i === null || `${month}-${String(i + 1).padStart(2, "0")}` < today)
    && (pastWeeks + 1) * 7 < cells.length) pastWeeks += 1;
  const anchor = hovered || selected;
  const tripEnd = anchor && stay ? addDays(anchor, stay) : "";
  return (
    <section aria-label={monthLabel(month)} className="min-w-0">
      <h3 className="mb-2 text-base font-bold">{monthLabel(month)}</h3>
      <div className="grid grid-cols-7 gap-1" role="grid" onMouseLeave={() => onHover("")}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <span key={day} className="pb-1 text-center text-[11px] font-medium text-muted-foreground" aria-hidden>{day.slice(0, 2)}</span>
        ))}
        {cells.slice(pastWeeks * 7).map((i, slot) => {
          if (i === null) return <span key={`lead-${slot}`} aria-hidden />;
          const date = `${month}-${String(i + 1).padStart(2, "0")}`;
          const day = byDate.get(date);
          const inTrip = !!tripEnd && date > anchor && date <= tripEnd;
          if (!day) {
            return (
              <span key={date} className={cn("fx-cell", date <= today ? "fx-cell-past" : "fx-cell-empty", inTrip && "fx-cell-trip", date === tripEnd && "fx-cell-return")} aria-hidden>
                <span className="fx-cell-num">{i + 1}</span>
              </span>
            );
          }
          const lowest = day.price === monthMin;
          return (
            <button key={date} type="button"
              onClick={() => onSelect(date)} onMouseEnter={() => onHover(date)} onFocus={() => onHover(date)}
              aria-pressed={selected === date}
              aria-label={`${dayLabel(date, { year: true })}: ${money(day.price)}${stay ? ` return, back ${dayLabel(addDays(date, stay))}` : ""}${lowest ? ", lowest this month" : ""}`}
              className={cn("fx-cell", `fx-seq-${priceStep(day.price, prices, STEPS)}`, selected === date && "fx-cell-on",
                inTrip && "fx-cell-trip", date === tripEnd && "fx-cell-return")}>
              <span className="fx-cell-num">{i + 1}</span>
              <span className="fx-cell-price">{plain(day.price)}</span>
              {lowest ? <span className="fx-cell-low">Lowest</span> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Trend ---------- */

function TrendChart({ index }: { index: [string, number, number][] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    if (!wrap.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(260, Math.round(entry.contentRect.width))));
    observer.observe(wrap.current);
    return () => observer.disconnect();
  }, []);
  if (index.length < 2) {
    return (
      <p className="text-sm text-muted-foreground" ref={wrap}>
        Tracking started {dayLabel(index[0]?.[0] ?? "", { year: true })}. After a few daily checks this shows whether fares are rising or falling, which is the clearest sign of when to buy.
      </p>
    );
  }
  const height = 180;
  const pad = { top: 16, right: 12, bottom: 26, left: 52 };
  const values = index.flatMap(([, typical, low]) => [typical, low]);
  const min = Math.min(...values) * 0.97;
  const max = Math.max(...values) * 1.02;
  const x = (i: number) => pad.left + (i / (index.length - 1)) * (width - pad.left - pad.right);
  const y = (value: number) => pad.top + (1 - (value - min) / (max - min || 1)) * (height - pad.top - pad.bottom);
  const line = (column: 1 | 2) => index.map((point, i) => `${x(i)},${y(point[column])}`).join(" ");
  const active = hover !== null ? index[hover] : null;
  return (
    <div ref={wrap} className="relative">
      <svg width={width} height={height} role="img" className="block"
        aria-label={`Typical fare moved from ${money(index[0][1])} to ${money(index[index.length - 1][1])} since ${dayLabel(index[0][0])}.`}
        onPointerMove={(event) => {
          const px = event.clientX - event.currentTarget.getBoundingClientRect().left;
          setHover(Math.max(0, Math.min(index.length - 1, Math.round(((px - pad.left) / (width - pad.left - pad.right)) * (index.length - 1)))));
        }}
        onPointerLeave={() => setHover(null)}>
        {[min, (min + max) / 2, max].map((tick) => (
          <g key={tick}>
            <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} className="fx-grid" />
            <text x={pad.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="fx-axis">{plain(tick)}</text>
          </g>
        ))}
        <text x={pad.left} y={height - 6} className="fx-axis">{dayLabel(index[0][0], { weekday: false })}</text>
        <text x={width - pad.right} y={height - 6} textAnchor="end" className="fx-axis">{dayLabel(index[index.length - 1][0], { weekday: false })}</text>
        <polyline points={line(1)} className="fx-line" />
        <polyline points={line(2)} className="fx-line fx-line-2" />
        {active ? <line x1={x(hover!)} x2={x(hover!)} y1={pad.top} y2={height - pad.bottom} className="fx-crosshair" /> : null}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="fx-key" aria-hidden /> Typical fare across all dates</span>
        <span className="inline-flex items-center gap-1.5"><span className="fx-key fx-key-2" aria-hidden /> Cheapest date</span>
      </div>
      {active ? (
        <div className="fx-tooltip" style={{ left: Math.min(Math.max(x(hover!) - 90, 0), width - 180), top: 0 }} role="status">
          <span className="block text-muted-foreground">Checked {dayLabel(active[0])}</span>
          <strong className="block tabular-nums">{money(active[1])} typical</strong>
          <span className="block tabular-nums">{money(active[2])} cheapest</span>
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Selected trip ---------- */

function LegLine({ icon: Icon, label, date, leg }: { icon: typeof PlaneTakeoff; label: string; date: string; leg: LegDetail }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 text-sm">
        <p className="font-semibold">{label} · {dayLabel(date)}</p>
        <p className="tabular-nums">{leg.depart_time} → {leg.arrive_time}{leg.arrive_day_offset ? <sup className="ml-0.5 text-[10px]">+{leg.arrive_day_offset}</sup> : null} · {duration(leg.duration_minutes)}</p>
        <p className="text-muted-foreground">{leg.airline} · {leg.stops === 0 ? "direct" : `${leg.stops} stop${leg.stops && leg.stops > 1 ? "s" : ""}${leg.via ? ` via ${leg.via}` : ""}`} · arrives {leg.airport}</p>
      </div>
    </div>
  );
}

function TripPanel({ day, days, calendar, stays, staysByDate, detail, route, typical, onPick, onStay, saved, onToggleSave }: {
  day: Day; days: Day[]; calendar: Calendar; stays: Calendar[]; staysByDate: Map<number | null, Map<string, number>>;
  detail: FlightData["details"][string] | undefined; route: FlightData["routes"][number]; typical: number;
  onPick: (date: string) => void; onStay: (stay: number | null) => void;
  saved: boolean; onToggleSave: (entry: Omit<SavedEntry, "savedAt">) => void;
}) {
  const diff = day.price - typical;
  const cheaper = nearbyCheaper(days, day.date);
  const options = stays.map((item) => ({ stay: item.stay, price: staysByDate.get(item.stay)?.get(day.date) }))
    .filter((item): item is { stay: number | null; price: number } => typeof item.price === "number");
  const cheapestOption = Math.min(...options.map((item) => item.price));
  const link = googleFlightsLink(route.origin, route.destination, day.date, day.returnDate);
  return (
    <div className="fx-card" id="trip">
      <p className="text-sm font-medium text-muted-foreground">
        {day.returnDate ? <>Leave {dayLabel(day.date)} · Return {dayLabel(day.returnDate)} · {calendar.stay} nights</> : <>One-way · {dayLabel(day.date, { year: true })}</>}
      </p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <p className="font-display text-4xl font-bold tabular-nums">{money(day.price)}</p>
        <span className="flex items-center gap-1">
          <AdviceBadge advice={day.advice} large />
          <SaveButton saved={saved} onToggle={onToggleSave}
            entry={{ id: `flight:${calendar.id}|${day.date}`, kind: "flight",
              title: `${route.origin} → ${route.destination} · ${dayLabel(day.date)}${day.returnDate ? ` → ${dayLabel(day.returnDate)}` : ""}`,
              href: `/flights?route=${calendar.route}&stay=${calendar.stay ?? "one-way"}&date=${day.date}`,
              section: "/flights", note: `${money(day.price)} · ${stayLabel(calendar.stay)}` }} />
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {day.returnDate ? "Return fare, economy, 1 adult. " : ""}
        {Math.abs(diff) < 1 ? "About the usual fare." : `${money(Math.abs(diff))} ${diff < 0 ? "below" : "above"} the usual ${money(typical)}.`}
      </p>

      {cheaper ? (
        <button type="button" onClick={() => onPick(cheaper.date)} className="fx-tip mt-4 w-full text-left">
          <TrendingDown className="size-4 shrink-0 text-[var(--fx-good)]" aria-hidden />
          <span>Leave {Math.abs(daysBetween(day.date, cheaper.date))} day{Math.abs(daysBetween(day.date, cheaper.date)) > 1 ? "s" : ""} {cheaper.date < day.date ? "earlier" : "later"} ({dayLabel(cheaper.date)}) and save <strong>{money(day.price - cheaper.price)}</strong></span>
          <ArrowRight className="ml-auto size-4 shrink-0" aria-hidden />
        </button>
      ) : null}

      {calendar.stay && options.length > 1 ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold">Same departure, different stay</h3>
          <ul className="mt-2 space-y-1.5">
            {options.map((item) => (
              <li key={String(item.stay)}>
                <button type="button" onClick={() => onStay(item.stay)} aria-pressed={item.stay === calendar.stay}
                  className={cn("fx-stay-row", item.stay === calendar.stay && "fx-stay-row-on")}>
                  <span className="w-16 shrink-0 text-left text-sm">{stayLabel(item.stay)}</span>
                  <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <span className="fx-bar absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.max(8, (item.price / Math.max(...options.map((o) => o.price))) * 100)}%` }} />
                  </span>
                  <span className={cn("w-20 shrink-0 text-right text-sm tabular-nums", item.price === cheapestOption && "font-bold")}>{money(item.price)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-5 space-y-3 border-t border-border/40 pt-4">
        {detail ? (
          <>
            <LegLine icon={PlaneTakeoff} label="Outbound" date={day.date} leg={detail.out} />
            {detail.back && day.returnDate ? <LegLine icon={PlaneLanding} label="Return" date={day.returnDate} leg={detail.back} /> : null}
            <p className="text-xs text-muted-foreground">Cheapest itinerary when checked on {dayLabel(detail.checked_on)}{detail.price !== day.price ? ` (then ${money(detail.price)})` : ""}.</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Flight times are checked for the cheapest dates each month. Open Google Flights for this date&apos;s airlines and times.</p>
        )}
      </div>

      <a href={link} target="_blank" rel="noopener noreferrer"
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-brutal-sm hover:opacity-90">
        See this trip on Google Flights <ArrowUpRight className="size-4" />
      </a>
      <p className="mt-3 text-xs text-muted-foreground">
        {day.checks > 1 ? `Checked ${day.checks} times; lowest seen ${money(day.lowestSeen)}.` : "First check for this date."}
        {day.change7d ? ` ${day.change7d < 0 ? "Down" : "Up"} ${money(Math.abs(day.change7d))} in 7 days.` : ""}
      </p>
    </div>
  );
}

/* ---------- Page ---------- */

type View = { route: string; stay: number | null };

export function FlightView({ data }: { data: FlightData | null }) {
  const focus = data?.calendars.find((item) => item.id === data.focus) ?? data?.calendars[0];
  const [view, setView] = useState<View>({ route: focus?.route ?? "kul-lon", stay: focus?.stay ?? 14 });
  const [selected, setSelected] = useState("");
  const [hovered, setHovered] = useState("");
  const [page, setPage] = useState(0);
  const { ids: savedIds, toggle: toggleSaved } = useSaved();
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelVisible, setPanelVisible] = useState(false);

  const calendar = data?.calendars.find((item) => item.route === view.route && item.stay === view.stay) ?? focus;
  const days = useMemo(() => toDays(calendar), [calendar]);
  const byDate = useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);
  const prices = days.map((day) => day.price);
  const typical = median(prices);
  const cheapest = days.length ? days.reduce((best, day) => (day.price < best.price ? day : best), days[0]) : null;
  const months = useMemo(() => Array.from(new Set(days.map((day) => day.date.slice(0, 7)))), [days]);
  const monthMin = useMemo(() => {
    const result = new Map<string, Day>();
    for (const day of days) {
      const current = result.get(day.date.slice(0, 7));
      if (!current || day.price < current.price) result.set(day.date.slice(0, 7), day);
    }
    return result;
  }, [days]);
  const stays = data?.calendars.filter((item) => item.route === view.route && item.stay !== null) ?? [];
  const staysByDate = useMemo(() => new Map(
    (data?.calendars ?? []).filter((item) => item.route === view.route).map((item) => [item.stay, new Map(item.days.map((row) => [row[0], row[1]]))]),
  ), [data, view.route]);
  const route = data?.routes.find((item) => item.id === view.route) ?? data?.routes[0];
  const outlook = bookingOutlook(days, calendar?.index ?? []);
  const current = byDate.get(selected) ?? cheapest;
  const top = [...days].sort((a, b) => a.price - b.price || a.date.localeCompare(b.date)).slice(0, 10);

  // Read ?route=&stay= once, so a shared link opens the same view.
  useEffect(() => {
    if (!data) return;
    const params = new URL(window.location.href).searchParams;
    const stayParam = params.get("stay");
    const next = { route: params.get("route") ?? view.route, stay: stayParam === "one-way" ? null : stayParam ? Number(stayParam) : view.stay };
    if (data.calendars.some((item) => item.route === next.route && item.stay === next.stay)) setView(next);
    if (params.get("date")) setSelected(params.get("date")!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Open on the selected date's month (first of the two shown on desktop).
  useEffect(() => {
    const index = months.indexOf((current?.date ?? "").slice(0, 7));
    if (index >= 0) setPage(index);
  }, [current?.date, months]);

  // The phone dock repeats the panel, so hide it while the panel is on screen.
  useEffect(() => {
    if (!panelRef.current) return;
    const observer = new IntersectionObserver(([entry]) => setPanelVisible(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(panelRef.current);
    return () => observer.disconnect();
  }, [data]);

  const updateUrl = (next: View, date: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("route", next.route);
    url.searchParams.set("stay", next.stay === null ? "one-way" : String(next.stay));
    if (date) url.searchParams.set("date", date); else url.searchParams.delete("date");
    window.history.replaceState(null, "", url);
  };
  const choose = (next: View) => {
    const keep = data?.calendars.find((item) => item.route === next.route && item.stay === next.stay)?.days.some((row) => row[0] === current?.date);
    setView(next);
    if (!keep) setSelected("");
    updateUrl(next, keep ? current?.date ?? "" : "");
  };
  const pick = (date: string) => {
    setSelected(date);
    updateUrl(view, date);
    if (window.matchMedia("(max-width: 1023px)").matches) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const updated = data ? new Date(data.generated_at).toLocaleString("en-MY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" }) : "";
  const visible = months.slice(page, page + 2);
  const isReturn = view.stay !== null;

  return (
    <div className="fx-root min-h-screen bg-background pb-24 lg:pb-0">

      <main className="page-shell py-6 sm:py-8">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Plane className="size-4" /> Flight fares · updated daily</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-5xl">
          {route?.id === "lon-kul" ? "London → KL" : "KL → London"}{isReturn ? " return" : " one-way"}
        </h1>

        {!data || !calendar ? (
          <div className="fx-card mt-6 text-sm text-muted-foreground">No fares yet. The first check runs with the next daily update.</div>
        ) : (
          <>
            <div className="mt-5 space-y-3">
              <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Trip">
                <span className="mr-1 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trip</span>
                <Chip active={view.route === "kul-lon" && isReturn} onClick={() => choose({ route: "kul-lon", stay: view.route === "kul-lon" && isReturn ? view.stay : 14 })}>KL → London return</Chip>
                <Chip active={view.route === "kul-lon" && !isReturn} onClick={() => choose({ route: "kul-lon", stay: null })}>KL → London one-way</Chip>
                <Chip active={view.route === "lon-kul" && isReturn} onClick={() => choose({ route: "lon-kul", stay: 14 })}>London → KL return</Chip>
                <Chip active={view.route === "lon-kul" && !isReturn} onClick={() => choose({ route: "lon-kul", stay: null })}>London → KL one-way</Chip>
              </div>
              {isReturn ? (
                <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Length of stay">
                  <span className="mr-1 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Stay</span>
                  {stays.map((item) => (
                    <Chip key={String(item.stay)} active={item.stay === view.stay} onClick={() => choose({ route: view.route, stay: item.stay })}>
                      {stayLabel(item.stay)}
                    </Chip>
                  ))}
                </div>
              ) : null}
            </div>

            <section aria-label="At a glance" className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
              <button type="button" className="fx-tile text-left transition-transform hover:-translate-y-0.5" onClick={() => cheapest && pick(cheapest.date)}>
                <p className="fx-tile-label">Cheapest {isReturn ? "trip" : "date"}</p>
                <p className="fx-tile-value">{money(cheapest?.price)}</p>
                <p className="fx-tile-note">{cheapest ? `${dayLabel(cheapest.date)}${cheapest.returnDate ? ` → ${dayLabel(cheapest.returnDate)}` : ""}` : ""} · <span className="underline underline-offset-2">show</span></p>
              </button>
              <div className="fx-tile">
                <p className="fx-tile-label">Usual fare</p>
                <p className="fx-tile-value">{money(typical)}</p>
                <p className="fx-tile-note">middle of {days.length} dates<span className="hidden sm:inline"> · range {money(Math.min(...prices))} to {money(Math.max(...prices))}</span></p>
              </div>
              <div className="fx-tile">
                <p className="fx-tile-label">Book now?</p>
                <p className="mt-2"><AdviceBadge advice={outlook.advice} large /></p>
                <p className="fx-tile-note hidden sm:block">{outlook.detail}</p>
              </div>
            </section>

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
              <section className="fx-card min-w-0" aria-labelledby="calendar-heading">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id="calendar-heading" className="text-lg font-bold">Pick your departure date</h2>
                  <div className="flex items-center gap-1">
                    <button type="button" className="fx-nav" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} aria-label="Earlier months"><ChevronLeft className="size-5" /></button>
                    <button type="button" className="fx-nav" onClick={() => setPage(Math.min(months.length - 1, page + 1))} disabled={page >= months.length - 1} aria-label="Later months"><ChevronRight className="size-5" /></button>
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Each day shows the cheapest {isReturn ? `return fare for a ${stayLabel(view.stay)} stay` : "one-way fare"} in RM. {isReturn ? "Hover or tap to see the trip on the calendar." : ""}
                </p>
                <div className="no-scrollbar -mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Jump to month">
                  {months.map((month, i) => (
                    <button key={month} type="button" onClick={() => setPage(i)} aria-pressed={i === page}
                      className={cn("fx-month", i === page && "fx-month-on", i === page + 1 && "md:fx-month-on")}>
                      <span className="block text-xs font-semibold">{monthLabel(month, true)}</span>
                      <span className="block text-[11px] tabular-nums text-muted-foreground">from {plain(monthMin.get(month)?.price ?? 0)}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-4 grid gap-6 md:grid-cols-2">
                  {visible.map((month, i) => (
                    <div key={month} className={cn(i === 1 && "hidden md:block")}>
                      <MonthGrid month={month} today={data.today} byDate={byDate} prices={prices} monthMin={monthMin.get(month)?.price ?? null}
                        selected={current?.date ?? ""} hovered={hovered} stay={view.stay} onSelect={pick} onHover={setHovered} />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
                  <span>Cheaper</span>
                  <span className="flex overflow-hidden rounded" aria-hidden>
                    {Array.from({ length: STEPS }, (_, i) => <span key={i} className={cn("h-3 w-5", `fx-seq-${i}`)} />)}
                  </span>
                  <span>Pricier</span>
                  {isReturn ? <span className="inline-flex items-center gap-1.5"><span className="fx-trip-key" aria-hidden /> your trip</span> : null}
                  <span>Blank days: no fare listed</span>
                </div>
              </section>

              <div ref={panelRef} className="scroll-mt-20 lg:sticky lg:top-20 lg:self-start">
                {current && route ? (
                  <TripPanel day={current} days={days} calendar={calendar} stays={stays} staysByDate={staysByDate}
                    saved={savedIds.has(`flight:${calendar.id}|${current.date}`)} onToggleSave={toggleSaved}
                    detail={data.details[`${calendar.id}|${current.date}`]} route={route} typical={typical}
                    onPick={pick} onStay={(stay) => choose({ route: view.route, stay })} />
                ) : null}
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <section className="fx-card" aria-labelledby="top-heading">
                <h2 id="top-heading" className="text-lg font-bold">10 cheapest {isReturn ? "trips" : "dates"}</h2>
                <ol className="mt-3 divide-y divide-border/40">
                  {top.map((day, i) => (
                    <li key={day.date}>
                      <button type="button" onClick={() => pick(day.date)} className={cn("fx-row", current?.date === day.date && "fx-row-on")}>
                        <span className="w-5 shrink-0 text-xs text-muted-foreground">{i + 1}</span>
                        <span className="min-w-0 flex-1 truncate text-left text-sm">
                          {dayLabel(day.date)}{day.returnDate ? ` → ${dayLabel(day.returnDate)}` : ""}
                        </span>
                        <span className="text-sm font-semibold tabular-nums">{money(day.price)}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </section>
              <section className="fx-card" aria-labelledby="trend-heading">
                <h2 id="trend-heading" className="text-lg font-bold">Are fares rising?</h2>
                <p className="mb-3 mt-1 text-sm text-muted-foreground">The usual and cheapest fare across all dates, on each day we checked. Rising lines mean book soon.</p>
                <TrendChart index={calendar.index} />
              </section>
            </div>

            <section className="mt-8 grid gap-4 text-sm sm:grid-cols-3" aria-label="Tips">
              <div><h3 className="font-semibold">When to book</h3><p className="mt-1 text-muted-foreground">KL–London fares are usually lowest 2 to 5 months ahead and climb in the last 6 weeks, especially around school holidays, Hari Raya and Christmas.</p></div>
              <div><h3 className="font-semibold">Save on a return</h3><p className="mt-1 text-muted-foreground">Try a different stay length and the days either side: the panel shows both. Midweek departures are often cheaper.</p></div>
              <div><h3 className="font-semibold">Before you pay</h3><p className="mt-1 text-muted-foreground">Fares change during the day. Open the trip on Google Flights to confirm the price, baggage and airport before booking.</p></div>
            </section>
            <p className="mt-6 text-xs text-muted-foreground">
              Source: Google Flights, economy, 1 adult, all London airports. Updated {updated} MYT{calendar.fresh ? "" : " (this calendar was not refreshed today)"}. Tracking since {dayLabel(data.tracking_since, { year: true })}.
            </p>
          </>
        )}
      </main>

      {current && data && calendar && !panelVisible ? (
        <a href="#trip" onClick={(event) => { event.preventDefault(); panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
          className="fx-dock lg:hidden">
          <span className="min-w-0">
            <span className="block truncate text-xs text-muted-foreground">{dayLabel(current.date)}{current.returnDate ? ` → ${dayLabel(current.returnDate)}` : ""}</span>
            <span className="block text-lg font-bold tabular-nums">{money(current.price)}</span>
          </span>
          <span className="ml-auto inline-flex items-center gap-1 text-sm font-semibold">Details <ArrowRight className="size-4" /></span>
        </a>
      ) : null}
    </div>
  );
}
