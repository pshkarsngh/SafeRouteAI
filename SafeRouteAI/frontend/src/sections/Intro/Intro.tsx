"use client";

import "./Intro.css";

import {
  IntroNavbar,
  Hero,
  Bottom,
} from "./components";

export default function Intro() {
  return (
    <section id="intro">
      {/* Background */}
      <div className="intro-background">
        <video
          className="intro-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src="/video/video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className="intro-overlay" />
      </div>

      {/* Navbar */}
      <IntroNavbar />

      {/* Hero */}
      <div className="intro-container">
        <div className="intro-content">
          <Hero />
          <Bottom />
        </div>
      </div>
    </section>
  );
}
