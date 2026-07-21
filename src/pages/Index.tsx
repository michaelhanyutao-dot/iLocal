import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Compass, LocateFixed, Send, SlidersHorizontal } from 'lucide-react';
import AppShell from '@/components/AppShell';
import EventCard from '@/components/EventCard';
import EventMap from '@/components/EventMap';
import FilterBar from '@/components/FilterBar';
import FloatingViewToggle from '@/components/FloatingViewToggle';
import SearchBar from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockEvents } from '@/data/mockEvents';
import { useLocation } from '@/hooks/useLocation';
import { useToast } from '@/hooks/use-toast';
import { useEventLibrary } from '@/lib/eventLibrary';
import { Event, EventCategory } from '@/types/event';

const Index = () => {
  const [events] = useState<Event[]>(mockEvents);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(mockEvents[0] ?? null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>([]);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  const { location, loading: locationLoading, error: locationError, requestLocation } = useLocation();
  const { language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const library = useEventLibrary();

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
    requestLocation();
    if (locationError) {
      toast({
        title: '位置权限',
        description: '请在浏览器设置中允许位置访问以获得更好的体验',
        variant: 'destructive',
      });
    }
  };

  return (
    <AppShell>
      <main className="ilocal-page ilocal-page-padding min-h-screen pb-8 pt-6 sm:pb-10 sm:pt-8">
        <header className="space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground sm:h-14 sm:w-14">
                <Compass className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={2.3} />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-black leading-none tracking-normal text-foreground sm:text-[28px]">iLocal</h1>
                <p className="mt-1.5 truncate text-sm font-semibold text-muted-foreground sm:text-base">发现身边正在发生的事</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border/80 bg-card text-base font-bold text-muted-foreground sm:h-11 sm:w-11"
              aria-label="切换语言"
            >
              {language === 'zh' ? '中' : 'EN'}
            </button>
          </div>

          <div className="flex gap-3">
            <SearchBar onSearch={setSearchQuery} placeholder="搜索活动、地点或主办方" />
            <button
              type="button"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary/70 text-foreground sm:h-[52px] sm:w-14"
              aria-label="筛选"
            >
              <SlidersHorizontal className="h-[22px] w-[22px] sm:h-6 sm:w-6" />
            </button>
          </div>

          <FilterBar
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
            onClearCategories={() => setSelectedCategories([])}
          />
        </header>

        <section className="mt-6 sm:mt-8">
          {viewMode === 'map' ? (
            <div className="relative">
              <Card className="overflow-hidden rounded-2xl border-border/80 bg-card p-0 sm:rounded-3xl">
                <div className="h-[calc(100svh-294px)] min-h-[430px] max-h-[600px] sm:h-[560px]">
                  <EventMap
                    events={filteredEvents}
                    userLocation={location}
                    selectedEvent={selectedEvent}
                    onEventSelect={handleEventSelect}
                  />
                </div>
              </Card>
              <Button
                variant="outline"
                size="icon"
                onClick={handleLocationRequest}
                disabled={locationLoading}
                className="absolute right-3 top-3 h-11 w-11 rounded-full bg-card shadow-md sm:right-4 sm:top-4 sm:h-12 sm:w-12"
                aria-label="当前位置"
              >
                {locationError ? (
                  <AlertCircle className="h-6 w-6 text-destructive" />
                ) : (
                  <LocateFixed className="h-6 w-6 text-primary" />
                )}
              </Button>
              {selectedEvent && (
                <button
                  type="button"
                  onClick={() => navigate(`/event/${selectedEvent.id}`)}
                  className="absolute inset-x-3 bottom-4 flex items-center gap-3 rounded-2xl bg-card/95 p-3 text-left shadow-soft backdrop-blur sm:inset-x-4 sm:bottom-5"
                >
                  <img
                    src={selectedEvent.coverImage}
                    alt={selectedEvent.title}
                    className="h-14 w-14 rounded-xl object-cover sm:h-16 sm:w-16 sm:rounded-2xl"
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
