"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import MenuButton from "./MenuButton";
import MenuClose from "./MenuClose";
import MenuLinks from "./MenuLinks";
import MenuFooter from "./MenuFooter";
import type { MenuLinkItem } from "./MenuLinks";
import type { MenuFooterLink } from "./MenuFooter";

const MENU_LINKS: MenuLinkItem[] = [
  { href: "/agency", label: "Agency" },
  { href: "/expertise", label: "Expertise" },
  { href: "/careers", label: "Careers" },
  { href: "/contact", label: "Contact" },
];

const FOOTER_LINKS: MenuFooterLink[] = [
  { href: "#", label: "Facebook" },
  { href: "#", label: "Instagram" },
  { href: "#", label: "LinkedIn" },
  { href: "#", label: "Twitter" },
];

export default function Menu() {
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen((prev) => !prev);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="intro-menu-wrap">
      <motion.div
        className={`intro-menu ${open ? "is-open" : ""}`}
        layout
        animate={{ borderRadius: open ? "26px" : "0 0 26px 26px" }}
        transition={{
          duration: 0.7,
          ease: [0.76, 0, 0.24, 1],
          delay: open ? 0 : 0.4,
        }}
      />

      <MenuButton open={open} onClick={toggle} />

      <AnimatePresence>
        {open && (
          <motion.div
            key="menu-panel"
            className="menu-panel"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: {
                duration: 0.35,
                delay: 0.4,
                ease: [0.215, 0.61, 0.355, 1],
              },
            }}
            exit={{
              opacity: 0,
              transition: { duration: 0.3, ease: "easeInOut" },
            }}
          >
            <div className="menu-panel-header">
              <MenuClose onClick={close} />
            </div>

            <MenuLinks links={MENU_LINKS} onNavigate={close} />

            <MenuFooter links={FOOTER_LINKS} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
