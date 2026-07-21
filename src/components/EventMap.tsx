import { useEffect, useRef } from 'react';
import { Event, UserLocation } from '@/types/event';

// UTF-8 safe base64 encoding
const utf8ToBase64 = (str: string) => {
  return btoa(unescape(encodeURIComponent(str)));
};

interface EventMapProps {
  events: Event[];
  userLocation: UserLocation | null;
  selectedEvent: Event | null;
  onEventSelect: (event: Event) => void;
}

const EventMap = ({ events, userLocation, selectedEvent, onEventSelect }: EventMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<AMapMap | null>(null);
  const markersRef = useRef<AMapMarker[]>([]);

  useEffect(() => {
    if (!mapRef.current || !window.AMap) return;

    // Initialize map
    const map = new window.AMap.Map(mapRef.current, {
      zoom: 13,
      center: userLocation ? [userLocation.lng, userLocation.lat] : [116.4074, 39.9042],
      mapStyle: 'amap://styles/whitesmoke',
    });

    mapInstanceRef.current = map;

    // Add user location marker
    if (userLocation) {
      new window.AMap.Marker({
        position: [userLocation.lng, userLocation.lat],
        icon: new window.AMap.Icon({
          size: new window.AMap.Size(20, 20),
          image: 'data:image/svg+xml;base64,' + utf8ToBase64(`
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="8" fill="hsl(270 40% 75%)" stroke="white" stroke-width="2"/>
              <circle cx="10" cy="10" r="3" fill="white"/>
            </svg>
          `),
        }),
        map: map,
      });
    }

    // Add event markers
    const markers = events.map(event => {
      const categoryColors = {
        coffee: '#7D9255',
        music: '#7D9255',
        market: '#9AAA7A',
        party: '#C8B16C',
        exhibition: '#A4B6A0',
        bar: '#8D9B6D',
        sports: '#6F8264'
      };

      const marker = new window.AMap.Marker({
        position: [event.location.lng, event.location.lat],
        icon: new window.AMap.Icon({
          size: new window.AMap.Size(32, 32),
          image: 'data:image/svg+xml;base64,' + utf8ToBase64(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="${categoryColors[event.category]}" stroke="white" stroke-width="2"/>
              <text x="16" y="20" text-anchor="middle" font-size="16" fill="white">${getCategoryIcon(event.category)}</text>
            </svg>
          `),
        }),
        map: map,
      });

      marker.on('click', () => {
        onEventSelect(event);
      });

      return marker;
    });

    markersRef.current = markers;

    return () => {
      markers.forEach(marker => marker.setMap(null));
      map.destroy();
    };
  }, [events, userLocation, onEventSelect]);

  // Highlight selected event
  useEffect(() => {
    if (selectedEvent && mapInstanceRef.current) {
      mapInstanceRef.current.setCenter([selectedEvent.location.lng, selectedEvent.location.lat]);
    }
  }, [selectedEvent]);

  const getCategoryIcon = (category: string) => {
    const icons = {
      coffee: '☕',
      music: '🎵',
      market: '🛍️',
      party: '🥂',
      exhibition: '🖼️',
      bar: '🎧',
      sports: '🏃'
    };
    return icons[category as keyof typeof icons] || '📍';
  };

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full rounded-2xl overflow-hidden shadow-card" />
      {!window.AMap && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-2xl">
          <p className="text-muted-foreground">地图加载中...</p>
        </div>
      )}
    </div>
  );
};

export default EventMap;
