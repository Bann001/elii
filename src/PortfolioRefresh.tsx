import { useMemo, useState } from 'react'
import ChatBot from './ChatBot'

type ProjectGroup = 'Operations' | 'Field tools' | 'Communication'
type Project = {
  name: string
  group: ProjectGroup
  description: string
  details: string[]
  stack: string[]
  url?: string
  status?: string
}

const projects: Project[] = [
  {
    name: 'ATOMS',
    group: 'Operations',
    description: 'A PWA for drone spraying operations, bringing field data and map-based workflows into one tool.',
    details: ['Live Supabase data', 'Map-based operations', 'React Query data fetching'],
    stack: ['React', 'TypeScript', 'Supabase', 'Mapbox GL'],
    url: 'https://atoms.agridomcorp.com',
  },
  {
    name: 'Aerobot Technical Support',
    group: 'Operations',
    description: 'A technical support portal for drone systems with service workflows and reporting tools.',
    details: ['Service tickets', 'Digital signatures', 'PDF reports and analytics'],
    stack: ['React', 'TypeScript', 'Supabase', 'Recharts'],
    url: 'https://techsupport.aerobot.ph/',
  },
  {
    name: 'Sticker Generator',
    group: 'Field tools',
    description: 'A browser-based tool for creating custom product labels and drone sticker sheets for print.',
    details: ['Custom product information', 'Logo and QR code support', 'Print-ready PDF output'],
    stack: ['React', 'Canvas', 'PDF export', 'QR codes'],
    url: 'https://bann001.github.io/hr-sticker',
  },
  {
    name: 'BrandSyncSMS',
    group: 'Field tools',
    description: 'A mobile-friendly PWA for field lead capture and marketing workflows.',
    details: ['Mobile contact capture', 'Offline-ready workflows', 'Contact synchronization'],
    stack: ['React', 'TypeScript', 'PWA', 'Tailwind'],
    url: 'https://sms-290z.onrender.com/',
  },
  {
    name: 'SF Talk',
    group: 'Communication',
    description: 'A self-hosted company messaging platform with real-time chat and search.',
    details: ['Real-time messaging', 'User administration', 'Search'],
    stack: ['React', 'Express.js', 'MySQL', 'Socket.io'],
    status: 'Local production',
  },
]

const filters = ['All work', 'Operations', 'Field tools', 'Communication'] as const
const skillGroups = [
  { title: 'Interface development', items: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'TailwindCSS'] },
  { title: 'Data & services', items: ['Supabase', 'MySQL', 'PostgreSQL', 'SQLite', 'MongoDB'] },
  { title: 'Mapping & reporting', items: ['Mapbox GL', 'Canvas', 'PDF export', 'Recharts'] },
  { title: 'Platforms & tools', items: ['Vite', 'PWA', 'Git', 'Linux', 'Docker', 'Nginx'] },
]

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="pr-arrow"><path d="M4 10h11m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function ExternalIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="pr-external"><path d="M11 4h5v5M16 4 9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 11v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}

export default function PortfolioRefresh() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('All work')
  const [menuOpen, setMenuOpen] = useState(false)
  const visibleProjects = useMemo(
    () => filter === 'All work' ? projects : projects.filter((project) => project.group === filter),
    [filter],
  )

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="portfolio-refresh">
      <a className="pr-skip" href="#main">Skip to content</a>
      <header className="pr-header">
        <div className="pr-nav-wrap">
          <a className="pr-brand" href="#home" onClick={closeMenu} aria-label="DevBann home">
            <span className="pr-brand-mark">B<span>.</span></span>
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
        <section className="pr-hero" id="home" aria-labelledby="hero-title">
          <div className="pr-hero-grid" aria-hidden="true" />
          <div className="pr-shell pr-hero-content">
            <p className="pr-kicker"><span className="pr-kicker-line" /> Portfolio · Front-end & product UI</p>
            <h1 id="hero-title">Thoughtful interfaces.<br /><span>Useful software.</span></h1>
            <div className="pr-hero-bottom">
              <p className="pr-hero-copy">I build web applications and interfaces with React, TypeScript, and a focus on practical workflows.</p>
              <div className="pr-hero-actions">
                <a className="pr-button pr-button-primary" href="#projects">Explore selected work <ArrowIcon /></a>
                <a className="pr-button pr-button-quiet" href={`mailto:bannsire@gmail.com`}>Contact me</a>
              </div>
            </div>
            <div className="pr-hero-index"><span>01 — 05</span><span>Product interfaces / web applications</span></div>
          </div>
          <div className="pr-hero-orb" aria-hidden="true"><div className="pr-orb-inner">B<span>.</span></div></div>
        </section>

        <section className="pr-section pr-about" id="about" aria-labelledby="about-title">
          <div className="pr-shell">
            <div className="pr-section-heading">
              <p className="pr-eyebrow">01 / About</p>
              <h2 id="about-title">The work is where<br />my story starts.</h2>
            </div>
            <div className="pr-about-content">
              <p className="pr-about-lead">My portfolio brings together web apps for operations, field teams, support workflows, print tools, and internal communication.</p>
              <p className="pr-body-copy">Across these projects, I’ve used React and TypeScript to build interfaces, connected products to services such as Supabase and MySQL, and worked with tools including Mapbox GL, Socket.io, Canvas, and PDF export. The common thread is building practical software with a clear interface.</p>
              <div className="pr-about-tags" aria-label="Areas represented in my projects">
                <span>Operations dashboards</span><span>PWAs</span><span>Field workflows</span><span>Support tools</span><span>Real-time apps</span>
              </div>
              <a className="pr-text-link" href="#projects">See the projects <ArrowIcon /></a>
            </div>
          </div>
        </section>

        <section className="pr-section pr-skills" id="skills" aria-labelledby="skills-title">
          <div className="pr-shell">
            <div className="pr-section-heading pr-heading-row">
              <div><p className="pr-eyebrow">02 / Skills</p><h2 id="skills-title">A practical toolkit,<br />used in real projects.</h2></div>
              <p className="pr-heading-note">Grouped by how the tools show up in the work—not by a rating or proficiency claim.</p>
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
        </section>

        <section className="pr-section pr-projects" id="projects" aria-labelledby="projects-title">
          <div className="pr-shell">
            <div className="pr-section-heading pr-heading-row">
              <div><p className="pr-eyebrow">03 / Selected work</p><h2 id="projects-title">Different problems.<br />Useful, working products.</h2></div>
              <p className="pr-heading-note">A selection of live applications and production tools. Open a live project to explore it.</p>
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
                  <div className="pr-project-visual" aria-hidden="true">
                    <div className="pr-visual-window"><div className="pr-window-controls"><i /><i /><i /></div><div className="pr-visual-layout"><div className="pr-visual-sidebar"/><div className="pr-visual-main"><i/><i/><i/><i/></div></div></div>
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
        </section>

        <section className="pr-section pr-contact" id="contact" aria-labelledby="contact-title">
          <div className="pr-shell pr-contact-panel">
            <div><p className="pr-eyebrow">04 / Contact</p><h2 id="contact-title">Have a project<br />in mind?</h2><p className="pr-contact-copy">Get in touch by email or explore the code and projects on GitHub.</p></div>
            <div className="pr-contact-actions">
              <a className="pr-button pr-button-primary" href="mailto:bannsire@gmail.com">Email DevBann <ArrowIcon /></a>
              <a className="pr-button pr-button-outline" href="https://github.com/Bann001" target="_blank" rel="noopener noreferrer">GitHub <ExternalIcon /></a>
              <span className="pr-email-address">bannsire@gmail.com</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="pr-footer"><div className="pr-shell"><a className="pr-brand" href="#home"><span className="pr-brand-mark">B<span>.</span></span><span>DevBann<span className="pr-brand-dot">/</span></span></a><span>Built with React, TypeScript & care.</span><a href="#home">Back to top ↑</a></div></footer>
      <ChatBot />
    </div>
  )
}
