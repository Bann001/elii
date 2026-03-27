import { useEffect, useMemo, useRef, useState } from 'react'

type Role = 'user' | 'bot'
type Msg = { id: string; role: Role; text: string; ts: number }

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function normalize(s: string) {
  return s.trim().toLowerCase()
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function answerFor(inputRaw: string) {
  const input = normalize(inputRaw)

  const containsAny = (words: string[]) => words.some((w) => input.includes(w))

  if (!input) return 'Type a question and I’ll help.'

  if (containsAny(['hello', 'hi', 'hey', 'yo'])) {
    return pick([
      'Hi! What do you want to know—projects, skills, tech stack, or contact?',
      'Hey! Ask me anything about this portfolio or how to contact DevBann.',
    ])
  }

  if (containsAny(['contact', 'email', 'message', 'mail'])) {
    return 'Use the Contact section to send a message—submissions go through Formspree and reach DevBann automatically.'
  }

  if (containsAny(['project', 'projects', 'work'])) {
    return 'Check the Projects section for featured work. If you want something specific, describe your idea and I’ll suggest a project style to match.'
  }

  if (containsAny(['skills', 'skill'])) {
    return 'Open the Skills section for strengths like React components, Tailwind styling, UI motion, and performance mindset.'
  }

  if (containsAny(['tech', 'stack', 'tools', 'framework', 'database', 'language'])) {
    return 'Tech Stack is grouped into Programming Languages, Databases, Tools, and Frameworks—scroll to that section to see the full list.'
  }

  if (containsAny(['deploy', 'github', 'pages', 'live', 'host'])) {
    return 'To update the live site: commit + push to master, then wait for the GitHub Pages deploy workflow to finish in the Actions tab.'
  }

  if (containsAny(['price', 'cost', 'free'])) {
    return 'This portfolio is built to run for free on GitHub Pages. No paid hosting required.'
  }

  return pick([
    "I can help with navigation, contact, tech stack, or deployment. What are you trying to do?",
    "Tell me what you want to change or ask, and I’ll guide you.",
  ])
}

async function askCloudflareAI(question: string) {
  const endpoint = import.meta.env.VITE_CHAT_API_URL as string | undefined
  if (!endpoint) return null

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })

  if (!res.ok) throw new Error(`AI request failed: ${res.status}`)

  const data = (await res.json()) as { answer?: string }
  return data.answer?.trim() || null
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
        text: 'Hi, I’m the DevBann helper. Ask me anything about this portfolio.',
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

  const send = async (text: string) => {
    const cleaned = text.trim()
    if (!cleaned) return
    const userMsg: Msg = { id: uid(), role: 'user', text: cleaned, ts: Date.now() }
    setMsgs((m) => [...m, userMsg])
    setDraft('')

    setSending(true)
    try {
      const aiAnswer = await askCloudflareAI(cleaned)
      const reply = aiAnswer || answerFor(cleaned)
      const botMsg: Msg = { id: uid(), role: 'bot', text: reply, ts: Date.now() + 1 }
      setMsgs((m) => [...m, botMsg])
    } catch {
      const botMsg: Msg = {
        id: uid(),
        role: 'bot',
        text: `${answerFor(cleaned)} (Using fallback mode right now.)`,
        ts: Date.now() + 1,
      }
      setMsgs((m) => [...m, botMsg])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60]">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full border border-white/10 bg-white/10 backdrop-blur px-4 py-3 text-sm font-semibold text-white hover:bg-white/15 transition-colors shadow-lg"
        >
          Need help?
        </button>
      ) : (
        <div className="w-[min(92vw,380px)] overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-white/90">DevBann Helper</div>
              <div className="text-xs text-white/60">
                {import.meta.env.VITE_CHAT_API_URL ? 'AI mode' : 'Fallback mode (set VITE_CHAT_API_URL)'}
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
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-snug ${
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
              <div className="flex justify-start">
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
                placeholder="Ask a question..."
                className="flex-1 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-400/50"
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

