import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="text-7xl font-semibold tracking-tighter text-muted-foreground">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">This page skipped class</h1>
      <p className="mt-3 max-w-sm text-muted-foreground">It doesn&apos;t exist. The good stuff is on the home page.</p>
      <Link href="/" className="btn btn-primary btn-lg mt-8">Back to Students Repo</Link>
    </main>
  );
}
