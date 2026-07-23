import { useState } from 'react';
import { UserLocation } from '@/types/event';

const PI = Math.PI;
const EARTH_RADIUS = 6378245.0;
const ECCENTRICITY = 0.006693421622966;

const isOutsideChina = (lat: number, lng: number) =>
  lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;

const transformLat = (x: number, y: number) => {
  let result = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  result += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
  result += ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0;
  result += ((160.0 * Math.sin((y / 12.0) * PI) + 320 * Math.sin((y * PI) / 30.0)) * 2.0) / 3.0;
  return result;
};

const transformLng = (x: number, y: number) => {
  let result = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  result += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
  result += ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0;
  result += ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / 30.0) * PI)) * 2.0) / 3.0;
  return result;
};

const wgs84ToGcj02 = (location: UserLocation): UserLocation => {
  if (isOutsideChina(location.lat, location.lng)) return location;

  let dLat = transformLat(location.lng - 105.0, location.lat - 35.0);
  let dLng = transformLng(location.lng - 105.0, location.lat - 35.0);
  const radLat = (location.lat / 180.0) * PI;
  let magic = Math.sin(radLat);
  magic = 1 - ECCENTRICITY * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((EARTH_RADIUS * (1 - ECCENTRICITY)) / (magic * sqrtMagic)) * PI);
  dLng = (dLng * 180.0) / ((EARTH_RADIUS / sqrtMagic) * Math.cos(radLat) * PI);

  return {
    lat: location.lat + dLat,
    lng: location.lng + dLng,
  };
};

export const useLocation = () => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = () =>
    new Promise<UserLocation>((resolve, reject) => {
      const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
      if (!window.isSecureContext && !isLocalhost) {
        const errorMessage = '定位需要 HTTPS 安全环境，请使用正式域名或本地 localhost 访问';
        setError(errorMessage);
        reject(new Error(errorMessage));
        return;
      }

      if (!navigator.geolocation) {
        const errorMessage = '您的浏览器不支持地理位置服务';
        setError(errorMessage);
        reject(new Error(errorMessage));
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const nextLocation = wgs84ToGcj02({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocation(nextLocation);
          setLoading(false);
          resolve(nextLocation);
        },
        (geolocationError) => {
          let errorMessage = '无法获取位置信息';
          switch (geolocationError.code) {
            case geolocationError.PERMISSION_DENIED:
              errorMessage = '位置权限被拒绝，请在浏览器设置中允许位置访问';
              break;
            case geolocationError.POSITION_UNAVAILABLE:
              errorMessage = '位置信息不可用，请检查系统定位服务';
              break;
            case geolocationError.TIMEOUT:
              errorMessage = '获取位置信息超时，请稍后再试';
              break;
            default:
              break;
          }
          setError(errorMessage);
          setLoading(false);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        }
      );
    });

  return {
    location,
    loading,
    error,
    requestLocation,
  };
};
