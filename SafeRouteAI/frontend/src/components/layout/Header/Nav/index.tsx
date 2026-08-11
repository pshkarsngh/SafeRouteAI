"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import styles from "./style.module.scss";
import { perspective, slideIn } from "../anim";
import { links, footerLinks } from "../data";

interface NavProps {
  closeMenu: () => void;
}

export default function Nav({ closeMenu }: NavProps) {
  return (
    <motion.div
      className={styles.nav}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* ======================
          Navigation Links
      ====================== */}

      <div className={styles.body}>
        {links.map((link, i) => (
          <div
            key={link.title}
            className={styles.linkContainer}
          >
            <motion.div
              custom={i}
              variants={perspective}
              initial="initial"
              animate="enter"
              exit="exit"
            >
              <Link
                href={link.href}
                onClick={closeMenu}
              >
                {link.title}
              </Link>
            </motion.div>
          </div>
        ))}
      </div>

      {/* ======================
            Footer Links
      ====================== */}

      <motion.div className={styles.footer}>
        {footerLinks.map((link, i) => (
          <motion.a
            key={link.title}
            href={link.href}
            custom={i}
            variants={slideIn}
            initial="initial"
            animate="enter"
            exit="exit"
            onClick={closeMenu}
          >
            {link.title}
          </motion.a>
        ))}
      </motion.div>
    </motion.div>
  );
}