import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  contentVariants,
  footerVariants,
  headerVariants,
  overlayVariants,
  panelVariants,
  type PanelSize,
} from "./animations";
import {
  COPYRIGHT_LABEL,
  DEFAULT_BRAND,
  defaultMenuItems,
  defaultSocialLinks,
  YEAR_LABEL,
  type MenuItem,
} from "./menuData";
import MenuButton from "./MenuButton";
import MenuNavigation from "./MenuNavigation";
import styles from "./SideMenu.module.scss";

export interface SideMenuProps {
  items?: MenuItem[];
  socialLinks?: MenuItem[];
  brand?: string;
}

const getPanelSize = (): PanelSize => {
  if (typeof window === "undefined") {
    return { width: 480, height: 650, top: 16, right: 16 };
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (viewportWidth < 768) {
    return {
      width: viewportWidth - 16,
      height: viewportHeight - 16,
      top: 8,
      right: 8,
    };
  }

  if (viewportWidth < 1024) {
    return {
      width: 420,
      height: Math.min(650, viewportHeight - 32),
      top: 16,
      right: 16,
    };
  }

  return {
    width: Math.min(480, viewportWidth - 32),
    height: Math.min(650, viewportHeight - 32),
    top: 16,
    right: 16,
  };
};

const usePanelSize = (): PanelSize => {
  const [size, setSize] = useState<PanelSize>(getPanelSize);

  useEffect(() => {
    const handleResize = () => {
      setSize(getPanelSize());
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return size;
};

const SideMenu = ({
  items = defaultMenuItems,
  socialLinks = defaultSocialLinks,
  brand = DEFAULT_BRAND,
}: SideMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const size = usePanelSize();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen((current) => !current);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <>
      <MenuButton isOpen={isOpen} onClick={toggleMenu} />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="overlay"
            className={styles.overlay}
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            onClick={closeMenu}
          />
        )}

        {isOpen && (
          <motion.aside
            key="menu"
            className={styles.menu}
            variants={panelVariants(size)}
            initial="closed"
            animate="open"
            exit="closed"
            aria-label="Navigation menu"
          >
            <motion.div
              className={styles.menuInner}
              variants={contentVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              <header className={styles.menuHeader}>
                <motion.span
                  className={styles.brand}
                  variants={headerVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                >
                  {brand}
                </motion.span>
                <motion.span
                  className={styles.year}
                  variants={headerVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                >
                  {YEAR_LABEL}
                </motion.span>
              </header>

              <MenuNavigation
                items={items}
                onNavigate={closeMenu}
              />

              <footer className={styles.menuFooter}>
                <div className={styles.socialRow}>
                  {socialLinks.map((link, index) => (
                    <motion.a
                      key={link.title}
                      href={link.href}
                      className={styles.socialLink}
                      variants={footerVariants}
                      custom={index}
                      initial="closed"
                      animate="open"
                      exit="closed"
                    >
                      {link.title}
                    </motion.a>
                  ))}
                </div>
                <motion.span
                  className={styles.copyright}
                  variants={footerVariants}
                  custom={socialLinks.length}
                  initial="closed"
                  animate="open"
                  exit="closed"
                >
                  {COPYRIGHT_LABEL}
                </motion.span>
              </footer>
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default SideMenu;
