"use client";

import { useState } from "react";

import Preloader from "@/components/preloader";
import Header from "@/components/layout/Header";
import About from "@/sections/About";

export default function AboutPage() {
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

      {/* About Section */}
      <About />
    </>
  );
}
