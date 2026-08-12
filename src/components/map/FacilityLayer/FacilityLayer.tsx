import { useEffect, useRef } from 'react'
import { Marker } from 'maplibre-gl'
import { useMap } from '../../../hooks/useMap'
import type { SafetyFacility } from '../../../services/facilities'
import styles from './FacilityLayer.module.scss'

const FACILITY_ICON: Record<SafetyFacility['category'], string> = {
  police: '🚔',
  hospital: '🏥',
  hotel: '🏨',
}

const FACILITY_COLOR: Record<SafetyFacility['category'], string> = {
  police: '#1d4ed8',
  hospital: '#be123c',
  hotel: '#b45309',
}

interface FacilityLayerProps {
  facilities: SafetyFacility[]
}

export default function FacilityLayer({ facilities }: FacilityLayerProps) {
  const { map } = useMap()
  const markersRef = useRef<Marker[]>([])

  useEffect(() => {
    const markers = facilities.map((facility) => {
      const element = document.createElement('div')
      element.className = styles.marker
      element.style.setProperty('--facility-color', FACILITY_COLOR[facility.category])
      element.innerHTML = `<span class="${styles.icon}">${FACILITY_ICON[facility.category]}</span>`

      element.title = `${facility.name} (${facility.category})`

      return new Marker({ element, anchor: 'center' })
        .setLngLat(facility.lngLat)
        .addTo(map)
    })

    markersRef.current = markers

    return () => {
      markers.forEach((marker) => marker.remove())
      markersRef.current = []
    }
  }, [map, facilities])

  return null
}