import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import '@dotlottie/player-component'
import './PageLoader.css'

gsap.registerPlugin(useGSAP)

const LOTTIE_SRC =
  'https://cdn.prod.website-files.com/63bf3e1c32ea7ba16d1bdf88/63bf3e1c32ea7b91831bdfb6_marker_line_lottie.json'

interface PageLoaderProps {
  to: string
  state?: unknown
  onDone: () => void
}

export default function PageLoader({ to, state, onDone }: PageLoaderProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useGSAP(
    () => {
      const tl = gsap.timeline({
        defaults: { ease: 'expo.out' },
        onComplete: onDone,
      })

      // Panels slide up and cover the screen (black -> white -> black)
      tl.to('.pl-page-1', { top: 0, duration: 0.5 }, 0.5)
        .to('.pl-page-2', { top: 0, duration: 1 }, 0.7)
        .to('.pl-page-3', { top: 0, duration: 1.5 }, 0.9)

        // Navigate once fully covered
        .call(() => navigate(to, { state }))

        // Panels slide off the top to reveal the new page, 0.2s apart
        .to('.pl-page-3', { top: '-100%', duration: 0.5 }, 2.5)
        .to('.pl-page-2', { top: '-100%', duration: 0.6 }, 2.7)
        .to('.pl-page-1', { top: '-100%', duration: 0.7 }, 2.9)
    },
    { scope: rootRef },
  )

  return (
    <div ref={rootRef} className="pl-loader">
      <div className="pl-page pl-page-1" />
      <div className="pl-page pl-page-2" />
      <div className="pl-page pl-page-3">
        <dotlottie-player
          src={LOTTIE_SRC}
          background="transparent"
          speed="2"
          autoplay
          loop
          className="pl-lottie"
        ></dotlottie-player>
      </div>
    </div>
  )
}
