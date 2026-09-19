/**
 * FIZIK-TEDAVI-EXCEPTIONAL-01 — Sağlığım › "FTR'm" hatırlatmaları. SAF fonksiyon.
 * Hasta yüzünde YASAK: tanı adı, VAS/ODI skoru/bandı, ilaç/etken madde, doz, klinik etiket.
 */
export type HatirlatmaDurum = 'gecikti' | 'yaklasiyor' | 'planli'

export type FtrHatirlatma = { ad: string; due: string | null; durum: HatirlatmaDurum }

export const YAKLASIYOR_GUN = 7
const ISO = /^\d{4}-\d{2}-\d{2}$/

const GOREV_BASLIK: Array<[RegExp, string]> = [
  [/^seans|ftr_seans|modalite/, 'Tedavi seansı'],
  [/^egzersiz|ev_egzersiz|home/, 'Ev egzersiz kontrolü'],
  [/^vas|odi|olcek|ölçek|form/, 'Ağrı / fonksiyon formu'],
  [/^rapor|sgk|belge|ortez/, 'Belge / rapor işlemi'],
  [/^kontrol|izlem|vizit|randevu|hatirlatma/, 'Kontrol randevusu'],
]

export function gorevBasligi(kod: string | null | undefined): string {
  const k = String(kod || '').toLocaleLowerCase('tr-TR')
  for (const [re, ad] of GOREV_BASLIK) if (re.test(k)) return ad
  return 'Kontrol randevusu'
}

export function hatirlatmaDurumu(due: string | null, bugun: string): HatirlatmaDurum {
  if (!due || !ISO.test(due) || !ISO.test(bugun)) return 'planli'
  const a = Date.parse(due + 'T12:00:00Z')
  const b = Date.parse(bugun + 'T12:00:00Z')
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 'planli'
  const fark = Math.round((a - b) / 86400000)
  if (fark < 0) return 'gecikti'
  return fark <= YAKLASIYOR_GUN ? 'yaklasiyor' : 'planli'
}

export interface FtrmGirdi {
  bugun: string
  gorevler: Array<{ kod: string; due: string | null }>
  sonrakiKontrolIso: string | null
}

export function ftrmHatirlatmalari(g: FtrmGirdi): FtrHatirlatma[] {
  const map = new Map<string, FtrHatirlatma>()
  for (const gorev of g.gorevler) {
    const ad = gorevBasligi(gorev.kod)
    const due = gorev.due && ISO.test(gorev.due.slice(0, 10)) ? gorev.due.slice(0, 10) : null
    const key = `${ad}|${due || ''}`
    if (map.has(key)) continue
    map.set(key, { ad, due, durum: hatirlatmaDurumu(due, g.bugun) })
  }
  if (g.sonrakiKontrolIso && ISO.test(g.sonrakiKontrolIso.slice(0, 10))) {
    const due = g.sonrakiKontrolIso.slice(0, 10)
    const ad = 'Kontrol randevusu'
    const key = `${ad}|${due}`
    if (!map.has(key)) map.set(key, { ad, due, durum: hatirlatmaDurumu(due, g.bugun) })
  }
  return [...map.values()].sort((a, b) => {
    if (!a.due) return b.due ? 1 : 0
    if (!b.due) return -1
    return a.due.localeCompare(b.due)
  })
}

export function sonrakiKontrol(liste: FtrHatirlatma[]): { tarih: string; neden: string } | null {
  const aday = liste.find((h) => h.due && (h.durum === 'yaklasiyor' || h.durum === 'planli'))
  if (!aday?.due) return null
  return { tarih: aday.due, neden: aday.ad }
}

export function seansHatirlatmalari(liste: FtrHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Tedavi seansı').map((h) => ({ ad: h.ad, due: h.due }))
}

export function egzersizHatirlatmalari(liste: FtrHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Ev egzersiz kontrolü' || h.ad === 'Ağrı / fonksiyon formu').map((h) => ({ ad: h.ad, due: h.due }))
}

export const FTRM_NOTU =
  'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Tarihleri muayenehaneniz belirler. Ani idrar kaçırma, oturak uyuşukluğu, ilerleyici güç kaybı veya ateşle birlikte bel ağrısında portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

export const FTR_IPUCLARI: readonly string[] = [
  'Ev egzersizlerinizi doktorunuzun söylediği şekilde yapın; ağrı artarsa durun ve muayenehaneyi arayın.',
  'Seans randevularına düzenli gelmek tedavinin parçasıdır.',
  'Yeni uyuşukluk, güç kaybı veya ateş olursa muayenehanenizi arayın; acil durumda 112.',
]

/** Hasta yüzü yasak kelimeler: tanı, VAS/ODI skor, etken madde, mg. */
export function hastaDiliTemizMi(metin: string): boolean {
  return !/(tanı|tani|ICD|VAS\s*\d|ODI\s*%|skor|bant|disk herni|cauda|\bmg\b|mg\/kg|ilaç dozu)/i.test(metin)
}
