/**
 * ROMATOLOJI-EXCEPTIONAL-01 — Sağlığım › "Romatizmam" hatırlatmaları. SAF fonksiyon.
 * Hasta yüzünde YASAK: tanı adı, DAS28/BASDAI sayı/bandı, ilaç/etken madde, doz, "romatoid/lupus".
 */
export type HatirlatmaDurum = 'gecikti' | 'yaklasiyor' | 'planli'

export type RomaHatirlatma = { ad: string; due: string | null; durum: HatirlatmaDurum }

export const YAKLASIYOR_GUN = 7
const ISO = /^\d{4}-\d{2}-\d{2}$/

const GOREV_BASLIK: Array<[RegExp, string]> = [
  [/^crp|esr|lab|kan.?tahlil/, 'Kan tahlili kontrolü'],
  [/^das28|basdai|skor|aktivite/, 'Eklem takip kontrolü'],
  [/^biyolojik|sut|rapor|belge/, 'Belge / rapor işlemi'],
  [/^eklem|harita/, 'Eklem muayene kontrolü'],
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

export interface RomatizmamGirdi {
  bugun: string
  gorevler: Array<{ kod: string; due: string | null }>
  sonrakiKontrolIso: string | null
}

export function romatizmamHatirlatmalari(g: RomatizmamGirdi): RomaHatirlatma[] {
  const map = new Map<string, RomaHatirlatma>()
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

export function sonrakiKontrol(liste: RomaHatirlatma[]): { tarih: string; neden: string } | null {
  const aday = liste.find((h) => h.due && (h.durum === 'yaklasiyor' || h.durum === 'planli'))
  if (!aday?.due) return null
  return { tarih: aday.due, neden: aday.ad }
}

export function labHatirlatmalari(liste: RomaHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Kan tahlili kontrolü').map((h) => ({ ad: h.ad, due: h.due }))
}

export function skorHatirlatmalari(liste: RomaHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Eklem takip kontrolü' || h.ad === 'Eklem muayene kontrolü').map((h) => ({ ad: h.ad, due: h.due }))
}

export function belgeHatirlatmalari(liste: RomaHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Belge / rapor işlemi').map((h) => ({ ad: h.ad, due: h.due }))
}

export const ROMATIZMAM_NOTU =
  'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Tarihleri muayenehaneniz belirler. Ateşli sıcak eklem, ani nefes darlığı veya bilinç değişikliğinde portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

export const ROMA_IPUCLARI: readonly string[] = [
  'İlaçlarınızı doktorunuzun söylediği şekilde kullanın; kendi başınıza miktar değiştirmeyin.',
  'Kan tahlili veya kontrol randevunuz varsa tarihi kaçırmayın.',
  'Ateşli sıcak eklem veya ani nefes darlığında 112’yi arayın.',
]

/** Hasta yüzü yasak kelimeler: tanı, skor sayı/band, etken madde, mg. */
export function hastaDiliTemizMi(metin: string): boolean {
  return !/(tanı|tani|ICD|DAS28|BASDAI|romatoid|ankilozan|lupus|SLE|skor|bant|\bmg\b|biyolojik doz|infüzyon)/i.test(metin)
}
