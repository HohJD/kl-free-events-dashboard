import fs from 'fs';
import path from 'path';
import type { FlightData } from './flights';

function googleFlightsUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'www.google.com' && url.pathname.startsWith('/travel/flights') ? value : '';
  } catch {
    return '';
  }
}

/** Reads flights.json written by the scraper; null until the first run. */
export function getFlights(): FlightData | null {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'flights.json'), 'utf8')) as FlightData;
    const rows = (Array.isArray(raw.rows) ? raw.rows : [])
      .filter((row) => Number.isFinite(row.price) && /^\d{4}-\d{2}-\d{2}$/.test(row.depart_date))
      .map((row) => ({ ...row, link: googleFlightsUrl(row.link), trend: Array.isArray(row.trend) ? row.trend : [] }));
    if (!rows.length || !Array.isArray(raw.routes) || !Array.isArray(raw.trips)) return null;
    return { ...raw, rows, summary: Array.isArray(raw.summary) ? raw.summary : [] };
  } catch {
    return null;
  }
}
