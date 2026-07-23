import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { getAdminBasePath } from '@/lib/adminNavigation';
import { eventCategories, eventFormSchema, formatZodErrors } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

type Candidate = Tables<'event_import_candidates'>;
type PublishedEvent = Pick<Tables<'events'>, 'id' | 'title' | 'date' | 'time' | 'address' | 'district' | 'status'>;
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

type DuplicateMatch = {
  event: PublishedEvent;
  reason: string;
};

const sourcePlatforms: SourcePlatform[] = ['xiaohongshu', 'manual', 'wechat', 'instagram', 'website', 'other'];

const statusLabels: Record<CandidateStatus, string> = {
  all: '全部',
  pending: '待审核',
  imported: '已发布',
  rejected: '已拒绝',
};

const beijingSampleEvents = [
  {
    source_platform: 'manual',
    source_url: '',
    source_title: '北京 demo 活动样本',
    title: '胡同夜游摄影散步',
    description: '跟随本地摄影师穿过东城胡同，记录夏夜街景与小店灯光。',
    category: 'exhibition',
    date: '2026-07-26',
    time: '19:30',
    address: '北京市东城区五道营胡同',
    latitude: 39.9498,
    longitude: 116.4142,
    district: '东城区',
    is_free: false,
    price: 68,
    organizer: '北京城市漫游',
    status: 'active',
    tags: ['摄影', '胡同', '城市漫游'],
  },
  {
    source_platform: 'manual',
    source_url: '',
    source_title: '北京 demo 活动样本',
    title: '三里屯独立乐队现场',
    description: '三支本地独立乐队轮番演出，适合下班后和朋友一起去听。',
    category: 'music',
    date: '2026-07-31',
    time: '20:00',
    address: '北京市朝阳区工体北路8号三里屯SOHO',
    latitude: 39.9365,
    longitude: 116.4542,
    district: '朝阳区',
    is_free: false,
    price: 120,
    organizer: '三里屯现场计划',
    status: 'active',
    tags: ['独立音乐', '现场演出', '三里屯'],
  },
  {
    source_platform: 'manual',
    source_url: '',
    source_title: '北京 demo 活动样本',
    title: '亮马河周末咖啡市集',
    description: '本地烘焙品牌集合，含手冲体验、甜点摊位和露天座位。',
    category: 'coffee',
    date: '2026-08-01',
    time: '14:00',
    address: '北京市朝阳区亮马河国际风情水岸',
    latitude: 39.9504,
    longitude: 116.4686,
    district: '朝阳区',
    is_free: true,
    price: 0,
    organizer: '亮马河生活节',
    status: 'active',
    tags: ['咖啡', '市集', '周末'],
  },
  {
    source_platform: 'manual',
    source_url: '',
    source_title: '北京 demo 活动样本',
    title: '798 夏日晚间艺术展',
    description: '当代艺术展夜间延时开放，包含导览和小型影像放映。',
    category: 'exhibition',
    date: '2026-08-02',
    time: '18:30',
    address: '北京市朝阳区酒仙桥路4号798艺术区',
    latitude: 39.9841,
    longitude: 116.4956,
    district: '朝阳区',
    is_free: false,
    price: 88,
    organizer: '798艺术区',
    status: 'active',
    tags: ['当代艺术', '夜场', '展览'],
  },
  {
    source_platform: 'manual',
    source_url: '',
    source_title: '北京 demo 活动样本',
    title: '朝阳公园草坪飞盘局',
    description: '面向新手的轻量飞盘活动，现场分组，有基础规则说明。',
    category: 'sports',
    date: '2026-08-08',
    time: '16:30',
    address: '北京市朝阳区朝阳公园南路1号',
    latitude: 39.9337,
    longitude: 116.4781,
    district: '朝阳区',
    is_free: false,
    price: 39,
    organizer: '城市运动小队',
    status: 'active',
    tags: ['飞盘', '户外', '新手友好'],
  },
  {
    source_platform: 'manual',
    source_url: '',
    source_title: '北京 demo 活动样本',
    title: '前门老街手作市集',
    description: '独立设计、手作饰品、复古小物和本地小吃摊位集合。',
    category: 'market',
    date: '2026-08-09',
    time: '11:00',
    address: '北京市东城区前门大街',
    latitude: 39.8993,
    longitude: 116.3972,
    district: '东城区',
    is_free: true,
    price: 0,
    organizer: '前门生活方式市集',
    status: 'active',
    tags: ['手作', '复古', '市集'],
  },
  {
    source_platform: 'manual',
    source_url: '',
    source_title: '北京 demo 活动样本',
    title: '国子监书店读书夜',
    description: '围绕城市旅行与生活方式书籍的分享会，含自由交流时间。',
    category: 'coffee',
    date: '2026-08-12',
    time: '19:00',
    address: '北京市东城区国子监街',
    latitude: 39.9489,
    longitude: 116.4116,
    district: '东城区',
    is_free: false,
    price: 49,
    organizer: '胡同书友会',
    status: 'active',
    tags: ['读书会', '咖啡', '交流'],
  },
  {
    source_platform: 'manual',
    source_url: '',
    source_title: '北京 demo 活动样本',
    title: '五棵松露台夏日派对',
    description: 'DJ、轻食和露台社交，适合想认识新朋友的周末夜晚。',
    category: 'party',
    date: '2026-08-15',
    time: '20:30',
    address: '北京市海淀区复兴路69号华熙LIVE',
    latitude: 39.9126,
    longitude: 116.2805,
    district: '海淀区',
    is_free: false,
    price: 99,
    organizer: 'Weekend Social Club',
    status: 'active',
    tags: ['派对', 'DJ', '社交'],
  },
  {
    source_platform: 'manual',
    source_url: '',
    source_title: '北京 demo 活动样本',
    title: '鼓楼爵士酒吧即兴夜',
    description: '本地爵士音乐人开放 Jam Session，现场提供精酿与小食。',
    category: 'bar',
    date: '2026-08-16',
    time: '21:30',
    address: '北京市西城区旧鼓楼大街',
    latitude: 39.9442,
    longitude: 116.3896,
    district: '西城区',
    is_free: false,
    price: 78,
    organizer: '鼓楼夜声',
    status: 'active',
    tags: ['爵士', '酒吧', 'Jam'],
  },
  {
    source_platform: 'manual',
    source_url: '',
    source_title: '北京 demo 活动样本',
    title: '首钢园城市骑行集合',
    description: '从首钢园出发的轻松骑行路线，适合周末低强度运动。',
    category: 'sports',
    date: '2026-08-22',
    time: '09:00',
    address: '北京市石景山区石景山路68号首钢园',
    latitude: 39.9121,
    longitude: 116.1695,
    district: '石景山区',
    is_free: true,
    price: 0,
    organizer: '北京轻骑计划',
    status: 'active',
    tags: ['骑行', '首钢园', '户外'],
  },
];

const sampleJson = JSON.stringify(beijingSampleEvents, null, 2);

const AdminIntake = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const adminBase = getAdminBasePath(location.pathname);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [publishedEvents, setPublishedEvents] = useState<PublishedEvent[]>([]);
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

  const fetchPublishedEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, date, time, address, district, status')
      .order('date', { ascending: false })
      .limit(500);

    if (error) {
      console.error('Error fetching published events for duplicate checks:', error);
      return;
    }

    setPublishedEvents(data ?? []);
  }, []);

  const refreshData = useCallback(async () => {
    await Promise.all([fetchCandidates(), fetchPublishedEvents()]);
  }, [fetchCandidates, fetchPublishedEvents]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

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

  const duplicateMatchesByCandidate = useMemo(() => {
    return new Map(
      candidates.map((candidate) => [
        candidate.id,
        findDuplicateEvents(normalizeEventPayload(asRecord(candidate.normalized_event)), publishedEvents),
      ]),
    );
  }, [candidates, publishedEvents]);

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
      await refreshData();
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
      await refreshData();
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

    await refreshData();
  };

  const handlePublishCandidate = async (candidate: Candidate) => {
    const normalized = normalizeEventPayload(asRecord(candidate.normalized_event));
    const validation = validateNormalizedEvent(normalized);
    const duplicateMatches = findDuplicateEvents(normalized, publishedEvents);

    if (!validation.valid) {
      toast({
        title: '线索还不能发布',
        description: validation.errors.join('\n'),
        variant: 'destructive',
      });
      return;
    }

    if (duplicateMatches.length > 0) {
      toast({
        title: '疑似重复活动',
        description: `已找到 ${duplicateMatches.length} 个正式活动匹配，请先编辑关键字段或确认已有活动。`,
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
      await refreshData();
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
              <Button variant="ghost" onClick={() => navigate(adminBase)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回管理后台
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">采集候选池</h1>
                <p className="text-sm text-muted-foreground">先收集线索，审核后发布为正式活动</p>
              </div>
            </div>
            <Button onClick={refreshData} variant="outline" disabled={loading}>
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
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setJsonText(sampleJson)}>
                载入北京样本
              </Button>
              <Button type="button" variant="ghost" onClick={() => setJsonText('')}>
                清空
              </Button>
            </div>
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
                  duplicateMatches={duplicateMatchesByCandidate.get(candidate.id) ?? []}
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
  duplicateMatches: DuplicateMatch[];
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
  duplicateMatches,
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
  const hasDuplicates = duplicateMatches.length > 0;

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
                <span className={['inline-flex items-center text-xs font-bold', hasDuplicates ? 'text-amber-700' : 'text-primary'].join(' ')}>
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  {hasDuplicates ? '疑似重复' : '可发布'}
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

        {hasDuplicates && (
          <div className="rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
            <p className="mb-2 font-black">检测到可能重复的正式活动，发布前请先核对：</p>
            <div className="space-y-2">
              {duplicateMatches.map((match) => (
                <a
                  key={`${match.event.id}-${match.reason}`}
                  href={`/event/${match.event.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg bg-card/80 px-3 py-2 text-amber-950 underline-offset-4 hover:underline"
                >
                  {match.event.title} · {match.event.date} {String(match.event.time).slice(0, 5)} · {match.reason}
                </a>
              ))}
            </div>
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
          <Button onClick={() => onPublish(candidate)} disabled={saving || candidate.status === 'imported' || !validation.valid || hasDuplicates}>
            <Send className="mr-2 h-4 w-4" />
            {hasDuplicates ? '需先去重' : '发布活动'}
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

const findDuplicateEvents = (event: NormalizedEvent, publishedEvents: PublishedEvent[]): DuplicateMatch[] => {
  if (!event.title || !event.date) return [];

  const titleKey = normalizeComparable(event.title);
  const addressKey = normalizeComparable(event.address);
  const timeKey = normalizeTime(event.time);

  return publishedEvents
    .map((publishedEvent) => {
      const sameTitleAndDate = normalizeComparable(publishedEvent.title) === titleKey && publishedEvent.date === event.date;
      const samePlaceAndTime = Boolean(addressKey)
        && normalizeComparable(publishedEvent.address) === addressKey
        && publishedEvent.date === event.date
        && normalizeTime(String(publishedEvent.time).slice(0, 5)) === timeKey;

      if (sameTitleAndDate) return { event: publishedEvent, reason: '同标题同日期' };
      if (samePlaceAndTime) return { event: publishedEvent, reason: '同日期同时间同地址' };
      return null;
    })
    .filter((match): match is DuplicateMatch => Boolean(match));
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

const normalizeComparable = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[，,。.\-—_·]/g, '');

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
