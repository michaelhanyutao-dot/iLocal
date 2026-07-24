-- Template for scheduling the iLocal activity updater from Supabase.
-- Replace PROJECT_REF and CHANGE_THIS_TO_A_LONG_RANDOM_SECRET before running.
-- Run this only after deploying supabase/functions/activity-updater.

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Store this same value as the Edge Function secret ACTIVITY_UPDATER_CRON_SECRET.
-- Do not reuse a Vercel key or Supabase service role key here.
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.app_secrets (
  name TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA private FROM PUBLIC;

INSERT INTO private.app_secrets (name, value)
VALUES ('activity_updater_cron_secret', 'CHANGE_THIS_TO_A_LONG_RANDOM_SECRET')
ON CONFLICT (name) DO UPDATE
SET value = excluded.value,
    updated_at = now();

SELECT cron.unschedule('ilocal-activity-updater-daily')
WHERE EXISTS (
  SELECT 1
  FROM cron.job
  WHERE jobname = 'ilocal-activity-updater-daily'
);

SELECT cron.schedule(
  'ilocal-activity-updater-daily',
  '17 4 * * *',
  $$
  SELECT net.http_post(
    url := 'https://PROJECT_REF.supabase.co/functions/v1/activity-updater',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-ilocal-cron-secret', (SELECT value FROM private.app_secrets WHERE name = 'activity_updater_cron_secret')
    ),
    body := jsonb_build_object('limit', 5)
  );
  $$
);
