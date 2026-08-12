import { useEffect, useState } from 'react'
import { getPoiGlyphDataUrl, loadPoiGlyphDataUrl } from '../../config/poiIcons'

interface PoiGlyphProps {
  icon: string
  className?: string
  alt?: string
}

/**
 * Renders a single POI symbol cropped from the map provider's own sprite —
 * the same glyph + source PNG that the map's maplibre symbol layers draw via
 * `icon-image`. Used for route-card markers so the icon matches the one shown
 * on the map exactly.
 */
export default function PoiGlyph({ icon, className, alt = '' }: PoiGlyphProps) {
  const [src, setSrc] = useState<string | null>(() => getPoiGlyphDataUrl(icon))

  useEffect(() => {
    let active = true
    loadPoiGlyphDataUrl(icon).then(
      (dataUrl) => {
        if (active) setSrc(dataUrl)
      },
      () => {
        /* keep previous state; render the empty placeholder until available */
      },
    )
    return () => {
      active = false
    }
  }, [icon])

  if (!src) return <span className={className} aria-hidden="true" />

  return <img className={className} src={src} alt={alt} draggable={false} />
}