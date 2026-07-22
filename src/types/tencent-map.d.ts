declare global {
  interface TMapLatLng {
    readonly __tmapLatLngBrand?: 'TMapLatLng';
  }

  interface TMapMap {
    destroy: () => void;
    setCenter: (position: TMapLatLng) => void;
    setZoom: (zoom: number) => void;
  }

  interface TMapMarkerLayer {
    on: (eventName: string, handler: (event: TMapMarkerEvent) => void) => void;
    setMap: (map: TMapMap | null) => void;
  }

  interface TMapMarkerEvent {
    geometry?: { id?: string };
    cluster?: { geometry?: { id?: string } };
  }

  interface TMapNamespace {
    LatLng: new (lat: number, lng: number) => TMapLatLng;
    Map: new (container: HTMLElement | string, options: Record<string, unknown>) => TMapMap;
    MultiMarker: new (options: Record<string, unknown>) => TMapMarkerLayer;
    MarkerStyle: new (options: Record<string, unknown>) => unknown;
    MarkerCluster?: new (options: Record<string, unknown>) => TMapMarkerLayer;
  }

  interface Window {
    TMap?: TMapNamespace;
  }
}

export {};
