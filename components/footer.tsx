import { SITE_FULL_NAME } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-border/60 py-8">
      <div className="page-shell flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p><span className="font-medium text-foreground">{SITE_FULL_NAME}</span> · updated daily, always free</p>
        <p>Confirm details with the organiser before you go.</p>
      </div>
    </footer>
  );
}
