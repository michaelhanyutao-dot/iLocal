import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { loadTencentMap } from '@/lib/tencentMapLoader';
import type { Event, UserLocation } from '@/types/event';

const BEIJING: UserLocation = { lat: 39.9042, lng: 116.4074 };

interface EventMapProps {
  events: Event[];
  userLocation: UserLocation | null;
  selectedEvent: Event | null;
  onEventSelect: (event: Event) => void;
}

const EventMap = ({ events, userLocation, selectedEvent, onEventSelect }: EventMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<TMapMap | null>(null);
  const markerLayerRef = useRef<TMapMarkerLayer | null>(null);
  const eventLookupRef = useRef<Record<string, Event>>({});
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    loadTencentMap()
      .then((TMap) => {
        if (cancelled || !mapRef.current) return;

        try {
          const center = userLocation ?? BEIJING;
          mapInstanceRef.current = new TMap.Map(mapRef.current, {
            zoom: userLocation ? 14 : 12,
            center: new TMap.LatLng(center.lat, center.lng),
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
      markerLayerRef.current?.setMap(null);
      markerLayerRef.current = null;
      mapInstanceRef.current?.destroy();
      mapInstanceRef.current = null;
    };
  }, [userLocation]);

  useEffect(() => {
    if (status !== 'ready' || !window.TMap || !mapInstanceRef.current) return;

    markerLayerRef.current?.setMap(null);
    eventLookupRef.current = Object.fromEntries(events.map((event) => [event.id, event]));

    try {
      markerLayerRef.current = new window.TMap.MultiMarker({
        id: 'ilocal-event-markers',
        map: mapInstanceRef.current,
        geometries: events.map((event) => ({
          id: event.id,
          position: new window.TMap.LatLng(event.location.lat, event.location.lng),
          properties: {
            title: event.title,
          },
        })),
      });

      markerLayerRef.current.on('click', (markerEvent) => {
        const eventId = markerEvent.geometry?.id ?? markerEvent.cluster?.geometry?.id;
        const event = eventId ? eventLookupRef.current[eventId] : null;
        if (event) onEventSelect(event);
      });
    } catch (markerError) {
      console.error('Tencent map markers failed:', markerError);
    }
  }, [events, onEventSelect, status]);

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
      <div ref={mapRef} className="h-full w-full overflow-hidden rounded-2xl shadow-card" />
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
