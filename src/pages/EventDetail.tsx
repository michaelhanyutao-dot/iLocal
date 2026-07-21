import { useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useEvent } from '@/hooks/useEvents';
import { useToast } from '@/hooks/use-toast';
import { useEventLibrary } from '@/lib/eventLibrary';

const categoryLabels: Record<string, string> = {
  coffee: '咖啡',
  music: '音乐',
  market: '市集',
  party: '派对',
  exhibition: '活动',
  bar: '酒吧',
  sports: '运动',
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

          <Card className="rounded-2xl border-border/80 bg-card p-4 shadow-none sm:p-5">
            <h2 className="text-lg font-black text-foreground">{event.title.includes('公园') ? '朝阳公园周末市集' : event.title}</h2>
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

          <button
            type="button"
            className="grid h-28 w-full place-items-center rounded-2xl border border-border/80 bg-secondary/35 text-center text-primary"
          >
            <span className="flex flex-col items-center gap-2 text-base font-black">
              <MapPin className="h-7 w-7" />
              在腾讯地图中查看
            </span>
          </button>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-[68px] z-40 border-t border-border/70 bg-card/95 px-2.5 py-2.5 backdrop-blur-xl sm:bottom-[70px] sm:px-3">
        <div className="ilocal-bottom-inner flex items-center gap-1.5 sm:gap-2">
          <ActionButton
            label="收藏"
            active={isSaved}
            onClick={() => library.toggleSaved(event.id)}
            icon={<Bookmark className="h-6 w-6" fill={isSaved ? 'currentColor' : 'none'} />}
          />
          <ActionButton
            label="喜欢"
            active={isLiked}
            onClick={() => library.toggleLiked(event.id)}
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
            onClick={() => toast({ title: '导航功能后续接入腾讯地图' })}
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
          <h2 className="text-xl font-black">Share {event.title}</h2>
          <p className="mt-3 text-base font-semibold text-muted-foreground">Send this link to friends so they can check it out.</p>
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
              Copy
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
