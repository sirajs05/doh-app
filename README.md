# doh

A SvelteKit + TypeScript app: a landing page, a login flow, a daily
"how are you feeling about your finances" check-in, a mock personal finance
dashboard ("Vibes"), a health-and-money tracker ("Health"), and a separate
admin view of check-in metrics. Backed by Neon Postgres via Drizzle ORM.

## Setup

```bash
npm install
npm run db:push   # pushes the full schema, including the new Health tables
npm run db:seed   # re-seeds everything from scratch
npm run dev -- --open
```

`npm run db:seed` creates:

- `test@test.com` / `password123` — a regular user, with mock accounts,
  transactions, goals, and Health-page data (conditions, an insurance plan,
  medications, appointments, flare-up history).
- `admin@doh.app` / `Admin123!` — an admin account.
- 8 additional sample users with random mood check-ins, so the admin
  dashboard's metrics aren't just one data point.

Re-running `db:seed` wipes and recreates all of the above from scratch —
anything you add through the Health page's forms (a condition, an
appointment, a flare-up, etc.) will be reset too.

## The flow

- `/` — title page (wordmark + "Enter").
- `/login` — regular user login (role `user` only).
- `/mood` — "how are you feeling about your finances today?", 5 options.
  Every login goes through this before the dashboard.
- `/vibes` (formerly `/home`) — the main dashboard: net worth, accounts, a
  bar + line chart of the last 7 days of spending (bars per day, with a
  trend line traced over the top), a few generated insights below it
  (highest-spend day, week-over-week change, top category), goals, recent
  spending by category, and recent transactions. All financial data
  here is **placeholder data seeded into the database**, not pulled from a
  real bank — swap the queries in `src/routes/vibes/+page.server.ts` when
  you have a real source.
- `/health` — conditions & allergies (add/remove), an insurance plan
  (expandable), appointments (add), medications (add), a flare-up tracker
  (log severity/symptoms/triggers/notes, with a running history and basic
  stats), and a nutrition-spend breakdown pulled from the same mock
  transactions as Vibes, compared against a monthly budget. Everything here
  is backed by real database tables and forms — it's a fully working
  feature, not a static mockup.
- `/admin/login` — a separate login, only for accounts with role `admin`.
- `/admin` — total user count, total check-ins, and mood distribution
  across everyone who's checked in. Deliberately has **no financial data**.

A top nav bar (`src/lib/components/NavBar.svelte`) links between Vibes and
Health and is shared by both pages.

## Auth

Neon's prebuilt auth (Neon Auth, built on Stack Auth) only ships official
ready-made login components for Next.js/React — there's no official
SvelteKit version. So this app uses a small hand-rolled auth system instead:
bcrypt-hashed passwords, a random session token (only its SHA-256 hash is
stored server-side) in an `httpOnly`, `sameSite=lax` cookie, read on every
request by `src/hooks.server.ts` into `event.locals.user`. Each protected
route's `+page.server.ts` checks `locals.user` itself and redirects if it's
missing or the wrong role.

## Styling

Dark theme, single font: **Fredoka**, loaded from Google Fonts in
`src/app.html` and used for both headings and body text via the
`--font-display` / `--font-body` variables in `src/app.css` (both point at
Fredoka; headings use weight 600, body text 400–500).

This replaced **Jorick**, the font from the original brand sheet. Turns out
Jorick isn't distributed on Google Fonts at all — the site's original
`fonts.googleapis.com/css2?family=Jorick` link never actually served
anything, so the app had silently been falling back to a generic serif the
whole time it "used" Jorick. Fredoka is a similarly bold, rounded, friendly
display face that's actually available and legible at small sizes (the
8–10px uppercase labels scattered around the UI). `static/fonts/README.md`
has notes on self-hosting a real Jorick file later if you get your hands on
one (e.g. exported from a Canva brand kit).

Color tokens (purple, blue, green, gold, on a near-black background) live
in `src/app.css` as CSS custom properties.

## Project structure

```
src/
  app.html                     font + HTML shell
  app.css                      design tokens, base styles, .card/.btn/.label
  app.d.ts                     Locals.user type
  hooks.server.ts              attaches the logged-in user to every request
  lib/
    moods.ts                   the 5 mood options (shared by /mood and /admin)
    components/
      NavBar.svelte            top nav shared by /vibes and /health
    server/
      auth.ts                  password hashing + session cookies
      db/
        index.ts               getDb() — lazy Drizzle client (Neon HTTP driver)
        schema.ts               users, sessions, mood_entries, mock_*, health_* tables
        seed.ts                 npm run db:seed
  routes/
    +page.svelte               title page
    login/                     user login
    mood/                      daily check-in
    vibes/                     main dashboard (mock data + chart + insights)
    health/                    health-and-money tracker (fully interactive)
    logout/+server.ts          POST to clear the session
    admin/
      login/                   admin login
      +page.svelte             admin metrics dashboard
```
