import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { useRef } from 'react'
import styles from './style.module.scss'

interface ParagraphProps {
  paragraph: string
}

export default function Paragraph({ paragraph }: ParagraphProps) {
  const container = useRef<HTMLParagraphElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start 0.9', 'start 0.25'],
  })

  const words = paragraph.split(' ')
  return (
    <p ref={container} className={styles.paragraph}>
      {words.map((word, i) => {
        const start = i / words.length
        const end = start + 1 / words.length
        return (
          <Word key={i} progress={scrollYProgress} range={[start, end]}>
            {word}
          </Word>
        )
      })}
    </p>
  )
}

interface WordProps {
  children: string
  progress: MotionValue<number>
  range: [number, number]
}

function Word({ children, progress, range }: WordProps) {
  const amount = range[1] - range[0]
  const step = amount / children.length
  return (
    <span className={styles.word}>
      {children.split('').map((char, i) => {
        const start = range[0] + i * step
        const end = range[0] + (i + 1) * step
        return (
          <Char key={`c_${i}`} progress={progress} range={[start, end]}>
            {char}
          </Char>
        )
      })}
    </span>
  )
}

interface CharProps {
  children: string
  progress: MotionValue<number>
  range: [number, number]
}

function Char({ children, progress, range }: CharProps) {
  const opacity = useTransform(progress, range, [0, 1])
  return (
    <span>
      <span className={styles.shadow}>{children}</span>
      <motion.span style={{ opacity }}>{children}</motion.span>
    </span>
  )
}
