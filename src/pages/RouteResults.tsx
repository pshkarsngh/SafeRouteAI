import { Fragment, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Map from '../components/map/Map/Map'
import MapMarker from '../components/map/MapMarker/MapMarker'
import RouteLayer from '../components/map/RouteLayer/RouteLayer'
import FacilityLayer from '../components/map/FacilityLayer/FacilityLayer'
import PoiGlyph from '../components/ui/PoiGlyph'
import { useMap } from '../hooks/useMap'
import { facilitiesForRoute, useSafeRoute } from '../hooks/useSafeRoute'
import { CATEGORY_ICON } from '../config/poiIcons'
import type { FacilityCategory } from '../config/safety'
import type { AnalyzedRoute } from '../utils/safety'
import type { SafetyFactors } from '../utils/routing'
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

/**
 * Categories surfaced in the route-info card. Each `icon` is the name of the
 * native map sprite glyph (same as the facility map markers), so the icons in
 * the panel match the icons rendered on the map.
 */
const FACILITY_DISPLAY: {
  category: FacilityCategory
  icon: string
  label: string
  short: string
}[] = [
  { category: 'hospital', icon: CATEGORY_ICON.hospital, label: 'Hospitals', short: 'hospitals' },
  { category: 'medicalFacility', icon: CATEGORY_ICON.medicalFacility, label: 'Medical facilities', short: 'medical' },
  { category: 'hotel', icon: CATEGORY_ICON.hotel, label: 'Hotels', short: 'hotels' },
  { category: 'restaurant', icon: CATEGORY_ICON.restaurant, label: 'Restaurants', short: 'restaurants' },
  { category: 'fuel', icon: CATEGORY_ICON.fuel, label: 'Petrol pumps', short: 'petrol' },
  { category: 'police', icon: CATEGORY_ICON.police, label: 'Police stations', short: 'police' },
]

const FACTOR_DISPLAY: { key: keyof SafetyFactors; label: string }[] = [
  { key: 'coverage', label: 'Facility coverage' },
  { key: 'proximity', label: 'Facility proximity' },
  { key: 'density', label: 'Facility density' },
  { key: 'distance', label: 'Distance' },
  { key: 'duration', label: 'Duration' },
]

function SafetyBadge({ score }: { score: number }) {
  return (
    <span className={styles.scoreBadge}>
      {score}
      <small>/100</small>
    </span>
  )
}

function coverageLabel(route: AnalyzedRoute): string {
  if (route.safetyScore >= 85) return 'HIGH'
  if (route.safetyScore >= 60) return 'MODERATE'
  return 'LOW'
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

  // Debug: verify the UI is reading the actual analyzed route counts.
  useEffect(() => {
    if (status === 'ready' && activeRoute) {
      console.log('[SafeRoute] POI DEBUG — UI binding')
      console.log('[SafeRoute]   activeRoute.facilityCounts:', activeRoute.facilityCounts)
      console.log('[SafeRoute]   activeRoute.totalFacilities:', activeRoute.totalFacilities)
      console.log('[SafeRoute]   facilityError:', facilityError)
    }
  }, [status, activeRoute, facilityError])

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
            {!facilityError && activeRoute.totalFacilities === 0 && (
              <p className={styles.facilityWarn}>
                No support facilities were found within ~1 km of these routes.
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
                            ? 'Best coverage'
                            : `Route ${index + 1}`}
                        {route.recommended && (
                          <span className={styles.recoTag}>✓ Recommended</span>
                        )}
                      </span>
                      <SafetyBadge score={route.safetyScore} />
                    </span>
                    <span className={styles.rowMeta}>
                      {route.distanceStr} · {route.durationStr} ·{' '}
                      {FACILITY_DISPLAY.slice(0, 4)
                        .map(
                          (f) =>
                            `${route.facilityCounts[f.category] ?? 0} ${f.short}`,
                        )
                        .join(' · ')}
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
                    {activeRoute.recommended ? '⭐ SAFEST ROUTE' : 'Route info'}
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

                <p className={styles.cardLabel}>Facilities on this route</p>
                <ul className={styles.facilityList}>
                  {FACILITY_DISPLAY.map((f) => {
                    const closest = activeRoute.closestFacilities[f.category]
                    return (
                      <li key={f.category} className={styles.facilityItem}>
                        <PoiGlyph icon={f.icon} className={styles.facilityIcon} alt={f.label} />
                        <span className={styles.facilityName}>
                          {f.label}
                          <small>within ~1 km of the route</small>
                        </span>
                        <span className={styles.facilityCount}>
                          {activeRoute.facilityCounts[f.category] ?? 0}
                        </span>
                        <span className={styles.facilityDist}>
                          {closest ? `~${closest.distanceStr}` : 'n/a'}
                        </span>
                      </li>
                    )
                  })}
                  <li className={`${styles.facilityItem} ${styles.facilityTotal}`}>
                    <PoiGlyph icon="marker" className={styles.facilityIcon} alt="Total facilities" />
                    <span className={styles.facilityName}>
                      Total facilities
                      <small>weighted score {activeRoute.weightedFacilityScore}</small>
                    </span>
                    <span className={styles.facilityCount}>
                      {activeRoute.totalFacilities}
                    </span>
                    <span className={styles.coverageTag}>
                      {coverageLabel(activeRoute)}
                    </span>
                  </li>
                </ul>

                <p className={styles.cardLabel}>Safety factors</p>
                {FACTOR_DISPLAY.map((factor) => (
                  <div className={styles.factorRow} key={factor.key}>
                    <span>{factor.label}</span>
                    <span className={styles.factorBar}>
                      <i
                        className={styles.factorFill}
                        style={{
                          width: `${activeRoute.safetyFactors[factor.key]}%`,
                        }}
                      />
                    </span>
                    <b>{activeRoute.safetyFactors[factor.key]}</b>
                  </div>
                ))}

                <p className={styles.cardLabel}>Why this route?</p>
                <ul className={styles.whyList}>
                  {activeRoute.whyRecommended.map((reason, i) => (
                    <li key={i}>
                      <span aria-hidden="true">✓</span> {reason}
                    </li>
                  ))}
                </ul>

                <p className={styles.disclaimer}>
                  Recommended based on nearby safety/support facilities and route
                  conditions. Facility coverage is the primary ranking factor — it is
                  not a guarantee of personal safety. Distances to facilities are
                  approximations.
                </p>
              </div>
            )}
          </div>
        )}
      </aside>
    </main>
  )
}