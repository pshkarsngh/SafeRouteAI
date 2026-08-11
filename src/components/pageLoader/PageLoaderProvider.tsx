import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import PageLoader from './PageLoader'

type NavigateWithLoader = (to: string) => void

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
  const [target, setTarget] = useState<{ to: string; key: number } | null>(
    null,
  )

  const navigateWithLoader = useCallback((to: string) => {
    setTarget({ to, key: Date.now() })
  }, [])

  const handleDone = useCallback(() => setTarget(null), [])

  return (
    <PageLoaderContext.Provider value={navigateWithLoader}>
      {target && <PageLoader key={target.key} to={target.to} onDone={handleDone} />}
      {children}
    </PageLoaderContext.Provider>
  )
}
