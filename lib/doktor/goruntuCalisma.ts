/**
 * Hasta görüntü ceketi — store / retrieve / display. Not a PACS.
 * Değerlendir = existing POST /api/doktor/belgeler/analiz (modalityFinal).
 */
import type { Modalite } from '@/core/belgeler/ontoloji'
import { VAULT_MAX_BYTES } from '@/lib/vault/types'

export type GoruntuTip = 'xr' | 'ekg' | 'goz' | 'derm' | 'mg' | 'us' | 'ct' | 'mr' | 'pet' | 'diger'
export type GoruntuKaynak = 'klinik_yukleme' | 'hasta_yukleme' | 'dicom' | 'hastane_link'
export type GoruntuOnay = 'taslak' | 'hekim_duzenledi' | 'hekim_onay' | 'hasta_paylas'

export const TASLAK_DIPNOT = 'Taslak. Tanı değildir. Hekim onaylamadan hastaya gitmez.'
export const MG_DIPNOT = 'Radyoloji teyidi şart.'

export const GORUNTU_MAX = 50 * 1024 * 1024
export const GORUNTU_RED_SERT = 100 * 1024 * 1024
export const GORUNTU_RED_ARSIV = 500 * 1024 * 1024

export const TIP_ETIKET: Record<GoruntuTip, string> = {
  xr: 'XR',
  ekg: 'EKG',
  goz: 'Göz',
  derm: 'Derm',
  mg: 'MG',
  us: 'US',
  ct: 'CT',
  mr: 'MR',
  pet: 'PET',
  diger: 'Diğer',
}

export const TIP_MODALITELER: Record<GoruntuTip, Modalite[]> = {
  xr: ['cxr', 'xr_kemik', 'xr_batin'],
  ekg: ['ekg'],
  goz: ['fundus', 'oct', 'dis_goz'],
  derm: ['derm', 'dermatoskopi', 'yara'],
  mg: ['mamografi'],
  us: ['us'],
  ct: ['pdf_rapor', 'ct'],
  mr: ['pdf_rapor', 'mr'],
  pet: ['pdf_rapor', 'pet'],
  diger: ['serbest', 'pdf_rapor'],
}

const HACIM = new Set<GoruntuTip>(['ct', 'mr', 'pet'])

export function modalityFinalIcin(tip: GoruntuTip, alt?: string | null): Modalite {
  const liste = TIP_MODALITELER[tip]
  if (alt && (liste as string[]).includes(alt)) return alt as Modalite
  return liste[0]
}

export function tipGecerli(ham: string | null | undefined): ham is GoruntuTip {
  return !!ham && ham in TIP_ETIKET
}

export function goruntuChip(tip: GoruntuTip, tarihIso: string | null | undefined, now = Date.now()): string {
  const etiket = TIP_ETIKET[tip]
  if (!tarihIso) return etiket
  const d = new Date(tarihIso.includes('T') ? tarihIso : `${tarihIso}T12:00:00+03:00`)
  if (Number.isNaN(d.getTime())) return etiket
  const ayniGun = new Date(now).toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' })
    === d.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' })
  if (ayniGun) return `${etiket} · bugün`
  return `${etiket} · ${d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', timeZone: 'Europe/Istanbul' })}`
}

const IZINLI: Record<string, true> = {
  'image/jpeg': true,
  'image/png': true,
  'image/webp': true,
  'application/pdf': true,
}

const US_VIDEO: Record<string, true> = {
  'video/mp4': true,
  'video/webm': true,
}

export function goruntuYuklemeReddi(g: {
  name?: string | null
  type?: string | null
  size: number
  tip: GoruntuTip
}): string | null {
  const ad = String(g.name || '').toLocaleLowerCase('tr-TR')
  const mime = String(g.type || '').toLowerCase()
  if (g.size >= GORUNTU_RED_ARSIV || /\.zip$|dicomdir|whole[-_ ]?(mr|ct|study)|2\s*gb/.test(ad)) {
    return 'Tüm MR/CT arşivi veya zip kabul edilmez. 1–3 anahtar kare ve rapor PDF yükleyin.'
  }
  if (g.size >= GORUNTU_RED_SERT) return 'Dosya 100 MB sınırını aşıyor.'
  if (g.size > GORUNTU_MAX) return 'V1 çalışma üst sınırı 50 MB (US kısa klip dahil).'
  if (HACIM.has(g.tip) && /\.(zip|tar|rar|7z)$/.test(ad)) {
    return 'Hacim arşivi yok — anahtar kare + rapor PDF.'
  }
  if (mime.startsWith('video/')) {
    if (g.tip !== 'us') return 'Video yalnız ultrason için.'
    if (!US_VIDEO[mime]) return 'Ultrason video: mp4 veya webm.'
  } else if (!IZINLI[mime] && !/\.(jpe?g|png|webp|pdf)$/.test(ad)) {
    return 'Kabul: JPEG, PNG, WebP, PDF. US için kısa mp4/webm.'
  }
  if (g.size > VAULT_MAX_BYTES) {
    return `Kasa şu an ${Math.round(VAULT_MAX_BYTES / (1024 * 1024))} MB. Anahtar kare veya kısa klip yükleyin.`
  }
  return null
}

export function hacimAiKapali(tip: GoruntuTip): boolean {
  return HACIM.has(tip)
}

/** Portal: yalnız hekim paylaştı. Ham AI / % / model adı yok. */
export function portaldaGorunurMu(row: {
  onay_durum: string
  tip: string
  modalite: string
  hekim_yorum?: string | null
}): boolean {
  if (row.onay_durum !== 'hasta_paylas') return false
  if (row.tip === 'mg' && !String(row.hekim_yorum || '').trim()) return false
  if (row.tip === 'goz' && row.modalite !== 'fundus') return false
  return true
}

export function portalOzeti(hekimYorum: string | null | undefined): string {
  const t = String(hekimYorum || '').trim()
  if (!t) return 'Görüntünüz dosyanıza eklendi. Değerlendirmeyi doktorunuz yapar.'
  return t.replace(/%\s*\d+|PASI|model|claude|güven/gi, '').slice(0, 140)
}

export function analizHref(patientId: string, belgeId: string, modalityFinal: Modalite): string {
  const q = new URLSearchParams({ modalityFinal, geriTab: 'goruntuleme', goruntu: '1' })
  return `/dashboard/doktor/hastalar/${encodeURIComponent(patientId)}/belgeler/${encodeURIComponent(belgeId)}?${q}`
}

/** XR/Göz/Derm/hacim: doktor alt tipi seçmeden kasaya alma / Değerlendir yok. */
export function altTipSecilmeli(tip: GoruntuTip): boolean {
  return TIP_MODALITELER[tip].length > 1
}

export function onayDurumDipnot(durum: string): string {
  if (durum === 'hasta_paylas') return 'Hastayla paylaşıldı. Portalda yalnız hekim yorumu görünür.'
  if (durum === 'hekim_onay' || durum === 'hekim_duzenledi') {
    return 'Hekim işledi. Portalda görünmesi için paylaşın.'
  }
  return TASLAK_DIPNOT
}

/** Portal yorumu: hekim özeti veya mevcut yorum. Ham Asistan ozeti asla. */
export function paylasimYorumu(g: {
  hekimOzet?: string | null
  mevcut?: string | null
  hamAsistan?: string | null
}): string | null {
  const t = String(g.hekimOzet || g.mevcut || '').trim()
  if (!t) return null
  if (g.hamAsistan && t === String(g.hamAsistan).trim()) return null
  return t.slice(0, 2000)
}
