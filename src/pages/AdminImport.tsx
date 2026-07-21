import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FileSpreadsheet, Upload, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { eventFormSchema, eventCategories } from '@/lib/validation';
import { formatZodErrors } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

type ParsedImportRow = {
  index: number;
  raw: Record<string, string>;
  event: TablesInsert<'events'> | null;
  tags: string[];
  errors: string[];
};

const sampleCsv = `title,description,category,date,time,address,latitude,longitude,district,is_free,price,organizer,status,tags
周五咖啡杯测,本地烘焙师带你认识不同产区咖啡,coffee,2026-07-31,15:00,北京市朝阳区三里屯太古里,39.936500,116.454200,朝阳区,true,,三里屯咖啡社,active,咖啡|杯测|三里屯
夏夜露台爵士,露台小型爵士演出与自然酒,bar,2026-08-01,20:30,北京市东城区雍和宫大街,39.947300,116.417900,东城区,false,88,夜色音乐,active,爵士|自然酒`;

const requiredHeaders = ['title', 'category', 'date', 'time', 'address', 'latitude', 'longitude'];

const AdminImport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [csvText, setCsvText] = useState(sampleCsv);
  const [importing, setImporting] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const parsedRows = useMemo(() => parseImportCsv(csvText, user?.id), [csvText, user?.id]);
  const validRows = parsedRows.filter((row) => row.event);
  const invalidRows = parsedRows.filter((row) => !row.event);
  const missingHeaders = getMissingHeaders(csvText);

  const handleImport = async () => {
    if (missingHeaders.length > 0 || validRows.length === 0) return;

    setImporting(true);
    setLastResult(null);

    try {
      const eventsToInsert = validRows.map((row) => row.event).filter(Boolean) as TablesInsert<'events'>[];
      const { data: insertedEvents, error: eventsError } = await supabase
        .from('events')
        .insert(eventsToInsert)
        .select('id, title');

      if (eventsError) throw eventsError;

      const tagNames = Array.from(new Set(validRows.flatMap((row) => row.tags)));

      if (tagNames.length > 0 && insertedEvents) {
        const { data: tags, error: tagsError } = await supabase
          .from('tags')
          .upsert(
            tagNames.map((name) => ({ name, color: '#7D9255' })),
            { onConflict: 'name' },
          )
          .select('id, name');

        if (tagsError) throw tagsError;

        const tagIdByName = new Map(tags?.map((tag) => [tag.name, tag.id]) ?? []);
        const importedEventIds = insertedEvents.map((event) => event.id);
        const eventTagRows = validRows.flatMap((row, rowIndex) => {
          const eventId = importedEventIds[rowIndex];
          if (!eventId) return [];

          return row.tags
            .map((tagName) => tagIdByName.get(tagName))
            .filter((tagId): tagId is string => Boolean(tagId))
            .map((tagId) => ({ event_id: eventId, tag_id: tagId }));
        });

        if (eventTagRows.length > 0) {
          const { error: eventTagsError } = await supabase
            .from('event_tags')
            .upsert(eventTagRows, { onConflict: 'event_id,tag_id' });

          if (eventTagsError) throw eventTagsError;
        }
      }

      setLastResult(`已成功导入 ${insertedEvents?.length ?? 0} 个活动`);
      toast({
        title: '批量导入成功',
        description: `已写入 ${insertedEvents?.length ?? 0} 个活动`,
      });
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: '批量导入失败',
        description: error instanceof Error ? error.message : '请检查 CSV 内容或数据库权限',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
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
                <h1 className="text-2xl font-bold text-foreground">批量导入活动</h1>
                <p className="text-sm text-muted-foreground">粘贴 CSV，预览校验后写入 Supabase</p>
              </div>
            </div>
            <Button onClick={handleImport} disabled={importing || missingHeaders.length > 0 || validRows.length === 0}>
              <Upload className="mr-2 h-4 w-4" />
              {importing ? '导入中...' : `导入 ${validRows.length} 条`}
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto grid gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="border-border/50 bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              CSV 内容
            </CardTitle>
            <CardDescription>
              必填列：title, category, date, time, address, latitude, longitude。tags 用竖线分隔。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={csvText}
              onChange={(event) => setCsvText(event.target.value)}
              className="min-h-[440px] font-mono text-sm"
              spellCheck={false}
            />
            {missingHeaders.length > 0 && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
                缺少必填列：{missingHeaders.join(', ')}
              </div>
            )}
            {lastResult && (
              <div className="rounded-lg border border-primary/30 bg-secondary/60 px-4 py-3 text-sm font-semibold text-primary">
                {lastResult}
              </div>
            )}
          </CardContent>
        </Card>

        <aside className="space-y-6">
          <Card className="border-border/50 bg-gradient-card">
            <CardHeader>
              <CardTitle>导入预览</CardTitle>
              <CardDescription>先校验，后写入。无效行不会导入。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <PreviewStat label="可导入" value={validRows.length} tone="ok" />
                <PreviewStat label="需修正" value={invalidRows.length} tone="error" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-muted-foreground">支持分类</h3>
                <div className="flex flex-wrap gap-2">
                  {eventCategories.map((category) => (
                    <Badge key={category} variant="secondary" className="rounded-full">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-card">
            <CardHeader>
              <CardTitle>行校验</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[520px] space-y-3 overflow-y-auto">
              {parsedRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无可预览内容</p>
              ) : (
                parsedRows.map((row) => (
                  <div key={row.index} className="rounded-xl border border-border/60 bg-card p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-bold">第 {row.index} 行</span>
                      {row.event ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <p className="line-clamp-1 text-sm font-semibold text-foreground">
                      {row.raw.title || '未填写标题'}
                    </p>
                    {row.errors.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs font-semibold text-destructive">
                        {row.errors.map((error) => (
                          <li key={error}>{error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
};

const PreviewStat = ({ label, value, tone }: { label: string; value: number; tone: 'ok' | 'error' }) => (
  <div className="rounded-xl border border-border/60 bg-card p-4">
    <p className="text-sm font-semibold text-muted-foreground">{label}</p>
    <p className={['mt-1 text-3xl font-black', tone === 'ok' ? 'text-primary' : 'text-destructive'].join(' ')}>
      {value}
    </p>
  </div>
);

const getMissingHeaders = (csvText: string) => {
  const [headerLine] = csvText.trim().split(/\r?\n/);
  const headers = splitCsvLine(headerLine ?? '').map((header) => header.trim());
  return requiredHeaders.filter((header) => !headers.includes(header));
};

const parseImportCsv = (csvText: string, userId?: string): ParsedImportRow[] => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((header) => header.trim());

  return lines.slice(1).map((line, index) => {
    const values = splitCsvLine(line);
    const raw = headers.reduce<Record<string, string>>((row, header, headerIndex) => {
      row[header] = values[headerIndex]?.trim() ?? '';
      return row;
    }, {});

    const tags = parseTags(raw.tags);
    const isFree = parseBoolean(raw.is_free, true);
    const price = raw.price ? Number(raw.price) : 0;
    const latitude = Number(raw.latitude);
    const longitude = Number(raw.longitude);
    const status = raw.status || 'active';

    const formLikeData = {
      title: raw.title,
      description: raw.description || '',
      category: raw.category,
      date: raw.date,
      time: raw.time,
      address: raw.address,
      latitude,
      longitude,
      district: raw.district || '',
      is_free: isFree,
      price,
      ticket_url: raw.ticket_url || '',
      organizer: raw.organizer || '',
      status,
    };

    const result = eventFormSchema.safeParse(formLikeData);

    if (!result.success) {
      return {
        index: index + 2,
        raw,
        event: null,
        tags,
        errors: formatZodErrors(result.error).split('\n'),
      };
    }

    return {
      index: index + 2,
      raw,
      event: {
        title: result.data.title,
        description: result.data.description || null,
        category: result.data.category,
        date: result.data.date,
        time: result.data.time,
        address: result.data.address,
        latitude: result.data.latitude,
        longitude: result.data.longitude,
        district: result.data.district || null,
        is_free: result.data.is_free,
        price: result.data.is_free ? null : result.data.price,
        ticket_url: result.data.ticket_url || null,
        organizer: result.data.organizer || null,
        status: result.data.status,
        attendees: 0,
        created_by: userId ?? null,
        cover_image: raw.cover_image || null,
      },
      tags,
      errors: [],
    };
  });
};

const splitCsvLine = (line: string) => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
};

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (!value) return fallback;
  return ['true', '1', 'yes', 'y', '免费'].includes(value.trim().toLowerCase());
};

const parseTags = (value: string | undefined) =>
  (value ?? '')
    .split(/[|;；，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

export default AdminImport;
