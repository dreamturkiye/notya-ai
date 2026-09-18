/**
 * GOZ-EXCEPTIONAL-01 — ROP tarama kartı + pediatrik görünürlük kapısı. Pure.
 * Zon (I–III), evre (0–5), plus (yok / pre-plus / plus) YALNIZ hekim girişidir (ICROP sınıf adları); motor evre önermez.
 * Sonraki tarama tarihini hekim kilitler — motor aralık uydurmaz. PMA = doğum haftası + doğumdan beri geçen hafta (tanım).
 * Tarama endikasyonu satırı: SB Ulusal Görme Taraması Rehberi 2019 (≤32 hf veya ≤1500 g → 4. haftada ROP muayenesi) — klinik.ts ile aynı.
 * Görünürlük (brans-alan-sizmasi): bilinmeyen yaş çocuk sayılmaz; erişkin hastada ROP / pediatrik kart varsayılan olarak görünmez.
 */
import type { Dipnot } from '../protocols/sources'

export const ROP_ZON = ['I', 'II', 'III'] as const
export const ROP_EVRE = ['0', '1', '2', '3', '4', '5'] as const
export const ROP_PLUS = ['yok', 'pre_plus', 'plus'] as const
export const PLUS_AD: Record<(typeof ROP_PLUS)[number], string> = { yok: 'plus yok', pre_plus: 'pre-plus', plus: 'plus' }

export interface RopKayit {
  tarih: string
  dogumHaftasi: number | null
  dogumAgirligiG: number | null
  pmaHafta: number | null
  zonSag: string | null; zonSol: string | null
  evreSag: string | null; evreSol: string | null
  plusSag: string | null; plusSol: string | null
  sonrakiTarama: string | null
  not: string | null
}

const gunFarki = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000)

/** Postmenstrüel yaş (hafta, 1 ondalık). Doğum tarihi veya doğum haftası yoksa null. */
export function pmaHesapla(dogumHaftasi: number | null, dogumTarihi: string | null, muayeneTarihi: string): number | null {
  if (dogumHaftasi == null || !dogumTarihi || !/^\d{4}-\d{2}-\d{2}/.test(dogumTarihi)) return null
  const gun = gunFarki(dogumTarihi.slice(0, 10), muayeneTarihi)
  if (gun < 0) return null
  return Math.round((dogumHaftasi + gun / 7) * 10) / 10
}

export function ropDogrula(g: Record<string, unknown>, dogumTarihi: string | null): { ok: true; kayit: RopKayit; uyarilar: string[] } | { ok: false; hata: string } {
  const tarih = typeof g.tarih === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(g.tarih) ? g.tarih : null
  if (!tarih) return { ok: false, hata: 'Muayene tarihi gerekli.' }
  const n = (v: unknown) => (v == null || v === '' ? null : Number(String(v).replace(',', '.')))
  const hf = n(g.dogumHaftasi), ag = n(g.dogumAgirligiG)
  if (hf != null && (!Number.isFinite(hf) || hf < 20 || hf > 44)) return { ok: false, hata: 'Doğum haftası 20–44 olmalı.' }
  if (ag != null && (!Number.isInteger(ag) || ag < 300 || ag > 6000)) return { ok: false, hata: 'Doğum ağırlığı 300–6000 g olmalı.' }
  const secim = <T extends readonly string[]>(v: unknown, liste: T) => (liste.includes(String(v)) ? String(v) : null)
  const sonraki = typeof g.sonrakiTarama === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(g.sonrakiTarama) ? g.sonrakiTarama : null
  if (sonraki && sonraki <= tarih) return { ok: false, hata: 'Sonraki tarama muayene tarihinden sonra olmalı.' }
  const kayit: RopKayit = {
    tarih, dogumHaftasi: hf, dogumAgirligiG: ag, pmaHafta: pmaHesapla(hf, dogumTarihi, tarih),
    zonSag: secim(g.zonSag, ROP_ZON), zonSol: secim(g.zonSol, ROP_ZON), evreSag: secim(g.evreSag, ROP_EVRE), evreSol: secim(g.evreSol, ROP_EVRE),
    plusSag: secim(g.plusSag, ROP_PLUS), plusSol: secim(g.plusSol, ROP_PLUS), sonrakiTarama: sonraki,
    not: g.not ? String(g.not).trim().slice(0, 240) || null : null,
  }
  const uyarilar: string[] = []
  if (!sonraki) uyarilar.push('Sonraki tarama tarihini hekim belirlesin (motor aralık önermez).')
  if (kayit.plusSag === 'plus' || kayit.plusSol === 'plus' || kayit.evreSag === '3' || kayit.evreSol === '3' || kayit.evreSag === '4' || kayit.evreSol === '4' || kayit.evreSag === '5' || kayit.evreSol === '5') uyarilar.push('Hekimin girdiği bulgu tedavi değerlendirmesi gerektirebilir — karar ve zamanlama hekimin (ROP ünitesi / vitreoretina).')
  return { ok: true, kayit, uyarilar }
}

export function ropTaramaEndikasyonu(dogumHaftasi: number | null, dogumAgirligiG: number | null): { var: boolean | null; metin: string; dipnot: Dipnot } {
  const dipnot: Dipnot = { ref: 'SB_COCUK_IZLEM', not: 'SB Ulusal Görme Taraması Rehberi 2019: ≤32 hf veya ≤1500 g → 4. haftada ROP için göz muayenesi' }
  if (dogumHaftasi == null && dogumAgirligiG == null) return { var: null, metin: 'Doğum haftası / ağırlığı girilmedi.', dipnot }
  const v = (dogumHaftasi != null && dogumHaftasi <= 32) || (dogumAgirligiG != null && dogumAgirligiG <= 1500)
  return { var: v, metin: v ? 'SB kriteri: ≤32 hf veya ≤1500 g — ROP taraması endikasyonu (4. hafta).' : 'SB ≤32 hf / ≤1500 g kriteri dışında — tarama kararı hekimin (klinik risk).', dipnot }
}

export function ropMetni(k: RopKayit): string {
  const goz = (ad: string, z: string | null, e: string | null, p: string | null) => `${ad}: ${[z ? `zon ${z}` : null, e != null ? `evre ${e}` : null, p ? PLUS_AD[p as keyof typeof PLUS_AD] : null].filter(Boolean).join(', ') || 'kaydedilmedi'}`
  return `ROP taraması (${k.tarih}${k.pmaHafta != null ? `, PMA ${String(k.pmaHafta).replace('.', ',')} hf` : ''}) — ${goz('OD', k.zonSag, k.evreSag, k.plusSag)}; ${goz('OS', k.zonSol, k.evreSol, k.plusSol)}.${k.sonrakiTarama ? ` Sonraki tarama: ${k.sonrakiTarama} (hekim).` : ''}`
}

/** Pediatrik sekme: bilinen yaş <18 veya kayıtlı pediatrik/ROP verisi. ROP kartı: bilinen yaş <12 ay veya kayıtlı ROP verisi. */
export function pediatrikGorunum(g: { yasAy: number | null; pedVeriVar: boolean; ropVeriVar: boolean }): { pediatrikSekme: boolean; ropKart: boolean } {
  const cocuk = g.yasAy != null && g.yasAy < 216
  const bebek = g.yasAy != null && g.yasAy < 12
  return { pediatrikSekme: cocuk || g.pedVeriVar || g.ropVeriVar, ropKart: bebek || g.ropVeriVar }
}
