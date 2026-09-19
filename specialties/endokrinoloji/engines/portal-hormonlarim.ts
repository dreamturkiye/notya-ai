/**
 * ENDOKRINOLOJI-EXCEPTIONAL-01 — Sağlığım › "Hormonlarım" hatırlatmaları. SAF fonksiyon.
 * Hasta yüzünde YASAK: tanı adı, HbA1c/TSH sayı/bandı, ilaç/etken madde, doz, "diyabet/hipotiroidi".
 */
export type HatirlatmaDurum = 'gecikti' | 'yaklasiyor' | 'planli'

export type EndoHatirlatma = { ad: string; due: string | null; durum: HatirlatmaDurum }

export const YAKLASIYOR_GUN = 7
const ISO = /^\d{4}-\d{2}-\d{2}$/

const GOREV_BASLIK: Array<[RegExp, string]> = [
  [/^hba1c|tsh|ft4|lab|kan.?tahlil/, 'Kan tahlili kontrolü'],
  [/^dxa|kemik/, 'Kemik yoğunluğu testi'],
  [/^rejim_insulin|insulin/, 'İnsülin rejim kontrolü'],
  [/^rejim_tiroid|tiroid.?rejim/, 'Tiroid rejim kontrolü'],
  [/^rapor|sgk|belge/, 'Belge / rapor işlemi'],
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

export interface HormonlarimGirdi {
  bugun: string
  gorevler: Array<{ kod: string; due: string | null }>
  sonrakiKontrolIso: string | null
}

export function hormonlarimHatirlatmalari(g: HormonlarimGirdi): EndoHatirlatma[] {
  const map = new Map<string, EndoHatirlatma>()
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

export function sonrakiKontrol(liste: EndoHatirlatma[]): { tarih: string; neden: string } | null {
  const aday = liste.find((h) => h.due && (h.durum === 'yaklasiyor' || h.durum === 'planli'))
  if (!aday?.due) return null
  return { tarih: aday.due, neden: aday.ad }
}

export function labHatirlatmalari(liste: EndoHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Kan tahlili kontrolü').map((h) => ({ ad: h.ad, due: h.due }))
}

export function dxaHatirlatmalari(liste: EndoHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Kemik yoğunluğu testi').map((h) => ({ ad: h.ad, due: h.due }))
}

export function rejimHatirlatmalari(liste: EndoHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => /rejim kontrolü/.test(h.ad)).map((h) => ({ ad: h.ad, due: h.due }))
}

export const HORMONLARIM_NOTU =
  'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Tarihleri muayenehaneniz belirler. Ciddi hipoglisemi, kusma ile bilinç değişikliği veya ani aşırı halsizlikte portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

export const ENDO_IPUCLARI: readonly string[] = [
  'İlaçlarınızı doktorunuzun söylediği şekilde kullanın; kendi başınıza miktar değiştirmeyin.',
  'Kan tahlili veya kemik testi randevunuz varsa tarihi kaçırmayın.',
  'Ciddi hipoglisemi veya ani bilinç bulanıklığında 112’yi arayın.',
]

/** Hasta yüzü yasak kelimeler: tanı, lab sayı/band, etken madde, mg/IU. */
export function hastaDiliTemizMi(metin: string): boolean {
  return !/(tanı|tani|ICD|HbA1c|TSH|FT4|diyabet|hipotiroid|hipertiroid|osteoporoz|T-skor|skor|bant|\bmg\b|\bIU\b|ünite|insülin dozu|levotiroksin)/i.test(metin)
}
