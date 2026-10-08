import { SITE_NAME } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-8 sm:py-10">
      <div className="page-shell">
        <p className="font-display text-base font-bold">{SITE_NAME}</p>
        <p className="mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
          A self-updating board of free opportunities for students and young people in Malaysia. Events, scholarships
          and internships are collected every day from Eventbrite, Luma, AllEvents, Devpost, Google Developer Groups,
          MLH, Afterschool.my and Hiredly. Always confirm details with the organiser or provider.
        </p>
      </div>
    </footer>
  );
}
