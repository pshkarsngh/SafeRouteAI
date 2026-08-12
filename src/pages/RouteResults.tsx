import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Map from '../components/map/Map/Map'
import MapMarker from '../components/map/MapMarker/MapMarker'
import RouteLayer from '../components/map/RouteLayer/RouteLayer'
import FacilityLayer from '../components/map/FacilityLayer/FacilityLayer'
import { useMap } from '../hooks/useMap'
import { facilitiesForRoute, useSafeRoute } from '../hooks/useSafeRoute'
import { coverageDescription } from '../utils/safety'
import type { Place } from '../utils/places'
import styles from './RouteResults.module.scss'

interface RouteResultsState {
  origin?: Place
  destination?: Place
}

function PlacePin({ place, variant }: { place: Place; variant: 'origin' | 'destination' }) {
  const { map } = useMap()
  return <MapMarker map={map} lngLat={place.lngLat} variant={variant} />
}

const FACILITY_ICON = { police: '🚔', hospital: '🏥', hotel: '🏨' } as const
const FACILITY_LABEL = { police: 'Police station', hospital: 'Hospital', hotel: 'Hotel' } as const

function SafetyBadge({ score }: { score: number }) {
  return (
    <span className={styles.scoreBadge}>
      {score}
      <small>/100</small>
    </span>
  )
}

export default function RouteResults() {
  const location = useLocation()
  const state = (location.state ?? {}) as RouteResultsState
  const origin = state.origin ?? null
  const destination = state.destination ?? null

  const { status, routes, allFacilities, error, facilityError } = useSafeRoute(
    origin,
    destination,
  )

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const recommended = routes.find((r) => r.recommended)
  const activeRoute =
    routes.find((r) => r.id === selectedId) ?? recommended ?? routes[0] ?? null
  const activeIndex = activeRoute ? routes.indexOf(activeRoute) : -1
  const recommendedIndex = recommended ? routes.indexOf(recommended) : -1
  const activeFacilities = activeRoute ? facilitiesForRoute(activeRoute, allFacilities) : []

  if (!origin || !destination) {
    return (
      <main className={styles.empty}>
        <h1>Plan your safe route</h1>
        <p>Select a starting point and a destination first.</p>
        <a href="/search" className={styles.emptyBtn}>
          Back to search
        </a>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <section className={styles.mapHost}>
        <Map>
          <>
            {activeRoute && (
              <RouteLayer
                routes={routes}
                activeIndex={Math.max(0, activeIndex)}
                recommendedIndex={recommendedIndex}
              />
            )}
            <PlacePin place={origin} variant="origin" />
            <PlacePin place={destination} variant="destination" />
            {status === 'ready' && activeRoute && (
              <FacilityLayer facilities={activeFacilities} />
            )}
          </>
        </Map>
        {status === 'ready' && routes.length > 1 && (
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <i className={`${styles.legendLine} ${styles.legendRecommended}`} /> Safest route
            </span>
            <span className={styles.legendItem}>
              <i className={styles.legendLine} /> Alternative route
            </span>
          </div>
        )}
      </section>

      <aside className={styles.panel}>
        {status === 'loading' && (
          <div className={styles.loadingState}>
            <span className={styles.spinner} aria-hidden="true" />
            <p>Finding road routes and safety facilities…</p>
          </div>
        )}

        {status === 'error' && (
          <div className={styles.errorState}>
            <p className={styles.errorTitle}>Couldn't plan a route</p>
            <p className={styles.errorMsg}>{error}</p>
            <a href="/search" className={styles.emptyBtn}>
              Back to search
            </a>
          </div>
        )}

        {status === 'ready' && (
          <div className={styles.results}>
            <header className={styles.panelHead}>
              <p className={styles.eyebrow}>
                {routes.length} road{routes.length > 1 ? 's' : ''} ranked by safety
              </p>
              <h2 className={styles.title}>
                {origin.name} <span aria-hidden="true">→</span> {destination.name}
              </h2>
            </header>

            {facilityError && (
              <p className={styles.facilityWarn}>
                Live facility data unavailable — scores use distance/time only.
              </p>
            )}

            <ol className={styles.list}>
              {routes.map((route, index) => (
                <li key={route.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(route.id)}
                    className={[
                      styles.row,
                      route === activeRoute ? styles.active : '',
                      route.rejected ? styles.rejected : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <span className={styles.rowTop}>
                      <span className={styles.rank}>{String(index + 1).padStart(2, '0')}</span>
                      <span className={styles.rowName}>
                        {route.recommended
                          ? 'Safest route'
                          : index === 0
                            ? 'Fastest'
                            : `Route ${index + 1}`}
                        {route.recommended && (
                          <span className={styles.recoTag}>✓ Recommended</span>
                        )}
                      </span>
                      <SafetyBadge score={route.safetyScore} />
                    </span>
                    <span className={styles.rowMeta}>
                      {route.distanceStr} · {route.durationStr} · {route.facilityCounts.police} police ·{' '}
                      {route.facilityCounts.hospital} hospitals · {route.facilityCounts.hotel} hotels
                    </span>
                    {route.rejected && route.rejectedReason && (
                      <span className={styles.rowReject}>{route.rejectedReason}</span>
                    )}
                  </button>
                </li>
              ))}
            </ol>

            {activeRoute && (
              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <p className={styles.cardKicker}>
                    {activeRoute.recommended ? '⭐ SAFE ROUTE' : 'Route info'}
                  </p>
                  <SafetyBadge score={activeRoute.safetyScore} />
                </div>

                <div className={styles.cardStats}>
                  <span className={styles.stat}>
                    {activeRoute.distanceStr}
                    <small>distance</small>
                  </span>
                  <span className={styles.stat}>
                    {activeRoute.durationStr}
                    <small>time</small>
                  </span>
                </div>

                <p className={styles.cardLabel}>Safety factors</p>
                {(Object.keys(FACILITY_LABEL) as (keyof typeof FACILITY_LABEL)[]).map(
                  (key) => (
                    <div className={styles.factorRow} key={key}>
                      <span>{FACILITY_ICON[key]} {FACILITY_LABEL[key]}</span>
                      <span className={styles.factorBar}>
                        <i
                          className={styles.factorFill}
                          style={{ width: `${activeRoute.safetyFactors[key]}%` }}
                        />
                      </span>
                      <b>{activeRoute.safetyFactors[key]}</b>
                    </div>
                  ),
                )}

                <p className={styles.cardLabel}>Nearby safety support</p>
                <ul className={styles.facilityList}>
                  {(Object.keys(FACILITY_LABEL) as (keyof typeof FACILITY_LABEL)[]).map(
                    (key) => {
                      const closest = activeRoute.closestFacilities[key]
                      return (
                        <li key={key} className={styles.facilityItem}>
                          <span className={styles.facilityIcon}>{FACILITY_ICON[key]}</span>
                          <span className={styles.facilityName}>
                            {FACILITY_LABEL[key]}
                            <small>
                              {activeRoute.facilityCounts[key]} nearby · coverage{' '}
                              {coverageDescription(activeRoute.safetyFactors[key])}
                            </small>
                          </span>
                          <span className={styles.facilityDist}>
                            {closest ? `~${closest.distanceStr}` : 'n/a'}
                          </span>
                        </li>
                      )
                    },
                  )}
                </ul>

                <p className={styles.cardLabel}>Why this route?</p>
                <ul className={styles.whyList}>
                  {activeRoute.whyRecommended.map((reason, i) => (
                    <li key={i}>
                      <span aria-hidden="true">✓</span> {reason}
                    </li>
                  ))}
                </ul>

                <p className={styles.disclaimer}>
                  Recommended based on nearby safety infrastructure and route conditions.
                  Facility proximity is one factor — it is not a guarantee of personal
                  safety. Distances to facilities are approximations.
                </p>
              </div>
            )}
          </div>
        )}
      </aside>
    </main>
  )
}