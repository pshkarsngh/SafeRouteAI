"use client";

import Link from "next/link";

export default function IntroNavbar() {
  return (
    <nav className="intro-navbar">

      {/* Left Logo */}
      <Link href="/" className="intro-logo" aria-label="SafeRoute home">
        <img
          src="/images/logo.svg"
          alt="SafeRoute"
        />
      </Link>

    </nav>
  );
}
