# iLocal

Mobile-first Beijing local discovery and personal activity planning MVP.

## Current Stack

- React + Vite web app
- Supabase-ready data layer
- Beijing demo fallback data when Supabase env vars are not configured
- Supabase SQL migration with RLS and explicit Data API grants
- Explore, Saved, Admin Import, Profile starter screens

## Local Setup

```bash
pnpm install
cp .env.example .env.local
pnpm run dev
```

Then open:

```text
http://127.0.0.1:5173/
```

## Supabase

Project ref:

```text
opjiacaqzljurmyknrlj
```

The initial schema is in:

```text
supabase/migrations/202607210001_initial_ilocal_schema.sql
```

Apply it through the Supabase SQL editor or, after Supabase CLI auth is configured:

```bash
supabase link --project-ref opjiacaqzljurmyknrlj
supabase db push
```

Add the browser-safe project key to `.env.local`:

```bash
VITE_SUPABASE_URL=https://opjiacaqzljurmyknrlj.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Do not put a Supabase secret key or service role key in any `VITE_` variable.

## Admin Import

Open the Admin tab in the app. It accepts CSV or JSON for:

- `events`
- `venues`

Imported rows default to `review` status so they can be checked before publishing.

## Next Build Steps

1. Connect Supabase permissions and apply the initial migration.
2. Add Supabase Auth and admin role assignment.
3. Replace local saved-state with authenticated `saved_items` and `user_plans`.
4. Add real Tencent Maps SDK rendering when `VITE_TENCENT_MAP_KEY` is set.
5. Expand admin review queue, source matching, verification logs, and publish workflow.
