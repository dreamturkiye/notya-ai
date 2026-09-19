/**
 * GENEL-CERRAHI-EXCEPTIONAL-01 — Sağlığım › "Ameliyatım" hatırlatmaları. SAF fonksiyon.
 * Hasta yüzünde YASAK: tanı adı, patoloji sonucu, doz, OR slot, "kanser/malign".
 */
export type HatirlatmaDurum = 'gecikti' | 'yaklasiyor' | 'planli'

export type GcHatirlatma = { ad: string; due: string | null; durum: HatirlatmaDurum }

export const YAKLASIYOR_GUN = 7
const ISO = /^\d{4}-\d{2}-\d{2}$/

const GOREV_BASLIK: Array<[RegExp, string]> = [
  [/^preop|ameliyat|islem.?gun/, 'Ameliyat / işlem günü'],
  [/^yara|dren|dikis/, 'Yara / dren kontrolü'],
  [/^patoloji|rapor/, 'Rapor takibi'],
  [/^taburcu/, 'Taburcu sonrası kontrol'],
  [/^goruntu|bt|us|mri/, 'Görüntüleme randevusu'],
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

export interface AmeliyatimGirdi {
  bugun: string
  gorevler: Array<{ kod: string; due: string | null }>
  sonrakiKontrolIso: string | null
}

export function ameliyatimHatirlatmalari(g: AmeliyatimGirdi): GcHatirlatma[] {
  const map = new Map<string, GcHatirlatma>()
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

export function sonrakiKontrol(liste: GcHatirlatma[]): { tarih: string; neden: string } | null {
  const aday = liste.find((h) => h.due && (h.durum === 'yaklasiyor' || h.durum === 'planli'))
  if (!aday?.due) return null
  return { tarih: aday.due, neden: aday.ad }
}

export function ameliyatHatirlatmalari(liste: GcHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => /Ameliyat|işlem/i.test(h.ad)).map((h) => ({ ad: h.ad, due: h.due }))
}

export function yaraHatirlatmalari(liste: GcHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => /Yara|dren|Taburcu/i.test(h.ad)).map((h) => ({ ad: h.ad, due: h.due }))
}

export function raporHatirlatmalari(liste: GcHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => /Rapor|Görüntüleme/i.test(h.ad)).map((h) => ({ ad: h.ad, due: h.due }))
}

export const AMELIYATIM_NOTU =
  'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Tarihleri muayenehaneniz belirler. Şiddetli karın ağrısı ve ateş/kusma, bol kanama, sıkışmış fıtık veya ameliyat sonrası kötüleşme varsa portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

export const GC_IPUCLARI: readonly string[] = [
  'Ameliyat ve kontrol randevularınızı kaçırmayın; değiştirmek için muayenehanenizi arayın.',
  'Yara bakımını doktorunuzun söylediği şekilde yapın; kendi başınıza pansuman değiştirmeyin.',
  'İlaçları yalnızca doktorunuzun yazdığı şekilde kullanın.',
  'Acil bulgularda 112’yi arayın.',
]

/** Hasta yüzü yasak kelimeler. */
export function hastaDiliTemizMi(metin: string): boolean {
  return !/(tan[ıi]|ICD|malign|benign kesin|evre|stage|TNM|kanser|doz|\bmg\b|OR slot|ameliyathane plan)/i.test(metin)
}
