"use client";

import Image from "next/image";
import Link from "next/link";
import "./Navbar.css";

export default function Navbar() {
  return (
    <header className="intro-navbar">

      {/* Logo */}
      <Link href="/" className="intro-logo">
        <Image
          src="/images/logo.svg"
          alt="SafeRoute"
          width={220}
          height={60}
          priority
        />
      </Link>

    </header>
  );
}