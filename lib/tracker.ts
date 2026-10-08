import type { SavedEntry } from "./use-saved";
import { statusOf } from "./use-saved";

/** Whole days from `today` to `date` (both YYYY-MM-DD); negative when past. */
export function daysUntil(date: string, today: string): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
}

const lastDay = (row: SavedEntry) => (row.endDate && row.date && row.endDate > row.date ? row.endDate : row.date!);

/** The soonest dated thing still ahead (or happening today) that isn't done. */
export function nextUp(rows: SavedEntry[], today: string): SavedEntry | null {
  return rows
    .filter((row) => row.date && statusOf(row) !== "done" && lastDay(row) >= today)
    .sort((a, b) => a.date!.localeCompare(b.date!))[0] ?? null;
}

/** Short countdown copy for a tracked item. */
export function countdown(row: SavedEntry, today: string): { text: string; hot: boolean } | null {
  if (!row.date) return null;
  const days = daysUntil(row.date, today);
  if (row.isDeadline) {
    if (days < 0) return { text: "Closed", hot: false };
    if (days === 0) return { text: "Closes today", hot: true };
    return { text: `Closes in ${days}d`, hot: days <= 7 };
  }
  if (lastDay(row) < today) return { text: "Past", hot: false };
  if (days <= 0) return { text: "Today", hot: true };
  if (days === 1) return { text: "Tomorrow", hot: true };
  return { text: `In ${days}d`, hot: days <= 7 };
}
