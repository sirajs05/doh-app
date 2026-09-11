# Doh-App

A SvelteKit + TypeScript starter wired up for a Neon Postgres database via Drizzle ORM.

## Why you need to run `npm install` yourself

This project's files were generated for you, but `npm install` could not be run
from this session because this account's network settings block
`registry.npmjs.org`. Nothing here has actually been installed yet.

## Setup

1. Open this folder in VS Code (it should already be open, since it's your
   `Doh-App` folder).
2. Open a terminal in VS Code (`` Ctrl+` ``) and run:

   ```bash
   npm install
   ```

3. Create a free Postgres database at [neon.com](https://neon.com), copy the
   connection string from the dashboard, and paste it into `.env`:

   ```bash
   DATABASE_URL="postgresql://user:password@ep-xxxx.region.aws.neon.tech/dbname?sslmode=require"
   ```

4. Push the schema (in `src/lib/server/db/schema.ts`) to your database:

   ```bash
   npm run db:push
   ```

5. Start the dev server:

   ```bash
   npm run dev -- --open
   ```

   The home page calls `/api/health`, which runs `select 1` against your
   database — if it says "connected to Neon", the wiring works.

## Project structure

```
src/
  app.html                     entry HTML shell
  app.d.ts                     ambient TypeScript types
  routes/
    +page.svelte               home page (pings /api/health)
    api/health/+server.ts       simple DB connectivity check
  lib/
    server/
      db/
        index.ts               getDb() — lazy Drizzle client (Neon HTTP driver)
        schema.ts               table definitions
drizzle.config.ts               drizzle-kit config (used by npm run db:push)
```

## Adding tables

Edit `src/lib/server/db/schema.ts`, then run `npm run db:push` again to sync
the change to Neon. Query them from any `+page.server.ts` or `+server.ts` via:

```ts
import { getDb } from '$lib/server/db';
import { items } from '$lib/server/db/schema';

const rows = await getDb().select().from(items);
```

## Deploying

`@sveltejs/adapter-auto` is already configured, so pushing this to a GitHub
repo and importing it into Vercel should just work — just add `DATABASE_URL`
as an environment variable in the Vercel project settings.
