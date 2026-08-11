"use client";

import Link from "next/link";

export default function Bottom() {
  return (
    <div className="hero-bottom">
      <div className="hero-description">
        <p>
          We create digital experiences that inspire, connect, and leave a
          lasting impact through innovative design, creativity, and technology.
        </p>
      </div>

      <div className="hero-buttons">
        <Link href="/projects" className="hero-btn">
          Explore
        </Link>

        <Link href="/about" className="hero-btn">
          Start Journey
        </Link>
      </div>
    </div>
  );
}
