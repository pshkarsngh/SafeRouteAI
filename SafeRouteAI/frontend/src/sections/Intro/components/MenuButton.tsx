"use client";

import { motion } from "framer-motion";

interface MenuButtonProps {
  open: boolean;
  onClick: () => void;
}

export default function MenuButton({ open, onClick }: MenuButtonProps) {
  return (
    <motion.button
      type="button"
      className="menu-button"
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      onClick={onClick}
      animate={{
        opacity: open ? 0 : 1,
        pointerEvents: open ? "none" : "auto",
      }}
      transition={{
        duration: 0.35,
        delay: open ? 0 : 0.4,
        ease: [0.76, 0, 0.24, 1],
      }}
    >
      <span className="menu-button-text">Menu</span>
    </motion.button>
  );
}
