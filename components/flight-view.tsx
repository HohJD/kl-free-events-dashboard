"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, Clock, Minus, Plane, TrendingDown, TrendingUp } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";
import {
  type Advice, type FareRow, type FlightData, bookingOutlook, dayLabel, duration, median, money, monthLabel,
  scalePosition, selectRows, shortMoney, tripLabel,
} from "@/lib/flights";

const STEPS = 7;
const stepOf = (price: number, prices: number[]) => Math.min(STEPS - 1, Math.floor(scalePosition(price, prices) * STEPS));

function AdviceBadge({ advice, large = false }: { advice: Advice; large?: boolean }) {
  const Icon = advice === "Buy" ? Check : advice === "Wait" ? Clock : Minus;
  const label = advice === "Buy" ? "Good to book" : advice === "Wait" ? "Wait" : "Typical";
  return (
    <span className={cn("fx-badge", `fx-badge-${advice.toLowerCase()}`, large && "fx-badge-lg")}>
      <Icon className={large ? "size-4" : "size-3.5"} strokeWidth={2.5} aria-hidden /> {label}
    </span>
  );
}

function useWidth<T extends HTMLElement>(): [React.RefObject<T>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(720);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

function niceTicks(min: number, max: number, count = 4): number[] {
  const span = max - min || 1;
  const raw = span / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? raw;
  const ticks = [];
  for (let value = Math.ceil(min / step) * step; value <= max; value += step) ticks.push(value);
  return ticks;
}

/** Fare by departure date: one line, crosshair + tooltip, typical reference, cheapest labelled. */
function FareChart({ rows, selected, onSelect }: { rows: FareRow[]; selected: string; onSelect: (date: string) => void }) {
  const [wrap, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const height = 260;
  const pad = { top: 28, right: 16, bottom: 30, left: 56 };
  const prices = rows.map((row) => row.price);
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const ticks = niceTicks(low * 0.95, high * 1.02);
  const yMin = Math.min(ticks[0] ?? low, low * 0.95);
  const yMax = Math.max(ticks[ticks.length - 1] ?? high, high);
  const t0 = Date.parse(rows[0]?.depart_date ?? "");
  const t1 = Date.parse(rows[rows.length - 1]?.depart_date ?? "");
  const x = (date: string) => pad.left + ((Date.parse(date) - t0) / (t1 - t0 || 1)) * (width - pad.left - pad.right);
  const y = (price: number) => pad.top + (1 - (price - yMin) / (yMax - yMin || 1)) * (height - pad.top - pad.bottom);
  const typical = median(prices);
  const cheapest = rows.reduce((best, row) => (row.price < best.price ? row : best), rows[0]);
  const months = Array.from(new Set(rows.map((row) => row.depart_date.slice(0, 7))));
  const active = hover !== null ? rows[hover] : null;

  const nearest = (clientX: number, element: SVGSVGElement) => {
    const px = clientX - element.getBoundingClientRect().left;
    let best = 0;
    rows.forEach((row, i) => { if (Math.abs(x(row.depart_date) - px) < Math.abs(x(rows[best].depart_date) - px)) best = i; });
    return best;
  };

  if (rows.length < 2) return <p className="py-10 text-center text-sm text-muted-foreground">More dates appear as daily checks come in.</p>;

  return (
    <div ref={wrap} className="relative">
      <svg
        width={width} height={height} role="img" tabIndex={0} className="block touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Fares by departure date from ${money(low)} to ${money(high)}; typical ${money(typical)}. Use arrow keys to move between dates.`}
        onPointerMove={(event) => setHover(nearest(event.clientX, event.currentTarget))}
        onPointerLeave={() => setHover(null)}
        onClick={(event) => onSelect(rows[nearest(event.clientX, event.currentTarget)].depart_date)}
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          const current = hover ?? Math.max(0, rows.findIndex((row) => row.depart_date === selected));
          const next = Math.min(rows.length - 1, Math.max(0, current + (event.key === "ArrowRight" ? 1 : -1)));
          setHover(next);
          onSelect(rows[next].depart_date);
        }}
        onBlur={() => setHover(null)}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} className="fx-grid" />
            <text x={pad.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="fx-axis">{shortMoney(tick)}</text>
          </g>
        ))}
        {months.map((month, i) => {
          const first = rows.find((row) => row.depart_date.startsWith(month))!;
          const mx = x(first.depart_date);
          const previous = i ? x(rows.find((row) => row.depart_date.startsWith(months[i - 1]))!.depart_date) : -Infinity;
          return mx < width - 40 && mx - previous >= 32 ? (
            <text key={month} x={mx} y={height - 8} className="fx-axis">{monthLabel(month).split(" ")[0].slice(0, 3)}</text>
          ) : null;
        })}
        <line x1={pad.left} x2={width - pad.right} y1={y(typical)} y2={y(typical)} className="fx-typical" />
        <text x={width - pad.right} y={y(typical) - 6} textAnchor="end" className="fx-axis">typical {money(typical)}</text>
        <polyline points={rows.map((row) => `${x(row.depart_date)},${y(row.price)}`).join(" ")} className="fx-line" />
        {rows.map((row, i) => (
          <circle key={row.depart_date} cx={x(row.depart_date)} cy={y(row.price)}
            r={row.depart_date === selected ? 6 : hover === i ? 5 : 4}
            className={cn("fx-dot", row.depart_date === selected && "fx-dot-on")} />
        ))}
        <g>
          <text x={Math.min(Math.max(x(cheapest.depart_date), pad.left + 40), width - pad.right - 40)} y={y(cheapest.price) - 12} textAnchor="middle" className="fx-callout">
            {money(cheapest.price)} · {dayLabel(cheapest.depart_date).replace(/^\w+ /, "")}
          </text>
        </g>
        {active ? <line x1={x(active.depart_date)} x2={x(active.depart_date)} y1={pad.top - 8} y2={height - pad.bottom} className="fx-crosshair" /> : null}
      </svg>
      {active ? (
        <div className="fx-tooltip" style={{ left: Math.min(Math.max(x(active.depart_date) - 90, 0), width - 180), top: 0 }} role="status">
          <strong className="block text-base tabular-nums">{money(active.price)}</strong>
          <span className="block">{dayLabel(active.depart_date, true)}</span>
          <span className="block text-muted-foreground">{active.airline}{active.stops !== null ? ` · ${active.stops === 0 ? "direct" : `${active.stops} stop${active.stops > 1 ? "s" : ""}`}` : ""}</span>
        </div>
      ) : null}
    </div>
  );
}

/** Month calendars; checked dates are shaded cheap (light) to pricey (dark). */
function PriceCalendar({ rows, selected, onSelect }: { rows: FareRow[]; selected: string; onSelect: (date: string) => void }) {
  const prices = rows.map((row) => row.price);
  const byDate = new Map(rows.map((row) => [row.depart_date, row]));
  const cheapest = Math.min(...prices);
  const months = Array.from(new Set(rows.map((row) => row.depart_date.slice(0, 7))));
  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {months.map((month) => {
          const [year, mon] = month.split("-").map(Number);
          const days = new Date(Date.UTC(year, mon, 0)).getUTCDate();
          const lead = (new Date(Date.UTC(year, mon - 1, 1)).getUTCDay() + 6) % 7;
          return (
            <section key={month} aria-label={monthLabel(month)}>
              <h4 className="mb-2 text-sm font-semibold">{monthLabel(month)}</h4>
              <div className="grid grid-cols-7 gap-1 text-center" role="grid">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => <span key={i} className="fx-axis pb-1" aria-hidden>{day}</span>)}
                {Array.from({ length: lead }, (_, i) => <span key={`lead-${i}`} aria-hidden />)}
                {Array.from({ length: days }, (_, i) => {
                  const date = `${month}-${String(i + 1).padStart(2, "0")}`;
                  const row = byDate.get(date);
                  if (!row) return <span key={date} className="fx-day-empty" aria-hidden>{i + 1}</span>;
                  const step = stepOf(row.price, prices);
                  return (
                    <button key={date} type="button" onClick={() => onSelect(date)} aria-pressed={selected === date}
                      aria-label={`${dayLabel(date, true)}: ${money(row.price)}, ${row.advice === "Buy" ? "good to book" : row.advice.toLowerCase()}`}
                      title={`${dayLabel(date)} · ${money(row.price)} · ${row.airline}`}
                      className={cn("fx-day", `fx-seq-${step}`, selected === date && "fx-day-on")}>
                      <span className="fx-day-num">{i + 1}</span>
                      <span className="fx-day-price">{shortMoney(row.price)}</span>
                      {row.price === cheapest ? <span className="fx-day-star" aria-hidden>★</span> : null}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>Cheaper</span>
        <span className="flex overflow-hidden rounded" aria-hidden>
          {Array.from({ length: STEPS }, (_, i) => <span key={i} className={cn("h-3 w-6", `fx-seq-${i}`)} />)}
        </span>
        <span>Pricier</span>
        <span className="ml-2">★ cheapest date · blank dates are not checked yet</span>
      </div>
    </div>
  );
}

function Detail({ row, typical }: { row: FareRow; typical: number }) {
  const diff = row.price - typical;
  return (
    <div className="fx-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {dayLabel(row.depart_date, true)}{row.return_date ? ` → ${dayLabel(row.return_date, true)}` : ""}
          </p>
          <p className="mt-1 font-display text-4xl font-bold tabular-nums">{money(row.price)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {Math.abs(diff) < 1 ? "Same as the typical fare" : `${money(Math.abs(diff))} ${diff < 0 ? "below" : "above"} typical`}
          </p>
        </div>
        <AdviceBadge advice={row.advice} large />
      </div>
      <p className="mt-3 text-sm">{row.reason}.</p>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
        <div><dt className="text-xs text-muted-foreground">Airline</dt><dd className="font-medium">{row.airline || "Various"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Stops</dt><dd className="font-medium">{row.stops === 0 ? "Direct" : row.stops === null ? "n/a" : `${row.stops}${row.via ? ` via ${row.via}` : ""}`}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Travel time</dt><dd className="font-medium">{duration(row.duration_minutes) || "n/a"}</dd></div>
        <div>
          <dt className="text-xs text-muted-foreground">Last 7 days</dt>
          <dd className="flex items-center gap-1 font-medium">
            {row.change_7d === null ? "Tracking" : row.change_7d === 0 ? "No change" : (
              <>{row.change_7d < 0 ? <TrendingDown className="size-4 text-[var(--fx-good)]" aria-hidden /> : <TrendingUp className="size-4 text-[var(--fx-critical)]" aria-hidden />}
                {row.change_7d < 0 ? "Down" : "Up"} {money(Math.abs(row.change_7d))}</>
            )}
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-muted-foreground">
        Checked {row.checks > 1 ? `${row.checks} times` : "once"}, lowest seen {money(row.lowest_seen)}{row.checked_on ? `, last on ${dayLabel(row.checked_on)}` : ""}.
        {row.options ? ` Cheapest of ${row.options} itineraries.` : ""}
      </p>
      {row.link ? (
        <a href={row.link} target="_blank" rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border/70 bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-brutal-sm hover:opacity-90">
          Check live price on Google Flights <ArrowUpRight className="size-4" />
        </a>
      ) : null}
    </div>
  );
}

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-2xl border border-border/50 bg-muted/40 p-1">
      {options.map((option) => (
        <button key={option.value} type="button" onClick={() => onChange(option.value)} aria-pressed={value === option.value}
          className={cn("min-h-11 rounded-xl px-4 text-sm font-semibold transition-colors",
            value === option.value ? "border border-border/60 bg-accent text-accent-foreground shadow-brutal-sm" : "text-muted-foreground hover:bg-card hover:text-foreground")}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function FlightView({ data }: { data: FlightData | null }) {
  const [route, setRoute] = useState(data?.routes[0]?.id ?? "kul-lon");
  const [trip, setTrip] = useState("one-way");
  const [selected, setSelected] = useState("");

  useEffect(() => {
    const params = new URL(window.location.href).searchParams;
    if (params.get("route") && data?.routes.some((item) => item.id === params.get("route"))) setRoute(params.get("route")!);
    if (params.get("trip") && data?.trips.includes(params.get("trip")!)) setTrip(params.get("trip")!);
  }, [data]);

  const rows = useMemo(() => (data ? selectRows(data, route, trip) : []), [data, route, trip]);
  const prices = rows.map((row) => row.price);
  const typical = median(prices);
  const cheapest = rows.length ? rows.reduce((best, row) => (row.price < best.price ? row : best), rows[0]) : null;
  const months = data?.summary.filter((item) => item.route === route && item.trip === trip) ?? [];
  const bestMonth = months.length ? months.reduce((best, item) => (item.price < best.price ? item : best), months[0]) : null;
  const outlook = bookingOutlook(rows);
  const current = rows.find((row) => row.depart_date === selected) ?? cheapest;

  useEffect(() => { setSelected(""); }, [route, trip]);

  const choose = (key: "route" | "trip", value: string) => {
    if (key === "route") setRoute(value); else setTrip(value);
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.replaceState(null, "", url);
  };

  const routeLabel = data?.routes.find((item) => item.id === route)?.label ?? "";
  const updated = data ? new Date(data.generated_at).toLocaleString("en-MY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" }) : "";

  return (
    <div className="fx-root min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="page-shell flex h-16 items-center justify-between gap-2">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <ArrowLeft className="size-4" /> Events
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="page-shell py-8 sm:py-10">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Plane className="size-4" /> Flight fares</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-5xl">KL ⇄ London</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          The cheapest economy fare for each departure date over the next 6 months, checked daily on Google Flights,
          with a simple signal on whether to book now.
        </p>

        {!data ? (
          <div className="fx-card mt-8 text-sm text-muted-foreground">No fares yet. The first check runs with the next daily update.</div>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap gap-3">
              <Segmented label="Direction" value={route} onChange={(value) => choose("route", value)}
                options={data.routes.map((item) => ({ value: item.id, label: item.id === "kul-lon" ? "KL → London" : "London → KL" }))} />
              <Segmented label="Trip type" value={trip} onChange={(value) => choose("trip", value)}
                options={data.trips.map((item) => ({ value: item, label: tripLabel(item).replace("Return · ", "Return ") }))} />
            </div>

            {rows.length ? (
              <>
                <section aria-label="Summary" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="fx-tile">
                    <p className="fx-tile-label">Cheapest date</p>
                    <p className="fx-tile-value">{money(cheapest?.price)}</p>
                    <p className="fx-tile-note">{cheapest ? `${dayLabel(cheapest.depart_date)} · ${cheapest.airline}` : ""}</p>
                  </div>
                  <div className="fx-tile">
                    <p className="fx-tile-label">Cheapest month</p>
                    <p className="fx-tile-value">{bestMonth ? monthLabel(bestMonth.month).split(" ")[0] : ""}</p>
                    <p className="fx-tile-note">{bestMonth ? `from ${money(bestMonth.price)}` : ""}</p>
                  </div>
                  <div className="fx-tile">
                    <p className="fx-tile-label">Typical fare</p>
                    <p className="fx-tile-value">{money(typical)}</p>
                    <p className="fx-tile-note">middle of {rows.length} dates checked</p>
                  </div>
                  <div className="fx-tile">
                    <p className="fx-tile-label">Book now?</p>
                    <p className="mt-2"><AdviceBadge advice={outlook.advice} large /></p>
                    <p className="fx-tile-note">{outlook.detail}</p>
                  </div>
                </section>

                <section className="fx-card mt-6" aria-labelledby="chart-heading">
                  <h2 id="chart-heading" className="text-lg font-bold">Fare by departure date</h2>
                  <p className="mb-3 text-sm text-muted-foreground">{routeLabel} · {tripLabel(trip)}. Hover or tap a point; click to see details below.</p>
                  <FareChart rows={rows} selected={current?.depart_date ?? ""} onSelect={setSelected} />
                </section>

                <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
                  <section className="fx-card order-2 lg:order-none" aria-labelledby="calendar-heading">
                    <h2 id="calendar-heading" className="mb-4 text-lg font-bold">Price calendar</h2>
                    <PriceCalendar rows={rows} selected={current?.depart_date ?? ""} onSelect={setSelected} />
                  </section>
                  <section aria-labelledby="detail-heading" className="order-1 lg:order-none lg:sticky lg:top-20 lg:self-start">
                    <h2 id="detail-heading" className="sr-only">Selected date</h2>
                    {current ? <Detail row={current} typical={typical} /> : null}
                  </section>
                </div>

                <section className="fx-card mt-6" aria-labelledby="month-heading">
                  <h2 id="month-heading" className="mb-3 text-lg font-bold">Best date each month</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-sm">
                      <thead><tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                        <th className="py-2 pr-3 font-medium">Month</th><th className="py-2 pr-3 text-right font-medium">From</th>
                        <th className="py-2 pr-3 font-medium">Best date</th><th className="py-2 pr-3 font-medium">Airline</th><th className="py-2 font-medium">Signal</th>
                      </tr></thead>
                      <tbody>
                        {months.map((item) => (
                          <tr key={item.month} className="cursor-pointer border-b border-border/30 hover:bg-muted/40" onClick={() => setSelected(item.depart_date)}>
                            <td className="py-2.5 pr-3 font-medium">{monthLabel(item.month)}</td>
                            <td className="py-2.5 pr-3 text-right font-semibold tabular-nums">{money(item.price)}</td>
                            <td className="py-2.5 pr-3">{dayLabel(item.depart_date)}</td>
                            <td className="py-2.5 pr-3 text-muted-foreground">{item.airline}</td>
                            <td className="py-2.5"><AdviceBadge advice={item.advice} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <details className="mt-4 text-sm">
                    <summary className="cursor-pointer font-semibold">All {rows.length} dates as a table</summary>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[560px]">
                        <thead><tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                          <th className="py-2 pr-3 font-medium">Depart</th>{trip !== "one-way" ? <th className="py-2 pr-3 font-medium">Return</th> : null}
                          <th className="py-2 pr-3 text-right font-medium">Fare</th><th className="py-2 pr-3 font-medium">Airline</th><th className="py-2 font-medium">Signal</th>
                        </tr></thead>
                        <tbody>
                          {rows.map((row) => (
                            <tr key={row.depart_date} className="border-b border-border/30">
                              <td className="py-2 pr-3">{dayLabel(row.depart_date)}</td>{trip !== "one-way" ? <td className="py-2 pr-3">{dayLabel(row.return_date)}</td> : null}
                              <td className="py-2 pr-3 text-right tabular-nums">{money(row.price)}</td>
                              <td className="py-2 pr-3 text-muted-foreground">{row.airline}</td>
                              <td className="py-2"><AdviceBadge advice={row.advice} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </section>
              </>
            ) : (
              <div className="fx-card mt-6 text-sm text-muted-foreground">No fares for this trip yet. Dates are checked in rotation, so they fill in over a few days.</div>
            )}

            <section className="mt-8 grid gap-4 text-sm sm:grid-cols-3" aria-label="How to use this">
              <div><h3 className="font-semibold">When to book</h3><p className="mt-1 text-muted-foreground">KL–London fares are usually lowest 2 to 5 months ahead and tend to rise in the last 6 weeks, especially around school holidays, Hari Raya and Christmas.</p></div>
              <div><h3 className="font-semibold">What the signal means</h3><p className="mt-1 text-muted-foreground">Good to book: cheapest seen for that date, Google says prices are low, or departure is close. Wait: clearly above its usual fare with time to spare.</p></div>
              <div><h3 className="font-semibold">Before you pay</h3><p className="mt-1 text-muted-foreground">Prices change during the day. Always confirm the fare, baggage and airport on Google Flights or the airline before booking.</p></div>
            </section>
            <p className="mt-6 text-xs text-muted-foreground">
              Source: Google Flights, economy, 1 adult, all London airports. Updated {updated} MYT. {data.coverage.known} of {data.coverage.slots} tracked dates have a fare so far; tracking since {dayLabel(data.tracking_since, true)}.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
