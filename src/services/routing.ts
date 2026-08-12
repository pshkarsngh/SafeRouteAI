import {
  dedupeRoutes,
  formatDuration,
  formatKm,
  type RouteCandidate,
} from '../utils/routing'

const OSRM_BASE_URL =
  (import.meta.env && import.meta.env.VITE_OSRM_URL) ??
  'https://router.project-osrm.org'

/** Maximum number of distinct road routes to display. */
export const MAX_VISIBLE_ROUTES = 4

/** How close a route may be to an already-kept route before it is dropped. */
const DUPLICATE_THRESHOLD_METERS = 60

export interface RoutingResult {
  routes: RouteCandidate[]
  inferred?: boolean
}

interface OsrmRoute {
  distance: number
  duration: number
  geometry: { coordinates: [number, number][] }
}

interface OsrmResponse {
  code: string
  message?: string
  routes?: OsrmRoute[]
}

function toRouteCandidate(
  raw: OsrmRoute,
  index: number,
  prefix: string,
): RouteCandidate {
  const distanceMeters = Math.round(raw.distance)
  const durationSeconds = Math.round(raw.duration)
  return {
    id: `${prefix}-${index + 1}`,
    points: raw.geometry.coordinates,
    distanceMeters,
    distanceKm: distanceMeters / 1000,
    distanceStr: formatKm(distanceMeters),
    durationSeconds,
    durationMin: durationSeconds / 60,
    durationStr: formatDuration(durationSeconds),
  }
}

async function osrmRequest(path: string): Promise<OsrmRoute[]> {
  const url =
    `${OSRM_BASE_URL}/route/v1/driving/${path}` +
    '?overview=full&geometries=geojson&alternatives=true&steps=false'

  let response: Response
  try {
    response = await fetch(url)
  } catch (err) {
    throw new Error(
      `Unable to reach the routing service (${OSRM_BASE_URL}). Check your connection and VITE_OSRM_URL.`,
      { cause: err },
    )
  }

  if (!response.ok) {
    throw new Error(`Routing service responded with HTTP ${response.status}.`)
  }

  const json = (await response.json()) as OsrmResponse
  if (json.code !== 'Ok' || !json.routes || json.routes.length === 0) {
    const reason = json.message ?? json.code ?? 'unknown error'
    if (json.code !== 'Ok') {
      throw new Error(`No road route could be found between these points (${reason}).`)
    }
    return []
  }

  return json.routes.filter((r) => r.geometry && Array.isArray(r.geometry.coordinates))
}

/**
 * Compute an off-line "nudge" point perpendicular to the straight line between
 * start and end, at fraction `t` along it and `offsetMeters` to one side. Used
 * to generate genuinely different but still road-following via routes.
 */
function viaPoint(
  start: [number, number],
  end: [number, number],
  t: number,
  offsetMeters: number,
): [number, number] {
  const mPerDegLon = 111320 * Math.cos(((start[1] + end[1]) / 2) * (Math.PI / 180))
  const mPerDegLat = 110540

  const dx = (end[0] - start[0]) * mPerDegLon
  const dy = (end[1] - start[1]) * mPerDegLat
  const length = Math.hypot(dx, dy) || 1
  const ux = dx / length
  const uy = dy / length

  const px = start[0] * mPerDegLon + ux * t * length - uy * offsetMeters
  const py = start[1] * mPerDegLat + uy * t * length + ux * offsetMeters

  return [px / mPerDegLon, py / mPerDegLat]
}

/**
 * A curated set of nudge offsets to surface additional practical routes.
 * Spread across the middle of the trip and both sides of the line.
 */
const VIA_CANDIDATES: { t: number; offset: number }[] = [
  { t: 0.28, offset: 500 },
  { t: 0.28, offset: -500 },
  { t: 0.42, offset: 900 },
  { t: 0.42, offset: -900 },
  { t: 0.55, offset: 1300 },
  { t: 0.55, offset: -1300 },
  { t: 0.7, offset: 800 },
  { t: 0.7, offset: -800 },
]

/**
 * Keep the requested number of routes with strictly distinct geometry,
 * ordered by distance. No fake routes are created: if only 1, 2 or 3 truly
 * different road routes exist, only that many are returned.
 */
function selectDiverseRoutes(
  routes: RouteCandidate[],
): RouteCandidate[] {
  const byDistance = [...routes].sort((a, b) => a.distanceMeters - b.distanceMeters)

  const kept = dedupeRoutes(byDistance, DUPLICATE_THRESHOLD_METERS)

  return kept.slice(0, MAX_VISIBLE_ROUTES)
}

/**
 * Request actual road routes from an OSRM server. Geometry is GeoJSON
 * `[lng, lat]` coordinates following the real road network.
 *
 * The public OSRM server only exposes a couple of alternatives, so additional
 * genuinely different road routes are produced via via-point requests through
 * off-line waypoints. Every returned route is a real OSRM road route — nothing
 * is invented, duplicated or drawn as a straight line. At most
 * `MAX_VISIBLE_ROUTES` distinct routes are returned; if fewer practical
 * alternatives exist, only those are returned.
 */
export async function fetchRoadRoutes(
  start: [number, number],
  end: [number, number],
): Promise<RoutingResult> {
  const [lon0, lat0] = start

  // 1. Base request: shortest path plus whatever alternatives the server offers.
  const base = await osrmRequest(`${lon0},${lat0};${end[0]},${end[1]}`)
  if (base.length === 0) {
    throw new Error('No road route could be found between these points.')
  }
  const collected: RouteCandidate[] = base.map((raw, i) =>
    toRouteCandidate(raw, i, 'route'),
  )
  console.log('[SafeRoute] Routes returned by routing API:', base.length)

  // 2. Via-point requests to surface more genuinely different routes.
  //    Collect a healthy margin above the target to allow diversity selection.
  for (let i = 0; i < VIA_CANDIDATES.length; i += 1) {
    if (collected.length >= MAX_VISIBLE_ROUTES * 2) break
    const candidate = VIA_CANDIDATES[i]
    const via = viaPoint(start, end, candidate.t, candidate.offset)
    try {
      const viaRoutes = await osrmRequest(
        `${lon0},${lat0};${via[0]},${via[1]};${end[0]},${end[1]}`,
      )
      viaRoutes.forEach((raw, j) =>
        collected.push(toRouteCandidate(raw, collected.length + j, 'route')),
      )
    } catch (err) {
      console.warn('[SafeRoute] Via-point route request failed, continuing.', err)
    }
  }
  console.log('[SafeRoute] Routes after via requests:', collected.length)

  // 3. Remove near-identical routes, keep up to MAX_VISIBLE_ROUTES distinct ones.
  const routes = selectDiverseRoutes(collected)
  if (routes.length === 0) {
    throw new Error('Routing service returned an empty route.')
  }
  console.log('[SafeRoute] Routes after filtering:', routes.length)
  console.log('[SafeRoute] Routes displayed:', routes.length)

  return { routes, inferred: routes.length < MAX_VISIBLE_ROUTES }
}