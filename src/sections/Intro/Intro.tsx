import Video from './Video'
import HomeHeroText from './HomeHeroText'
import HomeBottomText from './HomeBottomText'
import { useMarkReady } from '../../components/preloader'
import { useReveal } from '../../components/Loader'
import { usePageLoader } from '../../components/pageLoader'

const Intro = () => {
  const markReady = useMarkReady()
  const { startReveal } = useReveal()
  const navigateWithLoader = usePageLoader()

  const handleEnter = () => {
    startReveal('/search', { navigate: false, armDelay: 2400 })
    navigateWithLoader('/search')
  }

  return (
    <div className="text-white">
      <div className="h-screen w-screen fixed">
        <Video onReady={markReady} />
      </div>
      <div className="h-screen w-screen relative pb-5 overflow-hidden flex flex-col justify-between">
        <HomeHeroText />
        <HomeBottomText onEnter={handleEnter} />
      </div>
    </div>
  )
}

export default Intro
