import { useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMap } from '../../../hooks/useMap'
import { PLACES, type Place } from '../../../utils/places'
import styles from './SearchBar.module.scss'

const DOT_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1']

interface SearchBarProps {
  onSelect?: (place: Place) => void
}

export default function SearchBar({ onSelect }: SearchBarProps) {
  const { flyTo } = useMap()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const blurTimerRef = useRef<number | null>(null)

  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [active, setActive] = useState(-1)

  const results = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return PLACES.slice(0, 5)
    return PLACES.filter((place) =>
      `${place.name} ${place.region} ${place.tags.join(' ')}`.toLowerCase().includes(term),
    ).slice(0, 6)
  }, [query])

  const selectPlace = (place: Place) => {
    flyTo(place.lngLat, { zoom: place.zoom })
    setQuery(place.name)
    setActive(-1)
    setFocused(false)
    onSelect?.(place)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((index) => (index + 1) % Math.max(results.length, 1))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => (index <= 0 ? results.length - 1 : index - 1))
      return
    }
    if (event.key === 'Enter' && active >= 0 && results[active]) {
      event.preventDefault()
      selectPlace(results[active])
      return
    }
    if (event.key === 'Escape') {
      setFocused(false)
      inputRef.current?.blur()
    }
  }

  const handleResultMouseDown = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
  }

  const handleBlur = () => {
    blurTimerRef.current = window.setTimeout(() => setFocused(false), 120)
  }

  const handleFocus = () => {
    if (blurTimerRef.current) window.clearTimeout(blurTimerRef.current)
    setFocused(true)
  }

  return (
    <div className={styles.wrap} data-anim>
      <div className={styles.bar} onFocus={handleFocus} onBlur={handleBlur}>
        <svg
          className={styles.searchIcon}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search destination…"
          role="combobox"
          aria-label="Search destination"
          aria-expanded={focused && results.length > 0}
        />

        {query && (
          <button
            type="button"
            className={styles.clear}
            onClick={() => {
              setQuery('')
              setActive(-1)
              inputRef.current?.focus()
            }}
            aria-label="Clear search"
          >
            &times;
          </button>
        )}
      </div>

      <AnimatePresence>
        {focused && results.length > 0 && (
          <motion.ul
            className={styles.dropdown}
            role="listbox"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {results.map((place, index) => (
              <li key={place.id} role="option" aria-selected={active === index}>
                <button
                  type="button"
                  className={active === index ? `${styles.option} ${styles.active}` : styles.option}
                  onMouseDown={handleResultMouseDown}
                  onClick={() => selectPlace(place)}
                  onMouseEnter={() => setActive(index)}
                >
                  <span className={styles.dot} style={{ background: DOT_COLORS[index % DOT_COLORS.length] }} />
                  <span className={styles.text}>
                    <span className={styles.name}>{place.name}</span>
                    <span className={styles.meta}>{place.region}</span>
                  </span>
                  <span className={styles.arrow}>→</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}