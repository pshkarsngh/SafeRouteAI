/**
 * Central POI → icon mapping for SafeRoute.
 *
 * Icons are NOT emojis. They are the *native* glyphs from the map provider's
 * own sprite (OpenFreeMap "Liberty" style → `https://tiles.openfreemap.org/sprites/ofm_f384/ofm`).
 * The map renders them through a maplibre symbol layer using `icon-image`, i.e.
 * exactly the same image + rendering pipeline the base map uses for its POIs.
 *
 * The mapping mirrors the OpenMapTiles POI classification the tile server
 * (`tiles.openfreemap.org/planet`) emits, so the icon SafeRoute shows for a
 * detected POI is the one the base map itself would draw for that POI.
 */

import type { FacilityCategory } from './safety'

/** Pixel dimensions (logical px) of the source @2x sprite image. */
export const OFM_SPRITE_URL =
  'https://tiles.openfreemap.org/sprites/ofm_f384/ofm'
export const OFM_SPRITE_2X_URL = `${OFM_SPRITE_URL}@2x.png`
export const OFM_SPRITE_2X_WIDTH = 1024
export const OFM_SPRITE_PIXEL_RATIO = 2

/**
 * Rectangle of each native glyph inside the @2x sprite. These coordinates are
 * taken from the published sprite index (`ofm@2x.json`) so the same glyph used
 * on the map can be cropped and reused in the route cards.
 */
export interface PoiGlyph {
  x: number
  y: number
  w: number
  h: number
}

export const POI_GLYPHS: Record<string, PoiGlyph> = {
  hospital: { x: 254, y: 0, w: 42, h: 42 },
  doctors: { x: 420, y: 128, w: 42, h: 42 },
  dentist: { x: 378, y: 128, w: 42, h: 42 },
  pharmacy: { x: 294, y: 254, w: 42, h: 42 },
  fuel: { x: 304, y: 422, w: 38, h: 38 },
  restaurant: { x: 294, y: 296, w: 42, h: 42 },
  lodging: { x: 0, y: 254, w: 42, h: 42 },
  police: { x: 0, y: 296, w: 42, h: 42 },
  cross: { x: 152, y: 422, w: 38, h: 38 },
  marker: { x: 456, y: 422, w: 38, h: 38 },
}

/**
 * Granular OSM subclass (`poiType`) → native sprite icon name.
 * Reflects the OpenMapTiles `poi_class` mapping used by the tile provider:
 *   - clinic / nursing_home / hospital → hospital
 *   - doctors → doctors, dentist → dentist, pharmacy → pharmacy
 *   - fuel / petrol / charging → fuel
 *   - hotel / motel / guest_house / hostel / chalet → lodging
 */
export const POI_TYPE_ICON: Record<string, string> = {
  police: 'police',
  hospital: 'hospital',
  clinic: 'hospital',
  nursing_home: 'hospital',
  doctors: 'doctors',
  doctors_office: 'doctors',
  dentist: 'dentist',
  pharmacy: 'pharmacy',
  fuel: 'fuel',
  fuel_station: 'fuel',
  petrol_station: 'fuel',
  charging_station: 'fuel',
  restaurant: 'restaurant',
  hotel: 'lodging',
  motel: 'lodging',
  bed_and_breakfast: 'lodging',
  guest_house: 'lodging',
  hostel: 'lodging',
  chalet: 'lodging',
  alpine_hut: 'lodging',
  dormitory: 'lodging',
}

/** Fallback native icon per aggregated facility category. */
export const CATEGORY_ICON: Record<FacilityCategory, string> = {
  police: 'police',
  hospital: 'hospital',
  medicalFacility: 'hospital',
  hotel: 'lodging',
  restaurant: 'restaurant',
  fuel: 'fuel',
}

/** Display labels per aggregated facility category. */
export const CATEGORY_LABEL: Record<FacilityCategory, string> = {
  police: 'Police stations',
  hospital: 'Hospitals',
  medicalFacility: 'Medical facilities',
  hotel: 'Hotels',
  restaurant: 'Restaurants',
  fuel: 'Petrol pumps',
}

export const CATEGORY_SHORT_LABEL: Record<FacilityCategory, string> = {
  police: 'police',
  hospital: 'hospitals',
  medicalFacility: 'medical',
  hotel: 'hotels',
  restaurant: 'restaurants',
  fuel: 'petrol',
}

/** Resolve the native sprite icon name for a detected POI type. */
export function poiIconFor(poiType: string, category: FacilityCategory): string {
  return POI_TYPE_ICON[poiType] ?? CATEGORY_ICON[category] ?? 'marker'
}

let ofmSpritePromise: Promise<HTMLImageElement> | null = null
const glyphDataUrlCache = new Map<string, string>()

function loadOfmSprite(): Promise<HTMLImageElement> {
  if (ofmSpritePromise) return ofmSpritePromise
  ofmSpritePromise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.src = OFM_SPRITE_2X_URL
    image.onload = () => resolve(image)
    image.onerror = () => {
      ofmSpritePromise = null
      reject(new Error(`Unable to load the map POI sprite: ${OFM_SPRITE_2X_URL}`))
    }
  })
  return ofmSpritePromise
}

/** Cached cropped PNG data URL of a native sprite glyph, or `null` before load. */
export function getPoiGlyphDataUrl(icon: string): string | null {
  return glyphDataUrlCache.get(icon) ?? null
}

/**
 * Crop one glyph out of the map provider's own @2x sprite (the same PNG the
 * map's symbol layers render through `icon-image`) as a PNG data URL. This is
 * used off-canvas — e.g. inside route cards — so the exact native symbol that
 * appears on the map is reused everywhere. Results are cached per icon.
 */
export async function loadPoiGlyphDataUrl(icon: string): Promise<string> {
  const cached = glyphDataUrlCache.get(icon)
  if (cached) return cached

  const glyph = POI_GLYPHS[icon]
  if (!glyph) throw new Error(`No glyph rect registered for POI icon "${icon}".`)

  const sprite = await loadOfmSprite()
  const canvas = document.createElement('canvas')
  canvas.width = glyph.w
  canvas.height = glyph.h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Unable to get a 2D canvas context for the POI glyph.')
  ctx.drawImage(sprite, glyph.x, glyph.y, glyph.w, glyph.h, 0, 0, glyph.w, glyph.h)
  const dataUrl = canvas.toDataURL('image/png')
  glyphDataUrlCache.set(icon, dataUrl)
  return dataUrl
}

/** Kick off loading of several glyphs eagerly (fire-and-forget). */
export function preloadPoiGlyphs(icons: string[]): void {
  icons.forEach((icon) => {
    loadPoiGlyphDataUrl(icon).catch(() => undefined)
  })
}