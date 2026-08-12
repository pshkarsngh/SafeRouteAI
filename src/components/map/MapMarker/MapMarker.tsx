import { useEffect, useRef } from 'react'
import { Map as MapLibreMap, Marker } from 'maplibre-gl'
import type { LngLatLike } from 'maplibre-gl'
import markerStyles from './MapMarker.module.scss'
import pinUrl from '../../../assets/marker-pin.svg'

interface MapMarkerProps {
  map: MapLibreMap
  lngLat: LngLatLike
}

export default function MapMarker({ map, lngLat }: MapMarkerProps) {
  const markerRef = useRef<Marker | null>(null)

  useEffect(() => {
    const element = document.createElement('div')
    element.className = markerStyles.pin

    const image = document.createElement('img')
    image.src = pinUrl
    image.alt = ''
    element.appendChild(image)

    const marker = new Marker({ element, anchor: 'bottom' })
      .setLngLat(lngLat)
      .addTo(map)

    markerRef.current = marker

    return () => {
      marker.remove()
      markerRef.current = null
    }
  }, [map, lngLat])

  return null
}