import { CalendarDays, Gift, Plane, type LucideIcon } from "lucide-react";

export const SITE_NAME = "Free Things Malaysia";

export interface Section {
  href: string;
  label: string;
  short: string;
  icon: LucideIcon;
  blurb: string;
}

/** The four sections, in navigation order. */
export const SECTIONS: Section[] = [
  { href: "/", label: "Opportunities", short: "Opportunities", icon: CalendarDays, blurb: "Events, hackathons, scholarships, internships and free tools" },
  { href: "/free-items", label: "Free items", short: "Free items", icon: Gift, blurb: "Things people are giving away near you" },
  { href: "/flights", label: "Flight deals", short: "Flights", icon: Plane, blurb: "Cheapest KL ⇄ London fares for every date" },
];

/** The section a path belongs to; "" for pages outside the four sections. */
export function activeSection(pathname: string): string {
  const match = SECTIONS.filter((section) => section.href !== "/" && pathname.startsWith(section.href));
  if (match[0]) return match[0].href;
  return pathname === "/" ? "/" : "";
}
