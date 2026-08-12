/**
 * Single configuration home for the SafeRoute ranking feature.
 *
 * All tunables live here so the weights / radii / score blend can be changed
 * in one place without touching the ranking or UI code.
 */

export type FacilityCategory =
  | 'police'
  | 'hospital'
  | 'medicalFacility'
  | 'hotel'
  | 'restaurant'
  | 'fuel'

export const FACILITY_CATEGORIES: FacilityCategory[] = [
  'police',
  'hospital',
  'medicalFacility',
  'hotel',
  'restaurant',
  'fuel',
]

/**
 * Configurable route proximity threshold in meters. A facility counts for a
 * route when its straight-line (or actual road) distance to the route geometry
 * is at or below this value.
 */
export const ROUTE_FACILITY_RADIUS = 1000

/**
 * Per-category radius, in meters. These default to `ROUTE_FACILITY_RADIUS`
 * and can be widened/narrowed per category in this single file.
 */
export const SAFETY_RADIUS: Record<FacilityCategory, number> = {
  police: ROUTE_FACILITY_RADIUS,
  hospital: ROUTE_FACILITY_RADIUS,
  medicalFacility: ROUTE_FACILITY_RADIUS,
  hotel: ROUTE_FACILITY_RADIUS,
  restaurant: ROUTE_FACILITY_RADIUS,
  fuel: ROUTE_FACILITY_RADIUS,
}

/**
 * Importance of each facility category when computing how much useful
 * "safety/support" coverage a route has. Hospitals and medical facilities are
 * the most valuable, hotels provide activity support, restaurants indicate
 * populated/active areas.
 */
export const FACILITY_WEIGHTS: Record<FacilityCategory, number> = {
  police: 5,
  hospital: 5,
  medicalFacility: 5,
  hotel: 3,
  restaurant: 1,
  fuel: 3,
}

/**
 * Proximity bands used to turn a nearest-facility distance (meters) into a
 * 0–100 score. Beyond the last band the score keeps decaying to `FLOOR_SCORE`.
 */
export const PROXIMITY_BANDS: { max: number; score: number }[] = [
  { max: 250, score: 100 },
  { max: 500, score: 82 },
  { max: 1000, score: 60 },
  { max: 2000, score: 35 },
]

export const FLOOR_SCORE = 12

/** When no facility of a category is near a route, this neutral proximity score is used. */
export const MISSING_DATA_SCORE = 40

/**
 * Weighted facility count that maps to a full 100 coverage score. Routes with a
 * weighted count at or above this are treated as having excellent coverage.
 */
export const FACILITY_COVERAGE_REFERENCE = 60

/**
 * Weighted facilities per route-km that maps to a full 100 density score.
 * Routes denser than this are treated as having excellent coverage density.
 */
export const FACILITY_DENSITY_REFERENCE = 4

/**
 * Blend of the five factors that make up the final 0–100 safety score.
 * The dominant factor is facility coverage, followed by proximity and density;
 * distance and duration only break near-ties.
 */
export const SAFETY_SCORE_WEIGHTS = {
  coverage: 0.5,
  proximity: 0.2,
  density: 0.15,
  distance: 0.1,
  duration: 0.05,
}

/**
 * Maximum acceptable detour compared to the shortest road route, in percent.
 * Routes longer than this are marked as unreasonable and are never recommended.
 * (10–20% from the practical shortest route.)
 */
export const MAX_DETOUR_PERCENT = 20

/**
 * Maximum number of facilities kept per category for scoring. Guards against an
 * unbounded facility list blowing up the count or scoring work.
 */
export const MAX_FACILITIES_PER_CATEGORY = 60