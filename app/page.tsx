import { Dashboard } from "@/components/dashboard";
import { getEvents } from "@/lib/events";
import { getItems } from "@/lib/items";
import { HeroStats } from "@/components/hero";

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

export default function Home() {
  const { events, generatedAt, sources } = getEvents();

  const today = toLocalDate(new Date());
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);

  const todayCount = events.filter((e) => {
    if (!e.date) return false;
    const d = toLocalDate(dateFromIso(e.date));
    return isSameDay(d, today);
  }).length;

  const thisWeekCount = events.filter((e) => {
    if (!e.date) return false;
    const d = toLocalDate(dateFromIso(e.date));
    return d >= today && d < weekEnd;
  }).length;

  const stats: HeroStats = {
    total: events.length,
    sources: sources.length,
    today: todayCount,
    thisWeek: thisWeekCount,
    generatedAt,
  };

  return <Dashboard events={events} stats={stats} items={getItems()} />;
}
