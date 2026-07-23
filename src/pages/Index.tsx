import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Compass, Send } from 'lucide-react';
import AppShell from '@/components/AppShell';
import EventCard from '@/components/EventCard';
import EventMap from '@/components/EventMap';
import FilterBar from '@/components/FilterBar';
import FloatingViewToggle from '@/components/FloatingViewToggle';
import SearchBar from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEvents } from '@/hooks/useEvents';
import { useLocation } from '@/hooks/useLocation';
import { useToast } from '@/hooks/use-toast';
import { useEventLibrary } from '@/lib/eventLibrary';
import { Event, EventCategory } from '@/types/event';

const Index = () => {
  const { events, loading: eventsLoading, usingFallback, error: eventsError } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>([]);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  const { location, loading: locationLoading, error: locationError, requestLocation } = useLocation();
  const { language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const library = useEventLibrary();

  useEffect(() => {
    setSelectedEvent((current) => {
      if (!current) return null;
      return events.some((event) => event.id === current.id) ? current : null;
    });
  }, [events]);

  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.organizer.toLowerCase().includes(query) ||
        event.location.address.toLowerCase().includes(query) ||
        event.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(event => selectedCategories.includes(event.category));
    }

    return filtered;
  }, [events, searchQuery, selectedCategories]);

  useEffect(() => {
    setSelectedEvent((current) => {
      if (!current) return null;
      return filteredEvents.some((event) => event.id === current.id) ? current : null;
    });
  }, [filteredEvents]);

  const handleCategoryToggle = (category: EventCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    toast({
      title: event.title,
      description: `${event.dateLabel ?? event.date} ${event.time} · ${event.location.district}`,
    });
  };

  const handleLocationRequest = () => {
    toast({
      title: '正在获取当前位置',
      description: '如果浏览器或小程序弹出权限提示，请选择允许定位。',
    });
    requestLocation();
  };

  useEffect(() => {
    if (!locationError) return;
    toast({
      title: '无法定位当前位置',
      description: '请在浏览器或小程序设置中允许定位权限，然后再试一次。',
      variant: 'destructive',
    });
  }, [locationError, toast]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
  };

  return (
    <AppShell>
      <main className="ilocal-page ilocal-page-padding min-h-screen pb-8 pt-6 sm:pb-10 sm:pt-8">
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground sm:h-[52px] sm:w-[52px]">
                <Compass className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.3} />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-black leading-none tracking-normal text-foreground sm:text-[26px]">iLocal</h1>
                <p className="mt-1.5 truncate text-sm font-semibold text-muted-foreground">发现身边正在发生的事</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border/80 bg-card text-sm font-bold text-muted-foreground sm:h-11 sm:w-11 sm:text-base"
              aria-label="切换语言"
            >
              {language === 'zh' ? '中' : 'EN'}
            </button>
          </div>

          <div className="flex">
            <SearchBar value={searchQuery} onSearch={setSearchQuery} placeholder="搜索活动、地点或主办方" />
          </div>

          <FilterBar
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
            onClearCategories={() => setSelectedCategories([])}
          />

          {usingFallback && eventsError && (
            <div className="rounded-2xl bg-secondary/55 px-4 py-3 text-sm font-semibold text-muted-foreground">
              {eventsError}
            </div>
          )}
        </header>

        <section className="mt-5 sm:mt-6">
          {filteredEvents.length === 0 ? (
            <Card className="grid min-h-[360px] place-items-center rounded-2xl border-border/80 bg-card p-6 text-center shadow-none">
              <div className="space-y-4">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary/70 text-primary">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-black text-foreground">没有找到匹配活动</h2>
                  <p className="text-sm font-semibold text-muted-foreground">换个关键词，或清除分类筛选后再试。</p>
                </div>
                <Button variant="outline" onClick={clearFilters}>
                  清除筛选
                </Button>
              </div>
            </Card>
          ) : viewMode === 'map' ? (
            <div className="relative">
              <Card className="overflow-hidden rounded-2xl border-border/80 bg-card p-0">
                <div className="h-[calc(100svh-286px)] min-h-[400px] max-h-[560px] sm:h-[520px]">
                  <EventMap
                    events={filteredEvents}
                    userLocation={location}
                    selectedEvent={selectedEvent}
                    onEventSelect={handleEventSelect}
                    onLocationRequest={handleLocationRequest}
                    locationLoading={locationLoading}
                    locationError={locationError}
                  />
                </div>
              </Card>
              {eventsLoading && (
                <div className="absolute inset-x-8 top-6 rounded-full bg-card/95 px-4 py-2 text-center text-sm font-bold text-muted-foreground shadow-soft">
                  正在加载活动...
                </div>
              )}
              {selectedEvent && (
                <button
                  type="button"
                  onClick={() => navigate(`/event/${selectedEvent.id}`)}
                  className="absolute inset-x-3 bottom-4 flex items-center gap-3 rounded-2xl bg-card/95 p-3 text-left shadow-soft backdrop-blur sm:inset-x-4 sm:bottom-5"
                >
                  <img
                    src={selectedEvent.coverImage}
                    alt={selectedEvent.title}
                    className="h-14 w-14 rounded-xl object-cover sm:h-[60px] sm:w-[60px]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black text-foreground sm:text-base">{selectedEvent.title}</span>
                    <span className="mt-1 block truncate text-xs font-semibold text-muted-foreground sm:text-sm">
                      {selectedEvent.location.district} · {selectedEvent.ticket.isFree ? '免费' : `¥${selectedEvent.ticket.price}`}
                    </span>
                  </span>
                  <Send className="h-5 w-5 shrink-0 text-primary" />
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-3 sm:gap-4">
              {filteredEvents.map((event) => (
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
        </section>
      </main>

      <FloatingViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
    </AppShell>
  );
};

export default Index;
