import { motion } from "framer-motion";
import { linkVariants } from "./animations";
import type { MenuItem } from "./menuData";
import styles from "./MenuNavigation.module.scss";

export interface MenuNavigationProps {
  items: MenuItem[];
  onNavigate?: () => void;
}

const MenuNavigation = ({ items, onNavigate }: MenuNavigationProps) => {
  return (
    <nav className={styles.nav} aria-label="Main navigation">
      <ul className={styles.list}>
        {items.map((item, index) => (
          <motion.li
            key={item.title}
            className={styles.item}
            variants={linkVariants}
            custom={index}
            initial="closed"
            animate="open"
            exit="closed"
          >
            <a href={item.href} className={styles.link} onClick={onNavigate}>
              <span className={styles.linkText}>{item.title}</span>
              <span className={styles.linkArrow} aria-hidden="true">
                →
              </span>
            </a>
          </motion.li>
        ))}
      </ul>
    </nav>
  );
};

export default MenuNavigation;
