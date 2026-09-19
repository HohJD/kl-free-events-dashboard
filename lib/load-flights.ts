import fs from 'fs';
import path from 'path';
import type { FlightData } from './flights';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Reads flights.json (version 2) written by the scraper; null until the first run. */
export function getFlights(): FlightData | null {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'flights.json'), 'utf8')) as FlightData;
    if (raw.version !== 2 || !Array.isArray(raw.calendars) || !Array.isArray(raw.routes)) return null;
    const calendars = raw.calendars
      .map((calendar) => ({
        ...calendar,
        days: (Array.isArray(calendar.days) ? calendar.days : []).filter((row) => DATE.test(row[0]) && Number.isFinite(row[1]) && row[1] > 0),
        index: Array.isArray(calendar.index) ? calendar.index : [],
      }))
      .filter((calendar) => calendar.days.length);
    if (!calendars.length) return null;
    return { ...raw, calendars, details: raw.details && typeof raw.details === 'object' ? raw.details : {} };
  } catch {
    return null;
  }
}
