import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'

const NAV_ITEMS = [
  { label: 'Home', href: '#home' },
  { label: 'Skills', href: '#skills' },
  { label: 'Projects', href: '#projects' },
  { label: 'Tech Stack', href: '#tech' },
] as const

const ROLE_PHRASES = ['interfaces', 'web apps', 'product experiences'] as const

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

function useTypeOnce(text: string, speedMs = 90, startDelayMs = 250) {
  const [shownCount, setShownCount] = useState(0)

  useEffect(() => {
    let raf = 0
    const start = performance.now() + startDelayMs
    const tick = (now: number) => {
      const next = Math.floor((now - start) / speedMs)
      const clamped = Math.max(0, Math.min(text.length, next))
      setShownCount(clamped)

      if (clamped < text.length) {
        raf = window.requestAnimationFrame(tick)
      }
    }

    raf = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(raf)
  }, [text, speedMs, startDelayMs])

  return shownCount
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

function RotatingTypeWord({
  text,
  speedMs,
  startDelayMs,
  className,
  showCaret,
}: {
  text: string
  speedMs?: number
  startDelayMs?: number
  className?: string
  showCaret?: boolean
}) {
  const wrapperRef = useRef<HTMLSpanElement | null>(null)
  useScrollSpin(wrapperRef)

  const shownCount = useTypeOnce(text, speedMs ?? 90, startDelayMs ?? 260)
  const shown = text.slice(0, shownCount)

  return (
    <span ref={wrapperRef} className={`rotating-wrap inline-flex items-baseline ${className ?? ''}`}>
      {shown.split('').map((ch, i) => (
        <span key={`${ch}-${i}`} className="rotating-letter" style={{ ['--i' as any]: i }}>
          {ch}
        </span>
      ))}
      {showCaret && shownCount < text.length ? <span className="rotating-caret">|</span> : null}
    </span>
  )
}

function RotatingTypeCycle({
  phrases,
  className,
  typeMs = 70,
  deleteMs = 35,
  holdMs = 650,
  loop = true,
}: {
  phrases: string[]
  className?: string
  typeMs?: number
  deleteMs?: number
  holdMs?: number
  loop?: boolean
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
    <span ref={wrapperRef} className={`rotating-wrap inline-flex items-baseline ${className ?? ''}`}>
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
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
      {children}
    </span>
  )
}

function HeaderBrand() {
  const baseUrl = import.meta.env.BASE_URL
  const logoCandidates = useMemo(
    () => [`${baseUrl}imgs/logo.svg`, `${baseUrl}imgs/pfp.jpg`],
    [baseUrl],
  )
  const [logoIndex, setLogoIndex] = useState(0)

  return (
    <a href="#home" className="font-semibold tracking-tight text-white inline-flex items-center gap-3">
      {logoIndex < logoCandidates.length ? (
        <img
          src={logoCandidates[logoIndex]}
          alt="BannDev logo"
          className="h-8 w-auto"
          onError={() => setLogoIndex((v) => v + 1)}
        />
      ) : null}
      {logoIndex >= logoCandidates.length ? <span>BannDev</span> : null}
    </a>
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
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(168,85,247,0.22),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:48px_48px] opacity-40" />
      </div>

      <header className="fixed left-0 right-0 top-0 z-50 backdrop-blur bg-slate-950/60 border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="h-[72px] flex items-center justify-between">
            <HeaderBrand />

            <nav className="hidden md:flex items-center gap-7 text-sm">
              {NAV_ITEMS.map((item) => {
                const isActive = activeHref === item.href
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`transition-colors ${
                      isActive ? 'text-white' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </a>
                )
              })}
            </nav>

            <a
              href="#contact"
              className="hidden sm:inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10 transition-colors"
            >
              Let&apos;s talk
            </a>
          </div>
        </div>
      </header>

      <main className="relative">
        <section id="home" className="min-h-screen pt-28 pb-14">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="flex flex-wrap gap-3">
                  <Pill>ReactJS + Tailwind</Pill>
                  <Pill>Professional UI</Pill>
                  <Pill>Scroll-reactive animations</Pill>
                </div>

                <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05]">
                  <span className="text-white/90">I craft</span>{' '}
                  <RotatingTypeCycle
                    phrases={ROLE_PHRASES as unknown as string[]}
                    typeMs={65}
                    deleteMs={32}
                    holdMs={700}
                  />{' '}
                  <span className="text-white/90">for people.</span>
                </h1>

                <p className="mt-5 text-base sm:text-lg text-white/70 max-w-xl">
                  Scroll down and watch the colors rotate inside the letters. This one-page portfolio is built to feel
                  formal, fast, and unmistakably yours.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="#projects"
                    className="inline-flex items-center rounded-xl bg-white text-slate-950 px-5 py-3 text-sm font-semibold hover:bg-white/90 transition-colors"
                  >
                    View Projects
                  </a>
                  <a
                    href="#tech"
                    className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10 transition-colors"
                  >
                    Tech Stack
                  </a>
                </div>

                <div className="mt-10">
                  <div className="flex items-baseline gap-3">
                    <span className="text-white/70 text-sm uppercase tracking-widest">Name</span>
                    <RotatingTypeWord text="BannDev" className="text-3xl sm:text-4xl" />
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-fuchsia-500/30 via-cyan-400/20 to-amber-400/20 blur-2xl" />
                <div className="relative rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
                  <h2 className="text-xl font-semibold text-white">What I do</h2>
                  <div className="mt-6 grid gap-4">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-4">
                      <div className="font-semibold text-white/90">Clean, scalable UI</div>
                      <div className="mt-1 text-sm text-white/70">
                        Tailwind-first layouts with consistent spacing, typography, and accessibility.
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-4">
                      <div className="font-semibold text-white/90">Motion that means something</div>
                      <div className="mt-1 text-sm text-white/70">
                        Scroll-reactive effects that guide attention (not distract from content).
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-4">
                      <div className="font-semibold text-white/90">Practical front-end engineering</div>
                      <div className="mt-1 text-sm text-white/70">
                        Components, forms, and responsive behavior built for real users.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="text-xs text-white/60">Currently: building</span>
                  <span className="text-xs rounded-full px-3 py-1 border border-white/10 bg-white/5 text-white/80">
                    portfolios, dashboards, landing pages
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="skills" className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div>
                <h2 className="text-3xl font-semibold">Skills</h2>
                <p className="mt-2 text-white/70 max-w-2xl">
                  A focused set of tools for designing, building, and polishing front-end experiences.
                </p>
              </div>
              <div className="hidden md:block text-right">
                <div className="text-xs uppercase tracking-widest text-white/50">Approach</div>
                <div className="mt-1 text-sm text-white/80">Design + engineering, together.</div>
              </div>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                { title: 'React Components', desc: 'Reusable patterns, clean state, predictable UI.' },
                { title: 'Tailwind Styling', desc: 'Design systems using utility classes and layers.' },
                { title: 'UI Motion', desc: 'Typing + scroll effects with performant updates.' },
                { title: 'Responsive Layouts', desc: 'Mobile-first structure with careful typography.' },
                { title: 'Forms & Validation', desc: 'User-friendly interactions and accessible controls.' },
                { title: 'Performance Mindset', desc: 'Avoid unnecessary renders and keep it smooth.' },
              ].map((s) => (
                <div
                  key={s.title}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-white/25 transition-colors"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="text-lg font-semibold text-white">{s.title}</div>
                    <div className="mt-2 text-sm text-white/70">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="projects" className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div>
              <h2 className="text-3xl font-semibold">Projects</h2>
              <p className="mt-2 text-white/70 max-w-2xl">
                A few example projects. Replace names and links with your real work when you&apos;re ready.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {[
                {
                  title: 'Pulse UI Dashboard',
                  desc: 'A sleek dashboard with animated cards, filters, and responsive navigation.',
                  tags: ['React', 'Tailwind', 'UX Motion'],
                },
                {
                  title: 'Landing Page Studio',
                  desc: 'One-page marketing layouts with modular sections and polished typography.',
                  tags: ['UI Systems', 'Accessibility', 'Performance'],
                },
                {
                  title: 'Portfolio Builder',
                  desc: 'Templates + reusable components that let creators ship faster.',
                  tags: ['Components', 'Design Tokens', 'Forms'],
                },
                {
                  title: 'Tech Showcase',
                  desc: 'Interactive tech stack visuals with scroll-reactive highlights.',
                  tags: ['Animations', 'React', 'Tailwind'],
                },
              ].map((p) => (
                <div
                  key={p.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-white/25 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold text-white">{p.title}</div>
                      <div className="mt-2 text-sm text-white/70">{p.desc}</div>
                    </div>
                    <div className="shrink-0 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-xs text-white/70">
                      Featured
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/80"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6">
                    <a
                      href="#contact"
                      className="text-sm font-semibold text-white/90 hover:text-white inline-flex items-center gap-2"
                    >
                      Ask for a demo <span aria-hidden="true">→</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="tech" className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div>
              <h2 className="text-3xl font-semibold">Tech Stack</h2>
              <p className="mt-2 text-white/70 max-w-2xl">
                The tools I use most often to build clean, modern experiences.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {[
                'React',
                'TailwindCSS',
                'TypeScript',
                'Vite',
                'HTML',
                'CSS',
                'JavaScript',
                'Accessibility',
                'UI Design',
              ].map((t, idx) => (
                <span
                  key={t}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/85 hover:bg-white/10 transition-colors"
                  style={{ transform: `translateY(${(idx % 3) * 1}px)` }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
              <div>
                <h2 className="text-3xl font-semibold">Contact us</h2>
                <p className="mt-2 text-white/70 max-w-xl">
                  Want a formal, professional one-pager (with animations that actually look good)? Send a message below.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="mailto:hello@example.com"
                    className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/90 hover:bg-white/10 transition-colors"
                  >
                    Email: hello@example.com
                  </a>
                </div>
              </div>

              <ContactForm />
            </div>

            <div className="mt-12 text-xs text-white/50">
              Replace placeholders (email, project titles) with your real details.
            </div>
          </div>
        </section>

        <footer className="py-10 border-t border-white/10 bg-slate-950/30">
          <div className="mx-auto max-w-6xl px-4 flex items-center justify-center">
            <div className="text-sm text-white/70">© {new Date().getFullYear()} BannDev. All rights reserved.</div>
          </div>
        </footer>
      </main>
    </div>
  )
}

function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sent'>('idle')

  const canSubmit = name.trim().length >= 2 && email.includes('@') && message.trim().length >= 10

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!canSubmit) return
          setStatus('sent')
        }}
        className="space-y-5"
      >
        <div>
          <label className="text-sm font-semibold text-white/90">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm outline-none focus:border-fuchsia-400/50"
            placeholder="BannDev fan (example)"
            required
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-white/90">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm outline-none focus:border-fuchsia-400/50"
            placeholder="you@example.com"
            required
            type="email"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-white/90">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-2 w-full min-h-[120px] rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm outline-none focus:border-fuchsia-400/50"
            placeholder="Tell me what you want to build..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit || status === 'sent'}
          className="w-full rounded-xl bg-white text-slate-950 px-4 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
        >
          {status === 'sent' ? 'Message queued (demo)' : 'Send message'}
        </button>
      </form>
    </div>
  )
}

