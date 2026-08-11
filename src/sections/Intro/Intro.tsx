import Video from './Video'
import HomeHeroText from './HomeHeroText'
import HomeBottomText from './HomeBottomText'
import { useMarkReady } from '../../components/preloader'

const Intro = () => {
  const markReady = useMarkReady()

  return (
    <div className="text-white">
      <div className="h-screen w-screen fixed">
        <Video onReady={markReady} />
      </div>
      <div className="h-screen w-screen relative pb-5 overflow-hidden flex flex-col justify-between">
        <HomeHeroText />
        <HomeBottomText />
      </div>
    </div>
  )
}

export default Intro
