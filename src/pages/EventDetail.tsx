import { useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  Bookmark,
  CalendarPlus,
  Clock,
  CornerUpRight,
  Heart,
  MapPin,
  Navigation,
  Ticket,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import EventLocationMap from '@/components/EventLocationMap';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useEvent } from '@/hooks/useEvents';
import { useToast } from '@/hooks/use-toast';
import { useEventLibrary } from '@/lib/eventLibrary';
import { buildTencentMapMarkerUrl, buildTencentMapRouteUrl, openExternalUrl } from '@/lib/mapLinks';

const categoryLabels: Record<string, string> = {
  coffee: '咖啡',
  music: '音乐',
  market: '市集',
  party: '派对',
  exhibition: '展览',
  bar: '酒吧',
  sports: '运动',
};

const locationAccuracyCopy = {
  area: {
    title: '位置为区域估算',
    body: '该活动目前只有园区、商圈或集合区域线索，出发前建议查看消息来源，或搜索主办方确认最新集合点。',
  },
  unverified: {
    title: '位置尚未核验',
    body: '该位置来自采集线索，地址或坐标还没有完成二次确认。建议先查看来源信息，或继续搜索活动、店面和主办方说明。',
  },
};

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const library = useEventLibrary();
  const [shareOpen, setShareOpen] = useState(false);
  const { event, loading, usingFallback, error: eventError } = useEvent(id);

  if (loading && !event) {
    return (
      <AppShell>
        <main className="ilocal-page flex min-h-screen items-center justify-center px-5 text-center">
          <div className="text-base font-bold text-muted-foreground">正在加载活动...</div>
        </main>
      </AppShell>
    );
  }

  if (!event) {
    return (
      <AppShell>
        <main className="ilocal-page flex min-h-screen items-center justify-center px-5 text-center">
          <div>
            <h1 className="mb-4 text-2xl font-black">活动不存在</h1>
            <Button onClick={() => navigate('/')}>返回发现</Button>
          </div>
        </main>
      </AppShell>
    );
  }

  const shareUrl = typeof window === 'undefined' ? '' : window.location.href;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: shareUrl,
        });
        return;
      } catch {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: '分享链接已复制' });
    } catch {
      setShareOpen(true);
    }
  };

  const handlePlanned = () => {
    const planned = library.togglePlanned(event.id);
    toast({
      title: planned ? '已加入计划' : '已从计划移除',
      description: `${event.dateLabel ?? event.date} ${event.time} · ${event.title}`,
    });
  };

  const handleSaved = () => {
    const saved = library.toggleSaved(event.id);
    toast({ title: saved ? '已收藏' : '已取消收藏' });
  };

  const handleLiked = () => {
    const liked = library.toggleLiked(event.id);
    toast({ title: liked ? '已标记想去' : '已取消想去' });
  };

  const handleOpenMapMarker = () => {
    openExternalUrl(buildTencentMapMarkerUrl(event));
  };

  const handleOpenRoute = () => {
    openExternalUrl(buildTencentMapRouteUrl(event));
  };

  const isSaved = library.isSaved(event.id);
  const isLiked = library.isLiked(event.id);
  const isPlanned = library.isPlanned(event.id);

  return (
    <AppShell>
      <main className="ilocal-page min-h-screen bg-background pb-24">
        <section className="relative">
          <img
            src={event.coverImage}
            alt={event.title}
            className="h-[248px] w-full object-cover sm:h-[280px]"
          />
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-card text-foreground shadow-md sm:left-5 sm:top-5"
            aria-label="返回"
          >
            <ArrowLeft className="h-[22px] w-[22px] sm:h-6 sm:w-6" />
          </button>
          <span className="absolute right-4 top-4 rounded-full bg-card px-3 py-1.5 text-sm font-black shadow-sm sm:right-5 sm:top-5">
            {categoryLabels[event.category] ?? '活动'}
          </span>
        </section>

        <section className="ilocal-page-padding space-y-5 py-6 sm:py-7">
          <div className="space-y-3">
            <h1 className="text-3xl font-black leading-tight text-foreground sm:text-[32px]">{event.title}</h1>
            <p className="text-base font-bold text-muted-foreground">
              {event.organizer} · {event.location.district}
            </p>
            <Badge className="rounded-full bg-secondary px-3 py-1.5 text-sm font-bold text-muted-foreground hover:bg-secondary">
              {isPlanned ? '已安排' : '可安排'}
            </Badge>
            {usingFallback && eventError && (
              <p className="rounded-2xl bg-secondary/55 px-4 py-3 text-sm font-semibold text-muted-foreground">
                {eventError}
              </p>
            )}
          </div>

          <p className="text-base font-semibold leading-relaxed text-muted-foreground">{event.description}</p>

          <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3">
            <InfoTile icon={Clock} label="营业时间" value={`${event.dateLabel ?? event.date} ${event.time}`} />
            <InfoTile icon={MapPin} label="地址" value={event.location.address.replace('北京市', '')} />
            <InfoTile icon={MapPin} label="距离" value="18.5km" />
            <InfoTile icon={Ticket} label="人均" value={event.ticket.isFree ? '免费' : `¥${event.ticket.price}`} />
          </div>

          {event.location.accuracy !== 'precise' && (
            <LocationAccuracyNotice
              title={locationAccuracyCopy[event.location.accuracy]?.title ?? '位置待确认'}
              body={event.location.note || locationAccuracyCopy[event.location.accuracy]?.body}
            />
          )}

          <Card className="rounded-2xl border-border/80 bg-card p-4 shadow-none sm:p-5">
            <h2 className="text-lg font-black text-foreground">{event.title}</h2>
            <div className="mt-3 space-y-2 text-base font-semibold text-muted-foreground">
              <p className="flex items-center gap-2">
                <CalendarPlus className="h-5 w-5" />
                {event.dateLabel ?? event.date}, {event.time}
              </p>
              <p className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                {event.ticket.isFree ? '免费' : `¥${event.ticket.price}`}
              </p>
              <p>{event.description}</p>
            </div>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Badge className="rounded-full bg-secondary px-3 py-1.5 text-sm font-bold text-muted-foreground hover:bg-secondary">
              {categoryLabels[event.category] ?? 'Other'}
            </Badge>
            {event.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} className="rounded-full bg-secondary px-3 py-1.5 text-sm font-bold text-muted-foreground hover:bg-secondary">
                {tag}
              </Badge>
            ))}
          </div>

          <EventLocationMap event={event} onOpenMap={handleOpenMapMarker} />
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-[68px] z-40 border-t border-border/70 bg-card/95 px-2.5 py-2.5 backdrop-blur-xl sm:bottom-[70px] sm:px-3">
        <div className="ilocal-bottom-inner flex items-center gap-1.5 sm:gap-2">
          <ActionButton
            label="收藏"
            active={isSaved}
            onClick={handleSaved}
            icon={<Bookmark className="h-6 w-6" fill={isSaved ? 'currentColor' : 'none'} />}
          />
          <ActionButton
            label="喜欢"
            active={isLiked}
            onClick={handleLiked}
            icon={<Heart className="h-6 w-6" fill={isLiked ? 'currentColor' : 'none'} />}
          />
          <ActionButton
            label="分享"
            onClick={handleShare}
            icon={<CornerUpRight className="h-6 w-6" />}
          />
          <ActionButton
            label="导航"
            icon={<Navigation className="h-6 w-6" />}
            onClick={handleOpenRoute}
          />
          <Button
            onClick={handlePlanned}
            className="h-11 min-w-0 flex-1 rounded-2xl px-2 text-[13px] font-black sm:h-[46px] sm:px-3 sm:text-sm"
          >
            <CalendarPlus className="mr-1 h-4 w-4 shrink-0" />
            {isPlanned ? '已安排' : '加入计划'}
          </Button>
        </div>
      </div>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-[340px] rounded-2xl p-5 sm:max-w-[380px] sm:p-6">
          <h2 className="text-xl font-black">分享 {event.title}</h2>
          <p className="mt-3 text-base font-semibold text-muted-foreground">把这个链接发给朋友，一起看看这个活动。</p>
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-muted p-4">
            <CornerUpRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-base font-semibold">{shareUrl}</span>
            <Button
              variant="ghost"
              className="font-black"
              onClick={() => {
                void navigator.clipboard.writeText(shareUrl);
                setShareOpen(false);
                toast({ title: '分享链接已复制' });
              }}
            >
              复制
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

interface InfoTileProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}

const InfoTile = ({ icon: Icon, label, value }: InfoTileProps) => (
  <div className="min-w-0 rounded-2xl bg-secondary/35 p-4 sm:min-h-[92px]">
    <div className="mb-2 flex items-center gap-2 text-sm font-black text-muted-foreground">
      <Icon className="h-5 w-5" />
      {label}
    </div>
    <div className="line-clamp-2 break-words text-lg font-black leading-tight text-foreground">{value}</div>
  </div>
);

const LocationAccuracyNotice = ({ title, body }: { title: string; body?: string }) => (
  <div className="rounded-2xl border border-primary/20 bg-secondary/35 px-4 py-3 text-muted-foreground">
    <div className="flex gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-card text-primary">
        <AlertTriangle className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-black text-foreground">{title}</p>
        {body && <p className="mt-1 text-sm font-semibold leading-relaxed">{body}</p>}
      </div>
    </div>
  </div>
);

interface ActionButtonProps {
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick: () => void;
}

const ActionButton = ({ label, icon, active, onClick }: ActionButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className={[
      'grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-muted-foreground transition-colors sm:h-[46px] sm:w-[46px]',
      active ? 'border-primary bg-primary text-primary-foreground' : 'border-border/80 bg-card hover:bg-secondary/45',
    ].join(' ')}
  >
    {icon}
  </button>
);

export default EventDetail;
