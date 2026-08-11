interface VideoProps {
  onReady?: () => void
}

const Video = ({ onReady }: VideoProps) => {
  return (
    <div className="h-full w-full">
      <video
        className="h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        src="/video/video.mp4"
        onCanPlay={onReady}
        onLoadedData={onReady}
        onError={onReady}
      ></video>
    </div>
  )
}

export default Video
