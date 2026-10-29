/** Which country's data the discover page shows. `?edition=uk` switches. */
export type Edition = "my" | "uk";

export interface EditionConfig {
  label: string;
  /** Two-letter chip label. */
  short: string;
  /** IANA timezone for "today" boundaries (the scraper's display tz). */
  timezone: string;
  /** Location dropdown's no-filter option. */
  allLabel: string;
  /** Hero tagline. */
  tagline: string;
}

export const EDITIONS: Record<Edition, EditionConfig> = {
  my: {
    label: "Malaysia",
    short: "MY",
    timezone: "Asia/Kuala_Lumpur",
    allLabel: "All of Malaysia",
    tagline: "Events, funding, careers and free tools. Your next opportunity in Malaysia starts here.",
  },
  uk: {
    label: "United Kingdom",
    short: "UK",
    timezone: "Europe/London",
    allLabel: "All of the UK",
    tagline: "Free events in Oxford & nearby, UK career opportunities and tools for your next idea. All times are UK local.",
  },
};

export function editionOf(value: string | null | undefined): Edition {
  return value === "uk" ? "uk" : "my";
}
