"use client";

import { useState } from "react";

import Preloader from "@/components/preloader";
import Header from "@/components/layout/Header";
import About from "@/sections/About";

export default function AboutPage() {
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;

    if (sessionStorage.getItem("preloader-shown")) return false;

    sessionStorage.setItem("preloader-shown", "true");

    return true;
  });

  return (
    <>
      {loading && (
        <Preloader
          onComplete={() => setLoading(false)}
        />
      )}

      {!loading && (
        /* Floating Menu */
        <Header />
      )}

      {/* About Section */}
      <About />
    </>
  );
}
