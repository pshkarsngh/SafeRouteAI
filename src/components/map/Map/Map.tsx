import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AttributionControl, Map as MapLibreMap } from 'maplibre-gl'
import type { LngLatLike } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapContext } from '../../../hooks/useMap'
import styles from './Map.module.scss'

export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'
export const MAP_DEFAULT_CENTER: [number, number] = [77.1025, 28.7041]
export const MAP_DEFAULT_ZOOM = 12

interface MapProps {
  center?: LngLatLike
  zoom?: number
  minZoom?: number
  maxZoom?: number
  onReady?: () => void
  children?: ReactNode
}

export default function Map({
  center = MAP_DEFAULT_CENTER,
  zoom = MAP_DEFAULT_ZOOM,
  minZoom = 3,
  maxZoom = 18,
  onReady,
  children,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const onReadyRef = useRef(onReady)
  const [map, setMap] = useState<MapLibreMap | null>(null)

  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const instance = new MapLibreMap({
      container,
      style: MAP_STYLE_URL,
      center,
      zoom,
      minZoom,
      maxZoom,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      touchZoomRotate: false,
      attributionControl: false,
    })

    instance.addControl(new AttributionControl({ compact: true }), 'bottom-right')
    instance.once('load', () => onReadyRef.current?.())

    setMap(instance)

    return () => {
      instance.remove()
      setMap(null)
    }
  }, [center, zoom, minZoom, maxZoom])

  return (
    <MapContext.Provider value={map}>
      <div ref={containerRef} className={styles.map} />
      {map ? children : null}
    </MapContext.Provider>
  )
}