import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Map, { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from '../../components/map/Map/Map'
import MapControls from '../../components/map/MapControls/MapControls'
import MapMarker from '../../components/map/MapMarker/MapMarker'
import LayerToggle from '../../components/map/LayerToggle/LayerToggle'
import Header from '../../components/layout/Header/Header'
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

function DestinationPin({ place }: { place: Place }) {
  const { map } = useMap()
  return <MapMarker map={map} lngLat={place.lngLat} />
}

function DestinationCard({ place, onPlanRoute }: { place: Place; onPlanRoute: () => void }) {
  return (
    <div className={styles.destination}>
      <div className={styles.destinationInfo}>
        <p className={styles.destinationLabel}>Destination</p>
        <p className={styles.destinationName}>{place.name}</p>
        <p className={styles.destinationRegion}>{place.region}</p>
      </div>
      <button type="button" className={styles.planBtn} onClick={onPlanRoute}>
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
            <Header />
            <SearchBar onSelect={setDestination} />

            {destination && (
              <DestinationCard
                place={destination}
                onPlanRoute={() => navigateWithLoader('/route-results')}
              />
            )}

            <div className={styles.controlsHost} data-anim>
              <MapControls />
            </div>

            <div className={styles.layerHost} data-anim>
              <LayerToggle active={activeLayers} onToggle={toggleLayer} />
            </div>

            {destination && <DestinationPin place={destination} />}
          </>
        )}
      </Map>
    </section>
  )
}