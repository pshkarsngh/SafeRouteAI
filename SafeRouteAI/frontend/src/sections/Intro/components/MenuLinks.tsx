"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

export interface MenuLinkItem {
  href: string;
  label: string;
}

interface MenuLinkCustom {
  index: number;
  count: number;
}

interface MenuLinksProps {
  links: MenuLinkItem[];
  onNavigate?: () => void;
}

const linksVariants: Variants = {
  initial: {
    opacity: 0,
    y: 80,
    rotateX: 90,
  },
  enter: (custom: MenuLinkCustom) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      duration: 0.65,
      delay: 0.45 + custom.index * 0.08,
      ease: [0.215, 0.61, 0.355, 1],
    },
  }),
  exit: (custom: MenuLinkCustom) => ({
    opacity: 0,
    y: 60,
    rotateX: 90,
    transition: {
      duration: 0.35,
      delay: (custom.count - 1 - custom.index) * 0.05,
      ease: "easeInOut",
    },
  }),
};

export default function MenuLinks({ links, onNavigate }: MenuLinksProps) {
  return (
    <nav className="menu-nav" aria-label="Primary">
      <ul className="menu-nav-list">
        {links.map((link, index) => (
          <li key={link.href} className="menu-link">
            <motion.div
              className="menu-link-inner"
              custom={{ index, count: links.length }}
              variants={linksVariants}
              initial="initial"
              animate="enter"
              exit="exit"
            >
              <Link href={link.href} onClick={onNavigate}>
                {link.label}
              </Link>
            </motion.div>
          </li>
        ))}
      </ul>
    </nav>
  );
}
