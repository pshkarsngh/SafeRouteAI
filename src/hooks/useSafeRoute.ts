import { useEffect, useState } from 'react'
import { SAFETY_RADIUS } from '../config/safety'
import type { SafetyFacility } from '../services/facilities'
import { fetchNearbyFacilities } from '../services/facilities'
import { fetchRoadRoutes } from '../services/routing'
import { analyzeRoutes, type AnalyzedRoute } from '../utils/safety'
import { dedupeRoutes, distanceToPolylineMeters } from '../utils/routing'

export type RouteLoadStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface SafeRouteResult {
  status: RouteLoadStatus
  routes: AnalyzedRoute[]
  allFacilities: SafetyFacility[]
  error?: string
  facilityError?: boolean
}

/** Facilities within the safety radius of a specific route. */
export function facilitiesForRoute(
  route: AnalyzedRoute,
  facilities: SafetyFacility[],
): SafetyFacility[] {
  return facilities.filter(
    (f) =>
      distanceToPolylineMeters(f.lngLat, route.points) <= SAFETY_RADIUS[f.category] &&
      (route.facilityCounts[f.category] ?? 0) > 0,
  )
}

/**
 * Load real road routes for the origin/destination, fetch nearby safety
 * infrastructure, and run the safety analysis. Facility failures degrade
 * gracefully to scoring without them.
 */
export function useSafeRoute(
  origin: { lngLat: [number, number] } | null,
  destination: { lngLat: [number, number] } | null,
): SafeRouteResult {
  const [status, setStatus] = useState<RouteLoadStatus>('idle')
  const [routes, setRoutes] = useState<AnalyzedRoute[]>([])
  const [allFacilities, setAllFacilities] = useState<SafetyFacility[]>([])
  const [error, setError] = useState<string | undefined>(undefined)
  const [facilityError, setFacilityError] = useState(false)

  useEffect(() => {
    if (!origin || !destination) {
      setStatus('idle')
      setRoutes([])
      setAllFacilities([])
      setError(undefined)
      setFacilityError(false)
      return
    }

    let cancelled = false
    setStatus('loading')
    setError(undefined)
    setFacilityError(false)

    const load = async () => {
      try {
        const { routes: fetchedRoutes } = await fetchRoadRoutes(
          origin.lngLat,
          destination.lngLat,
        )
        if (cancelled) return

        const deduped = dedupeRoutes(fetchedRoutes)

        const first = deduped[0]?.points ?? []
        console.log('[SafeRoute] POI DEBUG — route geometry')
        console.log(`[SafeRoute]   routes after dedupe: ${deduped.length}`)
        console.log(`[SafeRoute]   first route geometry points: ${first.length}`)
        if (first.length > 0) {
          console.log(`[SafeRoute]   first coord [lng, lat]: ${JSON.stringify(first[0])}`)
          console.log(`[SafeRoute]   last coord  [lng, lat]: ${JSON.stringify(first[first.length - 1])}`)
          console.log(`[SafeRoute]   origin  [lng, lat]: ${JSON.stringify(origin.lngLat)}`)
          console.log(`[SafeRoute]   dest    [lng, lat]: ${JSON.stringify(destination.lngLat)}`)
        }

        const polylines = deduped.map((route) => route.points)
        let fetchedFacilities: SafetyFacility[] = []
        if (polylines.some((points) => points.length > 0)) {
          try {
            fetchedFacilities = await fetchNearbyFacilities(polylines)
          } catch (err) {
            if (!cancelled) {
              setFacilityError(true)
              console.warn('[SafeRoute] Facility lookup failed; scoring without facilities.', err)
            }
          }
        }
        if (cancelled) return

        console.log(`[SafeRoute] POI DEBUG — total facilities to analyze: ${fetchedFacilities.length}`)
        setRoutes(analyzeRoutes(deduped, fetchedFacilities))
        setAllFacilities(fetchedFacilities)
        setStatus('ready')
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Something went wrong.')
          setStatus('error')
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [origin, destination])

  return {
    status,
    routes,
    allFacilities,
    error,
    facilityError,
  }
}