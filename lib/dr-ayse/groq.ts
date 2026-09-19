/**
 * AUDIT-2026-09-03 — Bu modül artık bir ANTHROPIC ŞİMİ'dir.
 * Tarihçe: erken dönem araçlar (epikriz, belgeler/ingest, e-reçete, sandbox) Groq'a
 * yazılmıştı; GROQ_API_KEY hiçbir ortamda tanımlanmadığı için bu araçlar hiç çalışmadı.
 * Dışa açılan arayüz (groqChat(messages, options) → string ve varsayılan (system, user)
 * imzası) birebir korunarak iç kısım Anthropic'e geçirildi — böylece tüm çağıran rotalar
 * tek dosya değişikliğiyle düzeldi. Yeni kod bu modülü değil doğrudan Anthropic desenini
 * kullanmalı; bu dosya geriye dönük uyumluluk içindir.
 */

import { aiCagir, yanitMetni } from '@/lib/ai/cagir'

export type GroqMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function groqChat(
  messages: GroqMessage[],
  options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY missing')
  }

  const sistemParcalari = messages.filter((m) => m.role === 'system').map((m) => m.content)
  if (options?.jsonMode) {
    sistemParcalari.push('SADECE geçerli JSON döndür; kod bloğu, açıklama ya da giriş cümlesi ekleme.')
  }
  const konusma = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
  if (konusma.length === 0) konusma.push({ role: 'user', content: 'Devam et.' })

  // NOTYA-MALIYET-01: epikriz, gelişim taraması, belge ingest özeti (lab/radyoloji metni) — klinik çıktı, GÜÇLÜ
  // (klinik-analiz). Hata metni eskisiyle aynı biçimde: "Anthropic API <durum>: <gövde>".
  const data = await aiCagir({
    gorev: 'klinik-analiz',
    maxTokens: options?.maxTokens ?? 1024,
    temperature: options?.temperature ?? 0.4,
    system: sistemParcalari.join('\n\n') || undefined,
    messages: konusma,
  })
  const content = yanitMetni(data)
  if (!content) throw new Error('Empty Anthropic response')
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
