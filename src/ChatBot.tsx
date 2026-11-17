import { useEffect, useMemo, useRef, useState } from 'react'

type Role = 'user' | 'bot'
type Msg = { id: string; role: Role; text: string; ts: number }

const LOGO_SRC = `${import.meta.env.BASE_URL}imgs/logo.png`

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function normalize(s: string) {
  return s.trim().toLowerCase()
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]!
}

/**
 * Portfolio-scoped knowledge base.
 * The assistant ONLY answers using the facts below — everything it knows is
 * drawn from this DevBann portfolio. Anything outside this scope is politely
 * declined and redirected back to the portfolio.
 */
const PORTFOLIO = {
  owner: 'DevBann',
  role: 'Backend-leaning engineer focused on data modelling, APIs, and real-time services — from MySQL and PostgreSQL to Supabase and Socket.io.',
  email: 'bannsire@gmail.com',
  whatIDo:
    'DevBann builds the backend behind working products: data models, REST APIs, real-time services, and integrations. Front-end interfaces (React and Tailwind) are assembled with AI coding tools such as Claude and Copilot as a helper, not as the main focus.',
  skills: [
    'Node.js & Express — APIs, routing, middleware, server-side logic',
    'MySQL & PostgreSQL — schema design, queries, and data modelling',
    'Supabase — hosted Postgres, auth, and realtime subscriptions',
    'Real-time services — Socket.io chat and event handling',
    'AI-assisted UI — React/Tailwind interfaces generated with Claude and Copilot',
    'Infra basics — Linux, Docker, Nginx, and Cloudflare Workers',
  ],
  projects: [
    {
      name: 'ATOMS',
      status: 'Live',
      url: 'https://atoms.agridomcorp.com',
      desc: 'A drone spraying operations PWA. Live Supabase data, map-based workflows, and React Query data fetching. The backend handles the data model and queries; the interface was assembled with AI tooling.',
      tags: ['Node.js', 'Supabase', 'Mapbox GL', 'React Query'],
    },
    {
      name: 'BrandSyncSMS',
      status: 'Live',
      url: 'https://sms-290z.onrender.com/',
      desc: 'A field lead capture PWA focused on contact synchronization and offline-ready data workflows. Backend work covers the sync layer and data handling; the UI was generated with AI tools.',
      tags: ['React', 'TypeScript', 'PWA', 'AI-assisted UI'],
    },
    {
      name: 'Aerobot Technical Support',
      status: 'Live',
      url: 'https://techsupport.aerobot.ph/',
      desc: 'A service operations portal for drone systems: ticket workflows, digital signatures, PDF reporting, and data-backed analytics on a Supabase backend.',
      tags: ['Supabase', 'PDF export', 'Recharts', 'React'],
    },
    {
      name: 'SF Talk',
      status: 'Local Production',
      url: null,
      desc: 'A self-hosted messaging platform with an Express.js + MySQL backend and a React/Vite frontend. Real-time messaging over Socket.io, auth, search, and user administration.',
      tags: ['Express.js', 'MySQL', 'Socket.io', 'React'],
    },
  ],
  tech: {
    Languages: ['TypeScript', 'JavaScript', 'SQL', 'PHP'],
    Databases: ['MySQL', 'PostgreSQL', 'Supabase', 'SQLite'],
    Backend: ['Node.js', 'Express', 'REST APIs', 'Socket.io'],
    Tools: ['Git', 'Linux', 'Docker', 'Nginx', 'Cloudflare Workers'],
    'AI-assisted UI': ['React', 'TailwindCSS', 'Vite', 'Claude / Copilot', 'PWA'],
  },
} as const

function listProjects() {
  return PORTFOLIO.projects
    .map((p) => `• ${p.name} (${p.status})${p.url ? ` — ${p.url}` : ''}`)
    .join('\n')
}

function listTech() {
  return (Object.keys(PORTFOLIO.tech) as (keyof typeof PORTFOLIO.tech)[])
    .map((group) => `${group}: ${PORTFOLIO.tech[group].join(', ')}`)
    .join('\n')
}

/**
 * Answers strictly from the portfolio knowledge base above.
 * Off-topic questions are declined and redirected.
 */
function answerFor(inputRaw: string) {
  const input = normalize(inputRaw)
  const containsAny = (words: string[]) => words.some((w) => input.includes(w))
  const words = input.split(/[^a-z0-9]+/).filter(Boolean)
  const hasWord = (targets: string[]) => targets.some((t) => words.includes(t))

  if (!input) return 'Ask me anything about DevBann’s portfolio — skills, projects, tech stack, or contact.'

  if (hasWord(['hello', 'hi', 'hey', 'yo', 'sup', 'hiya'])) {
    return pick([
      'Hi! I can tell you about DevBann’s skills, projects, tech stack, or how to get in touch. What would you like to know?',
      'Hey! Ask me about the projects, skills, tech stack, or contact details in this portfolio.',
    ])
  }

  if (containsAny(['who', 'about', 'devbann', 'yourself', 'bio'])) {
    return `${PORTFOLIO.owner} — ${PORTFOLIO.role}`
  }

  if (containsAny(['what do you do', 'what does', 'services', 'offer', 'help with'])) {
    return PORTFOLIO.whatIDo
  }

  if (containsAny(['contact', 'email', 'reach', 'hire', 'message', 'mail', 'talk'])) {
    return `You can reach DevBann at ${PORTFOLIO.email}, or use the Contact section’s form (it sends the message straight to DevBann).`
  }

  // Specific project lookups
  if (containsAny(['atoms', 'drone spray', 'spraying'])) {
    const p = PORTFOLIO.projects.find((item) => item.name === 'ATOMS')!
    return `${p.name} (${p.status}): ${p.desc}\nBuilt with: ${p.tags.join(', ')}.${p.url ? `\nLive: ${p.url}` : ''}`
  }
  if (containsAny(['brandsync', 'sms', 'lead capture', 'brandsyncsms'])) {
    const p = PORTFOLIO.projects.find((item) => item.name === 'BrandSyncSMS')!
    return `${p.name} (${p.status}): ${p.desc}\nBuilt with: ${p.tags.join(', ')}.${p.url ? `\nLive: ${p.url}` : ''}`
  }
  if (containsAny(['aerobot', 'techsupport', 'tech support', 'support portal'])) {
    const p = PORTFOLIO.projects.find((item) => item.name === 'Aerobot Technical Support')!
    return `${p.name} (${p.status}): ${p.desc}\nBuilt with: ${p.tags.join(', ')}.${p.url ? `\nLive: ${p.url}` : ''}`
  }
  if (containsAny(['sf talk', 'messaging', 'chat app', 'socket'])) {
    const p = PORTFOLIO.projects.find((item) => item.name === 'SF Talk')!
    return `${p.name} (${p.status}): ${p.desc}\nBuilt with: ${p.tags.join(', ')}.`
  }

  if (containsAny(['project', 'projects', 'work', 'portfolio', 'built', 'apps'])) {
    return `Here are DevBann’s featured projects:\n${listProjects()}\n\nAsk about any one by name for details.`
  }

  if (containsAny(['skill', 'skills', 'good at', 'strength', 'expertise'])) {
    return `DevBann’s core skills:\n${PORTFOLIO.skills.map((s) => `• ${s}`).join('\n')}`
  }

  if (containsAny(['tech', 'stack', 'tools', 'framework', 'frameworks', 'database', 'databases', 'language', 'languages'])) {
    return `DevBann’s tech stack:\n${listTech()}`
  }

  if (containsAny(['react', 'tailwind', 'vite', 'typescript', 'javascript', 'php', 'mysql', 'postgres', 'mongodb', 'docker', 'nginx', 'wordpress', 'elementor'])) {
    return `Yes — that’s part of DevBann’s toolkit. Full stack:\n${listTech()}`
  }

  // Anything outside the portfolio scope is declined.
  return pick([
    'I can only answer questions about DevBann’s portfolio — try asking about skills, projects, tech stack, or contact.',
    'That’s outside what I know. I’m here just for this portfolio: ask me about DevBann’s projects, skills, tech stack, or contact info.',
  ])
}

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const initial = useMemo<Msg[]>(
    () => [
      {
        id: uid(),
        role: 'bot',
        text: 'Hi, I’m DevBann’s portfolio helper. I can answer questions about the projects, skills, tech stack, and contact details on this site.',
        ts: Date.now(),
      },
    ],
    [],
  )

  const [msgs, setMsgs] = useState<Msg[]>(initial)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [open, msgs.length])

  const send = (text: string) => {
    const cleaned = text.trim()
    if (!cleaned) return
    const userMsg: Msg = { id: uid(), role: 'user', text: cleaned, ts: Date.now() }
    setMsgs((m) => [...m, userMsg])
    setDraft('')

    setSending(true)
    // Small delay for a natural "thinking" feel; answer comes only from the
    // portfolio knowledge base.
    window.setTimeout(() => {
      const reply = answerFor(cleaned)
      const botMsg: Msg = { id: uid(), role: 'bot', text: reply, ts: Date.now() + 1 }
      setMsgs((m) => [...m, botMsg])
      setSending(false)
    }, 350)
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60]">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 py-2 pl-2 pr-4 text-sm font-semibold text-white shadow-lg backdrop-blur transition-colors hover:bg-white/15"
        >
          <img
            src={LOGO_SRC}
            alt=""
            aria-hidden="true"
            className="h-8 w-8 rounded-full border border-white/15 bg-slate-900/60 object-contain"
          />
          Need help?
        </button>
      ) : (
        <div className="w-[min(92vw,380px)] overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <img
                src={LOGO_SRC}
                alt="DevBann helper"
                className="h-9 w-9 rounded-full border border-white/15 bg-slate-900/60 object-contain"
              />
              <div>
                <div className="text-sm font-semibold text-white/90">DevBann Helper</div>
                <div className="text-xs text-white/60">Portfolio assistant</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 transition-colors"
            >
              Close
            </button>
          </div>

          <div ref={listRef} className="max-h-[52vh] overflow-auto px-4 py-3 space-y-2">
            {msgs.map((m) => (
              <div key={m.id} className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'bot' ? (
                  <img
                    src={LOGO_SRC}
                    alt=""
                    aria-hidden="true"
                    className="h-7 w-7 shrink-0 rounded-full border border-white/10 bg-slate-900/60 object-contain"
                  />
                ) : null}
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm leading-snug ${
                    m.role === 'user'
                      ? 'bg-white text-slate-950'
                      : 'border border-white/10 bg-white/5 text-white/85'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {sending ? (
              <div className="flex items-end gap-2 justify-start">
                <img
                  src={LOGO_SRC}
                  alt=""
                  aria-hidden="true"
                  className="h-7 w-7 shrink-0 rounded-full border border-white/10 bg-slate-900/60 object-contain"
                />
                <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-snug border border-white/10 bg-white/5 text-white/70">
                  Thinking...
                </div>
              </div>
            ) : null}
          </div>

          <form
            className="border-t border-white/10 p-3"
            onSubmit={(e) => {
              e.preventDefault()
              send(draft)
            }}
          >
            <div className="flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask about projects, skills, tech..."
                className="flex-1 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-accent/50"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
              >
                {sending ? '...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
