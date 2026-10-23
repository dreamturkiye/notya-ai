/**
 * AU-CANLI-02 — the bubbles of the assistant page, ordered by the SAME engine as Türkiye's /asistan page
 * (lib/asistan/balonSirasi.ts, NOTYA-SES-SIRA-01..03 and NOTYA-SES-KULLANICI-BALON-01). This file only maps the page's
 * three events onto that engine; it carries no ordering rule of its own:
 *
 *   - the clinician's spoken line (a transcript with the provider's event id)   → `kullaniciEkle`
 *   - a spoken fragment of the assistant (arrives while it speaks)             → a provisional bubble
 *   - the full answer (the `show_on_screen` tool)                              → `cevapEkle`, tagged as a screen reply,
 *                                                                                  replacing the provisional bubbles of its turn
 *   - a typed question and its answer                                          → appended: they are always the last thing said
 *
 * Pure: renders and orders in a plain Node test.
 */
import { cevapEkle, kullaniciEkle, oturumOlaylariniSil, type Balon } from '@/lib/asistan/balonSirasi'
import { SOHBET_AZAMI, sohbetFifoKirp, type SakliSesMesaj } from '@/lib/asistan/sohbetGecmisi'

export type SohbetBalon = Balon & { id: string; sira: number; /** a spoken fragment not yet replaced by the full answer */ gecici?: boolean }
export type BalonSayaci = { sira: number }

const yap = (sayac: BalonSayaci) => (role: 'user' | 'ai', text: string, olay?: number): SohbetBalon => {
  sayac.sira += 1
  return { id: `b${sayac.sira}`, sira: sayac.sira, role, text, ...(olay != null ? { olay } : {}) }
}

/** The clinician's spoken line, ordered by the provider's event id (and by the orphan rules when there is none). */
export function sesKullanicisi(onceki: SohbetBalon[], metin: string, olay: number | undefined, sayac: BalonSayaci): SohbetBalon[] {
  return sohbetKirp(kullaniciEkle(onceki, metin, olay, yap(sayac)))
}

/** A fragment the assistant is saying. Fragments of one turn join one provisional bubble. */
export function sesAsistani(onceki: SohbetBalon[], metin: string, sayac: BalonSayaci): SohbetBalon[] {
  const t = String(metin || '').trim()
  if (!t) return onceki
  const son = onceki[onceki.length - 1]
  if (son && son.role === 'ai' && son.gecici) return [...onceki.slice(0, -1), { ...son, text: `${son.text} ${t}` }]
  return sohbetKirp([...onceki, { ...yap(sayac)('ai', t), gecici: true }])
}

/** The opening greeting: said before the doctor has said anything, so it is settled at once and never mistaken for a turn's spoken beginning. */
export function selamEkle(onceki: SohbetBalon[], metin: string, sayac: BalonSayaci): SohbetBalon[] {
  return geciciyiOturt(sesAsistani(geciciyiOturt(onceki), metin, sayac))
}

/**
 * The full written answer. It replaces the provisional bubbles of the turn (the spoken beginning is part of it) and is
 * tagged as a screen reply, so a doctor's transcript that arrives later is still put in front of it.
 */
export function ekranCevabi(onceki: SohbetBalon[], metin: string, sayac: BalonSayaci): SohbetBalon[] {
  let son = onceki.length
  while (son > 0 && onceki[son - 1].role === 'ai' && onceki[son - 1].gecici) son--
  const temiz = onceki.slice(0, son)
  return sohbetKirp(cevapEkle(temiz, null, metin, (r, t) => yap(sayac)(r, t), null, true))
}

/** A spoken fragment that never got its full answer becomes a settled bubble (the call ended, or the screen tool was not offered). */
export function geciciyiOturt(onceki: SohbetBalon[]): SohbetBalon[] {
  return onceki.some((b) => b.gecici) ? onceki.map((b) => (b.gecici ? { ...b, gecici: false } : b)) : onceki
}

/** A typed line or its answer: the last thing said, so it goes last. */
export function yaziliEkle(onceki: SohbetBalon[], role: 'user' | 'ai', metin: string, sayac: BalonSayaci): SohbetBalon[] {
  const t = String(metin || '').trim()
  if (!t) return onceki
  return sohbetKirp([...geciciyiOturt(onceki), yap(sayac)(role, t)])
}

/** Event ids restart at 1 on every call: call this when a new call starts or the stored history is loaded. */
export const yeniCagri = (onceki: SohbetBalon[]): SohbetBalon[] => oturumOlaylariniSil(onceki)

/** First in, first out, 50 bubbles — the same ceiling as Türkiye's history. */
export function sohbetKirp(liste: SohbetBalon[]): SohbetBalon[] {
  return liste.length <= SOHBET_AZAMI ? liste : liste.slice(liste.length - SOHBET_AZAMI)
}

// ── history: the stored shape of Türkiye's history (lib/asistan/sohbetGecmisi.ts), voice and typed in one timeline ──

export function saklanacak(liste: SohbetBalon[]): SakliSesMesaj[] {
  return sohbetFifoKirp(liste.filter((b) => !b.gecici).map((b) => ({ id: b.id, role: b.role, text: b.text, sira: b.sira })), []).ses
}

export function saklidan(ses: readonly SakliSesMesaj[]): { liste: SohbetBalon[]; sira: number } {
  const liste = ses.map((m, i) => ({ id: m.id || `g${i}`, sira: m.sira || i + 1, role: m.role, text: m.text }))
  liste.sort((a, b) => a.sira - b.sira)
  return { liste, sira: liste.reduce((en, b) => Math.max(en, b.sira), 0) }
}
