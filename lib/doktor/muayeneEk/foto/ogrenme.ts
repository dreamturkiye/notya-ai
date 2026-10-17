/**
 * FOTO-AI-01 — doctor feedback loop (Kabul / Düzelt / Reddet) and the per-doctor adaptation it feeds.
 *
 * Same discipline as the attachment classifier's learning (muayene_ek_ogrenme): only COUNTERS keyed by a closed
 * vocabulary are stored for learning, never free text — so no patient data can enter it. The doctor's correction text
 * itself lives only in the encrypted feedback row. Adaptation is deterministic and applied when an evaluation is READ
 * (cached rows included), so learning never invalidates the image-hash cache and costs no model call.
 *
 * What adaptation may do: lower a confidence tier for a kind of suggestion this doctor keeps rejecting, and say so.
 * What it may NOT do: hide a red flag, raise a confidence, or change what the model saw. Safety asymmetry first.
 */
import { bolgeIdMi } from '@/lib/doktor/fotoArsiv/bolgeler'
import type { FotoDegerlendirme, Guven } from './sema'
import { birKademeDusur } from './kalibrasyon'

export const KARARLAR = ['kabul', 'duzelt', 'reddet'] as const
export type GeriBildirimKarari = (typeof KARARLAR)[number]
export const KARAR_ETIKETI: Record<GeriBildirimKarari, string> = { kabul: 'Kabul', duzelt: 'Düzelt', reddet: 'Reddet' }

export function kararMi(x: unknown): x is GeriBildirimKarari {
  return typeof x === 'string' && (KARARLAR as readonly string[]).includes(x)
}

/** Closed feature vocabulary of the learning table. */
export function ozellikGecerliMi(o: unknown): o is string {
  if (typeof o !== 'string' || o.length > 80) return false
  if (o === 'morfoloji' || o === 'gozlem') return true
  if (o.startsWith('bolge:')) return bolgeIdMi(o.slice(6))
  return /^(bayrak:[a-z][a-z-]{1,40}|ayirici:[a-z0-9][a-z0-9-]{0,39})$/.test(o)
}

export interface OgrenmeSatiri { ozellik: string; kabul: number; duzelt: number; reddet: number }

export interface Mutabakat { toplam: number; kabul: number; duzelt: number; reddet: number; /** 0..1, null below the minimum sample */ oran: number | null }

/** Fewer than this many answers is too few to quote a rate (we show the counts, not a percentage). */
export const MIN_ORNEK_ORAN = 5
/** Adaptation needs a clear pattern, not a couple of clicks. */
export const MIN_ORNEK_UYARLAMA = 5
export const UYARLAMA_RED_ORANI = 0.6

export function mutabakatHesapla(satirlar: readonly OgrenmeSatiri[]): Mutabakat {
  let kabul = 0, duzelt = 0, reddet = 0
  for (const s of satirlar) { kabul += s.kabul; duzelt += s.duzelt; reddet += s.reddet }
  const toplam = kabul + duzelt + reddet
  return { toplam, kabul, duzelt, reddet, oran: toplam >= MIN_ORNEK_ORAN ? kabul / toplam : null }
}

export function alanaGore(satirlar: readonly OgrenmeSatiri[]): Record<string, Mutabakat> {
  const g: Record<string, OgrenmeSatiri[]> = {}
  for (const s of satirlar) {
    const alan = s.ozellik.split(':')[0]
    ;(g[alan] ??= []).push(s)
  }
  return Object.fromEntries(Object.entries(g).map(([a, l]) => [a, mutabakatHesapla(l)]))
}

export function mutabakatMetni(m: Mutabakat): string {
  if (!m.toplam) return 'Henüz geri bildirim yok.'
  if (m.oran == null) return `${m.toplam} geri bildirim (${m.kabul} kabul, ${m.duzelt} düzeltme, ${m.reddet} ret) — oran için en az ${MIN_ORNEK_ORAN} gerekir.`
  return `Önerilerin %${Math.round(m.oran * 100)}'ini kabul ettiniz (${m.toplam} geri bildirim: ${m.kabul} kabul, ${m.duzelt} düzeltme, ${m.reddet} ret).`
}

export interface Uyarlama { ozellik: string; anahtar: string; mesaj: string }

const redPayi = (s: OgrenmeSatiri): number => {
  const n = s.kabul + s.duzelt + s.reddet
  return n ? (s.reddet + 0.5 * s.duzelt) / n : 0
}

/**
 * Applies this doctor's history to an evaluation. Returns a copy plus the list of adaptations (shown to the doctor:
 * "Bu tür öneriyi sık reddettiğiniz için güven düşürüldü").
 */
export function ogrenmeUygula(girdi: FotoDegerlendirme, satirlar: readonly OgrenmeSatiri[]): { deger: FotoDegerlendirme; uyarlamalar: Uyarlama[] } {
  const d: FotoDegerlendirme = JSON.parse(JSON.stringify(girdi))
  const uyarlamalar: Uyarlama[] = []
  const harita = new Map(satirlar.map((s) => [s.ozellik, s]))
  const uygun = (ozellik: string): OgrenmeSatiri | null => {
    const s = harita.get(ozellik)
    if (!s) return null
    return s.kabul + s.duzelt + s.reddet >= MIN_ORNEK_UYARLAMA && redPayi(s) >= UYARLAMA_RED_ORANI ? s : null
  }
  const dusur = (g: Guven): Guven => birKademeDusur(g)
  for (const a of d.ayiricilar) {
    const s = uygun(`ayirici:${a.anahtar}`)
    if (!s) continue
    const once = a.guven
    a.guven = dusur(a.guven)
    if (a.guven !== once) uyarlamalar.push({ ozellik: `ayirici:${a.anahtar}`, anahtar: `ayirici:${a.anahtar}`, mesaj: `Bu öneriyi sık reddettiğiniz için güven düzeyi düşürüldü (${s.reddet + s.duzelt}/${s.kabul + s.duzelt + s.reddet}).` })
  }
  const gen = uygun('gozlem')
  if (gen) {
    for (const g of d.gozlemler) g.guven = dusur(g.guven)
    uyarlamalar.push({ ozellik: 'gozlem', anahtar: 'gozlem', mesaj: 'Genel gözlem cümlelerini sık düzelttiğiniz için güven düzeyleri bir kademe düşürüldü.' })
  }
  for (const b of d.kirmiziBayraklar) {
    const s = uygun(`bayrak:${b.kod}`)
    if (!s || (b.durum !== 'var' && b.durum !== 'olasi')) continue
    // A red flag is NEVER hidden. A "var" this doctor usually rejects is shown as "olası"; the flag itself stays.
    if (b.durum === 'var') b.durum = 'olasi'
    uyarlamalar.push({ ozellik: `bayrak:${b.kod}`, anahtar: `bayrak:${b.kod}`, mesaj: 'Bu uyarıyı sık reddettiniz; yine de gösteriliyor çünkü güvenlik uyarılarını gizlemiyoruz.' })
  }
  return { deger: d, uyarlamalar }
}
