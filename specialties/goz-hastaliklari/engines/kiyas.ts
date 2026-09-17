/**
 * GOZ-COMPARE — same-eye OCT/fundus side-by-side pairing. Pure.
 * Does not interpret images; only validates pairing rules for the UI.
 */
import { GOZ_MODALITELER, type GozModalite } from '../imaging/dualSign'

export type GoruntuOzet = {
  id: string
  modalite: string
  goz: 'sag' | 'sol' | 'iki' | null
  tarih: string
  url: string | null
}

export function normalizeModalite(m: string): GozModalite | null {
  const t = String(m || '').toLowerCase()
  if (GOZ_MODALITELER.includes(t as GozModalite)) return t as GozModalite
  if (t === 'okt') return 'oct'
  if (t.includes('fundus') || t.includes('goz dibi')) return 'fundus'
  if (t.includes('on_segment') || t.includes('ön segment') || t.includes('slit')) return 'on_segment'
  return null
}

/** Parse clinic free-text region ("sağ göz", "OD", "sol") into OD/OS/OU. */
export function gozBolgeCoz(bolge: string | null | undefined): 'sag' | 'sol' | 'iki' | null {
  const t = String(bolge || '').toLocaleLowerCase('tr-TR').trim()
  if (!t) return null
  if (t === 'sag' || t === 'sol' || t === 'iki') return t
  if (/iki|bilateral|\bou\b/.test(t) || ((/sağ|sag/.test(t)) && /sol/.test(t))) return 'iki'
  if (/sağ|\bsag\b|\bod\b/.test(t)) return 'sag'
  if (/sol|\bos\b/.test(t)) return 'sol'
  return null
}

export function kiyasCifti(a: GoruntuOzet, b: GoruntuOzet): { ok: true; baslik: string } | { ok: false; hata: string } {
  if (a.id === b.id) return { ok: false, hata: 'Aynı görüntü iki kez seçilemez.' }
  const ma = normalizeModalite(a.modalite), mb = normalizeModalite(b.modalite)
  if (!ma || !mb) return { ok: false, hata: 'Yalnız OCT / fundus / ön segment karşılaştırılır.' }
  if (ma !== mb) return { ok: false, hata: 'Aynı modalite seçin (ikisi de OCT veya ikisi de fundus).' }
  if (!a.goz || !b.goz || a.goz === 'iki' || b.goz === 'iki') return { ok: false, hata: 'Her iki görüntüde de aynı göz (sağ veya sol) işaretli olmalı.' }
  if (a.goz !== b.goz) return { ok: false, hata: 'Aynı gözü (OD veya OS) seçin.' }
  const gozAd = a.goz === 'sag' ? 'sağ' : 'sol'
  const modAd = ma === 'oct' ? 'OCT' : ma === 'fundus' ? 'Fundus' : 'Ön segment'
  return { ok: true, baslik: `${modAd} karşılaştırması · ${gozAd} göz · ${a.tarih.slice(0, 10)} ↔ ${b.tarih.slice(0, 10)}` }
}
