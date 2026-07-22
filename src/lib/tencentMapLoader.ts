import { TENCENT_MAP_KEY } from '@/lib/mapConfig';

let loadPromise: Promise<TMapNamespace> | null = null;

export const loadTencentMap = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('MAP_UNAVAILABLE'));
  }

  if (window.TMap) {
    return Promise.resolve(window.TMap);
  }

  if (loadPromise) {
    return loadPromise;
  }

  if (!TENCENT_MAP_KEY) {
    return Promise.reject(new Error('MAP_KEY_MISSING'));
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://map.qq.com/api/gljs?v=1.exp&key=${encodeURIComponent(TENCENT_MAP_KEY)}`;
    script.async = true;
    script.charset = 'utf-8';

    let settled = false;
    const fail = () => {
      if (settled) return;
      settled = true;
      loadPromise = null;
      script.remove();
      reject(new Error('MAP_LOAD_FAILED'));
    };

    script.onload = () => {
      let attempts = 0;
      const waitForGlobal = () => {
        if (window.TMap) {
          settled = true;
          resolve(window.TMap);
          return;
        }

        attempts += 1;
        if (attempts > 60) {
          fail();
          return;
        }

        window.setTimeout(waitForGlobal, 100);
      };

      waitForGlobal();
    };

    script.onerror = fail;
    document.head.appendChild(script);
    window.setTimeout(fail, 12000);
  });

  return loadPromise;
};
