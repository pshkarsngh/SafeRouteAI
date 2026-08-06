"use client";

export default function Video() {
  return (
    <div className="intro-background">
      <video
        className="intro-video"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/video/video.mp4" type="video/mp4" />
      </video>
      <div className="intro-overlay" />
    </div>
  );
}
