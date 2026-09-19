export type Advice = 'Buy' | 'Wait' | 'Typical';

export interface FareRow {
  route: string;
  trip: string;
  depart_date: string;
  return_date: string;
  weekday: string;
  price: number;
  stops: number | null;
  found_at: string;
  days_out: number;
  change_7d: number | null;
  lowest_seen: number;
  checks: number;
  trend: [string, number][];
  google_level: string;
  advice: Advice;
  reason: string;
}

export interface MonthCell {
  route: string;
  trip: string;
  month: string;
  price: number;
  depart_date: string;
  return_date: string;
  advice: Advice;
}

export interface GoogleInsight {
  route: string;
  trip: string;
  depart_date: string;
  return_date: string;
  lowest_price: number | null;
  price_level: string;
  typical_low: number | null;
  typical_high: number | null;
  history: [string, number][];
  airline: string;
  stops: number | null;
  duration_minutes: number | null;
  google_url: string;
}

export interface FlightData {
  generated_at: string;
  currency: string;
  routes: { id: string; label: string; origin: string; destination: string }[];
  trips: string[];
  rows: FareRow[];
  summary: MonthCell[];
  google: GoogleInsight[];
  tracking_since: string;
}

export function tripLabel(trip: string): string {
  if (trip === 'one-way') return 'One-way';
  const days = Number(trip.split('-')[1]);
  return `Return · ${days / 7} weeks`;
}

export function money(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? `RM ${Math.round(value).toLocaleString('en-MY')}` : '';
}

export function shortDate(value: string): string {
  const stamp = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(stamp)) return value;
  return new Date(stamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', timeZone: 'UTC' });
}

export function monthLabel(value: string): string {
  const stamp = Date.parse(`${value}-01T00:00:00Z`);
  return Number.isFinite(stamp) ? new Date(stamp).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }) : value;
}

/** Spreadsheet column letters: 0 -> A, 25 -> Z, 26 -> AA. */
export function columnLetter(index: number): string {
  let label = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) label = String.fromCharCode(65 + ((n - 1) % 26)) + label;
  return label;
}

/** Excel-style 3-colour scale position (0 = cheapest, 1 = dearest) within a set. */
export function scalePosition(value: number, values: number[]): number {
  const finite = values.filter(Number.isFinite);
  if (!finite.length) return 0.5;
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  return max === min ? 0 : (value - min) / (max - min);
}
