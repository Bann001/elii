import { useRef } from 'react'
import type { ReactNode } from 'react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

const OFFSETS: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 48 },
  down: { x: 0, y: -48 },
  left: { x: 48, y: 0 },
  right: { x: -48, y: 0 },
  none: { x: 0, y: 0 },
}

/**
 * Scroll-driven entrance: fades, slides, and gently scales content into place
 * as it enters the viewport. Respects prefers-reduced-motion.
 */
export function Reveal({
  children,
  className,
  direction = 'up',
  delay = 0,
  once = true,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  direction?: Direction
  delay?: number
  once?: boolean
  as?: 'div' | 'section' | 'li' | 'span'
}) {
  const reduce = useReducedMotion()
  const { x, y } = OFFSETS[direction]
  const MotionTag = motion[as] as any

  if (reduce) {
    const Tag = as as any
    return <Tag className={className}>{children}</Tag>
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, x, y, scale: 0.98 }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once, amount: 0.25, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  )
}

/**
 * Parallax wrapper: translates its children on the Y axis relative to scroll,
 * creating depth between layers.
 */
export function Parallax({
  children,
  className,
  distance = 60,
}: {
  children: ReactNode
  className?: string
  distance?: number
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const raw = useTransform(scrollYProgress, [0, 1], [distance, -distance])
  const y = useSpring(raw, { stiffness: 120, damping: 30, mass: 0.5 })

  return (
    <div ref={ref} className={className}>
      <motion.div style={reduce ? undefined : { y }}>{children}</motion.div>
    </div>
  )
}
