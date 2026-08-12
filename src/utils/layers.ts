import type { Map as MapLibreMap } from 'maplibre-gl'

export type LayerGroupId = 'roads' | 'parks' | 'buildings'

export interface LayerGroup {
  id: LayerGroupId
  label: string
  color: string
}

export const LAYER_GROUPS: LayerGroup[] = [
  { id: 'roads', label: 'Roads', color: '#ff8a3d' },
  { id: 'parks', label: 'Parks', color: '#52b788' },
  { id: 'buildings', label: 'Buildings', color: '#5c7cfa' },
]

const GROUP_PATTERNS: Record<LayerGroupId, RegExp[]> = {
  roads: [
    /transportation/i,
    /road/i,
    /motorway/i,
    /trunk/i,
    /highway/i,
    /oneway/i,
    /^route/i,
    /ramp/i,
    /brunnel/i,
    /ferry/i,
  ],
  parks: [
    /^park$/i,
    /^parks/i,
    /landcover/i,
    /^wood/i,
    /^forest/i,
    /^grass/i,
    /farmland/i,
    /garden/i,
    /recreation/i,
    /^leisure/i,
    /^nature/i,
    /scrub/i,
    /heath/i,
    /^beach/i,
    /cemet/i,
    /allotment/i,
    /golf/i,
  ],
  buildings: [/building/i, /^bldg/i],
}

interface StyleLayerInfo {
  id: string
  'source-layer'?: string
}

export function classifyLayer(layer: StyleLayerInfo): LayerGroupId | null {
  const haystack = [layer.id, layer['source-layer'] ?? ''].join(' ')

  for (const group of ['buildings', 'parks', 'roads'] as const) {
    if (GROUP_PATTERNS[group].some((pattern) => pattern.test(haystack))) {
      return group
    }
  }

  return null
}

export function setLayerGroupVisible(
  map: MapLibreMap,
  group: LayerGroupId,
  visible: boolean,
): void {
  const layers = map.getStyle()?.layers ?? []
  const visibility = visible ? 'visible' : 'none'

  layers.forEach((layer) => {
    if (classifyLayer(layer) === group) {
      map.setLayoutProperty(layer.id, 'visibility', visibility)
    }
  })
}