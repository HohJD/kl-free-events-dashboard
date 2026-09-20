import { Opportunities } from "@/components/opportunities";
import { getEvents } from "@/lib/events";
import { getResources } from "@/lib/load-resources";
import { eventRegion, REGIONS } from "@/lib/regions";

export default function Home() {
  const { events, generatedAt, sources } = getEvents();
  const { resources } = getResources();

  // JSON-LD for Google rich results (next 25 dated, located events).
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: events
      .filter((e) => e.date && eventRegion(e) !== "unknown")
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
          location: eventRegion(e) === "online"
            ? { "@type": "VirtualLocation", url: e.link }
            : {
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <Opportunities events={events} resources={resources} generatedAt={generatedAt.toISOString()} sources={sources.length} />
    </>
  );
}
