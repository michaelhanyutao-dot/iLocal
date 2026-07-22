import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  RotateCcw,
  Send,
  Upload,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Json, Tables, TablesInsert } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { eventCategories, eventFormSchema, formatZodErrors } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

type Candidate = Tables<'event_import_candidates'>;
type CandidateStatus = 'all' | 'pending' | 'imported' | 'rejected';
type SourcePlatform = 'xiaohongshu' | 'manual' | 'wechat' | 'instagram' | 'website' | 'other';

type NormalizedEvent = {
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  address: string;
  latitude: number;
  longitude: number;
  district: string;
  is_free: boolean;
  price: number;
  ticket_url: string;
  organizer: string;
  status: 'active' | 'inactive' | 'draft';
  cover_image?: string;
  tags: string[];
};

const sourcePlatforms: SourcePlatform[] = ['xiaohongshu', 'manual', 'wechat', 'instagram', 'website', 'other'];

const statusLabels: Record<CandidateStatus, string> = {
  all: '全部',
  pending: '待审核',
  imported: '已发布',
  rejected: '已拒绝',
};

const sampleJson = `[
  {
    "source_platform": "xiaohongshu",
    "source_url": "https://www.xiaohongshu.com/explore/demo",
    "source_title": "北京周末小众展览合集",
    "title": "胡同夜游摄影散步",
    "description": "跟随本地摄影师穿过东城胡同，记录夏夜街景。",
    "category": "exhibition",
    "date": "2026-08-03",
    "time": "19:30",
    "address": "北京市东城区五道营胡同",
    "latitude": 39.9498,
    "longitude": 116.4142,
    "district": "东城区",
    "is_free": false,
    "price": 68,
    "organizer": "北京城市漫游",
    "status": "active",
    "tags": ["摄影", "胡同", "城市漫游"]
  }
]`;

const AdminIntake = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jsonText, setJsonText] = useState(sampleJson);
  const [selectedStatus, setSelectedStatus] = useState<CandidateStatus>('pending');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingJson, setEditingJson] = useState('');

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_import_candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCandidates(data ?? []);
    } catch (error) {
      console.error('Error fetching import candidates:', error);
      toast({
        title: '无法加载采集候选池',
        description: error instanceof Error ? error.message : '请检查 Supabase 权限',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const counts = useMemo(() => {
    return candidates.reduce(
      (accumulator, candidate) => {
        accumulator.all += 1;
        if (candidate.status === 'pending') accumulator.pending += 1;
        if (candidate.status === 'imported') accumulator.imported += 1;
        if (candidate.status === 'rejected') accumulator.rejected += 1;
        return accumulator;
      },
      { all: 0, pending: 0, imported: 0, rejected: 0 },
    );
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    if (selectedStatus === 'all') return candidates;
    return candidates.filter((candidate) => candidate.status === selectedStatus);
  }, [candidates, selectedStatus]);

  const handleCreateCandidates = async () => {
    setSaving(true);
    try {
      const parsed = JSON.parse(jsonText) as unknown;
      const rows = Array.isArray(parsed) ? parsed : [parsed];
      const inserts = rows
        .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object' && !Array.isArray(row))
        .map((row) => {
          const normalizedEvent = normalizeEventPayload(row);
          const validation = validateNormalizedEvent(normalizedEvent);

          return {
            source_platform: normalizeSourcePlatform(row.source_platform),
            source_url: getString(row.source_url) || null,
            source_title: getString(row.source_title) || getString(row.title) || null,
            raw_payload: toJson(row),
            normalized_event: toJson(normalizedEvent),
            status: 'pending',
            quality_score: validation.valid ? 1 : 0.35,
            notes: validation.valid ? null : validation.errors.join('\n'),
            created_by: user?.id ?? null,
          } satisfies TablesInsert<'event_import_candidates'>;
        });

      if (inserts.length === 0) {
        throw new Error('JSON 需要是对象或对象数组');
      }

      const { error } = await supabase.from('event_import_candidates').insert(inserts);
      if (error) throw error;

      toast({
        title: '已加入候选池',
        description: `新增 ${inserts.length} 条线索，等待审核发布`,
      });
      setSelectedStatus('pending');
      await fetchCandidates();
    } catch (error) {
      console.error('Create candidates failed:', error);
      toast({
        title: 'JSON 导入失败',
        description: error instanceof Error ? error.message : '请检查 JSON 格式',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditCandidate = (candidate: Candidate) => {
    setEditingId(candidate.id);
    setEditingJson(JSON.stringify(candidate.normalized_event, null, 2));
  };

  const handleSaveCandidate = async (candidate: Candidate) => {
    try {
      const parsed = JSON.parse(editingJson) as unknown;
      const normalized = normalizeEventPayload(asRecord(parsed));
      const validation = validateNormalizedEvent(normalized);

      const { error } = await supabase
        .from('event_import_candidates')
        .update({
          normalized_event: toJson(normalized),
          quality_score: validation.valid ? 1 : 0.35,
          notes: validation.valid ? null : validation.errors.join('\n'),
        })
        .eq('id', candidate.id);

      if (error) throw error;

      toast({
        title: '线索已更新',
        description: validation.valid ? '这条线索已经可以发布' : '仍有字段需要修正',
      });
      setEditingId(null);
      setEditingJson('');
      await fetchCandidates();
    } catch (error) {
      toast({
        title: '保存失败',
        description: error instanceof Error ? error.message : '请检查标准化 JSON',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (candidate: Candidate, status: 'pending' | 'rejected') => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('event_import_candidates')
      .update({
        status,
        reviewed_by: status === 'pending' ? null : user?.id ?? null,
        reviewed_at: status === 'pending' ? null : now,
      })
      .eq('id', candidate.id);

    if (error) {
      toast({
        title: '状态更新失败',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    await fetchCandidates();
  };

  const handlePublishCandidate = async (candidate: Candidate) => {
    const normalized = normalizeEventPayload(asRecord(candidate.normalized_event));
    const validation = validateNormalizedEvent(normalized);

    if (!validation.valid) {
      toast({
        title: '线索还不能发布',
        description: validation.errors.join('\n'),
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const eventToInsert = buildEventInsert(normalized, user?.id);
      const { data: insertedEvent, error: eventError } = await supabase
        .from('events')
        .insert(eventToInsert)
        .select('id, title')
        .single();

      if (eventError) throw eventError;

      await attachTags(insertedEvent.id, normalized.tags);

      const now = new Date().toISOString();
      const { error: candidateError } = await supabase
        .from('event_import_candidates')
        .update({
          status: 'imported',
          reviewed_by: user?.id ?? null,
          reviewed_at: now,
          imported_at: now,
          imported_event_id: insertedEvent.id,
        })
        .eq('id', candidate.id);

      if (candidateError) throw candidateError;

      toast({
        title: '活动已发布',
        description: `"${insertedEvent.title}" 已写入正式活动库`,
      });
      await fetchCandidates();
    } catch (error) {
      console.error('Publish candidate failed:', error);
      toast({
        title: '发布失败',
        description: error instanceof Error ? error.message : '请检查活动字段和数据库权限',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/admin')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回管理后台
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">采集候选池</h1>
                <p className="text-sm text-muted-foreground">先收集线索，审核后发布为正式活动</p>
              </div>
            </div>
            <Button onClick={fetchCandidates} variant="outline" disabled={loading}>
              <RotateCcw className="mr-2 h-4 w-4" />
              刷新
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto grid gap-6 px-4 py-6 xl:grid-cols-[minmax(360px,440px)_minmax(0,1fr)]">
        <Card className="border-border/50 bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              粘贴采集结果
            </CardTitle>
            <CardDescription>
              支持单个 JSON 对象或数组。可以先把小红书、网页、人工整理出的字段贴进来。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={jsonText}
              onChange={(event) => setJsonText(event.target.value)}
              className="min-h-[520px] font-mono text-sm"
              spellCheck={false}
            />
            <div className="rounded-lg border border-border/60 bg-card px-4 py-3 text-sm text-muted-foreground">
              建议字段：title, description, category, date, time, address, latitude, longitude, district, is_free,
              price, organizer, tags。
            </div>
            <Button onClick={handleCreateCandidates} disabled={saving} className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              {saving ? '处理中...' : '加入候选池'}
            </Button>
          </CardContent>
        </Card>

        <section className="space-y-6">
          <Card className="border-border/50 bg-gradient-card">
            <CardContent className="grid gap-3 pt-6 sm:grid-cols-4">
              {(['pending', 'imported', 'rejected', 'all'] as CandidateStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setSelectedStatus(status)}
                  className={[
                    'rounded-2xl border px-4 py-3 text-left transition-colors',
                    selectedStatus === status
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border/60 bg-card hover:bg-secondary/70',
                  ].join(' ')}
                >
                  <span className="block text-sm font-bold">{statusLabels[status]}</span>
                  <span className="mt-1 block text-2xl font-black">{counts[status]}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          {loading ? (
            <Card className="border-border/50 bg-gradient-card">
              <CardContent className="py-16 text-center text-sm font-semibold text-muted-foreground">
                正在加载候选线索...
              </CardContent>
            </Card>
          ) : filteredCandidates.length === 0 ? (
            <Card className="border-border/50 bg-gradient-card">
              <CardContent className="py-16 text-center text-sm font-semibold text-muted-foreground">
                当前没有{statusLabels[selectedStatus]}线索
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  editingId={editingId}
                  editingJson={editingJson}
                  saving={saving}
                  onEdit={handleEditCandidate}
                  onEditingJsonChange={setEditingJson}
                  onSave={handleSaveCandidate}
                  onCancelEdit={() => {
                    setEditingId(null);
                    setEditingJson('');
                  }}
                  onPublish={handlePublishCandidate}
                  onReject={(item) => handleUpdateStatus(item, 'rejected')}
                  onRestore={(item) => handleUpdateStatus(item, 'pending')}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

type CandidateCardProps = {
  candidate: Candidate;
  editingId: string | null;
  editingJson: string;
  saving: boolean;
  onEdit: (candidate: Candidate) => void;
  onEditingJsonChange: (value: string) => void;
  onSave: (candidate: Candidate) => void;
  onCancelEdit: () => void;
  onPublish: (candidate: Candidate) => void;
  onReject: (candidate: Candidate) => void;
  onRestore: (candidate: Candidate) => void;
};

const CandidateCard = ({
  candidate,
  editingId,
  editingJson,
  saving,
  onEdit,
  onEditingJsonChange,
  onSave,
  onCancelEdit,
  onPublish,
  onReject,
  onRestore,
}: CandidateCardProps) => {
  const normalized = normalizeEventPayload(asRecord(candidate.normalized_event));
  const validation = validateNormalizedEvent(normalized);
  const isEditing = editingId === candidate.id;
  const importedUrl = candidate.imported_event_id ? `/event/${candidate.imported_event_id}` : null;

  return (
    <Card className="border-border/50 bg-gradient-card">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={candidate.status} />
              <Badge variant="secondary" className="rounded-full">
                {candidate.source_platform}
              </Badge>
              {validation.valid ? (
                <span className="inline-flex items-center text-xs font-bold text-primary">
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  可发布
                </span>
              ) : (
                <span className="inline-flex items-center text-xs font-bold text-destructive">
                  <XCircle className="mr-1 h-3.5 w-3.5" />
                  需修正
                </span>
              )}
            </div>
            <CardTitle className="text-xl">{normalized.title || candidate.source_title || '未命名活动'}</CardTitle>
            <CardDescription className="mt-1">
              {normalized.date || '未填日期'} {normalized.time || ''} · {normalized.address || '未填地址'}
            </CardDescription>
          </div>
          {candidate.source_url && (
            <Button asChild variant="outline" size="sm">
              <a href={candidate.source_url} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                来源
              </a>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoTile label="分类" value={normalized.category || '-'} />
          <InfoTile label="区域" value={normalized.district || '-'} />
          <InfoTile label="票价" value={normalized.is_free ? '免费' : `¥${normalized.price}`} />
          <InfoTile label="主办方" value={normalized.organizer || '-'} />
        </div>

        {normalized.description && (
          <p className="rounded-xl border border-border/60 bg-card px-4 py-3 text-sm font-semibold text-muted-foreground">
            {normalized.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {normalized.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="rounded-full">
              {tag}
            </Badge>
          ))}
        </div>

        {!validation.valid && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
            {validation.errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}

        {isEditing && (
          <div className="space-y-3 rounded-xl border border-border/60 bg-card p-3">
            <Textarea
              value={editingJson}
              onChange={(event) => onEditingJsonChange(event.target.value)}
              className="min-h-[260px] font-mono text-sm"
              spellCheck={false}
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => onSave(candidate)}>保存标准化内容</Button>
              <Button variant="outline" onClick={onCancelEdit}>
                取消
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          {importedUrl && (
            <Button asChild variant="outline">
              <a href={importedUrl} target="_blank" rel="noreferrer">
                查看活动
              </a>
            </Button>
          )}
          <Button variant="outline" onClick={() => onEdit(candidate)}>
            编辑
          </Button>
          {candidate.status === 'rejected' ? (
            <Button variant="outline" onClick={() => onRestore(candidate)}>
              恢复待审
            </Button>
          ) : (
            <Button variant="outline" onClick={() => onReject(candidate)} disabled={candidate.status === 'imported'}>
              拒绝
            </Button>
          )}
          <Button onClick={() => onPublish(candidate)} disabled={saving || candidate.status === 'imported' || !validation.valid}>
            <Send className="mr-2 h-4 w-4" />
            发布活动
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const InfoTile = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-border/60 bg-card px-4 py-3">
    <p className="text-xs font-bold text-muted-foreground">{label}</p>
    <p className="mt-1 line-clamp-2 text-sm font-black text-foreground">{value}</p>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const label = status === 'pending' ? '待审核' : status === 'imported' ? '已发布' : status === 'rejected' ? '已拒绝' : status;
  return <Badge className="rounded-full">{label}</Badge>;
};

const validateNormalizedEvent = (event: NormalizedEvent) => {
  const result = eventFormSchema.safeParse({
    title: event.title,
    description: event.description,
    category: event.category,
    date: event.date,
    time: event.time,
    address: event.address,
    latitude: event.latitude,
    longitude: event.longitude,
    district: event.district,
    is_free: event.is_free,
    price: event.price,
    ticket_url: event.ticket_url,
    organizer: event.organizer,
    status: event.status,
  });

  if (result.success) return { valid: true, errors: [] };
  return { valid: false, errors: formatZodErrors(result.error).split('\n') };
};

const buildEventInsert = (event: NormalizedEvent, userId?: string): TablesInsert<'events'> => ({
  title: event.title,
  description: event.description || null,
  category: event.category,
  date: event.date,
  time: event.time,
  address: event.address,
  latitude: event.latitude,
  longitude: event.longitude,
  district: event.district || null,
  is_free: event.is_free,
  price: event.is_free ? null : event.price,
  ticket_url: event.ticket_url || null,
  organizer: event.organizer || null,
  cover_image: event.cover_image || null,
  status: event.status,
  attendees: 0,
  created_by: userId ?? null,
});

const attachTags = async (eventId: string, tags: string[]) => {
  const uniqueTags = Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
  if (uniqueTags.length === 0) return;

  const { data: tagRows, error: tagsError } = await supabase
    .from('tags')
    .upsert(
      uniqueTags.map((name) => ({ name, color: '#7D9255' })),
      { onConflict: 'name' },
    )
    .select('id, name');

  if (tagsError) throw tagsError;

  const eventTagRows = (tagRows ?? []).map((tag) => ({
    event_id: eventId,
    tag_id: tag.id,
  }));

  if (eventTagRows.length === 0) return;

  const { error: eventTagsError } = await supabase
    .from('event_tags')
    .upsert(eventTagRows, { onConflict: 'event_id,tag_id' });

  if (eventTagsError) throw eventTagsError;
};

const normalizeEventPayload = (payload: Record<string, unknown>): NormalizedEvent => {
  const category = normalizeCategory(getString(payload.category));
  const isFree = getBoolean(payload.is_free, getString(payload.price).includes('免费') || getString(payload.price) === '');

  return {
    title: getString(payload.title),
    description: getString(payload.description),
    category,
    date: getString(payload.date),
    time: normalizeTime(getString(payload.time)),
    address: getString(payload.address),
    latitude: getNumber(payload.latitude),
    longitude: getNumber(payload.longitude),
    district: getString(payload.district),
    is_free: isFree,
    price: isFree ? 0 : getNumber(payload.price),
    ticket_url: getString(payload.ticket_url),
    organizer: getString(payload.organizer),
    status: normalizeStatus(getString(payload.status)),
    cover_image: getString(payload.cover_image) || undefined,
    tags: normalizeTags(payload.tags),
  };
};

const normalizeCategory = (value: string) => {
  const lowerValue = value.trim().toLowerCase();
  const aliases: Record<string, string> = {
    咖啡: 'coffee',
    coffee: 'coffee',
    音乐: 'music',
    演出: 'music',
    music: 'music',
    市集: 'market',
    market: 'market',
    派对: 'party',
    party: 'party',
    展览: 'exhibition',
    exhibition: 'exhibition',
    酒吧: 'bar',
    bar: 'bar',
    运动: 'sports',
    sports: 'sports',
  };

  const normalized = aliases[lowerValue] ?? lowerValue;
  return eventCategories.includes(normalized as (typeof eventCategories)[number]) ? normalized : '';
};

const normalizeStatus = (value: string): NormalizedEvent['status'] => {
  if (value === 'inactive' || value === 'draft') return value;
  return 'active';
};

const normalizeSourcePlatform = (value: unknown): SourcePlatform => {
  const platform = getString(value).trim().toLowerCase();
  return sourcePlatforms.includes(platform as SourcePlatform) ? (platform as SourcePlatform) : 'manual';
};

const normalizeTime = (value: string) => {
  const trimmed = value.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(\d{1,2})[:：](\d{2})/);
  if (!match) return trimmed;
  return `${match[1].padStart(2, '0')}:${match[2]}`;
};

const normalizeTags = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map((tag) => getString(tag).trim()).filter(Boolean);
  }

  return getString(value)
    .split(/[|;；，,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const getString = (value: unknown) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const getNumber = (value: unknown) => {
  if (typeof value === 'number') return value;
  const parsed = Number(getString(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const getBoolean = (value: unknown, fallback: boolean) => {
  if (typeof value === 'boolean') return value;
  const normalized = getString(value).toLowerCase();
  if (!normalized) return fallback;
  return ['true', '1', 'yes', 'y', '免费', '是'].includes(normalized);
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
};

const toJson = (value: unknown): Json => JSON.parse(JSON.stringify(value)) as Json;

export default AdminIntake;
