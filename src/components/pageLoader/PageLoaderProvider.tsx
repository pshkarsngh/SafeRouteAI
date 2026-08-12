import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import PageLoader from './PageLoader'

type NavigateWithLoader = (to: string, state?: unknown) => void

const PageLoaderContext = createContext<NavigateWithLoader | null>(null)

export const usePageLoader = () => {
  const ctx = useContext(PageLoaderContext)
  if (!ctx) {
    throw new Error('usePageLoader must be used within PageLoaderProvider')
  }
  return ctx
}

interface Props {
  children: ReactNode
}

export default function PageLoaderProvider({ children }: Props) {
  const [target, setTarget] = useState<{
    to: string
    key: number
    state: unknown
  } | null>(null)

  const navigateWithLoader = useCallback((to: string, state?: unknown) => {
    setTarget({ to, state, key: Date.now() })
  }, [])

  const handleDone = useCallback(() => setTarget(null), [])

  return (
    <PageLoaderContext.Provider value={navigateWithLoader}>
      {target && (
        <PageLoader
          key={target.key}
          to={target.to}
          state={target.state}
          onDone={handleDone}
        />
      )}
      {children}
    </PageLoaderContext.Provider>
  )
}
