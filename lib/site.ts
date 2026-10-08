import { CalendarDays, type LucideIcon } from "lucide-react";

export const SITE_NAME = "Free Things Malaysia";

export interface Section {
  href: string;
  label: string;
  short: string;
  icon: LucideIcon;
  blurb: string;
}

/** The single section, in navigation order. */
export const SECTIONS: Section[] = [
  { href: "/", label: "Opportunities", short: "Opportunities", icon: CalendarDays, blurb: "Events, hackathons, scholarships, internships and free tools" },
];

/** The section a path belongs to; \"\" for pages outside the main section. */
export function activeSection(pathname: string): string {
  if (pathname === "/") return "/";
  return pathname.startsWith("/saved") ? "/saved" : "";
}
