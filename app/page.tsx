import { Dashboard } from "@/components/dashboard";
import { getEvents } from "@/lib/events";
import { HeroStats } from "@/components/hero";

import { filterEvents, malaysiaDay } from "@/lib/filter-events";
import { eventRegion, REGIONS } from "@/lib/regions";
import { getResources } from "@/lib/load-resources";
import { getFlights } from "@/lib/load-flights";
import { money } from "@/lib/flights";

function teasers() {
  const today = malaysiaDay();
  const open = getResources().resources.filter((row) => row.always_open || !row.deadline || row.deadline >= today).length;
  const flights = getFlights();
  const focus = flights?.calendars.find((calendar) => calendar.id === flights.focus);
  const cheapest = focus?.days.reduce<[string, number] | null>((best, row) => (!best || row[1] < best[1] ? [row[0], row[1]] : best), null);
  return {
    resources: open ? `${open} open scholarships, internships and tools` : "Scholarships, internships and free tools",
    flights: cheapest ? `KL ⇄ London return from ${money(cheapest[1])}` : "Cheapest KL ⇄ London fares by date",
  };
}

export default function Home() {
  const { events, generatedAt, sources } = getEvents();

  const today = malaysiaDay();
  const todayCount = filterEvents(events, "", "all", "all", "today").length;
  const thisWeekCount = filterEvents(events, "", "all", "all", "week").length;

  const stats: HeroStats = {
    total: events.length,
    sources: sources.length,
    today: todayCount,
    thisWeek: thisWeekCount,
    generatedAt,
  };

  // JSON-LD Event structured data for Google rich results (top 25 upcoming)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: events
      .filter((e) => e.date && e.date >= today && eventRegion(e) !== 'unknown')
      .slice(0, 25)
      .map((e, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Event",
          name: e.name,
          startDate: e.time ? `${e.date}T${e.time}:00+08:00` : e.date,
          url: e.link,
          isAccessibleForFree: true,
          eventStatus: "https://schema.org/EventScheduled",
          location: eventRegion(e) === 'online' ? {
            "@type": "VirtualLocation",
            url: e.link,
          } : {
            "@type": "Place",
            name: e.venue || REGIONS[eventRegion(e)],
            address: { "@type": "PostalAddress", addressRegion: REGIONS[eventRegion(e)], addressCountry: "MY" },
          },
          ...(e.image.startsWith("https://") ? { image: e.image } : {}),
        },
      })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <Dashboard events={events} stats={stats} teasers={teasers()} />
    </>
  );
}
