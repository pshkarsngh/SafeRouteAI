import { motion } from "framer-motion";
import { EASE } from "./animations";
import styles from "./MenuButton.module.scss";

export interface MenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
  closedLabel?: string;
  openLabel?: string;
}

const MenuButton = ({
  isOpen,
  onClick,
  closedLabel = "MENU",
  openLabel = "CLOSE",
}: MenuButtonProps) => {
  return (
    <button
      type="button"
      className={styles.button}
      aria-expanded={isOpen}
      aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      onClick={onClick}
    >
      <motion.span
        className={styles.slider}
        animate={{ y: isOpen ? "-50%" : "0%" }}
        transition={{ duration: 0.5, ease: EASE }}
        aria-hidden="true"
      >
        <span className={styles.label}>{closedLabel}</span>
        <span className={styles.label}>{openLabel}</span>
      </motion.span>
    </button>
  );
};

export default MenuButton;
