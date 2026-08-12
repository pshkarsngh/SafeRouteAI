import { useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMap } from '../../../hooks/useMap'
import { PLACES, type Place } from '../../../utils/places'
import styles from './SearchBar.module.scss'

const DOT_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1']

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0),
  )
  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[a.length][b.length]
}

function placeText(place: Place): string {
  return normalize(`${place.name} ${place.region} ${place.tags.join(' ')}`)
}

function fuzzyScore(place: Place, term: string): number | null {
  const haystack = placeText(place)
  if (haystack.includes(term)) return 0

  const firstName = normalize(place.name).split(' ')[0]
  const distance = levenshtein(term, firstName)
  const maxLen = Math.max(term.length, firstName.length)
  const normalizedDistance = distance / maxLen
  if (normalizedDistance <= 0.3) return Number((distance + 0.1).toFixed(2))
  return null
}

interface SearchBarProps {
  onSelect?: (place: Place) => void
  placeholder?: string
  variant?: 'origin' | 'destination'
}

export default function SearchBar({ onSelect, placeholder = 'Search destination…', variant = 'destination' }: SearchBarProps) {
  const { flyTo } = useMap()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const blurTimerRef = useRef<number | null>(null)

  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [active, setActive] = useState(-1)

  const results = useMemo(() => {
    const term = normalize(query)
    if (!term) return PLACES.slice(0, 5)

    const exact: Place[] = []
    const fuzzy: Array<{ place: Place; score: number }> = []

    PLACES.forEach((place) => {
      if (placeText(place).includes(term)) {
        exact.push(place)
      } else {
        const score = fuzzyScore(place, term)
        if (score !== null) fuzzy.push({ place, score })
      }
    })

    fuzzy.sort((a, b) => a.score - b.score)
    return [...exact, ...fuzzy.map((item) => item.place)].slice(0, 6)
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

  const wrapClass = variant === 'origin' ? `${styles.wrap} ${styles.origin}` : styles.wrap

  return (
    <div className={wrapClass} data-anim>
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
placeholder={placeholder}
          role="combobox"
          aria-label={placeholder}
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