"use client";

export default function Hero() {
  return (
    <div className="hero-title">
      <h1>L'étincelle</h1>

      <div className="hero-middle">
        <span>qui</span>

        <div className="hero-video">
          <video
            className="hero-video-element"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="/video/video.mp4" type="video/mp4" />
          </video>
        </div>

        <span>génère</span>
      </div>

      <h1>la créativité</h1>
    </div>
  );
}
