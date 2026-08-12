import { useEffect, useRef } from 'react'
import { LngLatBounds, type GeoJSONSource } from 'maplibre-gl'
import { useMap } from '../../../hooks/useMap'
import type { RouteCandidate } from '../../../utils/routing'

const ROUTE_COLORS = [
  '#2563eb',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0d9488',
  '#db2777',
  '#4f46e5',
  '#ea580c',
  '#0891b2',
]

const RECOMMENDED_COLOR = '#15803d'

interface RouteLayerProps {
  routes: RouteCandidate[]
  activeIndex: number
  recommendedIndex: number
}

const SOURCE_ID = 'saferoute-routes'
const LINE_ID = 'saferoute-routes-line'
const CASING_ID = 'saferoute-routes-casing'

interface FeatureProps {
  color: string
  width: number
  opacity: number
  casing: number
}

function buildFeatures(
  routes: RouteCandidate[],
  activeIndex: number,
  recommendedIndex: number,
): GeoJSONFeature[] {
  return routes.map((route, index) => {
    const isRecommended = index === recommendedIndex
    const isActive = index === activeIndex

    let props: FeatureProps
    let color: string
    if (isRecommended) {
      color = RECOMMENDED_COLOR
      props = {
        color,
        width: isActive ? 6 : 4.5,
        opacity: 1,
        casing: 11,
      }
    } else if (isActive) {
      color = ROUTE_COLORS[index % ROUTE_COLORS.length]
      props = {
        color,
        width: 5,
        opacity: 1,
        casing: 10,
      }
    } else {
      color = ROUTE_COLORS[index % ROUTE_COLORS.length]
      props = {
        color,
        width: 2.5,
        opacity: 0.5,
        casing: 5,
      }
    }

    return {
      type: 'Feature',
      properties: props,
      geometry: {
        type: 'LineString',
        coordinates: route.points,
      },
    }
  })
}

interface GeoJSONFeature {
  type: 'Feature'
  properties: FeatureProps
  geometry: { type: 'LineString'; coordinates: [number, number][] }
}

export default function RouteLayer({
  routes,
  activeIndex,
  recommendedIndex,
}: RouteLayerProps) {
  const { map } = useMap()
  const didFitOnce = useRef(false)
  const didInit = useRef(false)

  useEffect(() => {
    if (!map || routes.length === 0) return

    const features = buildFeatures(routes, activeIndex, recommendedIndex)

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
        id: CASING_ID,
        type: 'line',
        source: SOURCE_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#ffffff',
          'line-width': ['get', 'casing'],
          'line-opacity': ['get', 'opacity'],
        },
      })

      map.addLayer({
        id: LINE_ID,
        type: 'line',
        source: SOURCE_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['get', 'width'],
          'line-opacity': ['get', 'opacity'],
        },
      })

      if (!didFitOnce.current) {
        didFitOnce.current = true
        const bounds = new LngLatBounds()
        routes.forEach((route) =>
          route.points.forEach((point) => bounds.extend(point)),
        )
        map.fitBounds(bounds, { padding: 80, maxZoom: 13, duration: 1200 })
      }
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
      if (map.getLayer(LINE_ID)) map.removeLayer(LINE_ID)
      if (map.getLayer(CASING_ID)) map.removeLayer(CASING_ID)
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
      didInit.current = false
    }
  }, [map, routes, activeIndex, recommendedIndex])

  return null
}