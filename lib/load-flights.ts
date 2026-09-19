import fs from 'fs';
import path from 'path';
import type { FlightData } from './flights';

function httpsUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  try {
    return new URL(value).protocol === 'https:' ? value : '';
  } catch {
    return '';
  }
}

/** Reads flights.json written by the scraper; null until the first run with an API key. */
export function getFlights(): FlightData | null {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'flights.json'), 'utf8')) as FlightData;
    if (!Array.isArray(raw.rows) || !raw.rows.length) return null;
    return {
      ...raw,
      rows: raw.rows.filter((row) => Number.isFinite(row.price) && /^\d{4}-\d{2}-\d{2}$/.test(row.depart_date)),
      summary: Array.isArray(raw.summary) ? raw.summary : [],
      google: (Array.isArray(raw.google) ? raw.google : []).map((item) => ({ ...item, google_url: httpsUrl(item.google_url) })),
    };
  } catch {
    return null;
  }
}
