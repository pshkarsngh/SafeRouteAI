import { SAFETY_RADIUS, type FacilityCategory } from '../config/safety'
import { distanceToPolylineMeters } from '../utils/routing'

const OVERPASS_URL = import.meta.env.VITE_OVERPASS_URL ?? 'https://overpass-api.de/api/interpreter'

export interface SafetyFacility {
  id: string
  category: FacilityCategory
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
}

const CATEGORY_TAGS: Record<FacilityCategory, { key: string; value: string; fallback: string }> = {
  police: { key: 'amenity', value: 'police', fallback: 'Police station' },
  hospital: { key: 'amenity', value: 'hospital', fallback: 'Hospital' },
  hotel: { key: 'tourism', value: 'hotel', fallback: 'Hotel' },
}

const CATEGORY_FILTERS = `node["${CATEGORY_TAGS.police.key}"="${CATEGORY_TAGS.police.value}"]($bbox);
  way["${CATEGORY_TAGS.police.key}"="${CATEGORY_TAGS.police.value}"]($bbox);
  node["${CATEGORY_TAGS.hospital.key}"="${CATEGORY_TAGS.hospital.value}"]($bbox);
  way["${CATEGORY_TAGS.hospital.key}"="${CATEGORY_TAGS.hospital.value}"]($bbox);
  node["${CATEGORY_TAGS.hotel.key}"="${CATEGORY_TAGS.hotel.value}"]($bbox);
  way["${CATEGORY_TAGS.hotel.key}"="${CATEGORY_TAGS.hotel.value}"]($bbox);`

function classificationFor(tags?: Record<string, string>): FacilityCategory | null {
  if (!tags) return null
  if (tags[CATEGORY_TAGS.police.key] === CATEGORY_TAGS.police.value) return 'police'
  if (tags[CATEGORY_TAGS.hospital.key] === CATEGORY_TAGS.hospital.value) return 'hospital'
  if (tags[CATEGORY_TAGS.hotel.key] === CATEGORY_TAGS.hotel.value) return 'hotel'
  return null
}

function buildOverpassQuery(bbox: [number, number, number, number]): string {
  const [west, south, east, north] = bbox
  return `[out:json][timeout:25];(
${CATEGORY_FILTERS}
);out center tags;`
    .replace('($bbox)', `(${south},${west},${north},${east})`)
}

/**
 * Fetch police stations, hospitals and hotels near the given route geometry
 * from OpenStreetMap via Overpass. Facilities are filtered client-side to the
 * per-category safety radius around the route.
 */
export async function fetchNearbyFacilities(
  routePoints: [number, number][],
): Promise<SafetyFacility[]> {
  if (routePoints.length === 0) return []

  const maxRadius = Math.max(...Object.values(SAFETY_RADIUS))
  const lngs = routePoints.map((p) => p[0])
  const lats = routePoints.map((p) => p[1])

  // Expand the route bbox by the maximum search radius (degrees ≈ meters / 111320).
  const padLng = maxRadius / (111320 * Math.max(1, Math.abs((Math.min(...lats) + Math.max(...lats)) / 2)))
  const padLat = maxRadius / 110540
  const bbox: [number, number, number, number] = [
    Math.min(...lngs) - padLng,
    Math.min(...lats) - padLat,
    Math.max(...lngs) + padLng,
    Math.max(...lats) + padLat,
  ]

  const query = buildOverpassQuery(bbox)
  let response: Response
  try {
    response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ data: query }),
    })
  } catch (err) {
    throw new Error(
      `Unable to reach the facility data service (${OVERPASS_URL}).`,
      { cause: err },
    )
  }

  if (!response.ok) {
    throw new Error(`Facility data service responded with HTTP ${response.status}.`)
  }

  const json = (await response.json()) as OverpassResponse
  const elements = json.elements ?? []
  if (elements.length === 0) return []

  const facilities: SafetyFacility[] = []
  elements.forEach((el) => {
    const category = classificationFor(el.tags)
    const lat = el.lat ?? el.center?.lat
    const lon = el.lon ?? el.center?.lon
    if (!category || lat === undefined || lon === undefined) return

    const lngLat: [number, number] = [lon, lat]
    const distance = distanceToPolylineMeters(lngLat, routePoints)
    if (distance > SAFETY_RADIUS[category]) return

    const name = el.tags?.name || CATEGORY_TAGS[category].fallback
    facilities.push({
      id: `${el.type}-${el.id}`,
      category,
      name,
      lngLat,
    })
  })

  return facilities
}