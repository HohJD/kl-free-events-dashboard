import { CalendarDays, Gift, GraduationCap, Plane, type LucideIcon } from "lucide-react";

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
  { href: "/", label: "Events", short: "Events", icon: CalendarDays, blurb: "Free tech, startup and career events across Malaysia" },
  { href: "/resources", label: "Student resources", short: "Resources", icon: GraduationCap, blurb: "Scholarships, internships, grad roles and free tools" },
  { href: "/free-items", label: "Free items", short: "Free items", icon: Gift, blurb: "Things people are giving away near you" },
  { href: "/flights", label: "Flight deals", short: "Flights", icon: Plane, blurb: "Cheapest KL ⇄ London fares for every date" },
];

export function activeSection(pathname: string): string {
  const match = SECTIONS.filter((section) => section.href !== "/" && pathname.startsWith(section.href));
  return match[0]?.href ?? "/";
}
