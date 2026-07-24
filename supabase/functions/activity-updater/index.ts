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

type JsonRecord = Record<string, unknown>;

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

const validCategories = new Set(['coffee', 'music', 'market', 'party', 'exhibition', 'bar', 'sports']);

const asRecord = (value: unknown): JsonRecord =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};

const getString = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
};

const firstString = (...values: unknown[]) => {
  for (const value of values) {
    if (Array.isArray(value)) {
      const nested = firstString(...value);
      if (nested) return nested;
    }
    const stringValue = getString(value);
    if (stringValue) return stringValue;
    const record = asRecord(value);
    const url = getString(record.url);
    if (url) return url;
  }
  return '';
};

const extractFirstUrl = (value: string) => {
  try {
    const parsed = new URL(value.trim());
    return parsed.toString();
  } catch {
    const match = value.match(/https?:\/\/[^\s"'<>]+/i);
    return match?.[0] || '';
  }
};

const normalizeCategory = (category: string | null) =>
  category && validCategories.has(category) ? category : 'exhibition';

const hasEventType = (value: unknown) => {
  if (Array.isArray(value)) return value.some(hasEventType);
  return getString(value).toLowerCase().endsWith('event');
};

const getEventNodes = (value: unknown): JsonRecord[] => {
  if (Array.isArray(value)) return value.flatMap(getEventNodes);
  const record = asRecord(value);
  const graphNodes = getEventNodes(record['@graph']);
  const currentNodes = hasEventType(record['@type']) ? [record] : [];
  return [...currentNodes, ...graphNodes];
};

const readJsonLdNodes = (html: string): JsonRecord[] => {
  const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  return scripts.flatMap((script) => {
    const rawJson = script
      .replace(/^<script[^>]*>/i, '')
      .replace(/<\/script>$/i, '')
      .trim();

    try {
      return getEventNodes(JSON.parse(rawJson));
    } catch {
      return [];
    }
  });
};

const getAddress = (location: JsonRecord) => {
  const addressValue = location.address;
  const addressRecord = asRecord(addressValue);
  if (typeof addressValue === 'string') return addressValue.trim();

  return [
    getString(addressRecord.addressRegion),
    getString(addressRecord.addressLocality),
    getString(addressRecord.streetAddress),
    getString(addressRecord.name),
  ].filter(Boolean).join('');
};

const getGeo = (location: JsonRecord) => {
  const geo = asRecord(location.geo);
  const latitude = Number(geo.latitude);
  const longitude = Number(geo.longitude);
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return { latitude, longitude, accuracy: 'precise' };
  }

  return { latitude: 39.9042, longitude: 116.4074, accuracy: 'unverified' };
};

const getPrice = (offers: unknown) => {
  const offer = Array.isArray(offers) ? asRecord(offers[0]) : asRecord(offers);
  const price = Number(offer.price);
  return Number.isFinite(price) ? price : 0;
};

const getTicketUrl = (offers: unknown) => {
  const offer = Array.isArray(offers) ? asRecord(offers[0]) : asRecord(offers);
  return getString(offer.url);
};

const collectWebsiteEvents = async (source: UpdateSource): Promise<NormalizedCandidate[]> => {
  const sourceUrl = extractFirstUrl(source.query);
  if (!sourceUrl) return [];

  const response = await fetch(sourceUrl, {
    headers: {
      'User-Agent': 'iLocalActivityUpdater/0.1 (+https://i-local.vercel.app)',
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error(`Website fetch failed: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const events = readJsonLdNodes(html);

  return events.map((event) => {
    const location = asRecord(event.location);
    const organizer = asRecord(event.organizer);
    const startDate = getString(event.startDate);
    const parsedStart = startDate ? new Date(startDate) : null;
    const hasValidStart = parsedStart !== null && !Number.isNaN(parsedStart.getTime());
    const dateMatch = startDate.match(/^\d{4}-\d{2}-\d{2}/);
    const timeMatch = startDate.match(/[T\s](\d{2}:\d{2})/);
    const eventDate = dateMatch?.[0] || (hasValidStart ? parsedStart.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    const eventTime = timeMatch?.[1] || '12:00';
    const geo = getGeo(location);
    const address = getAddress(location) || getString(location.name) || source.city;
    const price = getPrice(event.offers);
    const ticketUrl = getTicketUrl(event.offers);
    const coverImage = firstString(event.image);
    const title = firstString(event.name, event.headline, source.name);
    const description = firstString(event.description, event.summary, source.notes);
    const normalizedEvent = {
      source_platform: 'website',
      source_url: sourceUrl,
      source_title: title,
      source_notes: '官网/网页 JSON-LD 自动解析，发布前仍需人工核验时间、地址、票务和封面图。',
      title,
      description,
      category: normalizeCategory(source.category_hint),
      date: eventDate,
      time: eventTime,
      address,
      latitude: geo.latitude,
      longitude: geo.longitude,
      location_accuracy: geo.accuracy,
      location_note: geo.accuracy === 'precise'
        ? ''
        : '网页未提供精确坐标，已使用城市默认点位；发布前需要在腾讯地图核验。',
      district: '',
      is_free: price === 0,
      price,
      ticket_url: ticketUrl || sourceUrl,
      cover_image: coverImage,
      cover_source_url: coverImage ? sourceUrl : '',
      organizer: firstString(organizer.name, event.organizer),
      status: 'draft',
      tags: [source.city, platformLabel(source.platform), source.category_hint || '网页活动'].filter(Boolean),
    };

    return {
      source_platform: 'website',
      source_url: sourceUrl,
      source_title: title,
      raw_payload: event,
      normalized_event: normalizedEvent,
      quality_score: geo.accuracy === 'precise' ? 82 : 58,
      notes: '来自公开网页结构化数据。请审核地址、坐标、日期、票价和图片授权。',
    };
  }).filter((candidate) => firstString(candidate.normalized_event.title));
};

const platformLabel = (platform: string) => {
  const labels: Record<string, string> = {
    xiaohongshu: '小红书',
    wechat: '公众号',
    website: '网页',
    instagram: 'Instagram',
    partner_api: '合作方',
    csv: 'CSV',
    manual: '人工',
    other: '其他',
  };
  return labels[platform] || platform;
};

const collectEventsForSource = async (source: UpdateSource): Promise<NormalizedCandidate[]> => {
  if (source.platform === 'website') {
    return collectWebsiteEvents(source);
  }

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

  const cronSecret = Deno.env.get('ACTIVITY_UPDATER_CRON_SECRET');
  const providedCronSecret = request.headers.get('x-ilocal-cron-secret');
  const isCronRequest = Boolean(cronSecret && providedCronSecret === cronSecret);

  if (!isCronRequest) {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return jsonResponse({ error: 'Missing authorization token' }, 401);
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return jsonResponse({ error: authError?.message || 'Invalid authorization token' }, 401);
    }

    const [{ data: hasAdminRole }, { data: hasModeratorRole }] = await Promise.all([
      supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }),
      supabase.rpc('has_role', { _user_id: user.id, _role: 'moderator' }),
    ]);

    if (!hasAdminRole && !hasModeratorRole) {
      return jsonResponse({ error: 'Admin or moderator role required' }, 403);
    }
  }

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
      let insertedCandidateCount = 0;
      let duplicateCount = 0;

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
        const sourceUrls = Array.from(new Set(candidateRows.map((row) => row.source_url).filter(Boolean)));
        let rowsToInsert = candidateRows;

        if (sourceUrls.length > 0) {
          const [existingCandidatesResult, existingEventsResult] = await Promise.all([
            supabase
              .from('event_import_candidates')
              .select('source_url, source_title')
              .in('source_url', sourceUrls),
            supabase
              .from('events')
              .select('source_url, source_title')
              .in('source_url', sourceUrls),
          ]);

          const existingKeys = new Set([
            ...(existingCandidatesResult.data || []),
            ...(existingEventsResult.data || []),
          ].map((row) => `${row.source_url || ''}::${row.source_title || ''}`));

          rowsToInsert = candidateRows.filter((row) => {
            const key = `${row.source_url || ''}::${row.source_title || ''}`;
            return !existingKeys.has(key);
          });
          duplicateCount = candidateRows.length - rowsToInsert.length;
        }

        if (rowsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('event_import_candidates')
            .insert(rowsToInsert);

          if (insertError) throw insertError;
        }

        insertedCandidateCount = rowsToInsert.length;
      }

      const finishedAt = new Date().toISOString();
      await supabase
        .from('event_update_runs')
        .update({
          status: 'completed',
          finished_at: finishedAt,
          discovered_count: candidates.length,
          candidate_count: insertedCandidateCount,
          duplicate_count: duplicateCount,
          summary: {
            adapter: source.platform === 'website' ? 'website-jsonld' : 'placeholder',
            dry_run: Boolean(body.dry_run),
            duplicate_count: duplicateCount,
            note: candidates.length
              ? 'New candidates inserted into event_import_candidates. Existing source matches were skipped.'
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
        candidate_count: insertedCandidateCount,
        duplicate_count: duplicateCount,
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
