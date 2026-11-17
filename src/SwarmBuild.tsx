import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

const PALETTE = ['#1ABCFE', '#0ACF83', '#9747FF', '#FF8A00', '#E8467C', '#00B5CE']

// Real, meaningful chunks of the portfolio — not placeholder rectangles.
// Nested elements are filtered out so each block is built exactly once.
const TARGET_SELECTOR = [
  '.pr-kicker', '.pr-eyebrow', 'h1', 'h2', 'h3',
  '.pr-hero-copy', '.pr-body-copy', '.pr-about-lead', '.pr-heading-note', '.pr-contact-copy',
  '.pr-about-tags', '.pr-filter-bar', '.pr-hero-actions', '.pr-hero-index',
  '.pr-skill-card', '.pr-project-card', '.pr-contact-panel', '.pr-mascot-img', '.pr-float',
].join(',')

const AGENTS = [
  { name: 'Type', ox: 0, oy: 0, color: '#0ACF83' },
  { name: 'Layout', ox: -52, oy: 44, color: '#1ABCFE' },
  { name: 'Polish', ox: 58, oy: -34, color: '#FF8A00' },
] as const

type Target = {
  id: number
  el: HTMLElement
  rect: { left: number; top: number; width: number; height: number }
  label: string
  kind: 'text' | 'block'
  color: string
}

type CursorState = { x: number; y: number; visible: boolean; step: number }

function nameFor(el: HTMLElement) {
  if (el.tagName === 'H1') return 'H1'
  if (el.tagName === 'H2') return 'H2'
  if (el.tagName === 'H3') return 'H3'
  if (el.classList.contains('pr-project-card')) return 'PROJECT'
  if (el.classList.contains('pr-skill-card')) return 'SKILL'
  if (el.classList.contains('pr-mascot-img') || el.tagName === 'IMG') return 'ASSET'
  if (el.classList.contains('pr-float')) return 'OBJECT'
  if (el.classList.contains('pr-hero-actions')) return 'CTA'
  if (el.classList.contains('pr-filter-bar')) return 'FILTER'
  return 'TEXT'
}

function priorityFor(el: HTMLElement) {
  if (el.classList.contains('pr-float')) return 3
  if (el.classList.contains('pr-mascot-img')) return 2
  return 1
}

function kindFor(el: HTMLElement): Target['kind'] {
  return /^(H1|H2|H3|P)$/.test(el.tagName) ||
    el.classList.contains('pr-eyebrow') ||
    el.classList.contains('pr-kicker') ||
    el.classList.contains('pr-hero-index') ||
    el.classList.contains('pr-heading-note')
    ? 'text'
    : 'block'
}

type BuildSectionProps = {
  id: string
  className?: string
  ariaLabelledBy?: string
  replayKey: number
  index?: number
  tourActive?: boolean
  tourIndex?: number
  onBuilt?: (index: number) => void
  children: ReactNode
}

export function BuildSection({
  id,
  className,
  ariaLabelledBy,
  replayKey,
  index = -1,
  tourActive = false,
  tourIndex = -1,
  onBuilt,
  children,
}: BuildSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const startedRef = useRef(false)
  const startRef = useRef<() => void>(() => {})
  const reduce = useReducedMotion()

  const [status, setStatus] = useState<'pending' | 'building' | 'done'>(reduce ? 'done' : 'pending')
  const [boxes, setBoxes] = useState<Target[]>([])
  const [cursor, setCursor] = useState<CursorState>({ x: 0, y: 0, visible: false, step: 0 })
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  useEffect(() => {
    if (reduce) {
      setStatus('done')
      return
    }

    startedRef.current = false
    setStatus('pending')
    setBoxes([])

    const section = sectionRef.current
    const content = contentRef.current
    if (!section || !content) return

    const timers: number[] = []
    let restore: (() => void) | null = null
    let cleanupObserver: (() => void) | null = null

    const start = () => {
      if (startedRef.current) return
      startedRef.current = true

      const sectionRect = section.getBoundingClientRect()
      const candidates = Array.from(content.querySelectorAll<HTMLElement>(TARGET_SELECTOR))
      const candidateSet = new Set(candidates)

      // Keep only top-level chunks (skip nodes nested inside another chunk).
      const topLevel = candidates
        .filter((el) => {
          let parent = el.parentElement
          while (parent && parent !== content) {
            if (candidateSet.has(parent)) return false
            parent = parent.parentElement
          }
          return true
        })
        .sort((a, b) => priorityFor(a) - priorityFor(b))
        .slice(0, 14)

      const targets: Target[] = topLevel.map((el, index) => {
        const rect = el.getBoundingClientRect()
        return {
          id: index,
          el,
          rect: {
            left: rect.left - sectionRect.left,
            top: rect.top - sectionRect.top,
            width: rect.width,
            height: rect.height,
          },
          label: `${nameFor(el)} · ${Math.round(rect.width)} × ${Math.round(rect.height)}`,
          kind: kindFor(el),
          color: PALETTE[index % PALETTE.length],
        }
      })

      // Hide each real element (not its containers — those must stay visible
      // so revealed children can actually be seen), remembering its original
      // inline style so it can be handed back untouched at the end.
      const saved = targets.map((target) => ({ el: target.el, style: target.el.getAttribute('style') }))
      targets.forEach((target) => {
        const el = target.el
        el.style.transition = 'opacity .3s ease, transform .45s cubic-bezier(.16,1,.3,1), clip-path .5s steps(26,end)'
        el.style.opacity = '0'
        // Text starts fully clipped so it reveals like a typewriter.
        if (target.kind === 'text') el.style.clipPath = 'inset(0 100% 0 0)'
      })

      restore = () => {
        saved.forEach(({ el, style }) => {
          if (style === null) el.removeAttribute('style')
          else el.setAttribute('style', style)
        })
      }

      setStatus('building')
      setProgress({ current: 0, total: targets.length })

      const STEP = 250
      targets.forEach((target, index) => {
        const at = 140 + index * STEP

        timers.push(window.setTimeout(() => {
          setBoxes((prev) => [...prev, target])
          setCursor({
            x: target.rect.left + Math.min(target.rect.width / 2, 140),
            y: target.rect.top + Math.min(target.rect.height / 2, 70),
            visible: true,
            step: index,
          })
          setProgress({ current: index + 1, total: targets.length })

          // Bring the actual element into existence.
          target.el.style.opacity = '1'
          target.el.style.transform = 'none'
          if (target.kind === 'text') target.el.style.clipPath = 'inset(0 0% 0 0)'
        }, at))

        timers.push(window.setTimeout(() => {
          setBoxes((prev) => prev.filter((box) => box.id !== target.id))
        }, at + 420))
      })

      timers.push(window.setTimeout(() => {
        setCursor((current) => ({ ...current, visible: false }))
        restore?.()
        restore = null
        setStatus('done')
        onBuilt?.(index)
      }, 140 + targets.length * STEP + 520))
    }

    startRef.current = start

    // In tour mode the parent decides when each section builds, so don't
    // let the observer jump the gun.
    if (!tourActive) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) start()
          }
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
      )
      observer.observe(section)

      const rect = section.getBoundingClientRect()
      if (rect.top < window.innerHeight * 0.85 && rect.bottom > window.innerHeight * 0.12) start()

      // (observer is disconnected in the cleanup below via observerRef)
      cleanupObserver = () => observer.disconnect()
    }

    return () => {
      cleanupObserver?.()
      timers.forEach((timer) => window.clearTimeout(timer))
      restore?.()
    }
    // tourActive / onBuilt are intentionally read from the render that set up
    // this build; changing them must not reset an in-progress build.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replayKey, reduce])

  // Tour mode: only the section the parent has selected starts building.
  useEffect(() => {
    if (tourActive && index === tourIndex) startRef.current()
  }, [tourActive, tourIndex, index])

  return (
    <section ref={sectionRef} id={id} className={className} aria-labelledby={ariaLabelledBy}>
      <div ref={contentRef} className={`swarm-content${status === 'pending' ? ' is-hidden' : ''}`}>
        {children}
      </div>

      <AnimatePresence>
        {status === 'building' ? (
          <motion.div
            className="swarm-overlay"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="swarm-grid" />

            <AnimatePresence>
              {boxes.map((box) => (
                <motion.div
                  key={box.id}
                  className="swarm-box"
                  style={{ left: box.rect.left, top: box.rect.top, ['--c' as string]: box.color } as React.CSSProperties}
                  initial={{ width: 0, height: 0, opacity: 0 }}
                  animate={{ width: box.rect.width, height: box.rect.height, opacity: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className="swarm-box__badge">{box.label}</span>
                </motion.div>
              ))}
            </AnimatePresence>

            {AGENTS.map((agent, index) => (
              <motion.div
                key={agent.name}
                className="swarm-cursor"
                style={{ left: 0, top: 0, ['--c' as string]: agent.color } as React.CSSProperties}
                animate={{
                  x: cursor.x + agent.ox,
                  y: cursor.y + agent.oy,
                  opacity: cursor.visible ? (index === 0 ? 1 : 0.75) : 0,
                }}
                transition={{ type: 'spring', stiffness: 230 - index * 35, damping: 24, delay: index * 0.05 }}
              >
                <span className="swarm-cursor__glyph">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 3l14 8.2-6.2 1.1L10 19 5 3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="swarm-cursor__name">{agent.name}</span>
              </motion.div>
            ))}

            <div className="swarm-hud">
              <span className="swarm-hud__dot" />
              REBUILDING · {progress.current}/{progress.total}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  )
}

export default BuildSection
