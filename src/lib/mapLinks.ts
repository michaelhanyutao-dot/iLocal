import type { Event } from '@/types/event';
import { TENCENT_MAP_KEY, TENCENT_MAP_REFERER } from '@/lib/mapConfig';

const getReferer = () => TENCENT_MAP_KEY || TENCENT_MAP_REFERER;

export const buildTencentMapMarkerUrl = (event: Event) => {
  const marker = [
    `coord:${event.location.lat},${event.location.lng}`,
    `title:${event.title}`,
    `addr:${event.location.address}`,
  ].join(';');

  const params = new URLSearchParams({
    marker,
    referer: getReferer(),
  });

  return `https://apis.map.qq.com/uri/v1/marker?${params.toString()}`;
};

export const buildTencentMapRouteUrl = (event: Event) => {
  const params = new URLSearchParams({
    type: 'walk',
    from: '当前位置',
    fromcoord: 'CurrentLocation',
    to: event.title,
    tocoord: `${event.location.lat},${event.location.lng}`,
    policy: '0',
    referer: getReferer(),
  });

  return `https://apis.map.qq.com/uri/v1/routeplan?${params.toString()}`;
};

export const openExternalUrl = (url: string) => {
  const opened = window.open(url, '_blank', 'noopener,noreferrer');

  if (!opened) {
    window.location.href = url;
  }
};
