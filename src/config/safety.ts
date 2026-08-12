export type FacilityCategory = 'police' | 'hospital' | 'hotel'

/**
 * How far around the route each facility type is considered "nearby".
 * Values are in meters and can be tuned in one place.
 */
export const SAFETY_RADIUS: Record<FacilityCategory, number> = {
  police: 1000,
  hospital: 1500,
  hotel: 1000,
}

/**
 * Contribution of each safety factor to the final score (0–1, sum = 1).
 */
export const SAFETY_WEIGHTS: Record<
  'police' | 'hospital' | 'hotel' | 'distance' | 'duration',
  number
> = {
  police: 0.4,
  hospital: 0.3,
  hotel: 0.15,
  distance: 0.1,
  duration: 0.05,
}

/**
 * How much of a category score comes from the nearest facility vs overall
 * coverage along the whole route.
 */
export const SCORE_BLEND = {
  nearest: 0.7,
  coverage: 0.3,
}

/**
 * Proximity bands used to turn a distance (meters) into a 0–100 score.
 * Beyond the last band the score keeps decaying to `FLOOR_SCORE`.
 */
export const PROXIMITY_BANDS: { max: number; score: number }[] = [
  { max: 250, score: 100 },
  { max: 500, score: 82 },
  { max: 1000, score: 60 },
  { max: 2000, score: 35 },
]

export const FLOOR_SCORE = 12

/**
 * When no facilities of a category are found near a route, this neutral
 * score is used so the route is not penalised to zero for missing data.
 */
export const MISSING_DATA_SCORE = 40

/**
 * Maximum acceptable detour compared to the shortest road route, in percent.
 * Routes longer than this are marked as unreasonable and are never recommended.
 */
export const MAX_DETOUR_PERCENT = 20

/**
 * How many equally-spaced samples are taken along a route for coverage scoring.
 */
export const COVERAGE_SAMPLES = 60

/**
 * Maximum number of facilities per category kept for scoring markers.
 */
export const MAX_FACILITIES_PER_CATEGORY = 60