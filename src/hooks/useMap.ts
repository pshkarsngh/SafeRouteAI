import { createContext, useContext } from 'react'
import type { FlyToOptions, LngLatLike, Map as MapLibreMap } from 'maplibre-gl'

export const MapContext = createContext<MapLibreMap | null>(null)

export interface MapApi {
  map: MapLibreMap
  flyTo: (center: LngLatLike, options?: Partial<FlyToOptions>) => void
  zoomIn: () => void
  zoomOut: () => void
}

export function useMap(): MapApi {
  const map = useContext(MapContext)

  if (!map) {
    throw new Error('useMap must be used inside the <Map> component')
  }

  return {
    map,
    flyTo: (center, options) =>
      map.flyTo({ center, essential: true, duration: 1400, ...options }),
    zoomIn: () => map.zoomIn({ duration: 500 }),
    zoomOut: () => map.zoomOut({ duration: 500 }),
  }
}