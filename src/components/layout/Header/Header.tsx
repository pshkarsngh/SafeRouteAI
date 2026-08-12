import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePageLoader } from '../../pageLoader'
import styles from './Header.module.scss'

const BRAND_PATH =
  'M35.1441047,8.4486911 L58.6905011,8.4486911 L58.6905011,-1.3094819e-14 L35.1441047,-1.3094819e-14 L35.1441047,8.4486911 Z M20.0019577,0.000230366492 L8.83414254,25.3433089 L18.4876971,25.3433089 L29.5733875,0.000230366492 L20.0019577,0.000230366492 Z M72.5255345,0.000691099476 L72.5255345,8.44846073 L94.3991559,8.44846073 L94.3991559,16.8932356 L72.5275991,16.8932356 L72.5275991,19.5237906 L72.5255345,19.5237906 L72.5255345,43.9274346 L102.80937,43.9274346 L102.80937,35.4798953 L80.9357483,35.4798953 L80.9357483,25.3437696 L94.3996147,25.3428482 L94.3996147,16.8953089 L102.80937,16.8953089 L102.80937,0.000691099476 L72.5255345,0.000691099476 Z M-1.30398043e-14,43.9278953 L8.78642762,43.9278953 L8.78642762,0.0057591623 L-1.30398043e-14,0.0057591623 L-1.30398043e-14,43.9278953 Z M58.6849955,8.4486911 L43.1186904,43.9274346 L52.3166592,43.9274346 L67.9877996,8.4486911 L58.6849955,8.4486911 Z M18.4688864,25.3437696 L26.7045278,43.9278953 L36.2761871,43.9278953 L28.1676325,25.3375497 L18.4688864,25.3437696 Z'

export default function Header() {
  const navigateWithLoader = usePageLoader()
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <header className={styles.header} data-anim>
      <button
        type="button"
        className={styles.brand}
        onClick={() => navigateWithLoader('/')}
        aria-label="SafeRoute home"
      >
        <svg className={styles.logo} viewBox="0 0 103 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path fill="currentColor" fillRule="evenodd" d={BRAND_PATH} />
        </svg>
      </button>

      <div className={styles.right}>
        <button
          type="button"
          className={styles.profile}
          onClick={() => setProfileOpen((open) => !open)}
          aria-expanded={profileOpen}
          aria-haspopup="menu"
        >
          <span className={styles.avatar}>SR</span>
          <span className={styles.label}>Profile</span>
        </button>

        <AnimatePresence>
          {profileOpen && (
            <motion.div
              className={styles.popover}
              role="menu"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={styles.popoverHead}>
                <span className={styles.avatar}>SR</span>
                <div>
                  <p className={styles.popoverName}>Guest Rider</p>
                  <p className={styles.popoverMeta}>guest@saferoute.ai</p>
                </div>
              </div>
              <p className={styles.popoverHint}>Sign in is coming soon.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}