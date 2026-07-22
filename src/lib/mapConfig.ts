export const TENCENT_MAP_KEY = import.meta.env.VITE_TENCENT_MAP_KEY || '';
export const TENCENT_MAP_REFERER = import.meta.env.VITE_TENCENT_MAP_REFERER || 'iLocal';

export const hasTencentMapKey = () => Boolean(TENCENT_MAP_KEY);
