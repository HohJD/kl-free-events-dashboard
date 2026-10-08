import { Compass, ListChecks, type LucideIcon } from "lucide-react";

export const SITE_NAME = "Students Repo";

export interface Section {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Navigation order: discover things, then track them. */
export const SECTIONS: Section[] = [
  { href: "/", label: "Discover", icon: Compass },
  { href: "/saved", label: "My tracker", icon: ListChecks },
];

/** The section a path belongs to; "" for pages outside the main sections. */
export function activeSection(pathname: string): string {
  if (pathname === "/") return "/";
  return pathname.startsWith("/saved") ? "/saved" : "";
}
