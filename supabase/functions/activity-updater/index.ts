/* global Deno */
import { createClient } from 'npm:@supabase/supabase-js@2.110.7';

type UpdateSource = {
  id: string;
  name: string;
  platform: string;
  city: string;
  query: string;
  category_hint: string | null;
  cadence: string;
  status: string;
};

type UpdateRun = {
  id: string;
  source_id: string | null;
  trigger_type: string;
};

type NormalizedCandidate = {
  source_platform: string;
  source_url?: string;
  source_title?: string;
  raw_payload: Record<string, unknown>;
  normalized_event: Record<string, unknown>;
  quality_score?: number;
  notes?: string;
};

type RequestBody = {
  run_id?: string;
  source_id?: string;
  dry_run?: boolean;
  limit?: number;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

const addInterval = (cadence: string) => {
  const next = new Date();
  if (cadence === 'hourly') next.setHours(next.getHours() + 1);
  if (cadence === 'daily') next.setDate(next.getDate() + 1);
  if (cadence === 'weekly') next.setDate(next.getDate() + 7);
  return cadence === 'manual' ? null : next.toISOString();
};

const getSupabaseSecretKey = () => {
  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (secretKeys) {
    try {
      const parsed = JSON.parse(secretKeys) as Record<string, string | undefined>;
      return parsed.default || Object.values(parsed).find(Boolean) || null;
    } catch {
      return null;
    }
  }

  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
};

const collectEventsForSource = async (source: UpdateSource): Promise<NormalizedCandidate[]> => {
  // Adapter slot: xiaohongshu/wechat/website/partner_api crawlers should normalize
  // into this function's return shape, then the shared pipeline handles review intake.
  console.info(`activity-updater placeholder adapter: ${source.platform} ${source.query}`);
  return [];
};

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = getSupabaseSecretKey();

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Missing SUPABASE_URL and Supabase secret/service role key' }, 500);
  }

  const body = (await request.json().catch(() => ({}))) as RequestBody;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const processRun = async (run: UpdateRun) => {
    const startedAt = new Date().toISOString();
    await supabase
      .from('event_update_runs')
      .update({ status: 'running', started_at: startedAt, error_message: null })
      .eq('id', run.id);

    if (!run.source_id) {
      await supabase
        .from('event_update_runs')
        .update({
          status: 'failed',
          finished_at: new Date().toISOString(),
          error_message: 'Run has no source_id.',
        })
        .eq('id', run.id);
      return { run_id: run.id, status: 'failed', candidate_count: 0 };
    }

    const { data: source, error: sourceError } = await supabase
      .from('event_update_sources')
      .select('*')
      .eq('id', run.source_id)
      .single<UpdateSource>();

    if (sourceError || !source) {
      await supabase
        .from('event_update_runs')
        .update({
          status: 'failed',
          finished_at: new Date().toISOString(),
          error_message: sourceError?.message || 'Source not found.',
        })
        .eq('id', run.id);
      return { run_id: run.id, status: 'failed', candidate_count: 0 };
    }

    try {
      const candidates = await collectEventsForSource(source);
      const shouldInsertCandidates = !body.dry_run && candidates.length > 0;

      if (shouldInsertCandidates) {
        const candidateRows = candidates.map((candidate) => ({
          automation_source_id: source.id,
          automation_run_id: run.id,
          source_platform: candidate.source_platform || source.platform,
          source_url: candidate.source_url || null,
          source_title: candidate.source_title || null,
          raw_payload: candidate.raw_payload,
          normalized_event: candidate.normalized_event,
          quality_score: candidate.quality_score || null,
          notes: candidate.notes || null,
          status: 'pending',
        }));

        const { error: insertError } = await supabase
          .from('event_import_candidates')
          .insert(candidateRows);

        if (insertError) throw insertError;
      }

      const finishedAt = new Date().toISOString();
      await supabase
        .from('event_update_runs')
        .update({
          status: 'completed',
          finished_at: finishedAt,
          discovered_count: candidates.length,
          candidate_count: shouldInsertCandidates ? candidates.length : 0,
          duplicate_count: 0,
          summary: {
            adapter: 'placeholder',
            dry_run: Boolean(body.dry_run),
            note: candidates.length
              ? 'Candidates inserted into event_import_candidates.'
              : 'No adapter results yet. Wire collectEventsForSource to start importing candidates.',
          },
        })
        .eq('id', run.id);

      await supabase
        .from('event_update_sources')
        .update({
          last_run_at: finishedAt,
          next_run_at: addInterval(source.cadence),
        })
        .eq('id', source.id);

      return {
        run_id: run.id,
        source_id: source.id,
        status: 'completed',
        discovered_count: candidates.length,
        candidate_count: shouldInsertCandidates ? candidates.length : 0,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown activity updater error.';
      await supabase
        .from('event_update_runs')
        .update({
          status: 'failed',
          finished_at: new Date().toISOString(),
          error_message: message,
        })
        .eq('id', run.id);
      return { run_id: run.id, status: 'failed', error: message };
    }
  };

  if (body.run_id) {
    const { data: run, error } = await supabase
      .from('event_update_runs')
      .select('*')
      .eq('id', body.run_id)
      .single<UpdateRun>();

    if (error || !run) {
      return jsonResponse({ error: error?.message || 'Run not found.' }, 404);
    }

    return jsonResponse({ results: [await processRun(run)] });
  }

  if (body.source_id) {
    const { data: source, error: sourceError } = await supabase
      .from('event_update_sources')
      .select('*')
      .eq('id', body.source_id)
      .single<UpdateSource>();

    if (sourceError || !source) {
      return jsonResponse({ error: sourceError?.message || 'Source not found.' }, 404);
    }

    const { data: run, error: runError } = await supabase
      .from('event_update_runs')
      .insert({
        source_id: source.id,
        status: 'queued',
        trigger_type: body.dry_run ? 'dry_run' : 'manual',
        source_snapshot: source,
      })
      .select('*')
      .single<UpdateRun>();

    if (runError || !run) {
      return jsonResponse({ error: runError?.message || 'Run creation failed.' }, 500);
    }

    return jsonResponse({ results: [await processRun(run)] });
  }

  const limit = Math.min(Math.max(body.limit || 5, 1), 20);
  const { data: queuedRuns, error: queueError } = await supabase
    .from('event_update_runs')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(limit)
    .returns<UpdateRun[]>();

  if (queueError) {
    return jsonResponse({ error: queueError.message }, 500);
  }

  const results = [];
  for (const run of queuedRuns || []) {
    results.push(await processRun(run));
  }

  return jsonResponse({
    processed: results.length,
    results,
  });
});
