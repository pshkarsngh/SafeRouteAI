import {
  FACILITY_CATEGORIES,
  FACILITY_COVERAGE_REFERENCE,
  FACILITY_DENSITY_REFERENCE,
  FACILITY_WEIGHTS,
  FLOOR_SCORE,
  MAX_DETOUR_PERCENT,
  MAX_FACILITIES_PER_CATEGORY,
  MISSING_DATA_SCORE,
  PROXIMITY_BANDS,
  SAFETY_RADIUS,
  SAFETY_SCORE_WEIGHTS,
  type FacilityCategory,
} from '../config/safety'
import type { SafetyFacility } from '../services/facilities'
import {
  distanceToPolylineMeters,
  formatKm,
  type NearestFacility,
  type RouteCandidate,
  type SafetyFactors,
} from '../utils/routing'

export interface AnalyzedRoute extends RouteCandidate {
  safetyScore: number
  safetyFactors: SafetyFactors
  closestFacilities: Partial<Record<FacilityCategory, NearestFacility>>
  facilityCounts: Partial<Record<FacilityCategory, number>>
  totalFacilities: number
  /** Weighted facility count (weight × count summed per category). */
  weightedFacilityScore: number
  /** Weighted facilities per route kilometre. */
  facilityDensity: number
  whyRecommended: string[]
  recommended: boolean
  rejected: boolean
  rejectedReason?: string
}

const CATEGORY_LABEL: Record<FacilityCategory, string> = {
  police: 'police station',
  hospital: 'hospital',
  medicalFacility: 'medical facility',
  hotel: 'hotel',
  restaurant: 'restaurant',
  fuel: 'fuel station',
}

/** Count a category's facilities already normalized by SAFETY_RADIUS. */
function countCategory(
  facility: SafetyFacility,
  routePoints: [number, number][],
): boolean {
  return (
    distanceToPolylineMeters(facility.lngLat, routePoints) <= SAFETY_RADIUS[facility.category]
  )
}

/** Deduplicate facilities that map to the same physical place. */
function isSameFacility(a: SafetyFacility, b: SafetyFacility): boolean {
  if (a.id === b.id) return true
  const coordKey = (f: SafetyFacility) =>
    `${f.lngLat[0].toFixed(5)},${f.lngLat[1].toFixed(5)}`
  return coordKey(a) === coordKey(b)
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

function toNearestFacility(
  facility: SafetyFacility,
  routePoints: [number, number][],
): NearestFacility {
  const distance = distanceToPolylineMeters(facility.lngLat, routePoints)
  return {
    name: facility.name,
    distanceMeters: Math.round(distance),
    distanceStr: formatKm(distance),
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

/** 0–100 facility coverage from the weighted facility count. */
function coverageScore(weightedScore: number): number {
  if (weightedScore <= 0) return 0
  return Math.min(
    100,
    Math.round((weightedScore / FACILITY_COVERAGE_REFERENCE) * 100),
  )
}

/**
 * 0–100 blended proximity. Each category contributes its nearest-facility
 * proximity weighted by its importance; categories with no nearby facility use
 * a neutral score rather than zeroing the result.
 */
function proximityFactor(
  byCategory: Partial<Record<FacilityCategory, SafetyFacility[]>>,
  routePoints: [number, number][],
): number {
  let weighted = 0
  let totalWeight = 0
  FACILITY_CATEGORIES.forEach((category) => {
    const facilities = byCategory[category] ?? []
    const weight = FACILITY_WEIGHTS[category]
    totalWeight += weight
    const nearest = nearestDistance(facilities, routePoints)
    weighted += weight * (Number.isFinite(nearest) ? proximityScore(nearest) : MISSING_DATA_SCORE)
  })
  if (totalWeight === 0) return 0
  return Math.round(weighted / totalWeight)
}

/** 0–100 weighted facility density (weighted facilities per route-km). */
function densityScore(weightedScore: number, distanceKm: number): number {
  if (weightedScore <= 0 || distanceKm <= 0) return 0
  const density = weightedScore / distanceKm
  return Math.min(100, Math.round((density / FACILITY_DENSITY_REFERENCE) * 100))
}

function buildReasons(
  route: AnalyzedRoute,
  shortest: RouteCandidate,
  fastestDuration: number,
): string[] {
  const reasons: string[] = []
  const factors = route.safetyFactors

  if (factors.coverage >= 85) reasons.push('Excellent safety/support facility coverage')
  else if (factors.coverage >= 65) reasons.push('Good safety/support facility coverage')
  else if (factors.coverage < 40) reasons.push('Limited nearby support facilities')

  if (factors.proximity >= 80) reasons.push('Key facilities are very close to the route')
  else if (factors.proximity >= 60) reasons.push('Key facilities are close to the route')

  if (factors.density >= 70) reasons.push('Dense cluster of facilities along the way')

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

function debugLog(route: AnalyzedRoute, rank: number, routeLabel: string): void {
  const counts = route.facilityCounts
  const closest = route.closestFacilities
  console.log(`[SafeRoute] Route ${routeLabel} (${route.id})`)
  console.log(`[SafeRoute]   Hospitals: ${counts.hospital ?? 0}`)
  console.log(`[SafeRoute]   Medical Facilities: ${counts.medicalFacility ?? 0}`)
  console.log(`[SafeRoute]   Hotels: ${counts.hotel ?? 0}`)
  console.log(`[SafeRoute]   Restaurants: ${counts.restaurant ?? 0}`)
  console.log(`[SafeRoute]   Petrol Stations: ${counts.fuel ?? 0}`)
  console.log(`[SafeRoute]   Police Stations: ${counts.police ?? 0}`)
  console.log(
    `[SafeRoute]   Total Facilities: ${route.totalFacilities}`,
  )
  console.log(`[SafeRoute]   Weighted Facility Score: ${route.weightedFacilityScore}`)
  if (closest.hospital) console.log(`[SafeRoute]   Nearest Hospital: ${closest.hospital.distanceMeters} m`)
  if (closest.medicalFacility)
    console.log(`[SafeRoute]   Nearest Medical Facility: ${closest.medicalFacility.distanceMeters} m`)
  if (closest.hotel) console.log(`[SafeRoute]   Nearest Hotel: ${closest.hotel.distanceMeters} m`)
  if (closest.restaurant)
    console.log(`[SafeRoute]   Nearest Restaurant: ${closest.restaurant.distanceMeters} m`)
  console.log(`[SafeRoute]   Route Distance: ${(route.distanceMeters / 1000).toFixed(1)} km`)
  console.log(`[SafeRoute]   Facility Density: ${route.facilityDensity.toFixed(2)}/km`)
  console.log(`[SafeRoute]   Final Safety Score: ${route.safetyScore}`)
  console.log(`[SafeRoute]   Rank: ${rank}`)
}

/**
 * Analyze all candidate road routes against nearby safety-support facilities
 * and rank them by facility coverage, proximity, density, then distance and
 * duration. Returns routes sorted by score with the safest practical route
 * marked as recommended. Only real facilities near each route's full geometry
 * are counted; nothing is invented and nothing is double counted.
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
    const closeFacilities: SafetyFacility[] = facilities.filter((facility) =>
      countCategory(facility, route.points),
    )

    // Deduplicate physical places before counting so a facility never boosts
    // a route twice (e.g. node + way for the same POI).
    const unique: SafetyFacility[] = []
    closeFacilities.forEach((facility) => {
      const already = unique.some((existing) => isSameFacility(existing, facility))
      if (!already) unique.push(facility)
    })

    const byCategory: Partial<Record<FacilityCategory, SafetyFacility[]>> = {}
    const counts: Partial<Record<FacilityCategory, number>> = {}
    FACILITY_CATEGORIES.forEach((category) => {
      const matched = unique
        .filter((f) => f.category === category)
        .sort(
          (a, b) =>
            distanceToPolylineMeters(a.lngLat, route.points) -
            distanceToPolylineMeters(b.lngLat, route.points),
        )
        .slice(0, MAX_FACILITIES_PER_CATEGORY)
      byCategory[category] = matched
      counts[category] = matched.length
    })

    const totalFacilities = FACILITY_CATEGORIES.reduce(
      (sum, category) => sum + (counts[category] ?? 0),
      0,
    )
    const weightedFacilityScore = FACILITY_CATEGORIES.reduce(
      (sum, category) => sum + (counts[category] ?? 0) * FACILITY_WEIGHTS[category],
      0,
    )
    const distanceKm = route.distanceMeters / 1000

    const coverage = coverageScore(weightedFacilityScore)
    const proximity = proximityFactor(byCategory, route.points)
    const density = densityScore(weightedFacilityScore, distanceKm)
    const distance = normalizedScore(shortest.distanceMeters, route.distanceMeters)
    const duration = normalizedScore(fastestDuration, route.durationSeconds)

    const rawScore =
      SAFETY_SCORE_WEIGHTS.coverage * coverage +
      SAFETY_SCORE_WEIGHTS.proximity * proximity +
      SAFETY_SCORE_WEIGHTS.density * density +
      SAFETY_SCORE_WEIGHTS.distance * distance +
      SAFETY_SCORE_WEIGHTS.duration * duration

    const detourOver = route.distanceMeters - detourLimitMeters
    const rejected = detourOver > 0
    const safetyScore = Math.max(0, Math.min(100, Math.round(rawScore)))

    const closestFacilities: Partial<Record<FacilityCategory, NearestFacility>> = {}
    FACILITY_CATEGORIES.forEach((category) => {
      const nearest = pickClosest(byCategory[category] ?? [], route.points)
      if (nearest) closestFacilities[category] = nearest
    })

    const base: AnalyzedRoute = {
      ...route,
      safetyScore,
      safetyFactors: { coverage, proximity, density, distance, duration },
      closestFacilities,
      facilityCounts: counts,
      totalFacilities,
      weightedFacilityScore,
      facilityDensity: distanceKm > 0 ? weightedFacilityScore / distanceKm : 0,
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
  const ordered = [...practical, ...rejectedRoutes]

  ordered.forEach((route, index) => {
    const routeLabel = String(analyzed.indexOf(route) + 1)
    debugLog(route, index + 1, routeLabel)
  })

  return ordered
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