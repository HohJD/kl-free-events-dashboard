# Development checks

## Current product scope (October 8)

- **Students Repo**: a hub for uni students in Malaysia. Two sections, desktop header pill nav and a floating phone tab bar (`components/site-header.tsx`, `lib/site.ts`):
  - `/` **Discover**: events, hackathons, scholarships, internships, graduate roles and free tools in one list (`lib/opportunities.ts`). Events are always limited to student-relevant ones (`forStudents` in `lib/event-discovery.ts`: focus categories, minus parent/homeowner/kid listings); there is no "everything" toggle and no source filter. Sticky type tabs + toolbar (search, date, sort, location, tracked-only, list/map); phones move date/location/sort into the Filters sheet. The list renders 24 cards at a time and loads more on scroll.
  - `/saved` **My tracker**: tracked items with status Interested → Applied/going → Done, an "Up next" countdown strip, and "Export to calendar" (.ics with alerts, `buildIcs` in `lib/calendar.ts`).
- Tracking: `lib/use-saved.ts` (localStorage `free-things-saved-v1`, unchanged key so old saves survive) now stores `status`, `date`, `endDate`, `time`, `isDeadline`, `place`, `label`. Tracking from a card shows a toast with "Remind me" (Google Calendar template link via `reminderUrl`, no OAuth).
- Design tokens live in `globals.css`: `--brand`/`--brand-2` gradient, lime `--accent`, per-kind hue via `kindStyle()` (`--kind`, `--kind-h`), `.card`, `.pill`/`.pill-hot`, `.kind-badge`, `.chip`, `.btn*`, `.field`, `.stat`. Cards are flat at rest and lift on hover.
- Publish only quality-version-2 event records with explicit free-admission evidence. Eligibility must be confirmed on the source, not inferred from the audience focus.
- Deploys: `vercel --prod` from this folder (the Hermes job does it daily). `.vercelignore` keeps local `.next`/`dist` out of the upload; a stale build once shipped mismatched next/font class names (serif fallback), so use `--force` if fonts look wrong.

- Run `npm run lint`, `npx tsc --noEmit`, `npx tsx scripts/test-filter-events.ts`, and `npm run build` for changes to the dashboard. `tsx` is pinned as a dev dependency.
- Static export uses `dist/`. Do not run a development server and production build concurrently against that directory.
- UI browser checks: build, serve `dist/` on localhost:3100, then run `node scripts/test-layout.mjs` and `node scripts/test-site.mjs` (uses installed Google Chrome through pinned Playwright). It tests 320/375/390/768/1440px in light/dark, mocks Supabase/image responses with synthetic fixtures, checks overflow/alignment/action rows and navigation, and writes screenshots to the OS temp directory. Override `TEST_URL` or `SCREENSHOT_DIR` as needed. It performs no real uploads or database writes.
- Layout conventions: `.page-shell` is the shared horizontal gutter/container; `.section-heading`, `.listing-card`, `.listing-body`, `.listing-title`, and `.listing-actions` live in `app/globals.css`. Keep the soft poster visual style, and 44px primary touch controls.
- The scraper is maintained separately at `/Users/hohjiada/kl-free-events-scraper`. Its offline regression suite is `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest -v test_kl_events_scraper`.
- Event state slugs are serialized in `events.json`. Missing state is `unknown`, never assume Kuala Lumpur. The navbar state selector affects events only, not user-uploaded items.
- Date filtering uses Asia/Kuala_Lumpur irrespective of visitor/server timezone. Undated entries must not match Today or Upcoming. Stale carried-forward source results expire after 48 hours.
- Hermes uses `~/.hermes/scripts/kl_events_update.sh` at 10:00–14:00 MYT, once per hour until success. `--force` explicitly bypasses today's success marker. Preserve live data on failed scrapes. Latest operational logs and source health are in the scraper directory, not the public site.
- Do not equate a source's successful HTTP response or a free search-page label with independently verified free public admission.
