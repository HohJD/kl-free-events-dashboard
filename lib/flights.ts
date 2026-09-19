export type AdviceCode = 'B' | 'W' | 'T';

/** [depart, price, change_7d, lowest_seen, checks, advice] as written by the scraper. */
export type DayRow = [string, number, number | null, number, number, AdviceCode];

export interface Calendar {
  id: string;
  route: string;
  stay: number | null;
  fresh: boolean;
  days: DayRow[];
  index: [string, number, number][];
}

export interface LegDetail {
  airline: string;
  stops: number | null;
  via: string;
  depart_time: string;
  arrive_time: string;
  arrive_day_offset: number;
  airport: string;
  duration_minutes: number | null;
}

export interface TripDetail {
  price: number;
  out: LegDetail;
  back: LegDetail | null;
  checked_on: string;
}

export interface FlightData {
  version: 2;
  generated_at: string;
  today: string;
  currency: string;
  routes: { id: string; label: string; origin: string; destination: string }[];
  focus: string;
  calendars: Calendar[];
  details: Record<string, TripDetail>;
  tracking_since: string;
  coverage: { requests: number; stopped: boolean; seconds: number };
}

export interface Day {
  date: string;
  price: number;
  change7d: number | null;
  lowestSeen: number;
  checks: number;
  advice: AdviceCode;
  returnDate: string;
}

export const ADVICE_TEXT: Record<AdviceCode, string> = { B: 'Good to book', W: 'Wait', T: 'Typical' };

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
}

export function toDays(calendar: Calendar | undefined): Day[] {
  if (!calendar) return [];
  return calendar.days.map(([date, price, change7d, lowestSeen, checks, advice]) => ({
    date, price, change7d, lowestSeen, checks, advice,
    returnDate: calendar.stay ? addDays(date, calendar.stay) : '',
  }));
}

export function stayLabel(stay: number | null, short = false): string {
  if (!stay) return 'One-way';
  if (stay % 7 === 0) return short ? `${stay / 7} wk${stay > 7 ? 's' : ''}` : `${stay / 7} week${stay > 7 ? 's' : ''}`;
  return `${stay} days`;
}

export function money(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? `RM ${Math.round(value).toLocaleString('en-MY')}` : '';
}

export function plain(value: number): string {
  return Math.round(value).toLocaleString('en-MY');
}

export function dayLabel(value: string, options: { year?: boolean; weekday?: boolean } = {}): string {
  const stamp = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(stamp)) return value;
  return new Date(stamp).toLocaleDateString('en-GB', {
    ...(options.weekday === false ? {} : { weekday: 'short' }), day: 'numeric', month: 'short',
    ...(options.year ? { year: 'numeric' } : {}), timeZone: 'UTC',
  });
}

export function monthLabel(value: string, short = false): string {
  const stamp = Date.parse(`${value.slice(0, 7)}-01T00:00:00Z`);
  return Number.isFinite(stamp)
    ? new Date(stamp).toLocaleDateString('en-GB', short ? { month: 'short', timeZone: 'UTC' } : { month: 'long', year: 'numeric', timeZone: 'UTC' })
    : value;
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

/** 0..steps-1 bucket of a fare between the cheapest and dearest of a set. */
export function priceStep(value: number, values: number[], steps = 7): number {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return max === min ? 0 : Math.min(steps - 1, Math.floor(((value - min) / (max - min)) * steps));
}

/** Cheaper departures within `range` days either side of a date. */
export function nearbyCheaper(days: Day[], date: string, range = 3): Day | null {
  const current = days.find((day) => day.date === date);
  if (!current) return null;
  const options = days.filter((day) => day.date !== date && Math.abs(daysBetween(date, day.date)) <= range && day.price < current.price);
  return options.sort((a, b) => a.price - b.price || Math.abs(daysBetween(date, a.date)) - Math.abs(daysBetween(date, b.date)))[0] ?? null;
}

/** One-line answer to "should I book now?" for a calendar. */
export function bookingOutlook(days: Day[], index: [string, number, number][]): { advice: AdviceCode; headline: string; detail: string } {
  if (!days.length) return { advice: 'T', headline: 'No fares yet', detail: 'The first check is still running.' };
  if (index.length >= 7) {
    const recent = index[index.length - 1][1];
    const weekAgo = index[index.length - 7][1];
    const change = (recent - weekAgo) / weekAgo;
    if (change >= 0.05) return { advice: 'B', headline: 'Fares are rising', detail: `Typical fare up ${Math.round(change * 100)}% this week. Book sooner rather than later.` };
    if (change <= -0.05) return { advice: 'W', headline: 'Fares are falling', detail: `Typical fare down ${Math.round(-change * 100)}% this week. Worth watching a few more days.` };
  }
  const good = days.filter((day) => day.advice === 'B').length;
  if (good / days.length >= 0.3) return { advice: 'B', headline: 'Good time to book', detail: `${good} of ${days.length} dates are at their lowest seen.` };
  return { advice: 'T', headline: 'Fares are steady', detail: 'Pick the green dates; book once your plans are fixed.' };
}

export function googleFlightsLink(origin: string, destination: string, depart: string, returnDate: string): string {
  const query = `Flights from ${origin} to ${destination} on ${depart}${returnDate ? ` returning ${returnDate}` : ' one way'}`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(query).replace(/%20/g, '+')}`;
}
