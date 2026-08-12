import {
  COVERAGE_SAMPLES,
  FLOOR_SCORE,
  MAX_DETOUR_PERCENT,
  MAX_FACILITIES_PER_CATEGORY,
  MISSING_DATA_SCORE,
  PROXIMITY_BANDS,
  SAFETY_RADIUS,
  SAFETY_WEIGHTS,
  SCORE_BLEND,
  type FacilityCategory,
} from '../config/safety'
import type { SafetyFacility } from '../services/facilities'
import {
  distanceToPolylineMeters,
  formatKm,
  haversineMeters,
  samplePolyline,
  type NearestFacility,
  type RouteCandidate,
  type SafetyFactors,
} from '../utils/routing'

export interface AnalyzedRoute extends RouteCandidate {
  safetyScore: number
  safetyFactors: SafetyFactors
  closestFacilities: {
    police?: NearestFacility
    hospital?: NearestFacility
    hotel?: NearestFacility
  }
  facilityCounts: { police: number; hospital: number; hotel: number }
  whyRecommended: string[]
  recommended: boolean
  rejected: boolean
  rejectedReason?: string
}

const CATEGORY_LABEL: Record<FacilityCategory, string> = {
  police: 'police station',
  hospital: 'hospital',
  hotel: 'hotel',
}

/** Turn a distance in meters into a 0–100 proximity score using configurable bands. */
export function proximityScore(distanceMeters: number): number {
  if (distanceMeters <= PROXIMITY_BANDS[0].max) return PROXIMITY_BANDS[0].score

  for (let i = 1; i < PROXIMITY_BANDS.length; i += 1) {
    const prev = PROXIMITY_BANDS[i - 1]
    const band = PROXIMITY_BANDS[i]
    if (distanceMeters <= band.max) {
      const fraction = (distanceMeters - prev.max) / (band.max - prev.max)
      return Math.round(prev.score + (band.score - prev.score) * fraction)
    }
  }

  const last = PROXIMITY_BANDS[PROXIMITY_BANDS.length - 1]
  const decay = (distanceMeters - last.max) / last.max
  return Math.max(FLOOR_SCORE, Math.round(last.score - last.score * Math.min(decay, 1)))
}

function nearestDistance(
  facilities: SafetyFacility[],
  routePoints: [number, number][],
): number {
  if (facilities.length === 0) return Infinity
  return Math.min(...facilities.map((f) => distanceToPolylineMeters(f.lngLat, routePoints)))
}

/**
 * Average proximity of the facilities nearest to equally-spaced sample points
 * along the whole route geometry (not just start/end).
 */
function coverageScore(
  facilities: SafetyFacility[],
  routePoints: [number, number][],
): number {
  if (facilities.length === 0) return 0
  const samples = samplePolyline(routePoints, COVERAGE_SAMPLES)
  const scores = samples.map((sample) => {
    const nearest = Math.min(...facilities.map((f) => haversineMeters(sample, f.lngLat)))
    return proximityScore(nearest)
  })
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
}

function facilityScore(
  facilities: SafetyFacility[],
  routePoints: [number, number][],
): number {
  const nearest = nearestDistance(facilities, routePoints)
  if (!Number.isFinite(nearest)) return MISSING_DATA_SCORE
  const coverage = coverageScore(facilities, routePoints)
  return Math.round(
    proximityScore(nearest) * SCORE_BLEND.nearest + coverage * SCORE_BLEND.coverage,
  )
}

function toNearestFacility(
  facility: SafetyFacility,
  routePoints: [number, number][],
): NearestFacility {
  return {
    name: facility.name,
    distanceMeters: Math.round(distanceToPolylineMeters(facility.lngLat, routePoints)),
    distanceStr: formatKm(distanceToPolylineMeters(facility.lngLat, routePoints)),
  }
}

function pickClosest(
  facilities: SafetyFacility[],
  routePoints: [number, number][],
): NearestFacility | undefined {
  if (facilities.length === 0) return undefined
  let best: SafetyFacility | undefined
  let bestDistance = Infinity
  facilities.forEach((facility) => {
    const distance = distanceToPolylineMeters(facility.lngLat, routePoints)
    if (distance < bestDistance) {
      bestDistance = distance
      best = facility
    }
  })
  return best ? toNearestFacility(best, routePoints) : undefined
}

function normalizedScore(shortest: number, value: number): number {
  if (shortest <= 0 || value <= 0) return 100
  return Math.round(Math.min(100, (shortest / value) * 100))
}

function buildReasons(
  route: AnalyzedRoute,
  shortest: RouteCandidate,
  fastestDuration: number,
): string[] {
  const reasons: string[] = []
  const factors = route.safetyFactors

  if (factors.police >= 85) reasons.push('Excellent police accessibility')
  else if (factors.police >= 65) reasons.push('Good police accessibility')

  if (factors.hospital >= 85) reasons.push('Excellent hospital accessibility')
  else if (factors.hospital >= 65) reasons.push('Good hospital accessibility')

  if (factors.hotel >= 65) reasons.push('Good nearby activity pockets (hotels)')

  const extraPercent =
    shortest.distanceMeters > 0
      ? ((route.distanceMeters - shortest.distanceMeters) / shortest.distanceMeters) * 100
      : 0
  if (extraPercent <= 8) reasons.push('Practically the shortest road route')
  else if (extraPercent <= MAX_DETOUR_PERCENT)
    reasons.push('Only a slight detour over the shortest route')

  if (route.durationSeconds <= fastestDuration * 1.05)
    reasons.push('Reasonable travel time')

  if (reasons.length === 0) reasons.push('This is the best route among the practical options')
  return reasons
}

/**
 * Analyze all candidate road routes against nearby safety infrastructure and
 * rank them. Returns routes sorted by score with the safest practical route
 * marked as recommended.
 */
export function analyzeRoutes(
  routes: RouteCandidate[],
  facilities: SafetyFacility[],
): AnalyzedRoute[] {
  if (routes.length === 0) return []

  const shortest = routes.reduce((a, b) =>
    a.distanceMeters <= b.distanceMeters ? a : b,
  )
  const fastestDuration = Math.min(...routes.map((r) => r.durationSeconds))
  const detourLimitMeters =
    shortest.distanceMeters * (1 + MAX_DETOUR_PERCENT / 100)

  const analyzed: AnalyzedRoute[] = routes.map((route) => {
    const byCategory: Record<FacilityCategory, SafetyFacility[]> = {
      police: [],
      hospital: [],
      hotel: [],
    }
    facilities.forEach((facility) => {
      const distance = distanceToPolylineMeters(facility.lngLat, route.points)
      if (distance <= SAFETY_RADIUS[facility.category]) {
        byCategory[facility.category].push(facility)
      }
    })
    ;(Object.keys(byCategory) as FacilityCategory[]).forEach((category) => {
      byCategory[category].sort(
        (a, b) =>
          distanceToPolylineMeters(a.lngLat, route.points) -
          distanceToPolylineMeters(b.lngLat, route.points),
      )
      byCategory[category] = byCategory[category].slice(
        0,
        MAX_FACILITIES_PER_CATEGORY,
      )
    })

    const police = facilityScore(byCategory.police, route.points)
    const hospital = facilityScore(byCategory.hospital, route.points)
    const hotel = facilityScore(byCategory.hotel, route.points)
    const distance = normalizedScore(shortest.distanceMeters, route.distanceMeters)
    const duration = normalizedScore(fastestDuration, route.durationSeconds)

    const rawScore =
      SAFETY_WEIGHTS.police * police +
      SAFETY_WEIGHTS.hospital * hospital +
      SAFETY_WEIGHTS.hotel * hotel +
      SAFETY_WEIGHTS.distance * distance +
      SAFETY_WEIGHTS.duration * duration

    const detourOver = route.distanceMeters - detourLimitMeters
    const rejected = detourOver > 0
    const safetyScore = Math.max(0, Math.min(100, Math.round(rawScore)))

    const base: AnalyzedRoute = {
      ...route,
      safetyScore,
      safetyFactors: { police, hospital, hotel, distance, duration },
      closestFacilities: {
        police: pickClosest(byCategory.police, route.points),
        hospital: pickClosest(byCategory.hospital, route.points),
        hotel: pickClosest(byCategory.hotel, route.points),
      },
      facilityCounts: {
        police: byCategory.police.length,
        hospital: byCategory.hospital.length,
        hotel: byCategory.hotel.length,
      },
      whyRecommended: [],
      recommended: false,
      rejected,
      rejectedReason: rejected
        ? `Unreasonable detour: ${formatKm(route.distanceMeters)} vs ${formatKm(
            shortest.distanceMeters,
          )} shortest (max ${MAX_DETOUR_PERCENT}%)`
        : undefined,
    }

    base.whyRecommended = buildReasons(base, shortest, fastestDuration)
    return base
  })

  const practical = analyzed.filter((r) => !r.rejected)
  if (practical.length > 0) {
    practical.sort((a, b) => {
      if (b.safetyScore !== a.safetyScore) return b.safetyScore - a.safetyScore
      return a.distanceMeters - b.distanceMeters
    })
    practical[0].recommended = true
  }

  const rejectedRoutes = analyzed.filter((r) => r.rejected)
  return [...practical, ...rejectedRoutes]
}

export function coverageDescription(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Good'
  if (score >= 55) return 'Moderate'
  if (score >= 35) return 'Weak'
  return 'Low'
}

export function categoryNoun(category: FacilityCategory): string {
  return CATEGORY_LABEL[category]
}