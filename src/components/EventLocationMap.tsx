import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, MapPin, Navigation } from 'lucide-react';
import { loadTencentMap } from '@/lib/tencentMapLoader';
import type { Event } from '@/types/event';

interface EventLocationMapProps {
  event: Event;
  onOpenMap: () => void;
}

const EventLocationMap = ({ event, onOpenMap }: EventLocationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<TMapMap | null>(null);
  const markerLayerRef = useRef<TMapMarkerLayer | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    loadTencentMap()
      .then((TMap) => {
        if (cancelled || !mapRef.current) return;

        try {
          const position = new TMap.LatLng(event.location.lat, event.location.lng);
          const map = new TMap.Map(mapRef.current, {
            zoom: 16,
            center: position,
          });

          mapInstanceRef.current = map;
          markerLayerRef.current = new TMap.MultiMarker({
            id: 'ilocal-detail-marker',
            map,
            geometries: [
              {
                id: event.id,
                position,
                properties: {
                  title: event.title,
                },
              },
            ],
          });
        } catch (mapError) {
          console.error('Tencent detail map initialization failed:', mapError);
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
  }, [event]);

  return (
    <button
      type="button"
      onClick={onOpenMap}
      className="group relative h-40 w-full overflow-hidden rounded-2xl border border-border/80 bg-secondary/35 text-left transition-colors hover:border-primary/45 sm:h-44"
      aria-label={`在腾讯地图中查看 ${event.title}`}
    >
      <div ref={mapRef} className="absolute inset-0" />

      {status === 'loading' && (
        <div className="absolute inset-0 grid place-items-center bg-card/90 text-primary">
          <span className="flex flex-col items-center gap-2 text-sm font-black">
            <Loader2 className="h-6 w-6 animate-spin" />
            腾讯地图加载中
          </span>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 grid place-items-center bg-card px-6 text-center text-primary">
          <span className="flex flex-col items-center gap-2 text-sm font-black">
            <AlertCircle className="h-7 w-7" />
            地图暂不可用，点击打开腾讯地图
          </span>
        </div>
      )}

      <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl bg-card/95 p-3 shadow-sm backdrop-blur">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-primary">
          <MapPin className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-foreground">{event.title}</p>
          <p className="truncate text-xs font-bold text-muted-foreground">{event.location.address}</p>
        </div>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:translate-x-0.5">
          <Navigation className="h-5 w-5" />
        </div>
      </div>
    </button>
  );
};

export default EventLocationMap;
