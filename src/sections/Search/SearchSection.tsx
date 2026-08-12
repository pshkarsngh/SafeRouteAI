import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Map, { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from '../../components/map/Map/Map'
import MapControls from '../../components/map/MapControls/MapControls'
import MapMarker from '../../components/map/MapMarker/MapMarker'
import LayerToggle from '../../components/map/LayerToggle/LayerToggle'
import SearchBar from '../../components/Navigation/SearchBar/SearchBar'
import { usePageLoader } from '../../components/pageLoader'
import { useMap } from '../../hooks/useMap'
import { setLayerGroupVisible, type LayerGroupId } from '../../utils/layers'
import type { Place } from '../../utils/places'
import styles from './SearchSection.module.scss'

gsap.registerPlugin(useGSAP)

const ALL_LAYER_GROUPS: LayerGroupId[] = ['roads', 'parks', 'buildings']

function LayerSync({ active }: { active: Set<LayerGroupId> }) {
  const { map } = useMap()

  useEffect(() => {
    ALL_LAYER_GROUPS.forEach((group) => {
      setLayerGroupVisible(map, group, active.has(group))
    })
  }, [map, active])

  return null
}

function PlacePin({ place, variant }: { place: Place; variant: 'origin' | 'destination' }) {
  const { map } = useMap()
  return <MapMarker map={map} lngLat={place.lngLat} variant={variant} />
}

function TripCard({
  origin,
  destination,
  onPlanRoute,
}: {
  origin: Place | null
  destination: Place | null
  onPlanRoute: () => void
}) {
  if (!origin && !destination) return null

  return (
    <div className={styles.destination}>
      <div className={styles.destinationInfo}>
        {origin && (
          <>
            <p className={styles.destinationLabel}>Starting point</p>
            <p className={styles.destinationName}>{origin.name}</p>
            <p className={styles.destinationRegion}>{origin.region}</p>
          </>
        )}
        {origin && destination && <div className={styles.tripDivider} />}
        {destination && (
          <>
            <p className={styles.destinationLabel}>Destination</p>
            <p className={styles.destinationName}>{destination.name}</p>
            <p className={styles.destinationRegion}>{destination.region}</p>
          </>
        )}
      </div>
      <button
        type="button"
        className={styles.planBtn}
        onClick={onPlanRoute}
        disabled={!origin || !destination}
      >
        Plan safe route
        <span aria-hidden="true">→</span>
      </button>
    </div>
  )
}

export default function SearchSection() {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const navigateWithLoader = usePageLoader()

  const [ready, setReady] = useState(false)
  const [origin, setOrigin] = useState<Place | null>(null)
  const [destination, setDestination] = useState<Place | null>(null)
  const [activeLayers, setActiveLayers] = useState<Set<LayerGroupId>>(
    () => new Set<LayerGroupId>(ALL_LAYER_GROUPS),
  )

  useGSAP(
    () => {
      gsap.from('[data-anim]', {
        y: 28,
        autoAlpha: 0,
        stagger: 0.1,
        duration: 0.9,
        ease: 'power3.out',
        delay: 0.15,
      })
    },
    { scope: rootRef, dependencies: [ready] },
  )

  const toggleLayer = (group: LayerGroupId) => {
    setActiveLayers((previous) => {
      const next = new Set(previous)
      if (next.has(group)) {
        next.delete(group)
      } else {
        next.add(group)
      }
      return next
    })
  }

  return (
    <section ref={rootRef} className={styles.section}>
      <Map center={MAP_DEFAULT_CENTER} zoom={MAP_DEFAULT_ZOOM} onReady={() => setReady(true)}>
        {ready && <LayerSync active={activeLayers} />}
        {ready && (
          <>
            <div className={styles.searchHost} data-anim>
              <SearchBar
                variant="origin"
                placeholder="Search starting point…"
                onSelect={setOrigin}
              />
              <SearchBar
                variant="destination"
                placeholder="Search destination…"
                onSelect={setDestination}
              />
            </div>

            <TripCard
              origin={origin}
              destination={destination}
              onPlanRoute={() =>
                navigateWithLoader('/route-results', { origin, destination })
              }
            />

            <div className={styles.controlsHost} data-anim>
              <MapControls />
            </div>

            <div className={styles.layerHost} data-anim>
              <LayerToggle active={activeLayers} onToggle={toggleLayer} />
            </div>

            {origin && <PlacePin place={origin} variant="origin" />}
            {destination && <PlacePin place={destination} variant="destination" />}
          </>
        )}
      </Map>
    </section>
  )
}