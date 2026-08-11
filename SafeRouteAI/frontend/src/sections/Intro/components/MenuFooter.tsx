"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

export interface MenuFooterLink {
  href: string;
  label: string;
}

interface MenuFooterCustom {
  index: number;
}

interface MenuFooterProps {
  links: MenuFooterLink[];
}

const footerVariants: Variants = {
  initial: {
    opacity: 0,
    y: 24,
  },
  enter: (custom: MenuFooterCustom) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: 0.8 + custom.index * 0.08,
      ease: [0.215, 0.61, 0.355, 1],
    },
  }),
  exit: (custom: MenuFooterCustom) => ({
    opacity: 0,
    y: 12,
    transition: {
      duration: 0.3,
      delay: custom.index * 0.05,
      ease: "easeInOut",
    },
  }),
};

export default function MenuFooter({ links }: MenuFooterProps) {
  return (
    <footer className="menu-footer">
      <div className="menu-footer-links">
        {links.map((link, index) => (
          <motion.a
            key={link.label}
            href={link.href}
            className="menu-footer-link"
            custom={{ index }}
            variants={footerVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            whileHover={{ y: -3 }}
            transition={{ duration: 0.3 }}
          >
            {link.label}
          </motion.a>
        ))}
      </div>
    </footer>
  );
}
