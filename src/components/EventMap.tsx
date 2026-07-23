import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle, Loader2, LocateFixed, UserRound } from 'lucide-react';
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
const CATEGORY_MARKER_CLASSES: Record<EventCategory, string> = {
  coffee: 'bg-coffee',
  music: 'bg-music',
  market: 'bg-market',
  party: 'bg-party',
  exhibition: 'bg-exhibition',
  bar: 'bg-bar',
  sports: 'bg-sports',
};

const MAP_MOVE_EVENTS = ['center_changed', 'zoom_changed', 'bounds_changed', 'idle', 'resize'];

interface ScreenPoint {
  x: number;
  y: number;
  visible: boolean;
}

const getScreenCoordinate = (point: unknown) => {
  if (!point || typeof point !== 'object') return null;
  const value = point as { x?: unknown; y?: unknown; getX?: () => number; getY?: () => number };
  const x = typeof value.x === 'number' ? value.x : value.getX?.();
  const y = typeof value.y === 'number' ? value.y : value.getY?.();

  if (typeof x !== 'number' || typeof y !== 'number' || Number.isNaN(x) || Number.isNaN(y)) {
    return null;
  }

  return { x, y };
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
  const animationFrameRef = useRef<number | null>(null);
  const syncOverlayPositionsRef = useRef<() => void>(() => {});
  const [eventPoints, setEventPoints] = useState<Record<string, ScreenPoint>>({});
  const [userPoint, setUserPoint] = useState<ScreenPoint | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const projectLocation = useCallback((location: UserLocation): ScreenPoint | null => {
    const map = mapInstanceRef.current;
    const mapElement = mapRef.current;

    if (!map || !mapElement || !window.TMap || typeof map.projectToContainer !== 'function') {
      return null;
    }

    const point = getScreenCoordinate(
      map.projectToContainer(new window.TMap.LatLng(location.lat, location.lng)),
    );

    if (!point) return null;

    return {
      ...point,
      visible:
        point.x >= -36 &&
        point.y >= -36 &&
        point.x <= mapElement.clientWidth + 36 &&
        point.y <= mapElement.clientHeight + 36,
    };
  }, []);

  const scheduleOverlaySync = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null;
      syncOverlayPositionsRef.current();
    });
  }, []);

  useEffect(() => {
    syncOverlayPositionsRef.current = () => {
      if (status !== 'ready') {
        setEventPoints({});
        setUserPoint(null);
        return;
      }

      setEventPoints(
        Object.fromEntries(
          events
            .map((event) => [event.id, projectLocation(event.location)] as const)
            .filter((entry): entry is readonly [string, ScreenPoint] => Boolean(entry[1])),
        ),
      );
      setUserPoint(userLocation ? projectLocation(userLocation) : null);
    };

    scheduleOverlaySync();
  }, [events, projectLocation, scheduleOverlaySync, status, userLocation]);

  useEffect(() => {
    let cancelled = false;
    let detachMapEvents: (() => void) | null = null;

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

          MAP_MOVE_EVENTS.forEach((eventName) => {
            mapInstanceRef.current?.on?.(eventName, scheduleOverlaySync);
          });
          detachMapEvents = () => {
            MAP_MOVE_EVENTS.forEach((eventName) => {
              mapInstanceRef.current?.off?.(eventName, scheduleOverlaySync);
            });
          };
        } catch (mapError) {
          console.error('Tencent map initialization failed:', mapError);
        }
        setStatus('ready');
        scheduleOverlaySync();
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      detachMapEvents?.();
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      mapInstanceRef.current?.destroy();
      mapInstanceRef.current = null;
    };
  }, [scheduleOverlaySync]);

  useEffect(() => {
    if (status !== 'ready' || !window.TMap || !mapInstanceRef.current || !userLocation) return;

    mapInstanceRef.current.setCenter(new window.TMap.LatLng(userLocation.lat, userLocation.lng));
    mapInstanceRef.current.setZoom(15);
    scheduleOverlaySync();
  }, [scheduleOverlaySync, status, userLocation]);

  useEffect(() => {
    if (selectedEvent && mapInstanceRef.current && window.TMap) {
      mapInstanceRef.current.setCenter(
        new window.TMap.LatLng(selectedEvent.location.lat, selectedEvent.location.lng),
      );
      mapInstanceRef.current.setZoom(15);
      scheduleOverlaySync();
    }
  }, [scheduleOverlaySync, selectedEvent]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="ilocal-tencent-map h-full w-full overflow-hidden rounded-2xl shadow-card" />
      {status === 'ready' && (
        <div className="pointer-events-none absolute inset-0 z-20">
          {events.map((event) => {
            const point = eventPoints[event.id];
            if (!point?.visible) return null;

            const isSelected = event.id === selectedEvent?.id;

            return (
              <button
                key={event.id}
                type="button"
                className={[
                  'pointer-events-auto absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 touch-manipulation place-items-center rounded-full border-2 border-white text-[17px] leading-none shadow-soft transition-transform hover:scale-110 active:scale-95',
                  CATEGORY_MARKER_CLASSES[event.category],
                  isSelected ? 'h-9 w-9 text-[19px] ring-4 ring-primary/25' : '',
                ].join(' ')}
                style={{ left: point.x, top: point.y }}
                onPointerDown={(markerEvent) => markerEvent.stopPropagation()}
                onClick={(markerEvent) => {
                  markerEvent.preventDefault();
                  markerEvent.stopPropagation();
                  onEventSelect(event);
                }}
                aria-label={`查看活动 ${event.title}`}
              >
                {CATEGORY_EMOJIS[event.category]}
              </button>
            );
          })}

          {userPoint?.visible && (
            <div
              className="absolute grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center"
              style={{ left: userPoint.x, top: userPoint.y }}
              aria-label="当前位置"
            >
              <span className="absolute h-10 w-10 rounded-full bg-primary/25" />
              <span className="relative grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-card text-primary shadow-soft">
                <UserRound className="h-4 w-4" />
              </span>
            </div>
          )}
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        onMouseDownCapture={(event) => event.stopPropagation()}
        onPointerDownCapture={(event) => event.stopPropagation()}
        onTouchStartCapture={(event) => event.stopPropagation()}
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
          <LocateFixed className="h-4 w-4 text-primary" />
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
