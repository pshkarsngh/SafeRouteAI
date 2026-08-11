"use client";

import { useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";

import Button from "./Button";
import Nav from "./Nav";

import styles from "./Header.module.scss";

const menu: Variants = {
  open: {
    width: "min(480px, calc(100vw - 32px))",
    height: "min(650px, calc(100vh - 32px))",

    top: "-16px",
    right: "-16px",

    transition: {
      duration: 0.75,
      type: "tween",
      ease: [0.76, 0, 0.24, 1],
    },
  },

  closed: {
    width: "100px",
    height: "40px",

    top: "0px",
    right: "0px",

    transition: {
      duration: 0.75,
      delay: 0.35,
      type: "tween",
      ease: [0.76, 0, 0.24, 1],
    },
  },
};

export default function Header() {
  const [isActive, setIsActive] = useState(false);

  const toggleMenu = () => {
    setIsActive((prev) => !prev);
  };

  const closeMenu = () => {
    setIsActive(false);
  };

  return (
    <header className={styles.header}>
      <motion.div
        className={styles.menu}
        variants={menu}
        initial={false}
        animate={isActive ? "open" : "closed"}
        style={{
          transformOrigin: "top right",
        }}
      >
        <AnimatePresence mode="wait">
          {isActive && <Nav closeMenu={closeMenu} />}
        </AnimatePresence>
      </motion.div>

      <Button
        isActive={isActive}
        toggleMenu={toggleMenu}
      />
    </header>
  );
}