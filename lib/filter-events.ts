import { Event } from "./events";

export type DateRange =
  | "all"
  | "today"
  | "tomorrow"
  | "week"
  | "month"
  | "upcoming"
  | "past";

function toLocalDate(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function dateFromIso(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function filterEvents(
  events: Event[],
  query: string,
  source: string,
  category: string,
  dateRange: DateRange
): Event[] {
  const q = query.trim().toLowerCase();
  const today = toLocalDate(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);

  return events
    .filter((e) => {
      if (!e.date) return true;
      const d = toLocalDate(dateFromIso(e.date));
      switch (dateRange) {
        case "today":
          return isSameDay(d, today);
        case "tomorrow":
          return isSameDay(d, tomorrow);
        case "week":
          return d >= today && d < weekEnd;
        case "month":
          return (
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth()
          );
        case "upcoming":
          return d >= today;
        case "past":
          return d < today;
        default:
          return true;
      }
    })
    .filter((e) => (source === "all" ? true : e.source === source))
    .filter((e) => (category === "all" ? true : e.category === category))
    .filter((e) => {
      if (!q) return true;
      const text =
        `${e.name} ${e.venue} ${e.description} ${e.category}`.toLowerCase();
      return text.includes(q);
    })
    .sort((a, b) => {
      const da = a.date || "9999-99-99";
      const db = b.date || "9999-99-99";
      if (da !== db) return da.localeCompare(db);
      return a.name.localeCompare(b.name);
    });
}
