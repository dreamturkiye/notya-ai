/**
 * AU-CANLI-01 — the English language set's part of the live assistant: the words the speech layer adds (what it says
 * for a list, a table, "the rest"), the opening line, and the shape of the settings. A country states only what is its
 * own: its name, the variety of English, the context of practice, its hard limits and its national sources.
 */
import type { CanliAsistanAyarlari } from '@/lib/ulke/tipler'

export type EnCanliGirdisi = {
  ulkeAdi: string
  /** "Australian English", "British English", … */
  dilAdi: string
  pratikBaglami: readonly string[]
  sinirlar: readonly string[]
  kaynakBlogu: (rol: string) => string | null
  gunlukTurLimiti?: number
  /** Opt-in environment switch; see CanliAsistanAyarlari.acikDegiskeni. */
  acikDegiskeni?: string
}

export function enCanliAsistan(g: EnCanliGirdisi): CanliAsistanAyarlari {
  return {
    dilAdi: g.dilAdi,
    ulkeAdi: g.ulkeAdi,
    pratikBaglami: g.pratikBaglami,
    sinirlar: g.sinirlar,
    kaynakBlogu: g.kaynakBlogu,
    gunlukTurLimiti: g.gunlukTurLimiti ?? 150,
    ...(g.acikDegiskeni ? { acikDegiskeni: g.acikDegiskeni } : {}),
    ekranSozleri: {
      liste: (n) => `${n} items, on your screen.`,
      tablo: 'I have put the table on your screen.',
      devami: 'The rest is on your screen.',
      veda: 'Goodbye for now.',
      anlasilmadi: 'Sorry, I could not answer that just now. Could you say it again?',
      bekletme: 'One moment, let me have a look...',
      gunlukSinir: 'We have reached the limit for the assistant today. You can pick this up again tomorrow.',
    },
    acilis: (a) => `Hello, I'm ${a.tamAd}, your ${a.rolAdi} colleague. What can I help with?`,
  }
}
