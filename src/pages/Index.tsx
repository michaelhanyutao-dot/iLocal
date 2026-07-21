import { useState, useMemo } from 'react';
import { Event, EventCategory } from '@/types/event';
import { mockEvents } from '@/data/mockEvents';
import { useLocation } from '@/hooks/useLocation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import EventMap from '@/components/EventMap';
import EventCard from '@/components/EventCard';
import SearchBar from '@/components/SearchBar';
import FilterBar from '@/components/FilterBar';
import FloatingViewToggle from '@/components/FloatingViewToggle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Send, Loader2, AlertCircle, Users, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const [events] = useState<Event[]>(mockEvents);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>([]);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  
  const { location, loading: locationLoading, error: locationError, requestLocation } = useLocation();
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Filter events based on search and filters
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Search filter
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

    // Category filter
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
      description: `${event.date} ${event.time} • ${event.location.district}`,
    });
  };

  const handleLocationRequest = () => {
    requestLocation();
    if (locationError) {
      toast({
        title: "位置权限",
        description: "请在浏览器设置中允许位置访问以获得更好的体验",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header with Search and Filters - Combined Sticky */}
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">{t('app.title')}</h1>
                <p className="text-xs text-muted-foreground">{t('app.subtitle')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                className="text-xs px-2 py-1 h-7"
              >
                <Globe className="w-3 h-3 mr-1" />
                {language === 'zh' ? 'EN' : '中文'}
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => navigate(user ? '/me' : '/login')}
                className="text-xs px-3 py-1 h-7"
              >
                <Users className="w-3 h-3 mr-1" />
                {user ? t('header.profile') : t('header.loginRegister')}
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="max-w-lg">
              <SearchBar onSearch={setSearchQuery} />
            </div>
            {/* Activity Category Filters */}
            <div>
              <FilterBar
                selectedCategories={selectedCategories}
                onCategoryToggle={handleCategoryToggle}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {viewMode === 'map' ? (
          /* Map Mode */
          <div className="mb-6 relative">
            <Card className="p-0 overflow-hidden bg-gradient-card border-border/50">
              <div className="h-[400px] lg:h-[500px]">
                <EventMap
                  events={filteredEvents}
                  userLocation={location}
                  selectedEvent={selectedEvent}
                  onEventSelect={handleEventSelect}
                />
              </div>
            </Card>
            
            {/* Location button only in map mode */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLocationRequest}
              disabled={locationLoading}
              className="absolute top-4 right-4 bg-card/90 backdrop-blur-lg text-xs px-3 py-2 h-8 shadow-lg"
            >
              {locationLoading ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : locationError ? (
                <AlertCircle className="w-3 h-3 mr-1 text-destructive" />
              ) : (
                <Send className="w-3 h-3 mr-1" />
              )}
              {locationLoading ? t('header.locating') : locationError ? t('header.relocate') : t('header.currentLocation')}
            </Button>
          </div>
        ) : (
          /* List Mode */
          <div className="space-y-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {t('events.found', { count: filteredEvents.length })}
              </h2>
            </div>
            
            {filteredEvents.length === 0 ? (
              <Card className="p-8 text-center bg-gradient-card border-border/50">
                <div className="text-muted-foreground">
                  <p className="text-lg mb-2">{t('events.noResults')}</p>
                  <p className="text-sm">{t('events.tryAdjust')}</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    distance="1.2km"
                    duration="15分钟"
                    onClick={() => navigate(user ? `/event/${event.id}` : '/login')}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Floating View Toggle */}
      <FloatingViewToggle
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    </div>
  );
};

export default Index;