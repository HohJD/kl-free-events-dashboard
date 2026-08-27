import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
        Nothing free <span className="marker-highlight">here</span>
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        This page doesn&apos;t exist — but there are plenty of free events and
        giveaways waiting on the homepage.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-1 rounded-full border border-border bg-primary px-5 py-2.5 font-mono text-xs font-bold uppercase text-primary-foreground shadow-brutal-sm transition-all hover:-translate-y-px active:translate-y-0.5 active:shadow-none"
      >
        Back to Free Things
      </Link>
    </div>
  );
}
