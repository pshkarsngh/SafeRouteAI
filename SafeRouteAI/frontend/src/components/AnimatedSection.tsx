"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  children: ReactNode;
  className?: string;
  from?: "bottom" | "left" | "right" | "fade";
  delay?: number;
}

export default function AnimatedSection({ children, className = "", from = "bottom", delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fromMap = {
      bottom: { y: 60, opacity: 0 },
      left: { x: -60, opacity: 0 },
      right: { x: 60, opacity: 0 },
      fade: { opacity: 0 },
    };

    gsap.set(el, fromMap[from]);

    const ctx = gsap.context(() => {
      gsap.to(el, {
        y: 0,
        x: 0,
        opacity: 1,
        duration: 0.8,
        delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          once: true,
        },
      });
    });

    return () => ctx.revert();
  }, [from, delay]);

  return (
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  );
}
