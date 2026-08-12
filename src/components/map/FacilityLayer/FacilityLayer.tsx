import { useEffect, useRef } from 'react'
import { type GeoJSONSource } from 'maplibre-gl'
import { useMap } from '../../../hooks/useMap'
import { poiIconFor } from '../../../config/poiIcons'
import type { SafetyFacility } from '../../../services/facilities'

const SOURCE_ID = 'saferoute-facilities'
const LAYER_ID = 'saferoute-facilities-icons'

interface FacilityGeometry {
  type: 'Feature'
  properties: { icon: string; name: string }
  geometry: { type: 'Point'; coordinates: [number, number] }
}

function buildFeatures(facilities: SafetyFacility[]): FacilityGeometry[] {
  return facilities.map((facility) => {
    const icon = poiIconFor(facility.poiType, facility.category)

    // Debug: verify the correct native icon is selected for each POI type.
    console.log(`[SafeRoute] POI: ${facility.name}`)
    console.log(`[SafeRoute]   type: ${facility.category} (${facility.poiType})`)
    console.log(`[SafeRoute]   normalizedType: ${facility.poiType}`)
    console.log(`[SafeRoute]   icon: ${icon}-map-icon`)
    console.log(`[SafeRoute]   lat: ${facility.lngLat[1]}, lon: ${facility.lngLat[0]}`)

    return {
      type: 'Feature',
      properties: { icon, name: facility.name },
      geometry: {
        type: 'Point',
        coordinates: facility.lngLat,
      },
    }
  })
}

interface FacilityLayerProps {
  facilities: SafetyFacility[]
}

/**
 * Renders POI markers using the map provider's own sprite symbols (the same
 * `icon-image` pipeline the base map uses for its POIs). Coordinates are the
 * exact detected POI positions — only the visual representation changes.
 */
export default function FacilityLayer({ facilities }: FacilityLayerProps) {
  const { map } = useMap()
  const didInit = useRef(false)

  useEffect(() => {
    if (!map) return

    const features = buildFeatures(facilities)

    const setData = () => {
      const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined
      if (source) {
        source.setData({ type: 'FeatureCollection', features })
      }
    }

    const addSourceAndLayers = () => {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features },
      })

      map.addLayer({
        id: LAYER_ID,
        type: 'symbol',
        source: SOURCE_ID,
        layout: {
          'icon-image': ['get', 'icon'],
          'icon-size': 1,
          'icon-allow-overlap': true,
          'text-field': ['get', 'name'],
          'text-anchor': 'top',
          'text-offset': [0, 0.6],
          'text-font': ['Noto Sans Italic'],
          'text-max-width': 9,
          'text-size': 12,
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#666',
          'text-halo-blur': 0.5,
          'text-halo-color': '#ffffff',
          'text-halo-width': 1,
        },
      })
    }

    const onLoad = () => {
      addSourceAndLayers()
      map.off('load', onLoad)
    }

    if (map.isStyleLoaded()) {
      if (!didInit.current) {
        didInit.current = true
        addSourceAndLayers()
      } else {
        setData()
      }
    } else {
      map.once('load', onLoad)
    }

    return () => {
      map.off('load', onLoad)
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
      didInit.current = false
    }
  }, [map, facilities])

  return null
}