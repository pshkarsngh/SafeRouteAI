import { SAFETY_RADIUS, type FacilityCategory } from '../config/safety'
import { distanceToPolylineMeters } from '../utils/routing'

export interface SafetyFacility {
  id: string
  category: FacilityCategory
  /** Granular OSM subclass (e.g. 'clinic', 'pharmacy', 'fuel', 'hotel'). */
  poiType: string
  name: string
  lngLat: [number, number]
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

interface OverpassResponse {
  elements?: OverpassElement[]
  remark?: string
}

/** OSM tag rules per category. `value` may be a `|`-separated list for `~` matches. */
interface CategoryRule {
  key: string
  value: string
  valueRegex?: boolean
  fallback: string
}

const CATEGORY_RULES: Record<FacilityCategory, CategoryRule> = {
  police: { key: 'amenity', value: 'police', fallback: 'Police station' },
  hospital: { key: 'amenity', value: 'hospital', fallback: 'Hospital' },
  medicalFacility: {
    key: 'amenity',
    value: 'clinic|doctors|dentist|pharmacy|doctors_office',
    valueRegex: true,
    fallback: 'Medical facility',
  },
  hotel: {
    key: 'tourism',
    value: 'hotel|motel|hostel|guest_house|bed_and_breakfast|chalet',
    valueRegex: true,
    fallback: 'Hotel',
  },
  restaurant: { key: 'amenity', value: 'restaurant', fallback: 'Restaurant' },
  fuel: {
    key: 'amenity',
    value: 'fuel|fuel_station|petrol_station|charging_station',
    valueRegex: true,
    fallback: 'Petrol pump',
  },
}

function ruleStatement(rule: CategoryRule, bbox: string): string {
  const value = rule.valueRegex ? `~"${rule.value.replace(/`/g, '')}"` : `="${rule.value}"`
  return `node["${rule.key}"${value}](${bbox});
  way["${rule.key}"${value}](${bbox});`
}

/** One small query per category — the public Overpass instance refuses big combined queries. */
function buildCategoryQuery(category: FacilityCategory, bbox: string): string {
  return `[out:json][timeout:25];(
${ruleStatement(CATEGORY_RULES[category], bbox)}
);out center tags;`
}

/**
 * Overpass "mirror" instances speaking the identical API. A custom
 * `VITE_OVERPASS_URL` (if set) is always tried first, then public mirrors.
 * The public default instance frequently returns 504 "server too busy", so
 * SafeRoute rotates to the next instance on failure.
 */
function overpassEndpoints(): string[] {
  const configured = import.meta.env.VITE_OVERPASS_URL?.trim()
  const candidates = [
    configured,
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
    'https://overpass.osm.jp/api/interpreter',
  ]
  const seen = new Set<string>()
  return candidates.filter(
    (endpoint): endpoint is string =>
      !!endpoint && !seen.has(endpoint) && (seen.add(endpoint), true),
  )
}

const REQUEST_TIMEOUT_MS = 30000
const MAX_ATTEMPTS_PER_ENDPOINT = 2
const RETRY_DELAY_MS = 1200
/** Delay between category queries so the public instance doesn't rate-limit (429). */
const QUERY_GAP_MS = 700

async function fetchOverpass(query: string): Promise<OverpassResponse> {
  const failures: string[] = []

  for (const endpoint of overpassEndpoints()) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_ENDPOINT; attempt += 1) {
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ data: query }),
            signal: controller.signal,
          })
          const text = await response.text()
          if (!response.ok) {
            const detail = text.replace(/\s+/g, ' ').trim().slice(0, 180)
            throw new Error(`HTTP ${response.status}${detail ? `: ${detail}` : ''}`)
          }
          return JSON.parse(text) as OverpassResponse
        } finally {
          clearTimeout(timer)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        failures.push(`[${endpoint} | attempt ${attempt + 1}] ${message}`)
        console.warn(`[SafeRoute] Overpass request failed: ${failures[failures.length - 1]}`)
        if (attempt < MAX_ATTEMPTS_PER_ENDPOINT - 1) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
        }
      }
    }
  }

  throw new Error(`Facility data service unreachable.\n${failures.join('\n')}`)
}

function classificationFor(tags?: Record<string, string>): {
  category: FacilityCategory
  poiType: string
} | null {
  if (!tags) return null
  if (tags.amenity === 'police') return { category: 'police', poiType: 'police' }
  if (tags.amenity === 'hospital') return { category: 'hospital', poiType: 'hospital' }
  if (tags.amenity === 'restaurant') return { category: 'restaurant', poiType: 'restaurant' }
  if (tags.tourism) {
    const hotelTypes = ['hotel', 'motel', 'bed_and_breakfast', 'guest_house', 'hostel', 'chalet']
    if (hotelTypes.includes(tags.tourism)) {
      return { category: 'hotel', poiType: tags.tourism }
    }
  }
  if (tags.amenity === 'pharmacy') return { category: 'medicalFacility', poiType: 'pharmacy' }
  if (tags.amenity === 'clinic') return { category: 'medicalFacility', poiType: 'clinic' }
  if (tags.amenity === 'doctors') return { category: 'medicalFacility', poiType: 'doctors' }
  if (tags.amenity === 'dentist') return { category: 'medicalFacility', poiType: 'dentist' }
  if (tags.amenity?.match(/^(fuel|fuel_station|petrol_station|charging_station)$/)) {
    return { category: 'fuel', poiType: 'fuel' }
  }
  return null
}

/** Normalize a facility's id so the same physical place is never counted twice. */
function facilityKey(type: string, id: number): string {
  return `${type}-${id}`
}

/** Minimum straight-line distance (m) from a point to ANY of the route polylines. */
function distanceToRoutesMeters(p: [number, number], polylines: [number, number][][]): number {
  let min = Infinity
  for (const points of polylines) {
    const distance = distanceToPolylineMeters(p, points)
    if (distance < min) min = distance
  }
  return min
}

/**
 * Fetch safety-support facilities (police, hospitals, medical facilities,
 * hotels, restaurants, fuel stations) near the given route geometries from
 * OpenStreetMap via Overpass.
 *
 * Each category is queried separately (small, lightweight Overpass queries that
 * the public instance can actually satisfy), with per-request timeouts, retries
 * and endpoint failover. Facilities are filtered client-side to the per-category
 * safety radius around ALL route geometries, and each facility is deduplicated.
 */
export async function fetchNearbyFacilities(
  polylines: [number, number][][],
): Promise<SafetyFacility[]> {
  const valid = polylines.filter((points) => points.length > 0)
  if (valid.length === 0) return []

  const maxRadius = Math.max(...Object.values(SAFETY_RADIUS))
  const allPoints = valid.flat()
  const lngs = allPoints.map((p) => p[0])
  const lats = allPoints.map((p) => p[1])

  // Buffer the bbox of ALL routes by the maximum search radius so the search
  // corridor covers the start, end and middle of the entire route set.
  const meanAbsLat = (Math.min(...lats) + Math.max(...lats)) / 2
  const padLng = maxRadius / (111320 * Math.max(1, Math.abs(meanAbsLat)))
  const padLat = maxRadius / 110540
  const bbox: [number, number, number, number] = [
    Math.min(...lngs) - padLng,
    Math.min(...lats) - padLat,
    Math.max(...lngs) + padLng,
    Math.max(...lats) + padLat,
  ]

  console.log('[SafeRoute] POI search started')
  console.log(
    `[SafeRoute]   route polylines: ${valid.length}, total geometry points: ${allPoints.length}`,
  )
  console.log(`[SafeRoute]   search bbox (west,south,east,north): ${bbox.join(',')}`)
  console.log(
    `[SafeRoute]   buffer radius: ${maxRadius} m (per-category: ${JSON.stringify(SAFETY_RADIUS)})`,
  )

  const facilities: SafetyFacility[] = []
  let totalRaw = 0
  let categoryFailures = 0
  const categories = Object.keys(CATEGORY_RULES) as FacilityCategory[]
  const bboxStr = `${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]}`

  for (const category of categories) {
    const query = buildCategoryQuery(category, bboxStr)
    try {
      const response = await fetchOverpass(query)
      const elements = (response as OverpassResponse).elements ?? []
      totalRaw += elements.length
      console.log(`[SafeRoute]   ${category}: raw POIs returned = ${elements.length}`)

      const seen = new Set<string>()
      let kept = 0
      elements.forEach((el) => {
        const key = facilityKey(el.type, el.id)
        if (seen.has(key)) return
        seen.add(key)

        const classified = classificationFor(el.tags)
        const lat = el.lat ?? el.center?.lat
        const lon = el.lon ?? el.center?.lon
        if (!classified || lat === undefined || lon === undefined) return

        const lngLat: [number, number] = [lon, lat]
        const distance = distanceToRoutesMeters(lngLat, valid)
        if (distance > SAFETY_RADIUS[classified.category]) return

        facilities.push({
          id: key,
          category: classified.category,
          poiType: classified.poiType,
          name: el.tags?.name || CATEGORY_RULES[category].fallback,
          lngLat,
        })
        kept += 1
      })

      const bySubtype: Record<string, number> = {}
      elements.forEach((el) => {
        const sub = el.tags?.amenity ?? el.tags?.tourism
        if (sub) bySubtype[sub] = (bySubtype[sub] ?? 0) + 1
      })
      console.log(
        `[SafeRoute]   ${category}: within radius + classified = ${kept}`,
        `| raw subtypes: ${JSON.stringify(bySubtype)}`,
      )
    } catch (err) {
      categoryFailures += 1
      console.warn(
        `[SafeRoute]   ${category}: query failed — ${err instanceof Error ? err.message : err}`,
      )
    }

    // Keep the per-category request rate gentle enough for the public instance.
    if (category !== categories[categories.length - 1]) {
      await new Promise((resolve) => setTimeout(resolve, QUERY_GAP_MS))
    }
  }

  console.log(`[SafeRoute] Total raw POIs returned: ${totalRaw}`)
  console.log(`[SafeRoute] Category queries failed: ${categoryFailures}/${categories.length}`)

  if (categoryFailures === categories.length && totalRaw === 0) {
    throw new Error('Facility data service responded with errors for every category.')
  }

  // In case the same POI is returned under a different syntactic id, collapse
  // by rounded coordinates too, keeping the first occurrence.
  const byCoords = new Map<string, SafetyFacility>()
  facilities.forEach((facility) => {
    const coordKey = `${facility.lngLat[0].toFixed(5)},${facility.lngLat[1].toFixed(5)}`
    if (!byCoords.has(coordKey)) byCoords.set(coordKey, facility)
  })

  const result = [...byCoords.values()]
  const grouped: Record<string, number> = {}
  result.forEach((facility) => {
    grouped[facility.category] = (grouped[facility.category] ?? 0) + 1
  })
  console.log('[SafeRoute] Facilities after route filtering:', result.length, grouped)

  return result
}