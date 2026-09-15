import type { Event } from "./events";
import { eventRegion, REGIONS } from "./regions";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function googleCalendarUrl(event: Event): string | null {
  if (!event.date) return null;
  const [y, m, d] = event.date.split("-").map(Number);
  if (!y || !m || !d) return null;

  let dates: string;
  if (event.time) {
    const [hh, mm] = event.time.split(":").map(Number);
    const start = `${y}${pad(m)}${pad(d)}T${pad(hh || 0)}${pad(mm || 0)}00`;
    const endH = (hh || 0) + 2;
    const end =
      endH >= 24
        ? `${y}${pad(m)}${pad(d)}T235900`
        : `${y}${pad(m)}${pad(d)}T${pad(endH)}${pad(mm || 0)}00`;
    dates = `${start}/${end}`;
  } else {
    const next = new Date(y, m - 1, d + 1);
    dates = `${y}${pad(m)}${pad(d)}/${next.getFullYear()}${pad(
      next.getMonth() + 1
    )}${pad(next.getDate())}`;
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.name,
    dates,
    details: `${event.description?.slice(0, 500) || ""}\n\n${event.link}`,
    location: eventRegion(event) === 'online' ? 'Online' : [event.venue, eventRegion(event) !== 'unknown' ? REGIONS[eventRegion(event)] : ''].filter(Boolean).join(', '),
    ctz: "Asia/Kuala_Lumpur",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
