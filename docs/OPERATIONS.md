# iLocal Operations Runbook

This is the working checklist for running the current iLocal MVP.

## Production Entry Points

- Public app: https://i-local.vercel.app
- Operator dashboard: `/dashboard`
- Activity management: `/dashboard/events`
- New activity: `/dashboard/events/new`
- Intake queue: `/dashboard/intake`
- CSV import: `/dashboard/import`
- Tag management: `/dashboard/tags`
- Role management: `/dashboard/users`

## Required Environment Variables

Set these in Vercel for Production and Preview:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_TENCENT_MAP_KEY`
- `VITE_TENCENT_MAP_REFERER`

After changing environment variables, redeploy the latest commit in Vercel.

## First Admin Setup

The first admin still needs one SQL insert because the role manager itself is protected by `user_roles`.

1. Sign up or log in with the operator email.
2. Copy the user's UUID from Supabase Authentication.
3. Run this in Supabase SQL Editor:

```sql
insert into public.user_roles (user_id, role)
values ('PASTE_AUTH_USER_UUID_HERE', 'admin')
on conflict (user_id, role) do nothing;
```

After that, use `/dashboard/users` to add moderators or additional admins.

## Daily Content Workflow

1. Collect candidate event information from manual research, partner submissions, official websites, social posts, or CSV batches.
2. Normalize each event into this shape:

```json
{
  "source_platform": "manual",
  "source_url": "",
  "source_title": "",
  "title": "",
  "description": "",
  "category": "music",
  "date": "2026-08-01",
  "time": "20:00",
  "address": "",
  "latitude": 39.9,
  "longitude": 116.4,
  "district": "朝阳区",
  "is_free": false,
  "price": 88,
  "ticket_url": "",
  "cover_image": "",
  "organizer": "",
  "status": "active",
  "tags": ["北京", "周末"]
}
```

3. Paste one JSON object or an array into `/dashboard/intake`.
4. Click `加入候选池`.
5. Review each candidate, correct fields if needed, then click `发布活动`.
6. Verify the activity appears in `/dashboard/events` and on the public Explore page.

## Activity Quality Rules

- Title should be short enough for mobile cards.
- Date must be `YYYY-MM-DD`; time must be `HH:mm`.
- Latitude and longitude should point to the actual venue, not just the district.
- Use `draft` when the source is incomplete, `active` when ready to publish, and `inactive` to take an event down.
- Prefer official ticket or venue links for `ticket_url`.
- Use a real event or venue image URL for `cover_image`; if empty, the app falls back to category artwork.

## Public QA Checklist

Before promoting a batch:

- Explore map and list both show the new events.
- Search finds event title, address, organizer, or tag.
- Event detail page shows the correct title, image, time, price, address, and Tencent map entry.
- Save, like, share, navigation, and plan buttons respond.
- Saved calendar shows planned events under the correct date.
- `/me` shows guest state when logged out and operator state when logged in.

## Deployment Workflow

1. Commit and push to `main`.
2. Vercel automatically creates a new production deployment.
3. Check Vercel deployment status.
4. Open the public app and run the QA checklist above.

## Near-Term Roadmap

- Add a proper image upload/storage workflow.
- Add duplicate detection in the intake queue.
- Add source confidence and editorial notes.
- Add a lightweight submission form for partners.
- Add scheduled sourcing jobs once the manual intake workflow is stable.
