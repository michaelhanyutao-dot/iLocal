declare global {
  interface TMapLatLng {
    readonly __tmapLatLngBrand?: 'TMapLatLng';
  }

  interface TMapMap {
    destroy: () => void;
    off?: (eventName: string, handler: () => void) => void;
    on?: (eventName: string, handler: () => void) => void;
    projectToContainer?: (position: TMapLatLng) => { x?: number; y?: number; getX?: () => number; getY?: () => number };
    setCenter: (position: TMapLatLng) => void;
    setZoom: (zoom: number) => void;
  }

  interface TMapOverlayLayer {
    on: (eventName: string, handler: (event: TMapMarkerEvent) => void) => void;
    setMap: (map: TMapMap | null) => void;
  }

  type TMapMarkerLayer = TMapOverlayLayer;

  interface TMapMarkerEvent {
    geometry?: { id?: string };
    cluster?: { geometry?: { id?: string } };
  }

  interface TMapNamespace {
    LatLng: new (lat: number, lng: number) => TMapLatLng;
    Map: new (container: HTMLElement | string, options: Record<string, unknown>) => TMapMap;
    MultiMarker: new (options: Record<string, unknown>) => TMapMarkerLayer;
    MultiLabel?: new (options: Record<string, unknown>) => TMapOverlayLayer;
    MarkerStyle: new (options: Record<string, unknown>) => unknown;
    LabelStyle?: new (options: Record<string, unknown>) => unknown;
    MarkerCluster?: new (options: Record<string, unknown>) => TMapMarkerLayer;
  }

  interface Window {
    TMap?: TMapNamespace;
  }
}

export {};
