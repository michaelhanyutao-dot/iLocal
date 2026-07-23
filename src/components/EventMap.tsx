import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle, Loader2, Send, UserRound } from 'lucide-react';
import { loadTencentMap } from '@/lib/tencentMapLoader';
import { Button } from '@/components/ui/button';
import type { Event, EventCategory, UserLocation } from '@/types/event';

const BEIJING: UserLocation = { lat: 39.9042, lng: 116.4074 };
const CATEGORY_EMOJIS: Record<EventCategory, string> = {
  coffee: '☕',
  music: '🎵',
  market: '🛍️',
  party: '🥂',
  exhibition: '🖼️',
  bar: '🎧',
  sports: '🏃‍♂️',
};
const CATEGORY_MARKER_COLORS: Record<EventCategory, string> = {
  coffee: '#D6AA82',
  music: '#B794F6',
  market: '#68D391',
  party: '#F6AD55',
  exhibition: '#63B3ED',
  bar: '#FC8181',
  sports: '#93A8F3',
};
const USER_MARKER_ICON =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(`
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="22" cy="22" r="21" fill="white" stroke="#C7A6DD" stroke-width="2"/>
      <circle cx="22" cy="15" r="5.2" fill="#C7A6DD"/>
      <path d="M11.8 34.2c1.8-6 5.4-9 10.2-9s8.4 3 10.2 9" stroke="#C7A6DD" stroke-width="4" stroke-linecap="round"/>
    </svg>
  `);

const svgToDataUrl = (svg: string) =>
  `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;

const createCategoryCircleIcon = (category: EventCategory, selected = false) => {
  const size = selected ? 38 : 32;
  const center = size / 2;
  const radius = selected ? 17 : 14;
  const shadowOpacity = selected ? 0.28 : 0.18;
  const fontSize = selected ? 20 : 17;

  return svgToDataUrl(`
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${center}" cy="${center + 1.5}" r="${radius}" fill="#45384D" opacity="${shadowOpacity}"/>
        <circle cx="${center}" cy="${center}" r="${radius}" fill="${CATEGORY_MARKER_COLORS[category]}" stroke="white" stroke-width="${selected ? 3 : 2}"/>
        <text x="${center}" y="${center}" text-anchor="middle" dominant-baseline="central" font-size="${fontSize}" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">${CATEGORY_EMOJIS[category]}</text>
      </svg>
    `);
};

interface EventMapProps {
  events: Event[];
  userLocation: UserLocation | null;
  selectedEvent: Event | null;
  onEventSelect: (event: Event) => void;
  onLocationRequest: () => void;
  locationLoading: boolean;
  locationError: string | null;
}

const EventMap = ({
  events,
  userLocation,
  selectedEvent,
  onEventSelect,
  onLocationRequest,
  locationLoading,
  locationError,
}: EventMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<TMapMap | null>(null);
  const eventMarkerLayerRef = useRef<TMapMarkerLayer | null>(null);
  const userMarkerLayerRef = useRef<TMapMarkerLayer | null>(null);
  const eventLookupRef = useRef<Record<string, Event>>({});
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    loadTencentMap()
      .then((TMap) => {
        if (cancelled || !mapRef.current) return;

        try {
          mapInstanceRef.current = new TMap.Map(mapRef.current, {
            zoom: 12,
            center: new TMap.LatLng(BEIJING.lat, BEIJING.lng),
            showControl: false,
            viewMode: '2D',
          });
        } catch (mapError) {
          console.error('Tencent map initialization failed:', mapError);
        }
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      eventMarkerLayerRef.current?.setMap(null);
      eventMarkerLayerRef.current = null;
      userMarkerLayerRef.current?.setMap(null);
      userMarkerLayerRef.current = null;
      mapInstanceRef.current?.destroy();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (status !== 'ready' || !window.TMap || !mapInstanceRef.current) return;

    eventMarkerLayerRef.current?.setMap(null);
    eventMarkerLayerRef.current = null;
    eventLookupRef.current = Object.fromEntries(events.map((event) => [event.id, event]));

    try {
      const markerStyles = Object.keys(CATEGORY_MARKER_COLORS).reduce<Record<string, unknown>>((styles, category) => {
        const eventCategory = category as EventCategory;
        styles[eventCategory] = new window.TMap!.MarkerStyle({
          width: 32,
          height: 32,
          anchor: { x: 16, y: 16 },
          src: createCategoryCircleIcon(eventCategory),
        });
        styles[`${eventCategory}-selected`] = new window.TMap!.MarkerStyle({
          width: 40,
          height: 40,
          anchor: { x: 20, y: 20 },
          src: createCategoryCircleIcon(eventCategory, true),
        });
        return styles;
      }, {});

      eventMarkerLayerRef.current = new window.TMap.MultiMarker({
        id: 'ilocal-event-marker-circles',
        map: mapInstanceRef.current,
        styles: markerStyles,
        geometries: events.map((event) => ({
          id: event.id,
          styleId: event.id === selectedEvent?.id ? `${event.category}-selected` : event.category,
          position: new window.TMap.LatLng(event.location.lat, event.location.lng),
          properties: {
            title: event.title,
          },
        })),
      });

      eventMarkerLayerRef.current.on('click', (markerEvent) => {
        const eventId = markerEvent.geometry?.id ?? markerEvent.cluster?.geometry?.id;
        const event = eventId ? eventLookupRef.current[eventId] : null;
        if (event) onEventSelect(event);
      });
    } catch (markerError) {
      console.error('Tencent map markers failed:', markerError);
    }
  }, [events, onEventSelect, selectedEvent?.id, status]);

  useEffect(() => {
    if (status !== 'ready' || !window.TMap || !mapInstanceRef.current) return;

    userMarkerLayerRef.current?.setMap(null);
    userMarkerLayerRef.current = null;

    if (!userLocation) return;

    try {
      const markerStyle = new window.TMap.MarkerStyle({
        width: 44,
        height: 44,
        anchor: { x: 22, y: 22 },
        src: USER_MARKER_ICON,
      });

      userMarkerLayerRef.current = new window.TMap.MultiMarker({
        id: 'ilocal-user-location-marker',
        map: mapInstanceRef.current,
        styles: {
          user: markerStyle,
        },
        geometries: [
          {
            id: 'user-location',
            styleId: 'user',
            position: new window.TMap.LatLng(userLocation.lat, userLocation.lng),
          },
        ],
      });

      mapInstanceRef.current.setCenter(new window.TMap.LatLng(userLocation.lat, userLocation.lng));
      mapInstanceRef.current.setZoom(15);
    } catch (markerError) {
      console.error('Tencent user marker failed:', markerError);
    }
  }, [status, userLocation]);

  useEffect(() => {
    if (selectedEvent && mapInstanceRef.current && window.TMap) {
      mapInstanceRef.current.setCenter(
        new window.TMap.LatLng(selectedEvent.location.lat, selectedEvent.location.lng),
      );
      mapInstanceRef.current.setZoom(15);
    }
  }, [selectedEvent]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="ilocal-tencent-map h-full w-full overflow-hidden rounded-2xl shadow-card" />
      <Button
        type="button"
        variant="outline"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onLocationRequest();
        }}
        disabled={locationLoading}
        className={[
          'pointer-events-auto absolute right-3 top-3 z-30 h-10 touch-manipulation gap-2 rounded-full border-border/80 bg-card/95 px-3 text-sm font-black text-foreground shadow-soft backdrop-blur hover:bg-card sm:right-4 sm:top-4',
        ].join(' ')}
        aria-label="定位当前位置"
      >
        {locationLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : locationError ? (
          <AlertCircle className="h-4 w-4 text-destructive" />
        ) : userLocation ? (
          <UserRound className="h-4 w-4 text-primary" />
        ) : (
          <Send className="h-4 w-4 text-primary" />
        )}
        <span>{locationLoading ? '定位中' : '当前位置'}</span>
      </Button>
      {locationError && (
        <div
          className={[
            'absolute right-3 z-10 max-w-[250px] rounded-2xl border border-destructive/30 bg-card/95 px-3 py-2 text-xs font-bold text-destructive shadow-soft backdrop-blur sm:right-4',
            'top-16 sm:top-[68px]',
          ].join(' ')}
        >
          请在浏览器或小程序设置中允许定位权限
        </div>
      )}
      {status === 'loading' && (
        <MapOverlay
          icon={<Loader2 className="h-6 w-6 animate-spin" />}
          title="腾讯地图加载中..."
          description="正在连接腾讯位置服务"
        />
      )}
      {status === 'error' && (
        <MapOverlay
          icon={<AlertCircle className="h-7 w-7" />}
          title="地图加载失败"
          description="请检查腾讯地图 Key、域名白名单或网络后再试"
        />
      )}
    </div>
  );
};

const MapOverlay = ({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-card px-6 text-center text-primary">
    {icon}
    <p className="mt-3 text-base font-black text-foreground">{title}</p>
    <p className="mt-1 text-sm font-semibold text-muted-foreground">{description}</p>
  </div>
);

export default EventMap;
