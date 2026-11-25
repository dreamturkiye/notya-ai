/**
 * BUGUN-V2 — pure display helpers for the patient's Bugün home (core: every branş; what is shown depends only on what the
 * patient logs and what the doctor planned). No data access, no words: everything is derived from the daily state
 * (lib/saglikEvi/ozet.ts) and the words come from lib/saglikEvi/sozler.ts.
 *  - the one next step at the top (a dose, else a reading still due today, else "plan done" / "nothing planned")
 *  - today's missed doses (one tap to fix)
 *  - the three day rings (İlaç / Ölçüm / Hedef) — a ring only for what this patient actually has
 *  - a 14-day series for the patient's trend curves
 * Colours: the same family as the doctor's Ev verisi card (ring teal / sun, one colour per measurement kind).
 */
import type { Egilim, GunlukDurum } from './ozet'
import type { OlcumTipi } from './tipler'
import { HALKA_RENK } from './evVerisiGorunum'
import { trGun } from './zaman'

/** Day rings, outer → inner. Hedef = calm green (time in target), never the alert terracotta. */
export const GUN_HALKA_RENK = { ilac: HALKA_RENK.ilac, olcum: HALKA_RENK.olcum, hedef: '#2f6b4f' } as const

export type SiradakiAdim =
  | { tur: 'doz'; saat: string; at: string; planIds: string[]; adlar: string[]; durum: 'zamani' | 'bekliyor' | 'ertelendi'; kalanDk: number }
  | { tur: 'olcum'; tip: OlcumTipi; ad: string; yapilan: number; hedef: number }
  | { tur: 'tamam' }
  | { tur: 'bos' }

/**
 * What to do next, one thing only. The next dose group wins (one tap marks the whole group); without a pending dose, the
 * first reading still due today; then "plan done" when anything was planned, else "nothing planned".
 */
export function siradakiAdim(d: Pick<GunlukDurum, 'siradaki' | 'bugunDozlar' | 'olcumKartlari'>, simdiMs: number): SiradakiAdim {
  const s = d.siradaki
  if (s) {
    const slot = d.bugunDozlar.find((x) => x.at === s.at && s.planIds.includes(x.planId))
    const durum = slot?.durum === 'zamani' || slot?.durum === 'ertelendi' ? slot.durum : 'bekliyor'
    return { tur: 'doz', saat: s.saat, at: s.at, planIds: s.planIds, adlar: s.adlar, durum, kalanDk: Math.round((Date.parse(s.at) - simdiMs) / 60_000) }
  }
  const k = d.olcumKartlari.find((x) => x.tip !== 'su' && x.gunlukHedef > 0 && x.bugunSayi < x.gunlukHedef)
  if (k) return { tur: 'olcum', tip: k.tip, ad: k.ad, yapilan: k.bugunSayi, hedef: k.gunlukHedef }
  const planVar = d.bugunDozlar.length > 0 || d.olcumKartlari.some((x) => x.tip !== 'su' && x.gunlukHedef > 0)
  return planVar ? { tur: 'tamam' } : { tur: 'bos' }
}

/** Today's doses whose time passed without a mark, grouped by time (oldest first). */
export function eksikDozlar(d: Pick<GunlukDurum, 'bugunDozlar'>): Array<{ saat: string; at: string; planIds: string[]; adlar: string[] }> {
  const g = new Map<string, { saat: string; at: string; planIds: string[]; adlar: string[] }>()
  for (const x of d.bugunDozlar) {
    if (x.durum !== 'kacirildi') continue
    const v = g.get(x.at) || { saat: x.saat, at: x.at, planIds: [], adlar: [] }
    v.planIds.push(x.planId); v.adlar.push(x.ad)
    g.set(x.at, v)
  }
  return [...g.values()].sort((a, b) => a.at.localeCompare(b.at))
}

export interface GunHalkasi {
  anahtar: 'ilac' | 'olcum' | 'hedef'
  renk: string
  /** 0..1, or null when there is nothing to measure yet (empty track). */
  oran: number | null
  yapilan: number
  toplam: number
  /** İlaç: doses not marked in time; Ölçüm: readings still due. */
  eksik: number
  tamam: boolean
}

/** Rings only for what the patient has: no medicines → no İlaç ring; no daily reading target → no Ölçüm / Hedef ring. */
export function gunHalkalari(d: Pick<GunlukDurum, 'halkalar' | 'bugunDozlar' | 'olcumKartlari'>): GunHalkasi[] {
  const h = d.halkalar
  const out: GunHalkasi[] = []
  if (h.ilac.toplam > 0) {
    const eksik = d.bugunDozlar.filter((x) => x.durum === 'kacirildi').length
    out.push({ anahtar: 'ilac', renk: GUN_HALKA_RENK.ilac, oran: h.ilac.yapilan / h.ilac.toplam, yapilan: h.ilac.yapilan, toplam: h.ilac.toplam, eksik, tamam: h.ilac.yapilan >= h.ilac.toplam })
  }
  if (h.olcum.toplam > 0) {
    out.push({ anahtar: 'olcum', renk: GUN_HALKA_RENK.olcum, oran: h.olcum.yapilan / h.olcum.toplam, yapilan: h.olcum.yapilan, toplam: h.olcum.toplam, eksik: h.olcum.toplam - h.olcum.yapilan, tamam: h.olcum.yapilan >= h.olcum.toplam })
  }
  if (h.olcum.toplam > 0 || d.olcumKartlari.some((k) => k.tip !== 'su')) {
    out.push({ anahtar: 'hedef', renk: GUN_HALKA_RENK.hedef, oran: h.hedef.yuzde == null ? null : h.hedef.yuzde / 100, yapilan: h.hedef.yuzde ?? 0, toplam: 100, eksik: 0, tamam: false })
  }
  return out
}

/** "Amlodipin", "Amlodipin ve Metformin", "A, B ve C". */
export function adlarMetni(adlar: string[], ve = 've'): string {
  if (adlar.length <= 1) return adlar[0] ?? ''
  return `${adlar.slice(0, -1).join(', ')} ${ve} ${adlar[adlar.length - 1]}`
}

/** A trend's daily means as curve points (x 0..1 over the window); days without a reading are skipped, never invented. */
export function egriNoktalari(e: Pick<Egilim, 'gunluk'>, ikinci = false): Array<{ x: number; y: number }> {
  const n = e.gunluk.length
  return e.gunluk
    .map((g, i) => ({ x: n > 1 ? i / (n - 1) : 1, y: ikinci ? g.ort2 : g.ort }))
    .filter((p): p is { x: number; y: number } => p.y != null && Number.isFinite(p.y))
}

/** The alert's own trend (the alert metric matches the trend key, e.g. 'glukoz:tokluk2'). */
export function uyariEgilimi(metrik: string, egilimler: Egilim[]): Egilim | null {
  return egilimler.find((e) => e.anahtar === metrik) ?? null
}

/** Split a rule-engine note into a lead sentence and the rest (display only — the text itself is unchanged). */
export function ilkCumle(metin: string): [string, string] {
  const m = metin.match(/^([^]+?[.!?])\s+(?=[A-ZÇĞİÖŞÜ])([^]+)$/)
  return m ? [m[1], m[2]] : [metin, '']
}

/** Badges earned today (the shelf marks them "Bugün" — the unlock moment stays visible after the dialog). */
export function bugunKazanildiMi(kazanildiAt: string | null, bugun: string): boolean {
  if (!kazanildiAt) return false
  return trGun(kazanildiAt) === bugun
}

/**
 * SAGLIGIM-GORUNUM-V3 (Kaan, 2026-11-25: "Burada 'İyi günler' hastanın adının olması iyi olur") — the Bugün greeting.
 * Adult → "<day-part>, <first name>"; a patient under 18 (a parent reads the page; veliDiliMi age rule) → no name in the
 * greeting (the "Hasta · ad" line carries it). `dakika` is the DEVICE's local minute, or null before the client clock is
 * known (server render / hydration) → the neutral word, so server and client markup match.
 */
export function bugunSelami(o: { dakika: number | null; hastaAdi: string | null | undefined; veli: boolean | undefined; selam: (dakika: number) => string; notr: string }): string {
  const bas = o.dakika == null ? o.notr : o.selam(o.dakika)
  const ad = (o.hastaAdi || '').trim().split(/\s+/)[0] || ''
  return ad && !o.veli ? `${bas}, ${ad}` : bas
}
