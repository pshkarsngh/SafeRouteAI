"use client";

import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <Link
      href="/"
      className={className}
      aria-label="SafeRoute home"
    >
      <Image
        src="/images/logo.svg"
        alt="SafeRoute"
        width={160}
        height={44}
        priority
      />
    </Link>
  );
}
