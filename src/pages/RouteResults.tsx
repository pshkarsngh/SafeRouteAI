import { usePageLoader } from '../components/pageLoader'

export default function RouteResults() {
  const navigateWithLoader = usePageLoader()

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[#eef1f4] px-6 text-center text-black">
      <h1 className="font-[font2] text-4xl uppercase tracking-tight">
        Plan your safe route
      </h1>
      <p className="max-w-sm opacity-60">
        Route results are the next step in the SafeRoute journey.
      </p>
      <button
        onClick={() => navigateWithLoader('/search')}
        className="mt-2 rounded-full bg-black px-6 py-3 font-semibold text-white transition hover:bg-black/80"
      >
        Back to search
      </button>
    </main>
  )
}