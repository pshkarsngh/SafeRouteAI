"use client";

import { useState } from "react";

import Preloader from "@/components/preloader";
import Header from "@/components/layout/Header";
import Intro from "@/sections/Intro";

export default function Home() {
  const [loading, setLoading] = useState(true);

  return (
    <>
      {loading && (
        <Preloader
          onComplete={() => setLoading(false)}
        />
      )}

      {/* Floating Menu */}
      <Header />

      {/* Hero Section */}
      <Intro />
    </>
  );
}