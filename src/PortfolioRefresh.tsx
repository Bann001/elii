import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'
import ChatBot from './ChatBot'
import { BuildSection } from './SwarmBuild'

const LOGO_SRC = `${import.meta.env.BASE_URL}imgs/logo.png`
const SECTION_IDS = ['home', 'about', 'skills', 'projects', 'contact'] as const

const CONTACT_EMAIL = 'bannsire@gmail.com'

// Opens Gmail's compose window with the recipient already filled in.
const composeUrl = (to: string) =>
  `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent('Portfolio enquiry')}`

type ProjectGroup = 'Operations' | 'Field tools' | 'Communication'
type Project = {
  name: string
  group: ProjectGroup
  description: string
  details: string[]
  stack: string[]
  image?: string
  url?: string
  status?: string
}

const baseUrl = import.meta.env.BASE_URL

const projects: Project[] = [
  {
    name: 'ATOMS',
    group: 'Operations',
    description: 'A PWA for drone spraying operations. Handles live Supabase data, map-based workflows, and React Query data fetching, with the UI assembled from AI-assisted component patterns.',
    details: ['Live Supabase data', 'Map-based operations', 'React Query data fetching'],
    stack: ['React', 'TypeScript', 'Supabase', 'Mapbox GL'],
    image: `${baseUrl}imgs/projects/atoms.jpg`,
    url: 'https://atoms.agridomcorp.com',
  },
  {
    name: 'BrandSyncSMS',
    group: 'Field tools',
    description: 'A mobile-friendly PWA for field lead capture and marketing. Focused on contact synchronization and offline-ready data workflows, with the interface generated using AI tooling.',
    details: ['Mobile contact capture', 'Offline-ready workflows', 'Contact synchronization'],
    stack: ['React', 'TypeScript', 'PWA', 'Tailwind'],
    image: `${baseUrl}imgs/projects/brandsyncsms.jpg`,
    url: 'https://sms-290z.onrender.com/',
  },
  {
    name: 'Aerobot Technical Support',
    group: 'Operations',
    description: 'A technical support portal for drone systems. Builds service workflows, digital signatures, and PDF reporting with data-backed analytics.',
    details: ['Service tickets', 'Digital signatures', 'PDF reports and analytics'],
    stack: ['React', 'TypeScript', 'Supabase', 'Recharts'],
    image: `${baseUrl}imgs/projects/aerobot.jpg`,
    url: 'https://techsupport.aerobot.ph/',
  },
  {
    name: 'SF Talk',
    group: 'Communication',
    description: 'A self-hosted messaging platform with real-time chat and search, backed by Express.js, MySQL, and Socket.io, plus user administration.',
    details: ['Real-time messaging', 'User administration', 'Search'],
    stack: ['React', 'Express.js', 'MySQL', 'Socket.io'],
    image: `${baseUrl}imgs/projects/sftalk.jpg`,
    status: 'Local production',
  },
]

const filters = ['All work', 'Operations', 'Field tools', 'Communication'] as const
const skillGroups = [
  { title: 'Backend & data', items: ['Node.js', 'Express', 'MySQL', 'PostgreSQL', 'Supabase', 'REST APIs', 'Redis'] },
  { title: 'Realtime & integrations', items: ['Socket.io', 'Mapbox GL', 'Stripe', 'Cloudflare Workers'] },
  { title: 'Languages & platforms', items: ['TypeScript', 'JavaScript', 'SQL', 'Linux', 'Docker', 'Nginx'] },
  { title: 'AI-assisted UI', items: ['React', 'Tailwind', 'Vite', 'Claude / Copilot', 'PWA'] },
]

type AmbientKind = 'planet' | 'ring' | 'glass' | 'cube' | 'orb' | 'spark'
type AmbientObject = {
  kind: AmbientKind
  x: string
  y: string
  size: string
  depth: number
  scrollf: number
  dur: string
  delay: string
  drift: 'a' | 'b' | 'c'
}

// Fixed positions around the hero, layered at different depths so the
// pointer/scroll parallax creates a sense of three-dimensional space.
const AMBIENT_OBJECTS: AmbientObject[] = [
  { kind: 'planet', x: '92%', y: '40%', size: '120px', depth: 34, scrollf: -0.06, dur: '13s', delay: '-2s', drift: 'a' },
  { kind: 'ring', x: '82%', y: '66%', size: '220px', depth: 26, scrollf: -0.045, dur: '17s', delay: '-6s', drift: 'b' },
  { kind: 'glass', x: '60%', y: '70%', size: '130px', depth: 18, scrollf: -0.03, dur: '11s', delay: '-4s', drift: 'c' },
  { kind: 'cube', x: '71%', y: '6%', size: '60px', depth: 30, scrollf: -0.05, dur: '9s', delay: '-1s', drift: 'a' },
  { kind: 'orb', x: '62%', y: '30%', size: '40px', depth: 22, scrollf: -0.035, dur: '10s', delay: '-5s', drift: 'b' },
  { kind: 'spark', x: '47%', y: '74%', size: '10px', depth: 40, scrollf: -0.08, dur: '8s', delay: '-3s', drift: 'c' },
  { kind: 'spark', x: '93%', y: '80%', size: '7px', depth: 46, scrollf: -0.09, dur: '7s', delay: '-2s', drift: 'a' },
]

// Writes normalized pointer position and scroll offset to CSS custom
// properties once per frame so the scene can react without re-rendering React.
function useAmbientMotion(rootRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = rootRef.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    let px = 0
    let py = 0
    let scroll = 0

    const flush = () => {
      frame = 0
      el.style.setProperty('--px', px.toFixed(3))
      el.style.setProperty('--py', py.toFixed(3))
      el.style.setProperty('--scroll', `${Math.round(scroll)}px`)
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(flush)
    }
    const onPointer = (event: PointerEvent) => {
      px = (event.clientX / window.innerWidth) * 2 - 1
      py = (event.clientY / window.innerHeight) * 2 - 1
      schedule()
    }
    const onScroll = () => {
      scroll = window.scrollY
      schedule()
    }

    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    flush()

    return () => {
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [rootRef])
}

function FloatingScene() {
  return (
    <div className="pr-scene" aria-hidden="true">
      {AMBIENT_OBJECTS.map((object, index) => (
        <div
          key={index}
          className="pr-float"
          style={
            {
              '--x': object.x,
              '--y': object.y,
              '--size': object.size,
              '--depth': `${object.depth}px`,
              '--scrollf': object.scrollf,
              '--dur': object.dur,
              '--delay': object.delay,
            } as CSSProperties
          }
        >
          <div className={`pr-drift pr-drift--${object.drift}`}>
            {object.kind === 'ring' ? (
              <div className="pr-shape pr-shape--ring"><div className="pr-ring" /></div>
            ) : (
              <div className={`pr-shape pr-shape--${object.kind}`} />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="pr-arrow"><path d="M4 10h11m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function ExternalIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="pr-external"><path d="M11 4h5v5M16 4 9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 11v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}

export default function PortfolioRefresh() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('All work')
  const [menuOpen, setMenuOpen] = useState(false)
  const [replayKey, setReplayKey] = useState(0)
  const [tourActive, setTourActive] = useState(false)
  const [tourIndex, setTourIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const tourActiveRef = useRef(false)
  const advanceTimer = useRef(0)
  useAmbientMotion(rootRef)

  useEffect(() => {
    tourActiveRef.current = tourActive
  }, [tourActive])

  useEffect(() => () => window.clearTimeout(advanceTimer.current), [])

  const stopTour = () => {
    window.clearTimeout(advanceTimer.current)
    setTourActive(false)
  }

  const startTour = () => {
    window.clearTimeout(advanceTimer.current)
    setTourActive(true)
    setTourIndex(0)
    setReplayKey((key) => key + 1)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  const handleBuilt = (index: number) => {
    if (!tourActiveRef.current) return
    if (index >= SECTION_IDS.length - 1) {
      setTourActive(false)
      return
    }
    const next = index + 1
    // Let the finished section settle before gliding to the next one.
    window.clearTimeout(advanceTimer.current)
    advanceTimer.current = window.setTimeout(() => {
      if (!tourActiveRef.current) return
      document.getElementById(SECTION_IDS[next])?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setTourIndex(next)
    }, 700)
  }

  // Any deliberate user input ends the tour and hands control back.
  useEffect(() => {
    if (!tourActive) return
    const cancel = () => {
      window.clearTimeout(advanceTimer.current)
      setTourActive(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancel()
    }
    window.addEventListener('wheel', cancel, { passive: true })
    window.addEventListener('touchstart', cancel, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', cancel)
      window.removeEventListener('touchstart', cancel)
      window.removeEventListener('keydown', onKey)
    }
  }, [tourActive])

  const visibleProjects = useMemo(
    () => filter === 'All work' ? projects : projects.filter((project) => project.group === filter),
    [filter],
  )

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="portfolio-refresh" ref={rootRef}>
      <div className="pr-cursor-glow" aria-hidden="true" />
      <a className="pr-skip" href="#main">Skip to content</a>
      <header className="pr-header">
        <div className="pr-nav-wrap">
          <a className="pr-brand" href="#home" onClick={closeMenu} aria-label="DevBann home">
            <span className="pr-brand-mark"><img className="pr-brand-logo" src={LOGO_SRC} alt="" /></span>
            <span>DevBann<span className="pr-brand-dot">/</span></span>
          </a>
          <button
            type="button"
            className="pr-menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span /><span />
          </button>
          <nav id="primary-navigation" className={`pr-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
            <a href="#about" onClick={closeMenu}>About</a>
            <a href="#skills" onClick={closeMenu}>Skills</a>
            <a href="#projects" onClick={closeMenu}>Projects</a>
            <a className="pr-nav-cta" href="#contact" onClick={closeMenu}>Get in touch <ArrowIcon /></a>
          </nav>
        </div>
      </header>

      <main id="main">
        <BuildSection id="home" className="pr-hero" ariaLabelledBy="hero-title" replayKey={replayKey} index={0} tourActive={tourActive} tourIndex={tourIndex} onBuilt={handleBuilt}>
          <FloatingScene />
          <div className="pr-hero-grid" aria-hidden="true" />
          <div className="pr-shell pr-hero-content">
            <p className="pr-kicker"><span className="pr-kicker-line" /> Portfolio · Backend & full-stack engineer</p>
            <h1 id="hero-title">Reliable backends.<br /><span>Interfaces built with AI.</span></h1>
            <div className="pr-hero-bottom">
              <p className="pr-hero-copy">Backend-focused engineer working with Node.js, SQL, and real-time services. I handle the data, APIs, and infrastructure, and use AI tools to build the interfaces that go on top.</p>
              <div className="pr-hero-actions">
                <a className="pr-button pr-button-primary" href="#projects">Explore selected work <ArrowIcon /></a>
                <a className="pr-button pr-button-quiet" href={composeUrl(CONTACT_EMAIL)} target="_blank" rel="noopener noreferrer">Contact me</a>
              </div>
            </div>
            <div className="pr-hero-index"><span>01 — 04</span><span>APIs · databases · real-time services</span></div>
          </div>
          <div className="pr-hero-mascot" aria-hidden="true">
            <div className="pr-mascot-halo" />
            <span className="pr-mascot-satellite pr-mascot-satellite--1" />
            <span className="pr-mascot-satellite pr-mascot-satellite--2" />
            <img className="pr-mascot-img" src={LOGO_SRC} alt="" />
          </div>
        </BuildSection>

        <BuildSection id="about" className="pr-section pr-about" ariaLabelledBy="about-title" replayKey={replayKey} index={1} tourActive={tourActive} tourIndex={tourIndex} onBuilt={handleBuilt}>
          <div className="pr-shell">
            <div className="pr-section-heading">
              <p className="pr-eyebrow">01 / About</p>
              <h2 id="about-title">I work where<br />the data lives.</h2>
            </div>
            <div className="pr-about-content">
              <p className="pr-about-lead">I’m a backend-leaning engineer. Most of my work is designing data models, building APIs, wiring up real-time services, and keeping production systems running.</p>
              <p className="pr-body-copy">Across these projects I’ve worked with Node.js, Express, MySQL, PostgreSQL, and Supabase, plus Socket.io for real-time messaging and map integrations. I ship the backend first, then use AI coding tools to assemble the front-end interfaces — React and Tailwind components generated and refined with Claude and Copilot rather than hand-built. The front-end is a tool I use well; the back-end is where I focus.</p>
              <div className="pr-about-tags" aria-label="Areas represented in my projects">
                <span>REST APIs</span><span>MySQL / PostgreSQL</span><span>Supabase</span><span>Real-time chat</span><span>Node.js</span>
              </div>
              <a className="pr-text-link" href="#projects">See the projects <ArrowIcon /></a>
            </div>
          </div>
        </BuildSection>

        <BuildSection id="skills" className="pr-section pr-skills" ariaLabelledBy="skills-title" replayKey={replayKey} index={2} tourActive={tourActive} tourIndex={tourIndex} onBuilt={handleBuilt}>
          <div className="pr-shell">
            <div className="pr-section-heading pr-heading-row">
              <div><p className="pr-eyebrow">02 / Skills</p><h2 id="skills-title">What I bring<br />to a backend role.</h2></div>
              <p className="pr-heading-note">Grouped by how the tools show up in the work—not by a rating or proficiency claim. UI tooling is included because I use it, not because it is my focus.</p>
            </div>
            <div className="pr-skill-grid">
              {skillGroups.map((group, index) => (
                <article className="pr-skill-card" key={group.title}>
                  <span className="pr-card-index">0{index + 1}</span>
                  <h3>{group.title}</h3>
                  <ul>{group.items.map((skill) => <li key={skill}>{skill}</li>)}</ul>
                </article>
              ))}
            </div>
          </div>
        </BuildSection>

        <BuildSection id="projects" className="pr-section pr-projects" ariaLabelledBy="projects-title" replayKey={replayKey} index={3} tourActive={tourActive} tourIndex={tourIndex} onBuilt={handleBuilt}>
          <div className="pr-shell">
            <div className="pr-section-heading pr-heading-row">
              <div><p className="pr-eyebrow">03 / Selected work</p><h2 id="projects-title">Systems I built.<br />Interfaces I generated.</h2></div>
              <p className="pr-heading-note">Each project is a working system with real data behind it. The UI was built with AI coding tools; the backend, data model, and integrations are mine.</p>
            </div>

            <div className="pr-filter-bar" role="group" aria-label="Filter projects">
              {filters.map((item) => (
                <button key={item} type="button" className={filter === item ? 'is-active' : ''} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>
              ))}
              <span className="pr-result-count" aria-live="polite">{visibleProjects.length} {visibleProjects.length === 1 ? 'project' : 'projects'}</span>
            </div>

            <div className="pr-project-grid" aria-live="polite">
              {visibleProjects.map((project, index) => (
                <article className={`pr-project-card ${index === 0 && filter === 'All work' ? 'pr-project-featured' : ''}`} key={project.name}>
                  <div className="pr-project-topline"><span>{project.group}</span><span>{project.url ? 'LIVE' : project.status}</span></div>
                  <div className="pr-project-visual">
                    <div className="pr-visual-window">
                      <div className="pr-window-controls"><i /><i /><i /></div>
                      {project.image ? (
                        <div className="pr-visual-screen">
                          <img src={project.image} alt={`${project.name} interface preview`} loading="lazy" />
                        </div>
                      ) : (
                        <div className="pr-visual-layout"><div className="pr-visual-sidebar" /><div className="pr-visual-main"><i /><i /><i /><i /></div></div>
                      )}
                    </div>
                    <span className="pr-visual-number">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="pr-project-copy">
                    <h3>{project.name}</h3>
                    <p>{project.description}</p>
                    <ul className="pr-project-details">{project.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
                    <div className="pr-project-stack" aria-label={`${project.name} technology stack`}>{project.stack.map((item) => <span key={item}>{item}</span>)}</div>
                    <div className="pr-project-link-row">
                      {project.url ? <a href={project.url} target="_blank" rel="noopener noreferrer">Visit live project <ExternalIcon /></a> : <span className="pr-private-note">Production project · no public demo</span>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </BuildSection>

        <BuildSection id="contact" className="pr-section pr-contact" ariaLabelledBy="contact-title" replayKey={replayKey} index={4} tourActive={tourActive} tourIndex={tourIndex} onBuilt={handleBuilt}>
          <div className="pr-shell pr-contact-panel">
            <div><p className="pr-eyebrow">04 / Contact</p><h2 id="contact-title">Hiring for a<br />backend role?</h2><p className="pr-contact-copy">Click the email below and Gmail opens with the recipient already filled in — just write and send.</p></div>
            <div className="pr-contact-actions">
              <a
                className="pr-button pr-button-primary"
                href={composeUrl(CONTACT_EMAIL)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Email DevBann <ArrowIcon />
              </a>
              <a className="pr-button pr-button-outline" href="https://github.com/Bann001" target="_blank" rel="noopener noreferrer">GitHub <ExternalIcon /></a>
              <a className="pr-email-address" href={composeUrl(CONTACT_EMAIL)} target="_blank" rel="noopener noreferrer">{CONTACT_EMAIL}</a>
            </div>
          </div>
        </BuildSection>
      </main>

      {tourActive ? (
        <div className="pr-tour-bar" role="status" aria-live="polite">
          <span className="pr-tour-bar__pulse" />
          <strong>AUTO TOUR</strong>
          <span>{tourIndex + 1} / {SECTION_IDS.length} · {SECTION_IDS[tourIndex]}</span>
          <span className="pr-tour-bar__hint">scroll or Esc to stop</span>
          <button type="button" onClick={stopTour}>Stop</button>
        </div>
      ) : null}

      <div className="pr-build-controls">
        <button
          type="button"
          className="pr-build-tour"
          onClick={startTour}
          aria-label="Play the auto-scrolling swarm build tour"
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M6 4.5l9 5.5-9 5.5v-11z" fill="currentColor" />
          </svg>
          Auto tour
        </button>
        <button
          type="button"
          className="pr-build-replay"
          onClick={() => {
            stopTour()
            setReplayKey((key) => key + 1)
          }}
          aria-label="Replay the swarm build animation"
          title="Replay build"
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M16.5 10a6.5 6.5 0 1 1-1.9-4.6M16.5 3.5V7H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Replay
        </button>
      </div>

      <footer className="pr-footer"><div className="pr-shell"><a className="pr-brand" href="#home"><span className="pr-brand-mark"><img className="pr-brand-logo" src={LOGO_SRC} alt="" /></span><span>DevBann<span className="pr-brand-dot">/</span></span></a><span>Built with React, TypeScript & care.</span><a href="#home">Back to top ↑</a></div></footer>
      <ChatBot />
    </div>
  )
}
