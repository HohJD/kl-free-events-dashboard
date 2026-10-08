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

export interface Reminder {
  title: string;
  /** YYYY-MM-DD */
  date: string;
  endDate?: string;
  time?: string;
  place?: string;
  link: string;
  /** Deadlines become an all-day "Deadline:" entry rather than the event itself. */
  isDeadline?: boolean;
}

const compact = (date: string) => date.replace(/-/g, "");
const nextDay = (date: string) => new Date(Date.parse(`${date}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
const validDay = (date?: string) => !!date && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(`${date}T00:00:00Z`));

/** Google Calendar "add event" link for anything with a date: no sign-in or API key needed. */
export function reminderUrl(item: Reminder): string | null {
  if (!validDay(item.date)) return null;
  const end = validDay(item.endDate) && item.endDate! > item.date ? item.endDate! : item.date;
  let dates = `${compact(item.date)}/${compact(nextDay(end))}`;
  if (!item.isDeadline && item.time && /^\d{2}:\d{2}$/.test(item.time) && end === item.date) {
    const [hh, mm] = item.time.split(":").map(Number);
    const endH = Math.min(hh + 2, 23);
    dates = `${compact(item.date)}T${pad(hh)}${pad(mm)}00/${compact(item.date)}T${pad(endH)}${pad(endH === 23 ? 59 : mm)}00`;
  }
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: item.isDeadline ? `Deadline: ${item.title}` : item.title,
    dates,
    details: item.isDeadline ? `Applications close today. Apply here:\n${item.link}` : item.link,
    ctz: "Asia/Kuala_Lumpur",
  });
  if (item.place && !item.isDeadline) params.set("location", item.place);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function icsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (match) => `\\${match}`);
}

/** One .ics file for every dated item, with alerts: 3 days before deadlines, 1 day before events. */
export function buildIcs(items: (Reminder & { id: string })[], now = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Student Repo by ATH//Tracker//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Student Repo tracker"];
  for (const item of items) {
    if (!validDay(item.date)) continue;
    const end = validDay(item.endDate) && item.endDate! > item.date ? item.endDate! : item.date;
    let uid = 0;
    for (const char of item.id) uid = (uid * 31 + char.charCodeAt(0)) >>> 0;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid.toString(36)}-${compact(item.date)}@free-things-malaysia`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(item.date)}`,
      `DTEND;VALUE=DATE:${compact(nextDay(end))}`,
      `SUMMARY:${icsText(item.isDeadline ? `Deadline: ${item.title}` : item.title)}`,
      `DESCRIPTION:${icsText(item.link)}`,
      `URL:${item.link}`,
      ...(item.place && !item.isDeadline ? [`LOCATION:${icsText(item.place)}`] : []),
      "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsText(item.title)}`, `TRIGGER:-P${item.isDeadline ? 3 : 1}D`, "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
