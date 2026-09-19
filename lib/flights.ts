export type Advice = 'Buy' | 'Wait' | 'Typical';

export interface FareRow {
  route: string;
  trip: string;
  depart_date: string;
  return_date: string;
  price: number;
  airline: string;
  stops: number | null;
  via: string;
  duration_minutes: number | null;
  arrive_airport: string;
  options: number;
  google_level: string;
  link: string;
  checked_on: string;
  weekday: string;
  days_out: number;
  change_7d: number | null;
  lowest_seen: number;
  checks: number;
  trend: [string, number][];
  advice: Advice;
  reason: string;
}

export interface MonthBest {
  route: string;
  trip: string;
  month: string;
  price: number;
  depart_date: string;
  return_date: string;
  airline: string;
  advice: Advice;
}

export interface FlightData {
  generated_at: string;
  currency: string;
  routes: { id: string; label: string; origin: string; destination: string }[];
  trips: string[];
  rows: FareRow[];
  summary: MonthBest[];
  coverage: { slots: number; known: number; checked_today: number; blocked: boolean };
  tracking_since: string;
  source: string;
}

export function tripLabel(trip: string): string {
  if (trip === 'one-way') return 'One-way';
  return `Return · ${Number(trip.split('-')[1]) / 7} weeks`;
}

export function money(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? `RM ${Math.round(value).toLocaleString('en-MY')}` : '';
}

export function shortMoney(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k` : String(Math.round(value));
}

export function dayLabel(value: string, withYear = false): string {
  const stamp = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(stamp)) return value;
  return new Date(stamp).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}), timeZone: 'UTC',
  });
}

export function monthLabel(value: string): string {
  const stamp = Date.parse(`${value.slice(0, 7)}-01T00:00:00Z`);
  return Number.isFinite(stamp) ? new Date(stamp).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : value;
}

export function duration(minutes: number | null): string {
  return minutes ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : '';
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** Position 0..1 of a fare between the cheapest and dearest of a set. */
export function scalePosition(value: number, values: number[]): number {
  const finite = values.filter(Number.isFinite);
  if (!finite.length) return 0.5;
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  return max === min ? 0 : (value - min) / (max - min);
}

/** The rows for one route and trip, soonest first. */
export function selectRows(data: FlightData, route: string, trip: string): FareRow[] {
  return data.rows.filter((row) => row.route === route && row.trip === trip).sort((a, b) => a.depart_date.localeCompare(b.depart_date));
}

/** One-line answer to "should I book now?" for a set of fares. */
export function bookingOutlook(rows: FareRow[]): { advice: Advice; headline: string; detail: string } {
  if (!rows.length) return { advice: 'Typical', headline: 'No fares yet', detail: 'The first checks are still running.' };
  const buy = rows.filter((row) => row.advice === 'Buy').length;
  const wait = rows.filter((row) => row.advice === 'Wait').length;
  if (buy >= wait && buy / rows.length >= 0.3) {
    return { advice: 'Buy', headline: 'Good time to book', detail: `${buy} of ${rows.length} dates look worth booking now.` };
  }
  if (wait > buy) {
    return { advice: 'Wait', headline: 'Worth waiting', detail: `${wait} of ${rows.length} dates are above their usual fare.` };
  }
  return { advice: 'Typical', headline: 'Fares are about normal', detail: 'Book once your dates are fixed; watch the green dates.' };
}
