export interface Env {
  AI: Ai
  ALLOWED_ORIGIN?: string
}

type ChatRequest = {
  question?: string
}

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json; charset=utf-8')
  return new Response(JSON.stringify(data), { ...init, headers })
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const reqOrigin = req.headers.get('Origin') || ''
    const allowedOrigin = env.ALLOWED_ORIGIN || '*'
    const origin = allowedOrigin === '*' ? '*' : reqOrigin === allowedOrigin ? allowedOrigin : allowedOrigin
    const cors = corsHeaders(origin)

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    const url = new URL(req.url)
    if (url.pathname !== '/chat') {
      return json({ error: 'Not found' }, { status: 404, headers: cors })
    }

    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, { status: 405, headers: cors })
    }

    let body: ChatRequest
    try {
      body = (await req.json()) as ChatRequest
    } catch {
      return json({ error: 'Invalid JSON body' }, { status: 400, headers: cors })
    }

    const question = body.question?.trim()
    if (!question) {
      return json({ error: 'question is required' }, { status: 400, headers: cors })
    }

    const systemPrompt =
      'You are DevBann portfolio AI assistant. Keep answers concise and practical. ' +
      'Focus only on portfolio-related topics: skills, projects, tech stack, contact, and deployment updates. ' +
      'If asked unrelated or harmful questions, politely redirect to portfolio topics.'

    try {
      const aiResp = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        max_tokens: 220,
      })

      const answer =
        (aiResp as { response?: string; result?: { response?: string } }).response ||
        (aiResp as { result?: { response?: string } }).result?.response ||
        'I can help with portfolio-related questions. Ask me about skills, projects, tech stack, or contact.'

      return json({ answer }, { status: 200, headers: cors })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown AI error'
      return json({ error: msg }, { status: 500, headers: cors })
    }
  },
}

