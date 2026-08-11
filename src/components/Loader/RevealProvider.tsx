import { lazy, Suspense, createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

const Loader = lazy(() => import('./Loader'))

interface StartRevealOptions {
  navigate?: boolean
  armDelay?: number
}

interface RevealContextValue {
  startReveal: (to: string, options?: StartRevealOptions) => void
}

const RevealContext = createContext<RevealContextValue | null>(null)

export const useReveal = () => {
  const ctx = useContext(RevealContext)
  if (!ctx) throw new Error('useReveal must be used within RevealProvider')
  return ctx
}

interface Props {
  children: ReactNode
}

const RevealProvider = ({ children }: Props) => {
  const navigate = useNavigate()
  const [active, setActive] = useState(false)
  const [armDelay, setArmDelay] = useState(0)

  const startReveal = useCallback(
    (to: string, options?: StartRevealOptions) => {
      const { navigate: shouldNavigate = true, armDelay: delay = 0 } = options ?? {}
      if (shouldNavigate) navigate(to)
      setArmDelay(delay)
      setActive(true)
    },
    [navigate],
  )

  const handleRevealed = useCallback(() => setActive(false), [])

  const value = useMemo(() => ({ startReveal }), [startReveal])

  return (
    <RevealContext.Provider value={value}>
      {active && (
        <Suspense fallback={<div className="reveal-fallback" />}>
          <Loader armDelay={armDelay} onRevealed={handleRevealed} />
        </Suspense>
      )}
      {children}
    </RevealContext.Provider>
  )
}

export default RevealProvider
