const GROQ_MODEL = 'llama-3.3-70b-versatile'
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

export type GroqMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function groqChat(
  messages: GroqMessage[],
  options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY missing')
  }

  const body: Record<string, unknown> = {
    model: GROQ_MODEL,
    messages,
    temperature: options?.temperature ?? 0.4,
    max_tokens: options?.maxTokens ?? 1024,
  }

  if (options?.jsonMode) {
    body.response_format = { type: 'json_object' }
  }

  const resp = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Groq API ${resp.status}: ${err.slice(0, 200)}`)
  }

  const data = await resp.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty Groq response')
  return content
}

// Default export: accepts (systemPrompt: string, userPrompt: string) for backward compat
const groqChatDefault = async (systemPromptOrMessages: string | GroqMessage[], userPrompt?: string): Promise<string> => {
  if (typeof systemPromptOrMessages === 'string') {
    return groqChat([{role:'system',content:systemPromptOrMessages},{role:'user',content:userPrompt||''}])
  }
  return groqChat(systemPromptOrMessages as GroqMessage[])
}
export default groqChatDefault
