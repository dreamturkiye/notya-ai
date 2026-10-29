/**
 * SES-OMURGA-V2 (A) — one utterance, one brain, latest wins (Kaan, 2026-10-29).
 *
 * ElevenLabs re-POSTs the Custom LLM request when the transcript grows, when it retries, and sometimes for no visible
 * reason (10-26: 43% of POSTs were duplicates, three brains ran on one utterance, losers waited 12 s in silence). It
 * plays the stream of the LATEST request it sent. So:
 *
 *   - a turn is keyed by the call (the per-call id in the voice token) and the turn POSITION in ElevenLabs' own
 *     `messages` history (number of user lines) — never by text equality alone;
 *   - an exact duplicate of a turn that is answering or was just answered is served from the shared stream of the
 *     first one (what it already said, then what it says next) — no second brain, no silent wait, no DB polling;
 *   - a new POST for the same turn with a different (grown / corrected) transcript SUPERSEDES the in-flight one: its
 *     model call is aborted, its unspoken output is dropped, and the newest request answers with the newest text;
 *   - a new turn that arrives while the previous turn has not said anything yet (ElevenLabs split one utterance into
 *     two turns) supersedes it too, with the two transcripts merged;
 *   - a genuinely new turn leaves an older turn running for the screen only.
 *
 * This registry is per server instance (Vercel routes concurrent requests of one call to the same warm instance
 * almost always). Across instances the database registry (ses_turu_ac_v2 / asistan_gecmis_ekle) gives the same
 * answer: latest request wins and only it writes the history. Pure module, no I/O.
 */
import { trAramaNormalize } from '@/lib/utils/turkceArama'

export type SesTurKarari = 'yeni' | 'ustune' | 'birlesik' | 'kopya'

export const KOPYA_PENCERESI_MS = 120_000
export const BIRLESTIRME_PENCERESI_MS = 6_000
const KAYIT_AZAMI = 500

type Dinleyici = (parca: string | null) => void

export class SesTurKaydi {
  readonly bas: number
  durum: 'acik' | 'bitti' = 'acik'
  bitis = 0
  /** Real speech already streamed (not the role delta, not a buffer). */
  icerikVar = false
  readonly iptal = new AbortController()
  readonly parcalar: string[] = []
  private readonly dinleyiciler = new Set<Dinleyici>()
  /** Set by the route when the database seq is known (history write identity). */
  seq = 0

  constructor(readonly cagri: string, readonly turNo: number, readonly anahtar: string, readonly metin: string, simdi = Date.now()) {
    this.bas = simdi
  }

  get iptalEdildi(): boolean { return this.iptal.signal.aborted }

  /** A spoken delta of this turn: kept for duplicates, pushed to their streams. */
  yay(parca: string): void {
    if (this.durum === 'bitti' || this.iptalEdildi || !parca) return
    this.parcalar.push(parca)
    if (/[\p{L}\p{N}]/u.test(parca)) this.icerikVar = true
    for (const d of this.dinleyiciler) { try { d(parca) } catch { /* a closed duplicate stream */ } }
  }

  bitir(simdi = Date.now()): void {
    if (this.durum === 'bitti') return
    this.durum = 'bitti'
    this.bitis = simdi
    for (const d of this.dinleyiciler) { try { d(null) } catch { /* */ } }
    this.dinleyiciler.clear()
  }

  /** Superseded: abort the brain; duplicates attached to it end too (ElevenLabs no longer plays them). */
  ustuneYaz(): void {
    if (!this.iptalEdildi) this.iptal.abort()
    this.bitir()
  }

  /** Stream what exists, then what comes, until the turn ends (or `azamiMs` passes). */
  paylas(yay: (parca: string) => void, azamiMs = 25_000): Promise<void> {
    for (const p of this.parcalar) yay(p)
    if (this.durum === 'bitti') return Promise.resolve()
    return new Promise<void>((coz) => {
      let bitti = false
      const son = () => { if (bitti) return; bitti = true; clearTimeout(zaman); this.dinleyiciler.delete(d); coz() }
      const d: Dinleyici = (p) => { if (p === null) son(); else yay(p) }
      const zaman = setTimeout(son, azamiMs)
      this.dinleyiciler.add(d)
    })
  }

  /** What this turn said, joined (the replay for a duplicate that arrives after the end). */
  soylenen(): string {
    return this.parcalar.join('').replace(/\s+/g, ' ').trim()
  }
}

const kayitlar = new Map<string, SesTurKaydi>()

/** Normalized fingerprint (Turkish-folded, punctuation-insensitive). */
export function sesTurAnahtari(mesaj: string): string {
  return trAramaNormalize(String(mesaj || '')).replace(/[^a-z0-9\s]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300)
}

type ElMesaj = { role?: string }
/** Turn position in ElevenLabs' history: the number of user lines. */
export function elTurNo(mesajlar: unknown): number {
  return Array.isArray(mesajlar) ? (mesajlar as ElMesaj[]).filter((m) => m?.role === 'user').length : 0
}

/** The last assistant line in ElevenLabs' history (what Ayşe said last — the echo reference). */
export function elSonAsistan(mesajlar: unknown): string {
  const liste = Array.isArray(mesajlar) ? (mesajlar as { role?: string; content?: unknown }[]) : []
  for (let i = liste.length - 1; i >= 0; i--) {
    const m = liste[i]
    if (m?.role !== 'assistant') continue
    const c = m.content
    const t = typeof c === 'string' ? c : Array.isArray(c) ? c.map((p) => (p && typeof p === 'object' && typeof (p as { text?: unknown }).text === 'string' ? (p as { text: string }).text : '')).join(' ') : ''
    if (t.trim()) return t.replace(/\s+/g, ' ').trim()
  }
  return ''
}

function birlestir(eski: string, yeni: string): string {
  const a = sesTurAnahtari(eski)
  const b = sesTurAnahtari(yeni)
  if (!a) return yeni
  if (b.includes(a)) return yeni
  if (a.includes(b)) return eski
  return `${eski.trim()} ${yeni.trim()}`.trim()
}

export type SesTurKarsilama = {
  karar: SesTurKarari
  kayit: SesTurKaydi
  /** The text the brain answers (merged when two turns were one utterance). */
  metin: string
  /** The superseded / duplicated earlier request, when there was one. */
  onceki: SesTurKaydi | null
}

/**
 * Decide what a POST is and register it. For 'kopya' the returned `kayit` is the EXISTING turn (serve its stream);
 * otherwise a new turn is registered as the call's latest and returned.
 */
export function sesTuruKarsila(g: { cagri: string; turNo: number; mesaj: string; simdi?: number }): SesTurKarsilama {
  const simdi = g.simdi ?? Date.now()
  const anahtar = sesTurAnahtari(g.mesaj)
  const k = kayitlar.get(g.cagri) || null
  if (k && k.turNo === g.turNo && k.anahtar === anahtar && !k.iptalEdildi && (k.durum === 'acik' || simdi - k.bitis <= KOPYA_PENCERESI_MS)) {
    return { karar: 'kopya', kayit: k, metin: g.mesaj, onceki: k }
  }
  let karar: SesTurKarari = 'yeni'
  let metin = g.mesaj
  if (k && k.durum === 'acik' && k.turNo === g.turNo) {
    karar = 'ustune'
    k.ustuneYaz()
  } else if (k && k.durum === 'acik' && k.turNo === g.turNo - 1 && !k.icerikVar && simdi - k.bas <= BIRLESTIRME_PENCERESI_MS) {
    karar = 'birlesik'
    metin = birlestir(k.metin, g.mesaj)
    k.ustuneYaz()
  }
  const yeni = new SesTurKaydi(g.cagri, g.turNo, sesTurAnahtari(metin), metin, simdi)
  kayitlar.delete(g.cagri)
  kayitlar.set(g.cagri, yeni)
  while (kayitlar.size > KAYIT_AZAMI) {
    const ilk = kayitlar.keys().next().value
    if (ilk === undefined) break
    kayitlar.delete(ilk)
  }
  return { karar, kayit: yeni, metin, onceki: k }
}

/** Test helper. */
export function sesTurKayitlariniSil(): void {
  kayitlar.clear()
}
