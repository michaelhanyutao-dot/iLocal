# iLocal

iLocal is a mobile-first local activity discovery app. The current MVP supports public discovery, event detail pages, saved/planned events, Tencent Maps integration, and an operator dashboard for activity management.

## Stack

- React + Vite + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase Auth, Postgres, and RLS
- Tencent Maps JavaScript SDK
- Vercel deployment

## Local Development

```sh
pnpm install
pnpm run dev
```

Useful checks:

```sh
pnpm run lint
pnpm run build
```

## Main Routes

- `/` public Explore page
- `/event/:id` event detail
- `/saved` saved list and calendar
- `/me` profile
- `/auth` operator login/register
- `/dashboard` operator dashboard
- `/dashboard/events` activity management
- `/dashboard/intake` event candidate review queue
- `/dashboard/import` CSV batch import
- `/dashboard/tags` tag management
- `/dashboard/users` role management

## Environment Variables

Set these locally in `.env.local` and in Vercel:

```sh
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_TENCENT_MAP_KEY=
VITE_TENCENT_MAP_REFERER=
```

## Operations

See [docs/OPERATIONS.md](docs/OPERATIONS.md) for the current operating checklist: first admin setup, daily content workflow, candidate intake format, QA checklist, and deployment notes.

## Deployment

Push to `main`; Vercel deploys the production app automatically.
