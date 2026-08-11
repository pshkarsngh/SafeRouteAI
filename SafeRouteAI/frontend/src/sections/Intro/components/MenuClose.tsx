"use client";

import { motion } from "framer-motion";

interface MenuCloseProps {
  onClick: () => void;
}

export default function MenuClose({ onClick }: MenuCloseProps) {
  return (
    <motion.button
      type="button"
      className="menu-close"
      aria-label="Close menu"
      onClick={onClick}
      initial={{ opacity: 0, y: -12, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.8 }}
      transition={{
        duration: 0.45,
        delay: 0.95,
        ease: [0.215, 0.61, 0.355, 1],
      }}
      whileHover={{ scale: 1.06 }}
    >
      Close
    </motion.button>
  );
}
