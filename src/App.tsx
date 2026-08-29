import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react'
import ChatBot from './ChatBot'
import { Reveal } from './motion'

const NAV_ITEMS = [
  { label: 'Home', href: '#home' },
  { label: 'Skills', href: '#skills' },
  { label: 'Projects', href: '#projects' },
  { label: 'Tech Stack', href: '#tech' },
] as const

const ROLE_PHRASES = ['interfaces', 'web_apps', 'product_experiences'] as const
const ROLE_MAX_CHARS = Math.max(...ROLE_PHRASES.map((p) => p.length))
const CONTACT_EMAIL = 'bannsire@gmail.com'
const CONTACT_FORM_ENDPOINT = 'https://formspree.io/f/mkopnqdw'

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

function useScrollSpin(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let raf = 0
    const update = () => {
      const rect = el.getBoundingClientRect()
      const viewH = window.innerHeight || 1

      // progress:
      // 0 when element is below the viewport
      // 1 when it has scrolled past the top
      const total = viewH + rect.height
      const passed = viewH - rect.top
      const progress = clamp01(passed / total)

      el.style.setProperty('--spin', `${progress * 720}deg`)
    }

    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [containerRef])
}

function useTypeCycle(
  phrases: string[],
  opts: { typeMs: number; deleteMs: number; holdMs: number; loop: boolean },
) {
  const { typeMs, deleteMs, holdMs, loop } = opts
  const safePhrases = useMemo(() => {
    const phrasesSafe = phrases.filter(Boolean)
    return phrasesSafe.length ? phrasesSafe : ['']
  }, [phrases])

  const [phraseIndex, setPhraseIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [direction, setDirection] = useState<'type' | 'delete'>('type')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (done) return

    const phrase = safePhrases[phraseIndex] ?? ''

    let timeoutId: number | undefined

    if (direction === 'type') {
      if (charIndex < phrase.length) {
        timeoutId = window.setTimeout(() => setCharIndex((v) => v + 1), typeMs)
      } else {
        timeoutId = window.setTimeout(() => setDirection('delete'), holdMs)
      }
    } else {
      if (charIndex > 0) {
        timeoutId = window.setTimeout(() => setCharIndex((v) => v - 1), deleteMs)
      } else {
        if (phraseIndex === safePhrases.length - 1) {
          if (loop) setPhraseIndex(0)
          else setDone(true)
        } else {
          setPhraseIndex((v) => v + 1)
        }
        setDirection('type')
      }
    }

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [
    charIndex,
    done,
    deleteMs,
    direction,
    holdMs,
    loop,
    phraseIndex,
    safePhrases,
    typeMs,
  ])

  const phrase = safePhrases[phraseIndex] ?? ''
  const visible = phrase.slice(0, charIndex)

  return { visible, done }
}

function RotatingTypeCycle({
  phrases,
  className,
  typeMs = 70,
  deleteMs = 35,
  holdMs = 650,
  loop = true,
  minChars,
}: {
  phrases: string[]
  className?: string
  typeMs?: number
  deleteMs?: number
  holdMs?: number
  loop?: boolean
  minChars?: number
}) {
  const wrapperRef = useRef<HTMLSpanElement | null>(null)
  useScrollSpin(wrapperRef)

  const { visible, done } = useTypeCycle(phrases, {
    typeMs,
    deleteMs,
    holdMs,
    loop,
  })

  return (
    <span
      ref={wrapperRef}
      className={`rotating-wrap inline-flex items-baseline ${className ?? ''}`}
      style={minChars ? { minWidth: `min(${minChars}ch, 85vw)` } : undefined}
    >
      {visible.split('').map((ch, i) => (
        <span key={`${ch}-${i}`} className="rotating-letter" style={{ ['--i' as any]: i }}>
          {ch}
        </span>
      ))}
      {!done ? <span className="rotating-caret">|</span> : null}
    </span>
  )
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/75">
      {children}
    </span>
  )
}

function SectionHeader({
  index,
  eyebrow,
  title,
  desc,
  aside,
}: {
  index: string
  eyebrow: string
  title: string
  desc?: string
  aside?: ReactNode
}) {
  return (
    <div className="flex items-end justify-between gap-6 flex-wrap">
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-accent">
          <span className="font-mono text-white/40">{index}</span>
          <span className="h-px w-8 bg-accent/40" />
          {eyebrow}
        </div>
        <h2 className="mt-4 text-3xl sm:text-4xl font-semibold text-white text-balance">{title}</h2>
        {desc ? <p className="mt-3 text-white/60 leading-relaxed">{desc}</p> : null}
      </div>
      {aside}
    </div>
  )
}

function HeaderBrand() {
  const baseUrl = import.meta.env.BASE_URL
  return (
    <a href="#home" className="group inline-flex items-center gap-2 font-display font-semibold tracking-tight text-white">
      <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg border border-accent/30 bg-accent/10">
        <img
          src={`${baseUrl}imgs/logo.png`}
          alt="DevBann logo"
          className="h-full w-full object-contain"
        />
      </span>
      DevBann
    </a>
  )
}

/**
 * Pinned scroll-storytelling hero.
 *
 * The section is tall; an inner panel sticks to the viewport while the story
 * plays out in three scroll-driven beats:
 *   1. Oversized mascot zooms in with a greeting.
 *   2. The headline assembles as the mascot settles to the side.
 *   3. The pitch, tags, and calls-to-action arrive to form the final layout.
 * A reduced-motion fallback renders the finished composition statically.
 */
function HeroStory() {
  const baseUrl = import.meta.env.BASE_URL
  const reduce = useReducedMotion()
  const sectionRef = useRef<HTMLDivElement | null>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })
  const p = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
    mass: 0.4,
  })

  // Mascot: zoom in, settle, and drift with a subtle tilt.
  const mascotScale = useTransform(p, [0, 0.55], [1.5, 1])
  const mascotRotate = useTransform(p, [0, 1], [-8, 5])
  const mascotY = useTransform(p, [0, 1], [40, -40])
  const glowScale = useTransform(p, [0, 0.55], [1.4, 1])

  // Beat 1 — greeting.
  const greetOpacity = useTransform(p, [0, 0.16, 0.26], [1, 1, 0])
  const greetY = useTransform(p, [0, 0.26], [0, -28])

  // Beat 2 — headline.
  const titleOpacity = useTransform(p, [0.2, 0.42], [0, 1])
  const titleY = useTransform(p, [0.2, 0.42], [44, 0])

  // Beat 3 — details + CTAs.
  const detailOpacity = useTransform(p, [0.56, 0.82], [0, 1])
  const detailY = useTransform(p, [0.56, 0.82], [44, 0])

  // Scroll hint fades quickly once the journey begins.
  const hintOpacity = useTransform(p, [0, 0.08], [1, 0])

  if (reduce) {
    return (
      <section id="home" className="pt-24 pb-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <MascotCard baseUrl={baseUrl} />
            <HeroCopy />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="home" ref={sectionRef} className="relative h-[280vh]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-10">
            {/* Mascot */}
            <div className="order-2 md:order-1">
              <motion.div
                style={{ scale: mascotScale, rotate: mascotRotate, y: mascotY }}
                className="relative mx-auto w-fit"
              >
                <motion.div
                  style={{ scale: glowScale }}
                  className="absolute -inset-8 rounded-[36px] bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.35),transparent_60%)] blur-2xl"
                />
                <div className="relative rounded-[32px] border border-white/10 bg-white/[0.03] p-2 backdrop-blur-sm">
                  <img
                    src={`${baseUrl}imgs/logo.png`}
                    alt="DevBann mascot — a coding polar bear"
                    className="h-44 w-44 sm:h-56 sm:w-56 lg:h-72 lg:w-72 object-contain bg-transparent rounded-3xl"
                  />
                </div>
                <motion.div
                  style={{ opacity: detailOpacity }}
                  className="absolute -bottom-3 -right-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-2 backdrop-blur-md"
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-white/80">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                    </span>
                    Available for work
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Story copy */}
            <div className="relative order-1 md:order-2 min-h-[20rem]">
              <motion.p
                style={{ opacity: greetOpacity, y: greetY }}
                className="text-sm font-medium uppercase tracking-[0.25em] text-accent"
              >
                Hi, I&apos;m DevBann
              </motion.p>

              <motion.div style={{ opacity: titleOpacity, y: titleY }} className="mt-4">
                <div className="flex flex-wrap gap-2.5">
                  <Pill>React + Tailwind</Pill>
                  <Pill>Professional UI</Pill>
                  <Pill>Scroll-reactive motion</Pill>
                </div>

                <h1 className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-2 text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.03]">
                  <span className="text-white whitespace-nowrap">I craft</span>
                  <RotatingTypeCycle
                    phrases={ROLE_PHRASES as unknown as string[]}
                    typeMs={65}
                    deleteMs={32}
                    holdMs={700}
                    minChars={ROLE_MAX_CHARS + 1}
                  />
                  <span className="text-white whitespace-nowrap">for people.</span>
                </h1>
              </motion.div>

              <motion.div style={{ opacity: detailOpacity, y: detailY }}>
                <p className="mt-6 max-w-md text-base sm:text-lg text-white/60 leading-relaxed text-pretty">
                  Front-end designer and engineer focused on clean, accessible interfaces — from
                  dashboards and PWAs to production tooling that people actually enjoy using.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="#projects"
                    className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-950 px-5 py-3 text-sm font-semibold hover:bg-white/90 transition-colors"
                  >
                    View Projects
                    <span aria-hidden="true">→</span>
                  </a>
                  <a
                    href="#contact"
                    className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/[0.08] hover:border-white/20 transition-colors"
                  >
                    Get in touch
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <motion.div
          style={{ opacity: hintOpacity }}
          className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/40"
        >
          Scroll to explore
          <span className="grid h-8 w-5 place-items-start rounded-full border border-white/20 p-1">
            <motion.span
              className="h-1.5 w-1 rounded-full bg-accent"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </span>
        </motion.div>
      </div>
    </section>
  )
}

/** Static mascot card used by the reduced-motion hero fallback. */
function MascotCard({ baseUrl }: { baseUrl: string }) {
  return (
    <div className="order-2 lg:order-1">
      <div className="relative mx-auto w-fit">
        <div className="absolute -inset-8 rounded-[36px] bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.35),transparent_60%)] blur-2xl" />
        <div className="relative rounded-[32px] border border-white/10 bg-white/[0.03] p-2 backdrop-blur-sm">
          <img
            src={`${baseUrl}imgs/logo.png`}
            alt="DevBann mascot — a coding polar bear"
            className="h-52 w-52 sm:h-64 sm:w-64 lg:h-80 lg:w-80 object-contain bg-transparent rounded-3xl"
          />
        </div>
        <div className="absolute -bottom-3 -right-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-2 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-medium text-white/80">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Available for work
          </div>
        </div>
      </div>
    </div>
  )
}

/** Static hero copy used by the reduced-motion hero fallback. */
function HeroCopy() {
  return (
    <div className="order-1 lg:order-2">
      <div className="flex flex-wrap gap-2.5">
        <Pill>React + Tailwind</Pill>
        <Pill>Professional UI</Pill>
        <Pill>Scroll-reactive motion</Pill>
      </div>

      <h1 className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-2 text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.03]">
        <span className="text-white whitespace-nowrap">I craft</span>
        <RotatingTypeCycle
          phrases={ROLE_PHRASES as unknown as string[]}
          typeMs={65}
          deleteMs={32}
          holdMs={700}
          minChars={ROLE_MAX_CHARS + 1}
        />
        <span className="text-white whitespace-nowrap">for people.</span>
      </h1>

      <p className="mt-6 max-w-md text-base sm:text-lg text-white/60 leading-relaxed text-pretty">
        Front-end designer and engineer focused on clean, accessible interfaces — from dashboards
        and PWAs to production tooling that people actually enjoy using.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href="#projects"
          className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-950 px-5 py-3 text-sm font-semibold hover:bg-white/90 transition-colors"
        >
          View Projects
          <span aria-hidden="true">→</span>
        </a>
        <a
          href="#contact"
          className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/[0.08] hover:border-white/20 transition-colors"
        >
          Get in touch
        </a>
      </div>
    </div>
  )
}

export default function App() {
  const [activeHref, setActiveHref] = useState('#home')

  const sectionIds = useMemo(() => NAV_ITEMS.map((n) => n.href.replace('#', '')), [])

  useEffect(() => {
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((v): v is HTMLElement => Boolean(v))

    if (!sections.length) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target instanceof HTMLElement) {
            setActiveHref(`#${entry.target.id}`)
          }
        }
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: 0.01 },
    )

    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [sectionIds])

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-x-clip">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,_rgba(34,211,238,0.14),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent_75%)] opacity-30" />
      </div>

      <header className="fixed left-0 right-0 top-0 z-50 backdrop-blur-md bg-slate-950/70 border-b border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-4">
          <div className="h-[72px] flex items-center justify-between">
            <HeaderBrand />

            <nav className="hidden md:flex items-center gap-1 text-sm">
              {NAV_ITEMS.map((item) => {
                const isActive = activeHref === item.href
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`relative rounded-full px-4 py-2 transition-colors ${
                      isActive ? 'text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {isActive ? (
                      <span className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.06]" />
                    ) : null}
                    <span className="relative">{item.label}</span>
                  </a>
                )
              })}
            </nav>

            <a
              href="#contact"
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-accent-soft transition-colors"
            >
              Let&apos;s talk
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </header>

      <main className="relative">
        <HeroStory />

        <section id="whatido" className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
              <Reveal
                direction="right"
                className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-10"
              >
                <div className="text-xs font-medium uppercase tracking-[0.2em] text-accent">What I do</div>
                <h2 className="mt-4 text-2xl sm:text-3xl font-semibold text-white text-balance">
                  Design and engineering, working as one
                </h2>
                <p className="mt-3 text-white/60 max-w-xl leading-relaxed">
                  I build professional front-end experiences with clean structure, modern styling, and motion
                  that adds clarity instead of noise.
                </p>

                <div className="mt-8 grid gap-3">
                  {[
                    {
                      title: 'Clean, scalable UI',
                      desc: 'Tailwind-first layouts with consistent spacing, typography, and accessibility.',
                    },
                    {
                      title: 'Motion that means something',
                      desc: 'Scroll-reactive effects that guide attention, never distract from content.',
                    },
                    {
                      title: 'Practical front-end engineering',
                      desc: 'Components, forms, and responsive behavior built for real users.',
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="group flex gap-4 rounded-2xl border border-white/[0.06] bg-slate-900/40 p-4 transition-colors hover:border-accent/25"
                    >
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-accent/25 bg-accent/10 text-accent transition-transform group-hover:scale-110">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      </span>
                      <div>
                        <div className="font-semibold text-white/90">{item.title}</div>
                        <div className="mt-1 text-sm text-white/60 leading-relaxed">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-white/50">Currently building</span>
                  <span className="text-xs rounded-full px-3 py-1 border border-white/10 bg-white/[0.04] text-white/75">
                    portfolios, dashboards, landing pages
                  </span>
                </div>
              </Reveal>

              <Reveal
                direction="left"
                delay={0.1}
                className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-10 h-full"
              >
                <div className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">Highlights</div>
                <div className="mt-6 grid gap-3">
                  {[
                    {
                      stat: '100%',
                      title: 'UI polish',
                      desc: 'Consistent spacing, typography, and micro-interactions for a premium feel.',
                    },
                    {
                      stat: 'Mobile-first',
                      title: 'Responsive by default',
                      desc: 'Clean layouts that scale from mobile to desktop without breaking.',
                    },
                    {
                      stat: 'Vite',
                      title: 'Fast builds',
                      desc: 'Modern tooling for quick iterations and smooth developer UX.',
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-white/[0.06] bg-slate-900/40 p-5 transition-colors hover:border-white/15"
                    >
                      <div className="font-display text-lg font-semibold text-accent">{item.stat}</div>
                      <div className="mt-1 font-semibold text-white/90">{item.title}</div>
                      <div className="mt-1 text-sm text-white/60 leading-relaxed">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section id="skills" className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <Reveal>
              <SectionHeader
                index="01"
                eyebrow="Skills"
                title="Tools for building polished experiences"
                desc="A focused toolkit for designing, building, and refining front-end experiences end to end."
                aside={
                  <div className="hidden md:block text-right">
                    <div className="text-xs uppercase tracking-[0.2em] text-white/40">Approach</div>
                    <div className="mt-1 text-sm text-white/70">Design + engineering, together</div>
                  </div>
                }
              />
            </Reveal>

            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                { title: 'React Components', desc: 'Reusable patterns, clean state, predictable UI.' },
                { title: 'Tailwind Styling', desc: 'Design systems using utility classes and layers.' },
                { title: 'UI Motion', desc: 'Typing + scroll effects with performant updates.' },
                { title: 'Responsive Layouts', desc: 'Mobile-first structure with careful typography.' },
                { title: 'Forms & Validation', desc: 'User-friendly interactions and accessible controls.' },
                { title: 'Performance Mindset', desc: 'Avoid unnecessary renders and keep it smooth.' },
              ].map((s, i) => (
                <Reveal
                  key={s.title}
                  delay={(i % 3) * 0.08}
                  className="card-sheen group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 transition-colors hover:border-accent/30"
                >
                  <div className="flex items-start justify-between">
                    <div className="text-lg font-semibold text-white">{s.title}</div>
                    <span className="font-mono text-xs text-white/25 transition-colors group-hover:text-accent/70">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-white/60 leading-relaxed">{s.desc}</div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="projects" className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <Reveal>
              <SectionHeader
                index="02"
                eyebrow="Projects"
                title="Selected work"
                desc="Real-world apps I've built, spanning print tooling, drone operations, field marketing, and technical support systems."
              />
            </Reveal>

            <div className="mt-12 grid gap-4 md:grid-cols-2">
              {[
                {
                  title: 'Sticker Generator',
                  desc: 'A web app for generating A4 label sheets — design custom stickers with product info, logos, and QR codes on the "Create" page, or generate RPU drone sticker sheets with mixed or uniform label sizes on the RPU page. Both export print-ready PDFs with canvas-rendered stickers at 300 DPI.',
                  tags: ['React', 'Canvas', 'PDF Export', 'QR Codes'],
                  href: 'https://bann001.github.io/hr-sticker',
                },
                {
                  title: 'ATOMS',
                  desc: 'A Vite + React + TypeScript PWA for managing drone spraying operations. It reads live data from a Supabase backend (vtiger CRM sync), uses Mapbox GL for maps, React Query for data fetching, shadcn/ui for components, and Tailwind for styling.',
                  tags: ['Vite', 'TypeScript', 'Supabase', 'Mapbox GL', 'React Query'],
                  href: 'https://atoms.agridomcorp.com',
                },
                {
                  title: 'BrandSyncSMS',
                  desc: 'A progressive web application built for field lead capture and marketing operations. It streamlines mobile contact capture, offline-ready workflows, and real-time synchronization for marketing teams on the ground.',
                  tags: ['React', 'TypeScript', 'PWA', 'Tailwind', 'Vite'],
                  href: 'https://sms-290z.onrender.com/',
                },
                {
                  title: 'Aerobot Technical Support',
                  desc: 'A comprehensive service portal and support management platform for Aerobot drone systems. Features service ticket workflows, Supabase backend integration, digital signature capture, PDF service report generation, and data analytics.',
                  tags: ['React', 'TypeScript', 'Supabase', 'PDF Export', 'Recharts'],
                  href: 'https://techsupport.aerobot.ph/',
                },
                {
                  title: 'SF Talk',
                  desc: 'A secure, self-hosted company messaging platform built with an Express.js + MySQL backend and a React/Vite frontend. It features real-time messaging with Socket.io, user authentication, OR-based search, batch inserts, and full JSON column handling — replacing a PocketBase backend with a custom Node.js server for greater control and scalability.',
                  tags: ['Express.js', 'MySQL', 'Socket.io', 'React', 'Vite'],
                  href: null,
                  note: 'Local Production',
                },
              ].map((p, i) => (
                <Reveal
                  key={p.title}
                  delay={(i % 2) * 0.1}
                  className="card-sheen group flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-7 transition-colors hover:border-accent/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="font-mono text-xs text-accent/70">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <h3 className="mt-1 text-xl font-semibold text-white transition-colors group-hover:text-accent-soft">
                        {p.title}
                      </h3>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                        p.href
                          ? 'border-accent/25 bg-accent/10 text-accent'
                          : 'border-white/10 bg-white/[0.04] text-white/50'
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {p.href ? 'Live' : p.note ?? 'Private'}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-white/60 leading-relaxed">{p.desc}</p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-white/70"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 pt-5 border-t border-white/[0.06]">
                    {p.href ? (
                      <a
                        href={p.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/link text-sm font-semibold text-white/90 hover:text-accent inline-flex items-center gap-2 transition-colors"
                      >
                        View live
                        <span aria-hidden="true" className="transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5">
                          ↗
                        </span>
                      </a>
                    ) : (
                      <span className="text-sm font-medium text-white/40 inline-flex items-center gap-2">
                        {p.note ?? 'Private project'}
                      </span>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="tech" className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <Reveal>
              <SectionHeader
                index="03"
                eyebrow="Tech Stack"
                title="What I build with"
                desc="The tools I reach for most often to ship clean, modern experiences."
              />
            </Reveal>

            <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  title: 'Languages',
                  items: ['TypeScript', 'JavaScript', 'HTML', 'CSS3', 'PHP'],
                },
                { title: 'Databases', items: ['MySQL', 'PostgreSQL', 'SQLite', 'MongoDB'] },
                {
                  title: 'Tools',
                  items: ['Git', 'Linux', 'Docker', 'Nginx', 'Apache'],
                },
                {
                  title: 'Frameworks',
                  items: ['React', 'TailwindCSS', 'Vite', 'WordPress', 'Elementor', 'Elementor Pro'],
                },
              ].map((group, i) => (
                <Reveal
                  key={group.title}
                  delay={(i % 4) * 0.07}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 transition-colors hover:border-accent/25"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-display text-sm font-semibold text-white">{group.title}</div>
                    <div className="font-mono text-xs text-white/35">{group.items.length}</div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {group.items.map((t) => (
                      <span
                        key={t}
                        className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/75 hover:border-accent/30 hover:text-white transition-colors"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
              <Reveal direction="right">
                <div className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Contact</div>
                <h2 className="mt-4 text-3xl sm:text-4xl font-semibold text-white text-balance">
                  Let&apos;s build something great
                </h2>
                <p className="mt-3 text-white/60 max-w-md leading-relaxed">
                  Want a formal, professional one-pager with motion that actually looks good? Tell me about
                  your project and I&apos;ll get back to you.
                </p>

                <div className="mt-8 space-y-3">
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="group flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 hover:border-accent/30 transition-colors"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
                      @
                    </span>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-white/40">Email</div>
                      <div className="text-sm font-semibold text-white/90 group-hover:text-accent-soft transition-colors">
                        {CONTACT_EMAIL}
                      </div>
                    </div>
                  </a>
                </div>
              </Reveal>

              <Reveal direction="left" delay={0.1}>
                <ContactForm />
              </Reveal>
            </div>
          </div>
        </section>

        <footer className="py-10 border-t border-white/[0.06] bg-slate-950/30">
          <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <HeaderBrand />
            <div className="text-sm text-white/50">
              © {new Date().getFullYear()} DevBann. All rights reserved.
            </div>
          </div>
        </footer>
      </main>

      <ChatBot />
    </div>
  )
}

function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle')

  const canSubmit = name.trim().length >= 2 && email.includes('@') && message.trim().length >= 10

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-8">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!canSubmit) return
          setStatus('submitting')

          const subject = `Portfolio contact from ${name.trim()}`

          const form = new URLSearchParams()
          form.set('name', name.trim())
          form.set('email', email.trim())
          form.set('message', message.trim())
          form.set('_subject', subject)
          // Lets you control the reply-to address in Formspree (if enabled).
          form.set('_replyto', email.trim())

          fetch(CONTACT_FORM_ENDPOINT, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: form,
          })
            .then(async (res) => {
              if (!res.ok) throw new Error(`Formspree request failed: ${res.status}`)
              return res.json().catch(() => null)
            })
            .then(() => {
              setStatus('sent')
              setName('')
              setEmail('')
              setMessage('')
              window.setTimeout(() => setStatus('idle'), 2500)
            })
            .catch(() => setStatus('error'))
        }}
        className="space-y-5"
      >
        <div>
          <label className="text-sm font-semibold text-white/90">Your name</label>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none transition-colors focus:border-accent/60 focus:ring-1 focus:ring-accent/40"
            placeholder="Your name"
            required
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-white/90">Email</label>
          <input
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none transition-colors focus:border-accent/60 focus:ring-1 focus:ring-accent/40"
            placeholder="you@example.com"
            required
            type="email"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-white/90">Message</label>
          <textarea
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-2 w-full min-h-[120px] rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none transition-colors focus:border-accent/60 focus:ring-1 focus:ring-accent/40"
            placeholder="Tell me what you want to build..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit || status === 'submitting'}
          className="w-full rounded-xl bg-white text-slate-950 px-4 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
        >
          {status === 'submitting' ? 'Sending...' : status === 'sent' ? 'Sent!' : status === 'error' ? 'Try again' : 'Send message'}
        </button>
      </form>
    </div>
  )
}
