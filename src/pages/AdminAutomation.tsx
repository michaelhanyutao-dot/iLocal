import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock,
  DatabaseZap,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Json, Tables, TablesInsert } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { getAdminBasePath } from '@/lib/adminNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type UpdateSource = Tables<'event_update_sources'>;
type UpdateRun = Tables<'event_update_runs'>;

type SourceForm = {
  name: string;
  platform: string;
  city: string;
  query: string;
  category_hint: string;
  cadence: string;
  status: string;
  notes: string;
};

const emptyForm: SourceForm = {
  name: '',
  platform: 'xiaohongshu',
  city: '北京',
  query: '',
  category_hint: '',
  cadence: 'manual',
  status: 'active',
  notes: '',
};

const platformOptions = [
  { value: 'xiaohongshu', label: '小红书' },
  { value: 'wechat', label: '公众号' },
  { value: 'website', label: '官网/网页' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'partner_api', label: '合作方 API' },
  { value: 'csv', label: 'CSV 批量' },
  { value: 'manual', label: '人工整理' },
  { value: 'other', label: '其他' },
];

const cadenceOptions = [
  { value: 'manual', label: '手动' },
  { value: 'hourly', label: '每小时' },
  { value: 'daily', label: '每天' },
  { value: 'weekly', label: '每周' },
];

const categoryOptions = [
  { value: 'music', label: '音乐' },
  { value: 'market', label: '市集' },
  { value: 'party', label: '派对' },
  { value: 'exhibition', label: '展览' },
  { value: 'bar', label: '酒吧' },
  { value: 'coffee', label: '咖啡' },
  { value: 'sports', label: '运动' },
  { value: 'other', label: '其他' },
];

const statusLabel = {
  active: '启用',
  paused: '暂停',
  queued: '排队中',
  running: '运行中',
  completed: '已完成',
  failed: '失败',
  cancelled: '已取消',
} as const;

const formatDateTime = (value: string | null) => {
  if (!value) return '未记录';
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const platformLabel = (platform: string) =>
  platformOptions.find((option) => option.value === platform)?.label || platform;

const cadenceLabel = (cadence: string) =>
  cadenceOptions.find((option) => option.value === cadence)?.label || cadence;

const runStatusVariant = (status: string) => {
  if (status === 'completed') return 'default';
  if (status === 'failed') return 'destructive';
  if (status === 'running') return 'secondary';
  return 'outline';
};

const AdminAutomation = () => {
  const { user, isAdmin, isModerator } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const adminBase = getAdminBasePath(location.pathname);
  const [sources, setSources] = useState<UpdateSource[]>([]);
  const [runs, setRuns] = useState<UpdateRun[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [form, setForm] = useState<SourceForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [queueing, setQueueing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSource = useMemo(
    () => sources.find((source) => source.id === selectedSourceId) || sources[0],
    [selectedSourceId, sources],
  );

  const sourceNameById = useMemo(
    () => new Map(sources.map((source) => [source.id, source.name])),
    [sources],
  );

  const stats = useMemo(() => {
    const activeSources = sources.filter((source) => source.status === 'active').length;
    const queuedRuns = runs.filter((run) => run.status === 'queued').length;
    const completedRuns = runs.filter((run) => run.status === 'completed').length;
    const failedRuns = runs.filter((run) => run.status === 'failed').length;
    return { activeSources, queuedRuns, completedRuns, failedRuns };
  }, [runs, sources]);

  const fetchAutomation = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [sourcesResult, runsResult] = await Promise.all([
      supabase
        .from('event_update_sources')
        .select('*')
        .order('status', { ascending: true })
        .order('created_at', { ascending: false }),
      supabase
        .from('event_update_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

    if (sourcesResult.error || runsResult.error) {
      const message = sourcesResult.error?.message || runsResult.error?.message || '自动化数据读取失败';
      setError(message);
      setLoading(false);
      return;
    }

    setSources(sourcesResult.data || []);
    setRuns(runsResult.data || []);
    setSelectedSourceId((current) => current || sourcesResult.data?.[0]?.id || '');
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAutomation();
  }, [fetchAutomation]);

  const updateForm = (field: keyof SourceForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateSource = async () => {
    if (!form.name.trim() || !form.query.trim()) {
      toast({
        title: '请补充来源名称和搜索词',
        description: '自动化来源至少需要一个清晰名称和一组可执行的关键词。',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    const payload: TablesInsert<'event_update_sources'> = {
      name: form.name.trim(),
      platform: form.platform,
      city: form.city.trim() || '北京',
      query: form.query.trim(),
      category_hint: form.category_hint || null,
      cadence: form.cadence,
      status: form.status,
      notes: form.notes.trim() || null,
      created_by: user?.id || null,
    };

    const { data, error: insertError } = await supabase
      .from('event_update_sources')
      .insert(payload)
      .select('*')
      .single();

    setSaving(false);

    if (insertError) {
      toast({
        title: '创建来源失败',
        description: insertError.message,
        variant: 'destructive',
      });
      return;
    }

    setForm(emptyForm);
    setSources((current) => [data, ...current]);
    setSelectedSourceId(data.id);
    toast({
      title: '来源已创建',
      description: '现在可以把它加入自动化运行队列。',
    });
  };

  const handleQueueRun = async () => {
    if (!selectedSource) {
      toast({
        title: '请选择一个来源',
        description: '没有来源配置时无法创建运行记录。',
        variant: 'destructive',
      });
      return;
    }

    setQueueing(true);
    const sourceSnapshot = {
      id: selectedSource.id,
      name: selectedSource.name,
      platform: selectedSource.platform,
      city: selectedSource.city,
      query: selectedSource.query,
      category_hint: selectedSource.category_hint,
      cadence: selectedSource.cadence,
      queued_at: new Date().toISOString(),
    };

    const payload: TablesInsert<'event_update_runs'> = {
      source_id: selectedSource.id,
      status: 'queued',
      trigger_type: 'manual',
      source_snapshot: sourceSnapshot as Json,
      summary: {
        note: '已由运营后台排队。部署 activity-updater Edge Function 后，可由定时任务或手动调用处理。',
      } as Json,
      created_by: user?.id || null,
    };

    const { data, error: insertError } = await supabase
      .from('event_update_runs')
      .insert(payload)
      .select('*')
      .single();

    setQueueing(false);

    if (insertError) {
      toast({
        title: '排队失败',
        description: insertError.message,
        variant: 'destructive',
      });
      return;
    }

    setRuns((current) => [data, ...current]);
    toast({
      title: '已创建运行记录',
      description: '下一步由 Edge Function 读取排队任务并写入候选池。',
    });
  };

  const handleToggleSource = async (source: UpdateSource) => {
    const nextStatus = source.status === 'active' ? 'paused' : 'active';
    const { data, error: updateError } = await supabase
      .from('event_update_sources')
      .update({ status: nextStatus })
      .eq('id', source.id)
      .select('*')
      .single();

    if (updateError) {
      toast({
        title: '更新状态失败',
        description: updateError.message,
        variant: 'destructive',
      });
      return;
    }

    setSources((current) => current.map((item) => (item.id === data.id ? data : item)));
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(adminBase)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回 Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  自动化更新流程
                </h1>
                <p className="text-sm text-muted-foreground">
                  来源配置 → 运行记录 → 候选池审核 → 发布活动
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAutomation} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {error && (
          <Card className="mb-6 border-amber-300/60 bg-amber-50 text-amber-950">
            <CardContent className="py-4">
              <p className="font-semibold">自动化表暂不可用</p>
              <p className="mt-1 text-sm">
                请先在 Supabase SQL Editor 运行 `supabase/migrations/20260724003000_activity_update_automation.sql`。
                原始错误：{error}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Bot className="h-4 w-4" />
                启用来源
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSources}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                排队任务
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.queuedRuns}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                完成运行
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedRuns}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4" />
                失败运行
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.failedRuns}</div>
            </CardContent>
          </Card>
        </div>

        {!isAdmin && !isModerator && (
          <Card className="mt-6 border-amber-300/60 bg-amber-50 text-amber-950">
            <CardContent className="py-4 text-sm font-semibold">
              当前账号没有 admin/moderator 角色，页面可能能打开，但写入动作会被 Supabase RLS 拦截。
            </CardContent>
          </Card>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.25fr]">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>新增来源</CardTitle>
              <CardDescription>
                先把稳定搜索词沉淀为来源，之后由定时任务或手动运行写入候选池。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="source-name">来源名称</Label>
                <Input
                  id="source-name"
                  value={form.name}
                  onChange={(event) => updateForm('name', event.target.value)}
                  placeholder="例如：小红书 北京音乐演出"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>平台</Label>
                  <Select value={form.platform} onValueChange={(value) => updateForm('platform', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {platformOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="source-city">城市</Label>
                  <Input
                    id="source-city"
                    value={form.city}
                    onChange={(event) => updateForm('city', event.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="source-query">搜索词 / 来源规则</Label>
                <Textarea
                  id="source-query"
                  value={form.query}
                  onChange={(event) => updateForm('query', event.target.value)}
                  placeholder="北京 周末 音乐 演出 livehouse"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>分类提示</Label>
                  <Select value={form.category_hint || 'other'} onValueChange={(value) => updateForm('category_hint', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>频率</Label>
                  <Select value={form.cadence} onValueChange={(value) => updateForm('cadence', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cadenceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="source-notes">运营说明</Label>
                <Textarea
                  id="source-notes"
                  value={form.notes}
                  onChange={(event) => updateForm('notes', event.target.value)}
                  placeholder="例如：优先核验地址、票务链接和活动时间。"
                  rows={3}
                />
              </div>
              <Button className="w-full" onClick={handleCreateSource} disabled={saving}>
                <DatabaseZap className="w-4 h-4 mr-2" />
                {saving ? '保存中...' : '创建来源'}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle>来源配置</CardTitle>
                <CardDescription>
                  小红书采集、公众号、官网和合作方 API 都统一作为来源管理。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading && <p className="text-sm text-muted-foreground">正在读取自动化配置...</p>}
                {!loading && sources.length === 0 && (
                  <p className="text-sm text-muted-foreground">还没有来源。先创建一个北京活动来源。</p>
                )}
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className={`rounded-lg border p-4 transition-colors ${
                      selectedSource?.id === source.id ? 'border-primary bg-primary/5' : 'border-border bg-card/60'
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <button
                        type="button"
                        className="flex-1 text-left"
                        onClick={() => setSelectedSourceId(source.id)}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{source.name}</h3>
                          <Badge variant={source.status === 'active' ? 'default' : 'secondary'}>
                            {source.status === 'active' ? '启用' : '暂停'}
                          </Badge>
                          <Badge variant="outline">{platformLabel(source.platform)}</Badge>
                          <Badge variant="outline">{cadenceLabel(source.cadence)}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{source.query}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          城市：{source.city} · 分类：{source.category_hint || '未指定'} · 最近运行：{formatDateTime(source.last_run_at)}
                        </p>
                      </button>
                      <Button variant="outline" size="sm" onClick={() => handleToggleSource(source)}>
                        {source.status === 'active' ? (
                          <PauseCircle className="w-4 h-4 mr-2" />
                        ) : (
                          <PlayCircle className="w-4 h-4 mr-2" />
                        )}
                        {source.status === 'active' ? '暂停' : '启用'}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle>手动排队运行</CardTitle>
                <CardDescription>
                  先创建运行记录；部署 Edge Function 后，运行器会读取排队任务并把结果写入候选池。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>选择来源</Label>
                  <Select value={selectedSource?.id || ''} onValueChange={setSelectedSourceId}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择来源" />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map((source) => (
                        <SelectItem key={source.id} value={source.id}>
                          {source.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedSource && (
                  <div className="rounded-lg border border-border bg-card/60 p-4 text-sm">
                    <p className="font-semibold">{selectedSource.name}</p>
                    <p className="mt-1 text-muted-foreground">{selectedSource.query}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {platformLabel(selectedSource.platform)} · {selectedSource.city} · {cadenceLabel(selectedSource.cadence)}
                    </p>
                  </div>
                )}
                <Button className="w-full" onClick={handleQueueRun} disabled={queueing || !selectedSource}>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  {queueing ? '排队中...' : '创建运行记录'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-6 bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle>最近运行记录</CardTitle>
            <CardDescription>
              运行完成后，新增活动会进入 `/dashboard/intake`，由人工审核后发布。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-3 pr-4 font-medium">来源</th>
                    <th className="py-3 pr-4 font-medium">状态</th>
                    <th className="py-3 pr-4 font-medium">触发</th>
                    <th className="py-3 pr-4 font-medium">发现</th>
                    <th className="py-3 pr-4 font-medium">候选</th>
                    <th className="py-3 pr-4 font-medium">重复</th>
                    <th className="py-3 pr-4 font-medium">创建时间</th>
                    <th className="py-3 font-medium">错误</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">
                        {run.source_id ? sourceNameById.get(run.source_id) || '来源已删除' : '未绑定来源'}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={runStatusVariant(run.status)}>
                          {statusLabel[run.status as keyof typeof statusLabel] || run.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">{run.trigger_type}</td>
                      <td className="py-3 pr-4">{run.discovered_count}</td>
                      <td className="py-3 pr-4">{run.candidate_count}</td>
                      <td className="py-3 pr-4">{run.duplicate_count}</td>
                      <td className="py-3 pr-4">{formatDateTime(run.created_at)}</td>
                      <td className="max-w-[240px] py-3 text-muted-foreground">
                        {run.error_message || '-'}
                      </td>
                    </tr>
                  ))}
                  {!loading && runs.length === 0 && (
                    <tr>
                      <td className="py-6 text-muted-foreground" colSpan={8}>
                        还没有运行记录。先创建一个运行记录，后续接入采集器即可自动填充候选池。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAutomation;
