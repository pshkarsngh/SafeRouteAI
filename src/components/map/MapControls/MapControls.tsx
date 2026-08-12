import { useMap } from '../../../hooks/useMap'
import { FALLBACK_CENTER } from '../../../utils/places'
import styles from './MapControls.module.scss'

export default function MapControls() {
  const { map, zoomIn, zoomOut } = useMap()

  const locate = () => {
    if (!navigator.geolocation) {
      map.flyTo({ center: FALLBACK_CENTER, zoom: 12, essential: true })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 14,
          essential: true,
          duration: 1600,
        })
      },
      () => {
        map.flyTo({ center: FALLBACK_CENTER, zoom: 12, essential: true })
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    )
  }

  return (
    <div className={styles.wrap} role="group" aria-label="Map controls">
      <button type="button" onClick={zoomIn} aria-label="Zoom in">
        +
      </button>
      <button type="button" className={styles.locate} onClick={locate} aria-label="Locate me">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      </button>
      <button type="button" onClick={zoomOut} aria-label="Zoom out">
        &minus;
      </button>
    </div>
  )
}