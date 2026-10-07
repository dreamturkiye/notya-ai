/**
 * MBYS-YARDIMCI-01 — the record Notya hands to the browser helper, and the pre-send checks.
 *
 * Kaan (2026-10-07): the doctor copies every field from the e-Nabız tool into the Ministry's MBYS web form by hand.
 * The helper (extensions/mbys-yardimci) removes the copy-paste; this module decides what a "ready" record is so
 * nothing bounces at the Ministry screen. Pure: no IO, no DOM — the route builds the record, the queue page shows
 * the checks, the extension fills the form. Notya never talks to a Ministry address (live_write stays false).
 */

export const MBYS_KAYIT_SURUM = 1 as const

export type MbysKayitTuru = 'vatandas' | 'yabanci' | 'vatansiz'

export const MBYS_KAYIT_TURU_AD: Record<MbysKayitTuru, string> = {
  vatandas: 'T.C. vatandaşı',
  yabanci: 'Yabancı',
  vatansiz: 'Vatansız',
}

/** E = Erkek, K = Kadın — the helper maps them to the form's own option texts (harita.json). */
export type MbysCinsiyet = 'E' | 'K' | ''

export type MbysKimlik = {
  tcKimlikNo: string
  pasaportNo: string
  sahisNo: string
  ad: string
  soyad: string
  cinsiyet: MbysCinsiyet
  /** YYYY-MM-DD; the helper converts to the form's format. */
  dogumTarihi: string
  /** 'TR' for a citizen; for others the country as the doctor wrote it. */
  uyruk: string
}

export type MbysMuayene = {
  sikayet: string
  hikaye: string
  bulgu: string
  aciklama: string
  boy: string
  kilo: string
  muayeneTuru: string
  vakaTuru: string
  ozellikliHizmet: string
}

export type MbysTani = { kod: string; ad: string }

export type MbysKayit = {
  surum: typeof MBYS_KAYIT_SURUM
  kayitTuru: MbysKayitTuru | ''
  kimlik: MbysKimlik
  /** null when the caller may only register the patient (ön büro): screen 2 is the physician's. */
  muayene: MbysMuayene | null
  tanilar: MbysTani[]
  hazirlandi: string
}

export type MbysAyar = { muayeneTuru: string; vakaTuru: string }

/** Unverified against the live form — the doctor can change both in the queue's settings. */
export const MBYS_VARSAYILAN_AYAR: MbysAyar = { muayeneTuru: 'Normal Muayene', vakaTuru: 'Normal Vaka' }

export const MBYS_MUAYENE_TURU_ONERI = ['Normal Muayene', 'Kontrol Muayenesi', 'Konsültasyon'] as const
export const MBYS_VAKA_TURU_ONERI = ['Normal Vaka', 'Adli Vaka', 'İş Kazası', 'Trafik Kazası'] as const

export function mbysAyarCoz(ham: unknown): MbysAyar {
  const o = ham && typeof ham === 'object' ? (ham as Record<string, unknown>) : {}
  const m = String(o.muayeneTuru ?? '').trim()
  const v = String(o.vakaTuru ?? '').trim()
  return { muayeneTuru: m || MBYS_VARSAYILAN_AYAR.muayeneTuru, vakaTuru: v || MBYS_VARSAYILAN_AYAR.vakaTuru }
}

// ─── Checks ────────────────────────────────────────────────────────────────────────────────────

/** T.C. kimlik no: 11 digits, first not 0, digit 10 and 11 are the official checksums. */
export function tcKimlikGecerli(ham: string | null | undefined): boolean {
  const s = String(ham ?? '').trim()
  if (!/^[1-9][0-9]{10}$/.test(s)) return false
  const d = s.split('').map(Number)
  const tek = d[0] + d[2] + d[4] + d[6] + d[8]
  const cift = d[1] + d[3] + d[5] + d[7]
  const on = (((tek * 7 - cift) % 10) + 10) % 10
  if (on !== d[9]) return false
  const toplam = d.slice(0, 10).reduce((a, b) => a + b, 0)
  return toplam % 10 === d[10]
}

/** Upper-case, dot after the category: "j069" → "J06.9", " Z00.0 " → "Z00.0". */
export function icd10Normalize(ham: string | null | undefined): string {
  const s = String(ham ?? '').trim().toUpperCase().replace(/\s+/g, '')
  const m = /^([A-Z][0-9]{2})\.?([0-9A-Z]{0,4})$/.exec(s)
  if (!m) return s
  return m[2] ? `${m[1]}.${m[2]}` : m[1]
}

export function icd10Gecerli(ham: string | null | undefined): boolean {
  return /^[A-Z][0-9]{2}(\.[0-9A-Z]{1,4})?$/.test(icd10Normalize(ham))
}

/** "172", "172,5", "17.4" → true; "" is "not present" and checked by the caller. */
export function sayiMi(ham: string | null | undefined): boolean {
  const s = String(ham ?? '').trim().replace(',', '.')
  return /^[0-9]+(\.[0-9]+)?$/.test(s) && Number(s) > 0
}

function tarihGecerli(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  const t = new Date(`${iso}T00:00:00Z`)
  return !Number.isNaN(t.getTime()) && t.toISOString().slice(0, 10) === iso && t.getTime() <= Date.now()
}

/** Where the queue sends the doctor to fix a finding. */
export type MbysDuzelt = 'kimlik' | 'not' | 'ayar' | 'yok'

export type MbysEksik = { alan: string; mesaj: string; duzelt: MbysDuzelt }

const bos = (v: string | null | undefined) => !String(v ?? '').trim()

export function mbysKontrol(k: MbysKayit): MbysEksik[] {
  const e: MbysEksik[] = []
  const ekle = (alan: string, mesaj: string, duzelt: MbysDuzelt) => e.push({ alan, mesaj, duzelt })
  const i = k.kimlik

  if (!k.kayitTuru) ekle('kayitTuru', 'Kayıt türü seçilmedi', 'kimlik')
  if (k.kayitTuru === 'vatandas') {
    if (bos(i.tcKimlikNo)) ekle('tcKimlikNo', 'T.C. kimlik no yok', 'kimlik')
    else if (!tcKimlikGecerli(i.tcKimlikNo)) ekle('tcKimlikNo', 'T.C. kimlik no geçersiz (11 hane / kontrol hanesi tutmuyor)', 'kimlik')
  } else if (k.kayitTuru === 'yabanci') {
    if (bos(i.pasaportNo)) ekle('pasaportNo', 'Pasaport no yok', 'kimlik')
  } else if (k.kayitTuru === 'vatansiz') {
    if (bos(i.sahisNo)) ekle('sahisNo', 'Şahıs numarası yok', 'kimlik')
  }
  if (bos(i.ad)) ekle('ad', 'Ad yok', 'kimlik')
  if (bos(i.soyad)) ekle('soyad', 'Soyad yok', 'kimlik')
  if (i.cinsiyet !== 'E' && i.cinsiyet !== 'K') ekle('cinsiyet', 'Cinsiyet yok', 'kimlik')
  if (bos(i.dogumTarihi)) ekle('dogumTarihi', 'Doğum tarihi yok', 'kimlik')
  else if (!tarihGecerli(i.dogumTarihi)) ekle('dogumTarihi', 'Doğum tarihi geçersiz', 'kimlik')
  if (bos(i.uyruk)) ekle('uyruk', 'Uyruk yok', 'kimlik')

  // Screen 2 is checked only when this caller hands it over (the physician).
  if (k.muayene) {
    const m = k.muayene
    if (!k.tanilar.length) ekle('tani', 'ICD-10 kodlu tanı yok', 'not')
    for (const t of k.tanilar) if (!icd10Gecerli(t.kod)) ekle('tani', `Geçersiz ICD-10 kodu: ${t.kod || '—'}`, 'not')
    if (bos(m.sikayet)) ekle('sikayet', 'Şikayet boş', 'not')
    if (bos(m.hikaye)) ekle('hikaye', 'Hikaye boş', 'not')
    if (bos(m.bulgu)) ekle('bulgu', 'Bulgu / gözlem boş', 'not')
    if (!bos(m.boy) && !sayiMi(m.boy)) ekle('boy', `Boy sayı değil: ${m.boy}`, 'not')
    if (!bos(m.kilo) && !sayiMi(m.kilo)) ekle('kilo', `Kilo sayı değil: ${m.kilo}`, 'not')
    if (bos(m.muayeneTuru)) ekle('muayeneTuru', 'Muayene türü yok', 'ayar')
    if (bos(m.vakaTuru)) ekle('vakaTuru', 'Vaka türü yok', 'ayar')
  }
  return e
}

/** What the queue shows. Only Aktarıldı / Kaydedildi are stored; Hazır / Eksik are computed live. */
export type MbysDurum = 'hazir' | 'eksik' | 'aktarildi' | 'kaydedildi'

export const MBYS_DURUM_AD: Record<MbysDurum, string> = {
  hazir: 'Hazır',
  eksik: 'Eksik',
  aktarildi: 'Aktarıldı',
  kaydedildi: 'Kaydedildi',
}

export function mbysDurum(eksikler: MbysEksik[], kayitli: string | null | undefined): MbysDurum {
  if (kayitli === 'kaydedildi') return 'kaydedildi'
  if (kayitli === 'aktarildi') return 'aktarildi'
  return eksikler.length ? 'eksik' : 'hazir'
}

export function mbysDurumCoz(ham: unknown): 'aktarildi' | 'kaydedildi' | null {
  return ham === 'aktarildi' || ham === 'kaydedildi' ? ham : null
}

// ─── Clipboard fallback ────────────────────────────────────────────────────────────────────────

function trTarih(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso
}

/** Plain text in MBYS screen order, for doctors without the helper. */
export function mbysDuzMetin(k: MbysKayit): string {
  const i = k.kimlik
  const s = (etiket: string, deger: string) => `${etiket}: ${String(deger || '').trim() || '—'}`
  const satir: string[] = ['— MBYS · Hasta Kayıt —', s('Kayıt türü', k.kayitTuru ? MBYS_KAYIT_TURU_AD[k.kayitTuru] : '')]
  if (k.kayitTuru === 'yabanci') satir.push(s('Pasaport No', i.pasaportNo))
  else if (k.kayitTuru === 'vatansiz') satir.push(s('Şahıs Numarası', i.sahisNo))
  else satir.push(s('Hasta T.C.', i.tcKimlikNo))
  satir.push(
    s('Hasta Adı', i.ad),
    s('Hasta Soyadı', i.soyad),
    s('Cinsiyet', i.cinsiyet === 'K' ? 'Kadın' : i.cinsiyet === 'E' ? 'Erkek' : ''),
    s('Doğum Tarihi', trTarih(i.dogumTarihi)),
    s('Uyruk', i.uyruk === 'TR' ? 'Türkiye' : i.uyruk),
  )
  if (k.muayene) {
    const m = k.muayene
    satir.push(
      '',
      '— MBYS · Muayene —',
      s('Muayene türü', m.muayeneTuru),
      s('Vaka türü', m.vakaTuru),
      s('Şikayet', m.sikayet),
      s('Hikaye', m.hikaye),
      s('Bulgu / Gözlem', m.bulgu),
      s('Açıklama', m.aciklama),
      s('Boy (cm)', m.boy),
      s('Kilo (kg)', m.kilo),
      s('Tanılar (ICD-10)', k.tanilar.map((t) => `${t.kod}${t.ad ? ` ${t.ad}` : ''}`).join(', ')),
    )
  }
  return satir.join('\n')
}
