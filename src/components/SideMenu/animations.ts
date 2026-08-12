import type { Variants } from "framer-motion";

export const EASE: [number, number, number, number] = [0.76, 0, 0.24, 1];

export interface PanelSize {
  width: number;
  height: number;
  top: number;
  right: number;
}

export const panelVariants = (size: PanelSize): Variants => ({
  closed: {
    width: 100,
    height: 45,
    top: 24,
    right: 24,
    borderRadius: 22.5,
    transition: { duration: 0.7, ease: EASE },
  },
  open: {
    width: size.width,
    height: size.height,
    top: size.top,
    right: size.right,
    borderRadius: 18,
    transition: { duration: 0.75, ease: EASE },
  },
});

export const overlayVariants: Variants = {
  closed: {
    opacity: 0,
    transition: { duration: 0.4, ease: EASE },
  },
  open: {
    opacity: 1,
    transition: { duration: 0.5, ease: EASE },
  },
};

export const contentVariants: Variants = {
  closed: {
    opacity: 0,
    transition: { duration: 0.15, ease: EASE },
  },
  open: {
    opacity: 1,
    transition: { duration: 0.45, ease: EASE, delay: 0.3 },
  },
};

export const headerVariants: Variants = {
  closed: {
    opacity: 0,
    y: -12,
  },
  open: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE, delay: 0.4 },
  },
};

export const linkVariants: Variants = {
  closed: {
    opacity: 0,
    y: 80,
    x: -20,
    rotateX: 90,
  },
  open: (index: number) => ({
    opacity: 1,
    y: 0,
    x: 0,
    rotateX: 0,
    transition: {
      duration: 0.6,
      ease: EASE,
      delay: index * 0.06,
    },
  }),
};

export const footerVariants: Variants = {
  closed: {
    y: 30,
    opacity: 0,
  },
  open: (index: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      delay: 0.45 + index * 0.05,
      duration: 0.5,
      ease: EASE,
    },
  }),
};
