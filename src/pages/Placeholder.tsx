import { usePageLoader } from '../components/pageLoader'

interface PlaceholderProps {
  title: string
  description: string
}

export default function Placeholder({ title, description }: PlaceholderProps) {
  const navigateWithLoader = usePageLoader()

  return (
    <main className="min-h-screen bg-white text-black flex flex-col justify-center items-center gap-4 text-center p-6">
      <h1 className="font-[font2] text-5xl uppercase">{title}</h1>
      <p className="opacity-60 max-w-md">{description}</p>
      <button
        onClick={() => navigateWithLoader('/')}
        className="mt-3 px-6 py-3 rounded-full border-2 border-black font-semibold hover:bg-black hover:text-white transition"
      >
        Back to home
      </button>
    </main>
  )
}
