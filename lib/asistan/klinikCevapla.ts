/**
 * NOTYA-TEK-BEYIN-CORE-01 — klinik voice brain (thin ElevenLabs mouth → this function).
 *
 * Klinik experts are colleague consultants (no patient chart / hasta_bul). Same mouth settings as
 * Pediatri Ayşe (Custom LLM + SES-KILIT / SES-SLUR via ses-llm), different brain: Luna with the
 * klinik persona prompt from `lib/ai/personas/klinik_uzmanlar`.
 */
import { aiCagir, yanitMetni } from '@/lib/ai/cagir'
import { KlinikUzmanPersonas } from '@/lib/ai/personas/klinik_uzmanlar'

export function klinikSesSistemPromptu(slug: string): string | null {
  const p = KlinikUzmanPersonas[slug]
  if (!p) return null
  return [
    `Sen ${p.name}, ${p.title}. ${p.systemPrompt}`,
    'Bir klinikte çalışan uzman meslektaşla konuşuyorsun; hasta ile değil. Türkçe konuş.',
    'Sesli görüşmedesin: kısa, net cümleler kur; madde işareti ve uzun liste kullanma.',
    'Emin olmadığın klinik bilgiyi uydurma; kaynağından emin değilsen bunu açıkça söyle.',
    'Tehlikeli doz, kontrendikasyon veya atlanmış risk görürsen sormadan söyle ve doğrusunu öner.',
  ].join(' ')
}

export async function klinikCevapla(g: {
  slug: string
  mesaj: string
  doctorId?: string | null
  sozParcasi?: (t: string) => void
}): Promise<{ ok: true; soz: string } | { ok: false; hata: string }> {
  const system = klinikSesSistemPromptu(g.slug)
  if (!system) return { ok: false, hata: 'Bilinmeyen klinik uzman.' }
  const mesaj = String(g.mesaj || '').replace(/\s+/g, ' ').trim().slice(0, 4000)
  if (!mesaj) return { ok: false, hata: 'Boş mesaj.' }
  try {
    const yanit = await aiCagir({
      gorev: 'sohbet-uzman',
      system,
      messages: [{ role: 'user', content: mesaj }],
      doctorId: g.doctorId || null,
      maxTokens: 600,
    })
    const soz = yanitMetni(yanit).replace(/\s+/g, ' ').trim()
    if (!soz) return { ok: false, hata: 'Boş cevap.' }
    g.sozParcasi?.(soz)
    return { ok: true, soz }
  } catch (e) {
    console.error('[klinikCevapla]', e instanceof Error ? e.name : 'hata')
    return { ok: false, hata: 'Cevap üretilemedi.' }
  }
}
