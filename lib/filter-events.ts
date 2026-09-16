import type { Event } from "./events";

export type DateRange =
  | "all"
  | "today"
  | "tomorrow"
  | "week"
  | "month"
  | "upcoming"
  | "past";

export function malaysiaDay(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)!.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function filterEvents(
  events: Event[],
  query: string,
  source: string,
  category: string,
  dateRange: DateRange,
  now = new Date()
): Event[] {
  const q = query.trim().normalize('NFKC').toLowerCase();
  const today = malaysiaDay(now);
  const start = Date.parse(`${today}T00:00:00Z`);
  const tomorrow = new Date(start + 86400000).toISOString().slice(0, 10);
  const weekEnd = new Date(start + 7 * 86400000).toISOString().slice(0, 10);

  return events
    .filter((e) => {
      if (e.stale && (!e.checked_at || !Number.isFinite(Date.parse(e.checked_at)) || now.getTime() - Date.parse(e.checked_at) > 48 * 3600000)) return false;
      const date = e.date;
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return dateRange === 'all';
      const timestamp = Date.parse(`${date}T00:00:00Z`);
      if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== date) return false;
      const end = e.end_date || date;
      const endStamp = Date.parse(`${end}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(end) || !Number.isFinite(endStamp) || new Date(endStamp).toISOString().slice(0, 10) !== end || end < date) return false;
      switch (dateRange) {
        case "today": return date <= today && end >= today;
        case "tomorrow": return date <= tomorrow && end >= tomorrow;
        case "week": return end >= today && date < weekEnd;
        case "month": return end >= today && date.slice(0, 7) <= today.slice(0, 7);
        case "upcoming": return end >= today;
        case "past": return end < today;
        default: return true;
      }
    })
    .filter((e) => source === "all" || e.source === source)
    .filter((e) => category === "all" || e.category === category)
    .filter((e) => !q || `${e.name} ${e.venue} ${e.description} ${e.category}`.normalize('NFKC').toLowerCase().includes(q))
    .sort((a, b) => {
      const dateOrder = (a.date || '9999-99-99').localeCompare(b.date || '9999-99-99');
      return dateOrder || a.name.localeCompare(b.name);
    });
}
