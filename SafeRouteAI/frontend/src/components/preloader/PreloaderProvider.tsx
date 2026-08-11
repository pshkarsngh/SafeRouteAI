"use client";

import { useEffect, useState } from "react";
import Preloader from "./Preloader";

interface Props {
  children: React.ReactNode;
}

export default function PreloaderProvider({ children }: Props) {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const hasVisited = sessionStorage.getItem("preloader");

    if (!hasVisited) {
      setLoading(true);
    }
  }, []);

  const handleComplete = () => {
    sessionStorage.setItem("preloader", "true");
    setLoading(false);
  };

  if (!mounted) return null;

  return (
    <>
      {loading && (
        <Preloader onComplete={handleComplete} />
      )}

      {children}
    </>
  );
}