import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Calendar, CheckCircle2, Clock, Heart, List, MapPin } from 'lucide-react';
import AppShell from '@/components/AppShell';
import EventCard from '@/components/EventCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { mockEvents } from '@/data/mockEvents';
import { useEventLibrary } from '@/lib/eventLibrary';

type SavedView = 'list' | 'calendar';
type SavedFilter = 'saved' | 'want' | 'planned' | 'past';
type CalendarMode = 'month' | 'agenda';

const filters: { key: SavedFilter; label: string }[] = [
  { key: 'saved', label: '收藏' },
  { key: 'want', label: '想去' },
  { key: 'planned', label: '已安排' },
  { key: 'past', label: '去过' },
];

const calendarCells = [
  { day: 29, outside: true },
  { day: 30, outside: true },
  ...Array.from({ length: 31 }, (_, index) => ({ day: index + 1, outside: false })),
  { day: 1, outside: true },
  { day: 2, outside: true },
];

const Saved = () => {
  const [view, setView] = useState<SavedView>('list');
  const [filter, setFilter] = useState<SavedFilter>('saved');
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('month');
  const navigate = useNavigate();
  const library = useEventLibrary();

  const eventsByFilter = useMemo(() => {
    const pastCutoff = '2026-07-21';
    const byId = (ids: string[]) => mockEvents.filter((event) => ids.includes(event.id));

    return {
      saved: byId(library.savedIds),
      want: byId(library.likedIds),
      planned: byId(library.plannedIds),
      past: mockEvents.filter((event) => event.date < pastCutoff && library.savedIds.includes(event.id)),
    } satisfies Record<SavedFilter, typeof mockEvents>;
  }, [library.likedIds, library.plannedIds, library.savedIds]);

  const visibleEvents = eventsByFilter[filter];
  const calendarEvents = eventsByFilter.planned.length > 0 ? eventsByFilter.planned : eventsByFilter.saved;
  const eventDays = new Set(calendarEvents.map((event) => Number(event.date.slice(-2))));
  const selectedDayEvents = calendarEvents.filter((event) => event.date === '2026-07-21');

  return (
    <AppShell>
      <main className="mx-auto min-h-screen w-full max-w-[390px] bg-background px-5 pb-10 pt-10">
        <h1 className="text-4xl font-black tracking-normal text-foreground">我的收藏</h1>

        <section className="mt-8 space-y-6">
          <div className="grid rounded-3xl bg-secondary/70 p-1.5 grid-cols-2">
            <ModeButton active={view === 'list'} onClick={() => setView('list')} icon={<List className="h-6 w-6" />} label="列表" />
            <ModeButton active={view === 'calendar'} onClick={() => setView('calendar')} icon={<Calendar className="h-6 w-6" />} label="日历" />
          </div>

          {view === 'list' ? (
            <>
              <div className="grid grid-cols-4 gap-3">
                {filters.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFilter(item.key)}
                    className={[
                      'h-14 rounded-2xl text-base font-black transition-colors',
                      filter === item.key ? 'bg-primary text-primary-foreground' : 'bg-secondary/65 text-muted-foreground',
                    ].join(' ')}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {visibleEvents.length === 0 ? (
                <EmptySaved onDiscover={() => navigate('/')} />
              ) : (
                <div className="grid grid-cols-2 items-start gap-4">
                  {visibleEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      distance="1.2km"
                      isSaved={library.isSaved(event.id)}
                      onToggleSaved={() => library.toggleSaved(event.id)}
                      onClick={() => navigate(`/event/${event.id}`)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <section className="space-y-6">
              <div className="grid rounded-3xl bg-secondary/70 p-1.5 grid-cols-2">
                <ModeButton active={calendarMode === 'month'} onClick={() => setCalendarMode('month')} label="月历" />
                <ModeButton active={calendarMode === 'agenda'} onClick={() => setCalendarMode('agenda')} label="日程" />
              </div>

              <Card className="rounded-[28px] border-border/80 bg-card p-5 shadow-none">
                <div className="mb-6 flex items-center justify-between text-muted-foreground">
                  <button type="button" className="text-3xl font-black" aria-label="上个月">‹</button>
                  <h2 className="text-2xl font-black text-foreground">Jul 2026</h2>
                  <button type="button" className="text-3xl font-black" aria-label="下个月">›</button>
                </div>

                <div className="grid grid-cols-7 gap-y-4 text-center">
                  {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
                    <div key={day} className="text-base font-black text-muted-foreground">{day}</div>
                  ))}
                  {calendarCells.map((cell, index) => {
                    const hasEvent = !cell.outside && eventDays.has(cell.day);
                    const isToday = !cell.outside && cell.day === 21;
                    return (
                      <button
                        key={`${cell.day}-${index}`}
                        type="button"
                        className={[
                          'relative mx-auto grid h-12 w-12 place-items-center rounded-2xl text-lg font-bold',
                          cell.outside ? 'text-muted-foreground/35' : 'text-foreground',
                          isToday ? 'border-2 border-primary bg-secondary/50 text-primary' : '',
                        ].join(' ')}
                      >
                        {cell.day}
                        {hasEvent && <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-primary" />}
                      </button>
                    );
                  })}
                </div>

                <Button variant="outline" className="mt-6 h-12 w-full rounded-2xl text-base font-black text-primary">
                  回到今天
                </Button>
              </Card>

              <div className="space-y-3">
                <h2 className="text-lg font-black text-muted-foreground">回到今天</h2>
                {selectedDayEvents.length === 0 ? (
                  <p className="text-xl font-bold text-muted-foreground">当天没有记录</p>
                ) : (
                  selectedDayEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => navigate(`/event/${event.id}`)}
                      className="w-full rounded-3xl border border-border/80 bg-card p-4 text-left shadow-card"
                    >
                      <div className="flex items-start gap-3">
                        <img src={event.coverImage} alt={event.title} className="h-16 w-16 rounded-2xl object-cover" />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-lg font-black text-foreground">{event.title}</h3>
                          <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {event.time}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {event.location.district}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>
          )}
        </section>
      </main>
    </AppShell>
  );
};

interface ModeButtonProps {
  active: boolean;
  onClick: () => void;
  icon?: ReactNode;
  label: string;
}

const ModeButton = ({ active, onClick, icon, label }: ModeButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      'flex h-14 items-center justify-center gap-2 rounded-2xl text-lg font-black transition-colors',
      active ? 'bg-card text-foreground shadow-card ring-2 ring-primary/30' : 'text-muted-foreground',
    ].join(' ')}
  >
    {icon}
    {label}
  </button>
);

const EmptySaved = ({ onDiscover }: { onDiscover: () => void }) => (
  <div className="grid min-h-[520px] place-items-center text-center">
    <div className="space-y-4">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-secondary/70 text-primary">
        <Bookmark className="h-10 w-10" />
      </div>
      <div className="space-y-2 text-xl font-black text-muted-foreground">
        <p>还没有收藏</p>
        <button type="button" onClick={onDiscover} className="underline underline-offset-4">
          去发现
        </button>
      </div>
      <div className="flex justify-center gap-3 text-muted-foreground">
        <Heart className="h-5 w-5" />
        <CheckCircle2 className="h-5 w-5" />
      </div>
    </div>
  </div>
);

export default Saved;
