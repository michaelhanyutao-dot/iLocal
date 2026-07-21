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
      <main className="ilocal-page ilocal-page-padding min-h-screen pb-8 pt-8 sm:pb-10 sm:pt-10">
        <h1 className="text-3xl font-black tracking-normal text-foreground sm:text-4xl">我的收藏</h1>

        <section className="mt-6 space-y-5 sm:mt-8 sm:space-y-6">
          <div className="grid grid-cols-2 rounded-2xl bg-secondary/70 p-1.5 sm:rounded-3xl">
            <ModeButton active={view === 'list'} onClick={() => setView('list')} icon={<List className="h-6 w-6" />} label="列表" />
            <ModeButton active={view === 'calendar'} onClick={() => setView('calendar')} icon={<Calendar className="h-6 w-6" />} label="日历" />
          </div>

          {view === 'list' ? (
            <>
              <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                {filters.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFilter(item.key)}
                    className={[
                      'h-12 rounded-2xl text-sm font-black transition-colors sm:h-14 sm:text-base',
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
                <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-3 sm:gap-4">
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
              <div className="grid grid-cols-2 rounded-2xl bg-secondary/70 p-1.5 sm:rounded-3xl">
                <ModeButton active={calendarMode === 'month'} onClick={() => setCalendarMode('month')} label="月历" />
                <ModeButton active={calendarMode === 'agenda'} onClick={() => setCalendarMode('agenda')} label="日程" />
              </div>

              <Card className="rounded-2xl border-border/80 bg-card p-4 shadow-none sm:rounded-3xl sm:p-5">
                <div className="mb-5 flex items-center justify-between text-muted-foreground sm:mb-6">
                  <button type="button" className="text-2xl font-black sm:text-3xl" aria-label="上个月">‹</button>
                  <h2 className="text-xl font-black text-foreground sm:text-2xl">Jul 2026</h2>
                  <button type="button" className="text-2xl font-black sm:text-3xl" aria-label="下个月">›</button>
                </div>

                <div className="grid grid-cols-7 gap-y-3 text-center sm:gap-y-4">
                  {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
                    <div key={day} className="text-sm font-black text-muted-foreground sm:text-base">{day}</div>
                  ))}
                  {calendarCells.map((cell, index) => {
                    const hasEvent = !cell.outside && eventDays.has(cell.day);
                    const isToday = !cell.outside && cell.day === 21;
                    return (
                      <button
                        key={`${cell.day}-${index}`}
                        type="button"
                        className={[
                          'relative mx-auto grid h-10 w-10 place-items-center rounded-xl text-base font-bold sm:h-12 sm:w-12 sm:rounded-2xl sm:text-lg',
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

                <Button variant="outline" className="mt-5 h-11 w-full rounded-2xl text-sm font-black text-primary sm:mt-6 sm:h-12 sm:text-base">
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
                      className="w-full rounded-2xl border border-border/80 bg-card p-4 text-left shadow-card"
                    >
                      <div className="flex items-start gap-3">
                        <img src={event.coverImage} alt={event.title} className="h-14 w-14 rounded-xl object-cover sm:h-16 sm:w-16 sm:rounded-2xl" />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-base font-black text-foreground sm:text-lg">{event.title}</h3>
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
      'flex h-12 items-center justify-center gap-2 rounded-xl text-base font-black transition-colors sm:h-14 sm:rounded-2xl sm:text-lg',
      active ? 'bg-card text-foreground shadow-card ring-2 ring-primary/30' : 'text-muted-foreground',
    ].join(' ')}
  >
    {icon}
    {label}
  </button>
);

const EmptySaved = ({ onDiscover }: { onDiscover: () => void }) => (
  <div className="grid min-h-[460px] place-items-center text-center sm:min-h-[520px]">
    <div className="space-y-4">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary/70 text-primary sm:h-20 sm:w-20">
        <Bookmark className="h-8 w-8 sm:h-10 sm:w-10" />
      </div>
      <div className="space-y-2 text-lg font-black text-muted-foreground sm:text-xl">
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
