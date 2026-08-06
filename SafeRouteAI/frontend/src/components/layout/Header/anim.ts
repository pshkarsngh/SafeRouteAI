import type { Variants } from "framer-motion";

export const perspective: Variants = {
  initial: {
    opacity: 0,
    rotateX: 90,
    y: 80,
    x: -20,
  },

  enter: (i: number) => ({
    opacity: 1,
    rotateX: 0,
    y: 0,
    x: 0,

    transition: {
      duration: 0.65,
      delay: 0.5 + i * 0.1,
      ease: [0.215, 0.61, 0.355, 1],
      opacity: {
        duration: 0.35,
      },
    },
  }),

  exit: {
    opacity: 0,
    rotateX: 0,
    y: 20,

    transition: {
      duration: 0.45,
      ease: [0.76, 0, 0.24, 1],
    },
  },
};

export const slideIn: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },

  enter: (i: number) => ({
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.5,
      delay: 0.75 + i * 0.08,
      ease: [0.215, 0.61, 0.355, 1],
    },
  }),

  exit: {
    opacity: 0,
    y: 20,

    transition: {
      duration: 0.4,
      ease: "easeInOut",
    },
  },
};