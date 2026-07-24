# iLocal Operations Runbook

This is the working checklist for running the current iLocal MVP.

## Production Entry Points

- Public app: https://i-local.vercel.app
- Operator dashboard: `/dashboard`
- Activity management: `/dashboard/events`
- New activity: `/dashboard/events/new`
- Intake queue: `/dashboard/intake`
- Activity automation: `/dashboard/automation`
- CSV import: `/dashboard/import`
- Tag management: `/dashboard/tags`
- User management: `/dashboard/users`

## Required Environment Variables

Set these in Vercel for Production and Preview:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_TENCENT_MAP_KEY`
- `VITE_TENCENT_MAP_REFERER`

After changing environment variables, redeploy the latest commit in Vercel.

## Required Supabase Migrations

Run every file in `supabase/migrations` that has not yet been applied to the current Supabase project.

The cover upload feature specifically requires:

- `supabase/migrations/20260723093000_event_cover_storage.sql`

It creates the public `event-covers` Storage bucket and RLS policies. Without this migration, the dashboard still works, but image uploads will fail and operators must paste image URLs manually.

User management specifically requires:

- `supabase/migrations/20260723183000_app_user_profiles.sql`

It creates `app_user_profiles`, syncs Auth users into an operations-facing user ledger, and stores app-level account status (`active` or `suspended`). Without this migration, `/dashboard/users` cannot show the account list.

Location quality specifically requires:

- `supabase/migrations/20260724001000_event_location_quality.sql`

It adds `location_accuracy`, `location_note`, and verification metadata to formal events. Without this migration, the public app still reads old activities, but the dashboard cannot save the location quality fields.

Source provenance specifically requires:

- `supabase/migrations/20260724002000_event_source_provenance.sql`

It adds source platform, source URL, source title, cover source URL, source notes, and source verification metadata to formal events. Without this migration, candidate publishing still works only for old activity fields and the dashboard cannot save source tracking fields.

Activity automation specifically requires:

- `supabase/migrations/20260724003000_activity_update_automation.sql`

It creates `event_update_sources` and `event_update_runs`, links automated runs back to `event_import_candidates`, expands accepted source platform values, and seeds initial Beijing sourcing rules. Without this migration, `/dashboard/automation` will show a setup warning and cannot queue runs.

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

After that, use `/dashboard/users` to add moderators or additional admins, send password reset emails, and suspend/reactivate app accounts.

## User Management Rules

- The public Profile page does not expose the dashboard entry; operators should open `/dashboard` or `/dashboard/users` directly.
- Passwords are never shown, stored, or manually edited in the frontend.
- Use `重置密码` in `/dashboard/users` to send a Supabase recovery email. The user sets a new password at `/reset-password`.
- `禁用账号` changes app-level status to `suspended`. The frontend blocks suspended accounts after session sync, but strict server-side enforcement for every future privileged operation should stay in RLS or Edge Functions.
- Creating, deleting, or force-changing Supabase Auth users requires a backend service role flow, preferably a Supabase Edge Function. Do not add a service role key to Vercel client environment variables.

## Daily Content Workflow

1. Collect candidate event information from manual research, partner submissions, official websites, social posts, or CSV batches.
2. Normalize each event into this shape:

```json
{
  "source_platform": "manual",
  "source_url": "",
  "source_title": "",
  "source_notes": "",
  "title": "",
  "description": "",
  "category": "music",
  "date": "2026-08-01",
  "time": "20:00",
  "address": "",
  "latitude": 39.9,
  "longitude": 116.4,
  "location_accuracy": "unverified",
  "location_note": "只有社交平台线索，发布前建议确认具体店面或集合点。",
  "district": "朝阳区",
  "is_free": false,
  "price": 88,
  "ticket_url": "",
  "cover_image": "",
  "cover_source_url": "",
  "organizer": "",
  "status": "active",
  "tags": ["北京", "周末"]
}
```

3. Paste one JSON object or an array into `/dashboard/intake`.
4. Click `加入候选池`.
5. Review each candidate in `/dashboard/intake`. Use the structured editor for normal fixes such as title, time, address, coordinates, location accuracy, source links, cover image, tags, and price. Use the JSON editor only for advanced field repair or batch-style cleanup.
6. Correct fields if needed, then click `保存标准化内容`.
7. Click `发布活动` after validation and duplicate checks pass.
8. Verify the activity appears in `/dashboard/events` and on the public Explore page.

## Automated Activity Update Workflow

The automation flow is intentionally staged so unverified social content never publishes directly.

1. Open `/dashboard/automation`.
2. Create or adjust a source:
   - `platform`: where the source comes from, such as `xiaohongshu`, `wechat`, `website`, `partner_api`, or `csv`.
   - `city`: current MVP target is `北京`.
   - `query`: exact search terms or source rule, for example `北京 周末 音乐 演出 livehouse`.
   - `category_hint`: the expected iLocal category.
   - `cadence`: `manual` for early testing; switch to `daily` or `weekly` only after the adapter is stable.
3. Click `创建运行记录` to queue a manual run.
4. Deploy and invoke `supabase/functions/activity-updater` to process queued runs. `/dashboard/automation` can call it directly with `立即运行来源`, `处理排队任务`, or an individual row's `处理` button.
5. A completed adapter writes normalized rows into `event_import_candidates`.
6. Review every candidate in `/dashboard/intake`, verify location/source/cover image, then publish.

The browser frontend must never contain social platform credentials or Supabase service role keys. Real collection should run in a Supabase Edge Function, scheduled worker, or another backend job that writes only to the candidate pool.

Current adapters:

- `website`: if the source query contains a public URL, `activity-updater` fetches the page and extracts JSON-LD `Event` data into candidate activities.
- `xiaohongshu`, `wechat`, `instagram`, `partner_api`, `csv`, `manual`, `other`: currently tracked as source configuration and run records. Add adapters before expecting automatic candidates from these platforms.

### Edge Function Deployment Notes

Function path:

- `supabase/functions/activity-updater/index.ts`

Function config:

- `supabase/config.toml` sets `[functions.activity-updater] verify_jwt = false` so Supabase Cron can call it with `x-ilocal-cron-secret`. The function still performs its own authorization: dashboard calls need admin/moderator JWT, scheduled calls need the cron secret.

Required Supabase Edge Function secrets:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEYS` with a `default` secret key, or legacy `SUPABASE_SERVICE_ROLE_KEY`
- `ACTIVITY_UPDATER_CRON_SECRET` for scheduled calls

Supported request bodies:

```json
{ "run_id": "RUN_UUID" }
```

```json
{ "source_id": "SOURCE_UUID", "dry_run": true }
```

```json
{ "limit": 5 }
```

The last form drains up to five queued runs. It is the shape to call from a scheduled job once the first real adapter is added.

Manual dashboard calls require the logged-in user to have `admin` or `moderator`. Scheduled calls must send `x-ilocal-cron-secret` matching `ACTIVITY_UPDATER_CRON_SECRET`.

### Scheduled Run Template

Use this SQL template only after the Edge Function is deployed and tested manually:

- `supabase/sql/activity_updater_schedule_template.sql`

Before running it:

1. Replace `PROJECT_REF` with the Supabase project ref.
2. Replace `CHANGE_THIS_TO_A_LONG_RANDOM_SECRET` with the same value stored as the Edge Function secret `ACTIVITY_UPDATER_CRON_SECRET`.
3. Keep the first schedule conservative, for example once per day at off-peak time.

### Automation Quality Rules

- Keep social-source results in the candidate pool; never auto-publish them.
- Preserve original source URL, source title, source notes, and cover source URL.
- Store social-platform images only when rights and source policy are acceptable; otherwise use a linked cover URL, a venue image, or an operator-uploaded replacement.
- Mark weak locations as `area` or `unverified`, and write the reason in `location_note`.
- Prefer official venue/ticket sources over reposts when resolving time, price, and address.
- Duplicate checking should run before inserting or publishing formal events. The first scaffold records `duplicate_count`; adapter refinement should fill it.
- Start with `manual` cadence and Beijing-only queries. Move to daily scheduling after five to ten successful human-reviewed runs.

## Activity Quality Rules

- Title should be short enough for mobile cards.
- Date must be `YYYY-MM-DD`; time must be `HH:mm`.
- Latitude and longitude should point to the actual venue, not just the district.
- Use Tencent/GCJ-02 coordinates for event locations. Browser user location is converted before rendering, but event data should not mix WGS84, Baidu BD-09, or rough district-center coordinates.
- Set `location_accuracy` on every activity:
  - `precise`: exact venue, store, building, or doorplate has been checked.
  - `area`: only a park, compound, shopping area, street, or broad gathering area is known.
  - `unverified`: social-source or scraped clue that still needs secondary verification.
- Use `location_note` to explain weak locations, for example `只有园区信息，建议用户查看来源或搜索主办方最新集合点`.
- Social-source candidates should stay `unverified` until an operator checks the original post, official page, venue listing, or map search result.
- Preserve source metadata whenever an event is collected from social platforms or websites:
  - `source_platform`: `xiaohongshu`, `wechat`, `website`, `instagram`, `manual`, or `other`.
  - `source_url`: original post, official page, ticket page, or venue page.
  - `source_title`: original source title or post headline.
  - `source_notes`: what was checked, what remains uncertain, and any important editorial caveat.
  - `cover_source_url`: where the selected cover image came from.
- Mark `来源已核验` in `/dashboard/events` only after checking the original post or official source. Publishing from `/dashboard/intake` records the candidate source and marks it checked when a source URL exists.
- Use `draft` when the source is incomplete, `active` when ready to publish, and `inactive` to take an event down.
- Prefer official ticket or venue links for `ticket_url`.
- Upload a cover image in `/dashboard/events/new`, or paste a real event/venue image URL into `cover_image`; if empty, the app falls back to category artwork.

## Duplicate Checks

The intake queue and CSV import preview warn and block publishing/importing when they find an existing formal event with:

- the same normalized title and same date, or
- the same normalized address, same date, and same time.

If the warning is a false positive, edit the candidate or CSV row's title, date, time, or address before publishing/importing.

## Public QA Checklist

Before promoting a batch:

- Explore map and list both show the new events.
- Search finds event title, address, organizer, or tag.
- Event detail page shows the correct title, image, time, price, address, and Tencent map entry.
- Event detail page shows a location reminder for `area` or `unverified` activities, and no reminder for `precise` activities.
- Save, like, share, navigation, and plan buttons respond.
- Saved calendar shows planned events under the correct date.
- `/me` shows guest/user state without an operations dashboard entry.
- `/dashboard/users` shows account list, roles, active/suspended status, reset email action, and notes.

## Deployment Workflow

1. Commit and push to `main`.
2. Vercel automatically creates a new production deployment.
3. Check Vercel deployment status.
4. Open the public app and run the QA checklist above.

## Near-Term Roadmap

- Add source confidence and editorial notes.
- Add a lightweight submission form for partners.
- Wire the first real activity adapter into `activity-updater`, starting with Beijing 小红书-like social-source candidates.
- Add scheduled sourcing jobs once the manual automation runs are stable.
- Add service-role Edge Functions for admin-only Auth user creation, deletion, and forced session revocation.
