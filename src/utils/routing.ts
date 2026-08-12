export interface SafetyFactors {
  police: number
  hospital: number
  hotel: number
  distance: number
  duration: number
}

export interface NearestFacility {
  name: string
  distanceMeters: number
  distanceStr: string
}

export interface RouteCandidate {
  id: string
  points: [number, number][]
  distanceMeters: number
  distanceStr: string
  durationSeconds: number
  durationStr: string
  /** Map URL path from origin to destination, used for the fit bounds. */
  distanceKm: number
  durationMin: number
  safetyScore?: number
  safetyFactors?: SafetyFactors
  closestFacilities?: {
    police?: NearestFacility
    hospital?: NearestFacility
    hotel?: NearestFacility
  }
  facilityCounts?: { police: number; hospital: number; hotel: number }
  whyRecommended?: string[]
  recommended?: boolean
  rejected?: boolean
  rejectedReason?: string
}

const EARTH_RADIUS_KM = 6371

function toRad(value: number): number {
  return (value * Math.PI) / 180
}

/** Haversine distance in meters between two [lng, lat] points. */
export function haversineMeters(a: [number, number], b: [number, number]): number {
  const [lon1, lat1] = a
  const [lon2, lat2] = b
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * 1000 * Math.asin(Math.sqrt(h))
}

/**
 * Distance in meters from a point to a segment, using a local equirectangular
 * projection so the math is plain 2D. Accurate for city-scale distances.
 */
export function distanceToSegmentMeters(
  p: [number, number],
  a: [number, number],
  b: [number, number],
): number {
  const lat = toRad((a[1] + b[1]) / 2)
  const perDegLon = 111320 * Math.cos(lat)
  const perDegLat = 110540

  const ax = a[0] * perDegLon
  const ay = a[1] * perDegLat
  const bx = b[0] * perDegLon
  const by = b[1] * perDegLat
  const px = p[0] * perDegLon
  const py = p[1] * perDegLat

  const dx = bx - ax
  const dy = by - ay
  const lenSq = dx * dx + dy * dy
  let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  const cx = ax + t * dx
  const cy = ay + t * dy
  return Math.hypot(px - cx, py - cy)
}

/** Minimum distance in meters from a point to a polyline of [lng, lat] points. */
export function distanceToPolylineMeters(
  p: [number, number],
  points: [number, number][],
): number {
  if (points.length === 0) return Infinity
  if (points.length === 1) return haversineMeters(p, points[0])
  let min = Infinity
  for (let i = 1; i < points.length; i += 1) {
    const d = distanceToSegmentMeters(p, points[i - 1], points[i])
    if (d < min) min = d
  }
  return min
}

/** Sample `count` equally spaced points along a polyline. */
export function samplePolyline(
  points: [number, number][],
  count: number,
): [number, number][] {
  if (points.length === 0) return []
  if (points.length === 1 || count <= 2) return [points[0], points[points.length - 1]]

  const segments: { length: number; start: number; a: [number, number]; b: [number, number] }[] = []
  let total = 0
  for (let i = 1; i < points.length; i += 1) {
    const length = haversineMeters(points[i - 1], points[i])
    segments.push({ length, start: total, a: points[i - 1], b: points[i] })
    total += length
  }

  const samples: [number, number][] = []
  for (let i = 0; i < count; i += 1) {
    const target = (i / (count - 1)) * total
    const seg = segments.find((s) => target <= s.start + s.length) ?? segments[segments.length - 1]
    const local = Math.max(0, Math.min(1, (target - seg.start) / (seg.length || 1)))
    samples.push([
      seg.a[0] + (seg.b[0] - seg.a[0]) * local,
      seg.a[1] + (seg.b[1] - seg.a[1]) * local,
    ])
  }
  return samples
}

export function formatKm(meters: number): string {
  const km = meters / 1000
  if (km < 1) return `${Math.round(meters)} m`
  return `${km.toFixed(1)} km`
}

export function formatDuration(seconds: number): string {
  const minutes = seconds / 60
  if (minutes < 60) return `${Math.round(minutes)} min`
  const hours = Math.floor(minutes / 60)
  const rest = Math.round(minutes % 60)
  return `${hours}h ${rest}m`
}

/**
 * Estimate how similar two route geometries are by sampling both and
 * averaging the distance between corresponding samples. Returns meters.
 * 0 = identical geometry.
 */
export function routeSimilarityMeters(
  a: [number, number][],
  b: [number, number][],
): number {
  if (a.length === 0 || b.length === 0) return Infinity
  const samples = 40
  const aSamples = samplePolyline(a, samples)
  const bSamples = samplePolyline(b, samples)
  const n = Math.min(aSamples.length, bSamples.length)
  let total = 0
  for (let i = 0; i < n; i += 1) {
    total += haversineMeters(aSamples[i], bSamples[i])
  }
  return total / n
}

/**
 * Remove routes that are near-duplicates of a kept route. A route is dropped
 * only when its geometry closely follows an already-kept route (both in shape
 * and overall length) to avoid cluttering the map with essentially identical
 * lines. Genuinely different alternatives are never removed.
 */
export function dedupeRoutes(
  routes: RouteCandidate[],
  similarityThresholdMeters = 60,
  lengthToleranceRatio = 0.03,
): RouteCandidate[] {
  const kept: RouteCandidate[] = []

  routes.forEach((route) => {
    const isDuplicate = kept.some((existing) => {
      const lengthRatio =
        Math.max(route.distanceMeters, existing.distanceMeters) /
        Math.max(1, Math.min(route.distanceMeters, existing.distanceMeters))
      if (lengthRatio > 1 + lengthToleranceRatio) return false
      return (
        routeSimilarityMeters(route.points, existing.points) <=
        similarityThresholdMeters
      )
    })
    if (!isDuplicate) kept.push(route)
  })

  return kept
}