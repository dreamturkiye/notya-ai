/**
 * Eski Groq çağrı yerlerini aiCagir'e bağlar (Luna-Pro). Dış arayüz (groqChat) korunur.
 */

import { aiCagir, yanitMetni } from '@/lib/ai/cagir'

export type GroqMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function groqChat(
  messages: GroqMessage[],
  /** `butceMs`: the calling route's time budget (rotaButcesiMs) — passed through to aiCagir. */
  options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean; butceMs?: number }
): Promise<string> {
  if (!String(process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || '').trim()) {
    throw new Error('OPENROUTER_API_KEY missing')
  }

  const sistemParcalari = messages.filter((m) => m.role === 'system').map((m) => m.content)
  if (options?.jsonMode) {
    sistemParcalari.push('SADECE geçerli JSON döndür; kod bloğu, açıklama ya da giriş cümlesi ekleme.')
  }
  const konusma = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
  if (konusma.length === 0) konusma.push({ role: 'user', content: 'Devam et.' })

  // NOTYA-MALIYET-01: epikriz, gelişim taraması, belge ingest özeti (lab/radyoloji metni) — klinik çıktı (LUNAPRO-01: birincil Luna-Pro)
  // (klinik-analiz).
  const data = await aiCagir({
    gorev: 'klinik-analiz',
    maxTokens: options?.maxTokens ?? 1024,
    temperature: options?.temperature ?? 0.4,
    jsonBekleniyor: !!options?.jsonMode,
    ...(options?.butceMs ? { butceMs: options.butceMs } : {}),
    system: sistemParcalari.join('\n\n') || undefined,
    messages: konusma,
  })
  const content = yanitMetni(data)
  if (!content) throw new Error('Empty model response')
  // jsonMode çağıranları JSON.parse yapar — kod bloğu çitlerini burada temizle.
  return options?.jsonMode ? content.replace(/```json\n?|\n?```/g, '').trim() : content
}

// Default export: accepts (systemPrompt: string, userPrompt: string) for backward compat
const groqChatDefault = async (systemPromptOrMessages: string | GroqMessage[], userPrompt?: string): Promise<string> => {
  if (typeof systemPromptOrMessages === 'string') {
    return groqChat([{ role: 'system', content: systemPromptOrMessages }, { role: 'user', content: userPrompt || '' }])
  }
  return groqChat(systemPromptOrMessages as GroqMessage[])
}
export default groqChatDefault
