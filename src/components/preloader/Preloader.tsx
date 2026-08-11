"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import "./Preloader.css";

interface PreloaderProps {
  ready: boolean;
  onComplete: () => void;
}

export default function Preloader({ ready, onComplete }: PreloaderProps) {
  const loaderRef = useRef<HTMLDivElement>(null);
  const starRef = useRef<HTMLDivElement>(null);

  const [progress, setProgress] = useState(0);
  const [fadeStar, setFadeStar] = useState(false);

  const readyRef = useRef(ready);
  const zoomRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  // If the counter finished before the intro page was ready, zoom out once it is.
  useEffect(() => {
    if (ready && zoomRef.current) {
      zoomRef.current();
      zoomRef.current = null;
    }
  }, [ready]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Continuous rotation
      const rotateTween = gsap.to(starRef.current, {
        rotation: "-=360",
        duration: 2.5, // slower rotation
        repeat: -1,
        ease: "none",
        transformOrigin: "50% 50%",
      });

      const counter = { value: 0 };

      // Zoom-out animation, only played once the page is ready
      const zoom = () => {
        rotateTween.timeScale(1.5);

        gsap.delayedCall(0.2, () => {
          const tl = gsap.timeline({
            onComplete: () => {
              rotateTween.kill();
              onComplete();
            },
          });

          tl.to(starRef.current, {
            scale: 120,
            duration: 0.55,
            ease: "power4.inOut",
            transformOrigin: "50% 50%",
          })

            // Small Hold
            .to({}, { duration: 0.02 })

            // Background Transparent
            .call(() => {
              if (loaderRef.current) {
                loaderRef.current.style.background = "transparent";
              }

              setFadeStar(true);
            })

            // Fade Loader
            .to(loaderRef.current, {
              opacity: 0,
              duration: 0.1,
              ease: "power2.out",
              pointerEvents: "none",
            });
        });
      };

      // Counter Animation
      gsap.to(counter, {
        value: 100,
        duration: 2.5,
        ease: "power1.inOut",

        onUpdate: () => {
          setProgress(Math.round(counter.value));
        },

        onComplete: () => {
          if (readyRef.current) {
            zoom()
          } else {
            zoomRef.current = zoom

            // Fallback so the preloader never hangs (e.g. refreshing on a
            // page where the intro video, which marks "ready", isn't mounted).
            gsap.delayedCall(3, () => {
              if (zoomRef.current) {
                zoomRef.current()
                zoomRef.current = null
              }
            })
          }
        },
      });
    }, loaderRef);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div id="loader" ref={loaderRef}>
      {/* Loading Text */}
      <h4 className="loader-text">LOADING</h4>

      {/* Rotating Star */}
      <div id="loader-star" ref={starRef}>
        <img
          src="/images/svg-star-white.svg"
          alt="Loader Logo"
          width={120}
          height={120}
          draggable={false}
          className={`loader-star ${fadeStar ? "fade-out" : ""}`}
        />
      </div>
      {/* Loading Counter */}
      <h1 id="loader-number">
        {progress}
        <span>%</span>
      </h1>
    </div>
  );
}
