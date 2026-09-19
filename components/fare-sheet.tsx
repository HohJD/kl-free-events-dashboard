"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowDown, ArrowUp, Download, Plane } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";
import {
  type Advice, type FareRow, type FlightData, columnLetter, money, monthLabel, scalePosition, shortDate, tripLabel,
} from "@/lib/flights";

type Cell = { text: string; value?: number; node?: React.ReactNode; className?: string; style?: React.CSSProperties; align?: "left" | "right" | "center" };
type Column = { header: string; width: number; align?: "left" | "right" | "center"; numeric?: boolean };
type Sheet = { id: string; label: string; columns: Column[]; rows: Cell[][]; note?: string };

const ADVICE_CLASS: Record<Advice, string> = { Buy: "xl-good", Wait: "xl-bad", Typical: "xl-neutral" };

// Excel's default 3-colour scale: green (low) → yellow → red (high).
function scaleStyle(position: number): React.CSSProperties {
  const stops = [[99, 190, 123], [255, 235, 132], [248, 105, 107]];
  const [from, to, t] = position < 0.5 ? [stops[0], stops[1], position * 2] : [stops[1], stops[2], (position - 0.5) * 2];
  const rgb = from.map((channel, i) => Math.round(channel + (to[i] - channel) * t));
  return { backgroundColor: `rgb(${rgb.join(" ")} / var(--xl-scale-alpha))` };
}

function Spark({ points }: { points: [string, number][] }) {
  if (points.length < 2) return <span className="xl-dim">{points.length ? "1 check" : ""}</span>;
  const values = points.map(([, price]) => price);
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  const path = values.map((value, i) => `${(i / (values.length - 1)) * 70 + 1},${17 - ((value - min) / range) * 15}`).join(" ");
  const last = values[values.length - 1];
  return (
    <svg width="72" height="18" viewBox="0 0 72 18" role="img" aria-label={`Trend from ${money(values[0])} to ${money(last)}`}>
      <polyline points={path} fill="none" stroke="var(--xl-spark)" strokeWidth="1.5" />
      <circle cx={71} cy={17 - ((last - min) / range) * 15} r="2" fill={last <= values[0] ? "var(--xl-down)" : "var(--xl-up)"} />
    </svg>
  );
}

function weekday(value: string): string {
  const stamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(stamp) ? new Date(stamp).toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" }) : "";
}

function delta(value: number | null): Cell {
  if (value === null) return { text: "", align: "right" };
  if (value === 0) return { text: "0", value: 0, align: "right", className: "xl-dim" };
  return {
    text: `${value > 0 ? "+" : "−"}${money(Math.abs(value)).replace("RM ", "")}`,
    value, align: "right",
    className: value < 0 ? "xl-down-text" : "xl-up-text",
  };
}

function fareSheet(rows: FareRow[], route: string, label: string): Sheet {
  const mine = rows.filter((row) => row.route === route);
  const prices = mine.map((row) => row.price);
  return {
    id: route, label,
    note: "Cheapest fare found for each departure date. Colour scale: green = cheapest in this sheet, red = dearest.",
    columns: [
      { header: "Depart", width: 112 }, { header: "Trip", width: 118 }, { header: "Fare", width: 96, align: "right", numeric: true },
      { header: "Signal", width: 76, align: "center" }, { header: "7-day change", width: 96, align: "right", numeric: true },
      { header: "Lowest seen", width: 96, align: "right", numeric: true }, { header: "Trend", width: 84, align: "center" },
      { header: "Return", width: 112 }, { header: "Stops", width: 56, align: "right", numeric: true },
      { header: "Days out", width: 72, align: "right", numeric: true }, { header: "Google", width: 76, align: "center" },
      { header: "Why", width: 320 }, { header: "Fare seen", width: 88 },
    ],
    rows: mine.map((row) => [
      { text: `${row.weekday} ${shortDate(row.depart_date)}` },
      { text: tripLabel(row.trip) },
      { text: money(row.price), value: row.price, align: "right", style: scaleStyle(scalePosition(row.price, prices)) },
      { text: row.advice, align: "center", className: cn("font-semibold", ADVICE_CLASS[row.advice]) },
      delta(row.change_7d),
      { text: money(row.lowest_seen), value: row.lowest_seen, align: "right" },
      { text: row.trend.map(([day, price]) => `${day} ${money(price)}`).join(", "), node: <Spark points={row.trend} />, align: "center" },
      { text: row.return_date ? `${weekday(row.return_date)} ${shortDate(row.return_date)}` : "" },
      { text: row.stops === null || row.stops === undefined ? "" : String(row.stops), value: row.stops ?? undefined, align: "right" },
      { text: String(row.days_out), value: row.days_out, align: "right" },
      { text: row.google_level ? row.google_level[0].toUpperCase() + row.google_level.slice(1) : "", align: "center" },
      { text: row.reason },
      { text: row.found_at ? shortDate(row.found_at) : "" },
    ]),
  };
}

function summarySheet(data: FlightData): Sheet {
  const months = Array.from(new Set(data.summary.map((cell) => cell.month))).sort();
  const lines = data.routes.flatMap((route) => data.trips.map((trip) => ({ route, trip })));
  return {
    id: "summary", label: "Summary",
    note: "Cheapest fare per month (colour scale per row). Pick the green month, then open its route sheet for the best date.",
    columns: [
      { header: "Route", width: 176 }, { header: "Trip", width: 118 },
      ...months.map((month) => ({ header: monthLabel(month), width: 92, align: "right" as const, numeric: true })),
      { header: "Cheapest", width: 96, align: "right", numeric: true }, { header: "Best date", width: 92 }, { header: "Signal", width: 76, align: "center" },
    ],
    rows: lines.map(({ route, trip }) => {
      const cells = months.map((month) => data.summary.find((cell) => cell.route === route.id && cell.trip === trip && cell.month === month));
      const prices = cells.flatMap((cell) => (cell ? [cell.price] : []));
      const best = cells.reduce<(typeof cells)[number]>((low, cell) => (cell && (!low || cell.price < low.price) ? cell : low), undefined);
      return [
        { text: route.label },
        { text: tripLabel(trip) },
        ...cells.map((cell): Cell => cell
          ? { text: money(cell.price), value: cell.price, align: "right", style: scaleStyle(scalePosition(cell.price, prices)) }
          : { text: "", align: "right" }),
        { text: money(best?.price), value: best?.price, align: "right", className: "font-semibold" },
        { text: best ? shortDate(best.depart_date) : "" },
        best ? { text: best.advice, align: "center", className: cn("font-semibold", ADVICE_CLASS[best.advice]) } : { text: "" },
      ];
    }),
  };
}

function googleSheet(data: FlightData): Sheet {
  const labels = Object.fromEntries(data.routes.map((route) => [route.id, route.label]));
  return {
    id: "google", label: "Google check",
    note: "Google Flights' own verdict for the cheapest dates, checked daily. \"Low\" means below Google's typical range for that trip.",
    columns: [
      { header: "Route", width: 176 }, { header: "Trip", width: 118 }, { header: "Depart", width: 92 }, { header: "Return", width: 92 },
      { header: "Google fare", width: 100, align: "right", numeric: true }, { header: "Level", width: 76, align: "center" },
      { header: "Typical low", width: 96, align: "right", numeric: true }, { header: "Typical high", width: 96, align: "right", numeric: true },
      { header: "History", width: 84, align: "center" }, { header: "Airline", width: 170 }, { header: "Stops", width: 56, align: "right", numeric: true },
      { header: "Duration", width: 80, align: "right" }, { header: "Link", width: 90 },
    ],
    rows: data.google.map((item) => {
      const level = (item.price_level || "").toLowerCase();
      const advice: Advice | null = level === "low" ? "Buy" : level === "high" ? "Wait" : level ? "Typical" : null;
      return [
        { text: labels[item.route] || item.route }, { text: tripLabel(item.trip) },
        { text: shortDate(item.depart_date) }, { text: item.return_date ? shortDate(item.return_date) : "" },
        { text: money(item.lowest_price), value: item.lowest_price ?? undefined, align: "right" },
        { text: level ? level[0].toUpperCase() + level.slice(1) : "", align: "center", className: advice ? cn("font-semibold", ADVICE_CLASS[advice]) : "" },
        { text: money(item.typical_low), value: item.typical_low ?? undefined, align: "right" },
        { text: money(item.typical_high), value: item.typical_high ?? undefined, align: "right" },
        { text: `${item.history.length} points`, node: <Spark points={item.history} />, align: "center" },
        { text: item.airline }, { text: item.stops === null ? "" : String(item.stops), value: item.stops ?? undefined, align: "right" },
        { text: item.duration_minutes ? `${Math.floor(item.duration_minutes / 60)}h ${item.duration_minutes % 60}m` : "", align: "right" },
        item.google_url
          ? { text: item.google_url, node: <a href={item.google_url} target="_blank" rel="noopener noreferrer" className="xl-link">Open ↗</a> }
          : { text: "" },
      ];
    }),
  };
}

const GUIDE: [string, string][] = [
  ["Signal", "Buy = cheap now (Google rates it low, or it is in the cheapest quarter of our daily checks, or departure is under 6 weeks away)."],
  ["", "Wait = clearly above usual with more than 6 weeks to go. Typical = about normal; buy when your dates are fixed."],
  ["Fares", "Cheapest fare found for each date, economy, any airline, all London airports. Fares come from recent traveller searches and can be a few days old: check \"Fare seen\"."],
  ["Returns", "Priced for 2-week and 3-week stays. The return date shown is the one that gave the cheapest fare."],
  ["7-day change", "How the fare for that same departure date moved since a week ago. Green = cheaper, red = dearer."],
  ["Rule of thumb", "KL–London fares are usually lowest 2 to 5 months before departure, and tend to rise in the last 6 weeks and around school holidays, Hari Raya and Christmas."],
  ["Before booking", "Always confirm the fare, baggage and airport on the airline or booking site: prices change during the day."],
];

function guideSheet(data: FlightData | null): Sheet {
  return {
    id: "guide", label: "How to read",
    columns: [{ header: "Topic", width: 140 }, { header: "Notes", width: 860 }],
    rows: [
      ...GUIDE.map(([topic, text]) => [{ text: topic, className: "font-semibold" }, { text }]),
      [{ text: "Tracking since", className: "font-semibold" }, { text: data ? shortDate(data.tracking_since) : "First update pending" }],
    ],
  };
}

function toCsv(sheet: Sheet): string {
  const quote = (text: string) => (/[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text);
  return [sheet.columns.map((column) => column.header), ...sheet.rows.map((row) => row.map((cell) => cell.value !== undefined ? String(cell.value) : cell.text))]
    .map((line) => line.map(quote).join(",")).join("\n");
}

export function FareSheet({ data }: { data: FlightData | null }) {
  const [sheetId, setSheetId] = useState("summary");
  const [trip, setTrip] = useState("all");
  const [buyOnly, setBuyOnly] = useState(false);
  const [sort, setSort] = useState<{ column: number; descending: boolean } | null>(null);
  const [selected, setSelected] = useState<[number, number]>([0, 0]);
  const gridRef = useRef<HTMLDivElement>(null);

  const sheets = useMemo(() => {
    if (!data) return [guideSheet(null)];
    const rows = data.rows.filter((row) => (trip === "all" || row.trip === trip) && (!buyOnly || row.advice === "Buy"));
    const [out, back] = data.routes;
    return [
      summarySheet(data),
      fareSheet(rows, out.id, "KL → London"),
      fareSheet(rows, back.id, "London → KL"),
      ...(data.google.length ? [googleSheet(data)] : []),
      guideSheet(data),
    ];
  }, [data, trip, buyOnly]);

  const sheet = sheets.find((item) => item.id === sheetId) || sheets[0];
  const rows = useMemo(() => {
    if (!sort) return sheet.rows;
    const key = (row: Cell[]) => row[sort.column]?.value ?? row[sort.column]?.text ?? "";
    return [...sheet.rows].sort((a, b) => {
      const [x, y] = [key(a), key(b)];
      const order = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return sort.descending ? -order : order;
    });
  }, [sheet, sort]);

  useEffect(() => { setSort(null); setSelected([0, 0]); }, [sheetId]);
  useEffect(() => {
    const value = new URL(window.location.href).searchParams.get("sheet");
    if (value) setSheetId(value);
  }, []);

  const chooseSheet = (id: string) => {
    setSheetId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("sheet", id);
    window.history.replaceState(null, "", url);
  };

  // Row 0 is the header row, as in a spreadsheet; data rows start at 1.
  const [selRow, selCol] = selected;
  const selectedCell = selRow === 0 ? { text: sheet.columns[selCol]?.header ?? "" } : rows[selRow - 1]?.[selCol];
  const columnValues = rows.map((row) => row[selCol]?.value).filter((value): value is number => typeof value === "number");
  const stats = sheet.columns[selCol]?.numeric && columnValues.length
    ? { count: columnValues.length, min: Math.min(...columnValues), average: columnValues.reduce((a, b) => a + b, 0) / columnValues.length }
    : null;
  const isMoney = /Fare|Lowest|Cheapest|Typical|Google fare|change|^[A-Z][a-z]{2} \d{4}$/.test(sheet.columns[selCol]?.header ?? "");

  const onKeyDown = (event: React.KeyboardEvent) => {
    const moves: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    const next: [number, number] = [
      Math.min(Math.max(selRow + move[0], 0), rows.length),
      Math.min(Math.max(selCol + move[1], 0), sheet.columns.length - 1),
    ];
    setSelected(next);
    gridRef.current?.querySelector(`[data-cell="${next[0]}-${next[1]}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([toCsv({ ...sheet, rows })], { type: "text/csv" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: `kl-london-${sheet.id}.csv` });
    link.click();
    URL.revokeObjectURL(url);
  };

  const updated = data
    ? new Date(data.generated_at).toLocaleString("en-MY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" })
    : "";
  const fareSheetActive = sheet.id === "kul-lon" || sheet.id === "lon-kul";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="page-shell flex h-16 items-center justify-between gap-2">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <ArrowLeft className="size-4" /> Events
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="page-shell py-6 sm:py-8">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">KL ⇄ London fares</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Cheapest one-way and return fares for every departure date in the next 6 months, updated daily,
          with a Buy / Wait signal. Start on <strong>Summary</strong> to find the cheapest month.
        </p>

        <div className="xl-book mt-6">
          <div className="xl-titlebar">
            <Plane className="size-4 shrink-0" />
            <span className="truncate font-semibold">kl-london-fares</span>
            <span className="ml-auto hidden truncate opacity-80 sm:inline">{data ? `${data.currency} · updated ${updated} MYT` : "Waiting for first update"}</span>
          </div>

          <div className="xl-ribbon" role="toolbar" aria-label="Sheet options">
            <div className="xl-group">
              <span className="xl-group-label">Trip</span>
              <div className="flex flex-wrap gap-1">
                {["all", ...(data?.trips ?? [])].map((value) => (
                  <button key={value} onClick={() => setTrip(value)} aria-pressed={trip === value} disabled={!fareSheetActive}
                    className={cn("xl-button", trip === value && "xl-button-on")}>
                    {value === "all" ? "All" : tripLabel(value)}
                  </button>
                ))}
              </div>
            </div>
            <div className="xl-group">
              <span className="xl-group-label">Filter</span>
              <button onClick={() => setBuyOnly(!buyOnly)} aria-pressed={buyOnly} disabled={!fareSheetActive} className={cn("xl-button", buyOnly && "xl-button-on")}>
                Buy signals only
              </button>
            </div>
            <div className="xl-group">
              <span className="xl-group-label">Export</span>
              <button onClick={download} className="xl-button"><Download className="size-3.5" /> CSV</button>
            </div>
          </div>

          <div className="xl-formula">
            <span className="xl-namebox">{columnLetter(selCol)}{selRow + 1}</span>
            <span className="xl-fx" aria-hidden>fx</span>
            <span className="min-w-0 flex-1 truncate" aria-live="polite">{selectedCell?.text ?? ""}</span>
          </div>

          <div ref={gridRef} className="xl-grid" tabIndex={0} onKeyDown={onKeyDown} role="grid" aria-label={sheet.label} aria-rowcount={rows.length + 1}>
            <table>
              <colgroup>
                <col style={{ width: 40 }} />
                {sheet.columns.map((column, i) => <col key={i} style={{ width: column.width }} />)}
              </colgroup>
              <thead>
                <tr>
                  <th className="xl-corner" aria-hidden />
                  {sheet.columns.map((column, i) => (
                    <th key={i} className={cn("xl-colhead", i === 0 && "xl-freeze-head", selCol === i && "xl-colhead-on")} aria-hidden>{columnLetter(i)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr role="row">
                  <th className={cn("xl-rowhead xl-rowhead-top", selRow === 0 && "xl-rowhead-on")} aria-hidden>1</th>
                  {sheet.columns.map((column, i) => (
                    <td key={i} data-cell={`0-${i}`} role="columnheader"
                      aria-sort={sort?.column === i ? (sort.descending ? "descending" : "ascending") : undefined}
                      className={cn("xl-cell xl-header", i === 0 && "xl-freeze xl-freeze-top", selRow === 0 && selCol === i && "xl-selected")}
                      onClick={() => { setSelected([0, i]); setSort(sort?.column === i ? { column: i, descending: !sort.descending } : { column: i, descending: false }); }}
                      style={{ textAlign: column.align }}>
                      <span className="inline-flex items-center gap-1">
                        {column.header}
                        {sort?.column === i ? (sort.descending ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />) : null}
                      </span>
                    </td>
                  ))}
                </tr>
                {rows.map((row, r) => (
                  <tr key={r} role="row">
                    <th className={cn("xl-rowhead", selRow === r + 1 && "xl-rowhead-on")} aria-hidden>{r + 2}</th>
                    {row.map((cell, c) => (
                      <td key={c} data-cell={`${r + 1}-${c}`} role="gridcell" onClick={() => setSelected([r + 1, c])}
                        className={cn("xl-cell", c === 0 && "xl-freeze", cell.className, selRow === r + 1 && selCol === c && "xl-selected")}
                        style={{ textAlign: cell.align, ...cell.style }} title={cell.node ? cell.text : undefined}>
                        {cell.node ?? cell.text}
                      </td>
                    ))}
                  </tr>
                ))}
                {!rows.length ? (
                  <tr><th className="xl-rowhead" aria-hidden>2</th><td className="xl-cell xl-dim" colSpan={sheet.columns.length}>
                    {data ? "No fares match these filters." : "No fares yet: the first update runs with the next daily scrape."}
                  </td></tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <nav className="xl-tabs" aria-label="Sheets">
            {sheets.map((item) => (
              <button key={item.id} onClick={() => chooseSheet(item.id)} aria-pressed={sheet.id === item.id} className={cn("xl-tab", sheet.id === item.id && "xl-tab-on")}>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="xl-status">
            <span className="truncate">{sheet.note ?? "Ready"}</span>
            {stats ? (
              <span className="ml-auto shrink-0 tabular-nums">
                Average: {isMoney ? money(stats.average) : stats.average.toFixed(1)} · Min: {isMoney ? money(stats.min) : stats.min} · Count: {stats.count}
              </span>
            ) : null}
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Fares: Travelpayouts (Aviasales) cached search results{data?.google.length ? "; buy-now levels: Google Flights" : ""}. Prices are indicative and in Malaysian ringgit;
          confirm on the airline or booking site before paying. Tip: click a cell, then use the arrow keys; click a header to sort.
        </p>
      </main>
    </div>
  );
}
