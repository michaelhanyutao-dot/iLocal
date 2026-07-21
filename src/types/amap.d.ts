declare global {
  type AMapPosition = [number, number];

  interface AMapMap {
    destroy: () => void;
    setCenter: (position: AMapPosition) => void;
  }

  interface AMapMarker {
    on: (eventName: string, handler: () => void) => void;
    setMap: (map: AMapMap | null) => void;
  }

  interface AMapNamespace {
    Map: new (container: HTMLElement, options: Record<string, unknown>) => AMapMap;
    Marker: new (options: Record<string, unknown>) => AMapMarker;
    Icon: new (options: Record<string, unknown>) => unknown;
    Size: new (width: number, height: number) => unknown;
  }

  interface Window {
    AMap?: AMapNamespace;
  }
}

export {};
