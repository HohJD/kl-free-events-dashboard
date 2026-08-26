import { getEvents } from "../lib/events";

const { events } = getEvents();
const byCategory: Record<string, string[]> = {};
for (const e of events) {
  (byCategory[e.category] ||= []).push(e.name.slice(0, 70));
}
for (const [cat, names] of Object.entries(byCategory).sort(
  (a, b) => b[1].length - a[1].length
)) {
  console.log(`\n=== ${cat} (${names.length}) ===`);
  for (const n of names) console.log("  -", n);
}
