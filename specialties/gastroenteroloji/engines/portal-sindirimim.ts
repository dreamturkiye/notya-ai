/**
 * GASTROENTEROLOJI-EXCEPTIONAL-01 — Sağlığım › "Sindirimim" hatırlatmaları. SAF fonksiyon.
 * Hasta yüzünde YASAK: tanı adı, skor/band, ilaç/etken madde, doz, "Crohn/ÜK/HBV".
 */
export type HatirlatmaDurum = 'gecikti' | 'yaklasiyor' | 'planli'

export type GastroHatirlatma = { ad: string; due: string | null; durum: HatirlatmaDurum }

export const YAKLASIYOR_GUN = 7
const ISO = /^\d{4}-\d{2}-\d{2}$/

const GOREV_BASLIK: Array<[RegExp, string]> = [
  [/^skor|mayo|hbi|ibs/, 'Takip formu kontrolü'],
  [/^hbv|hcv|hepatit|lab/, 'Kan tahlili kontrolü'],
  [/^endoskopi|kolonoskopi|egd|eus|ercp/, 'Endoskopi kontrolü'],
  [/^rejim_ppi|ppi/, 'Mide koruyucu rejim kontrolü'],
  [/^rejim_biyolojik|biyolojik/, 'Biyolojik tedavi kontrolü'],
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

export interface SindirimimGirdi {
  bugun: string
  gorevler: Array<{ kod: string; due: string | null }>
  sonrakiKontrolIso: string | null
}

export function sindirimimHatirlatmalari(g: SindirimimGirdi): GastroHatirlatma[] {
  const map = new Map<string, GastroHatirlatma>()
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

export function sonrakiKontrol(liste: GastroHatirlatma[]): { tarih: string; neden: string } | null {
  const aday = liste.find((h) => h.due && (h.durum === 'yaklasiyor' || h.durum === 'planli'))
  if (!aday?.due) return null
  return { tarih: aday.due, neden: aday.ad }
}

export function skorHatirlatmalari(liste: GastroHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Takip formu kontrolü').map((h) => ({ ad: h.ad, due: h.due }))
}

export function hepatitHatirlatmalari(liste: GastroHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Kan tahlili kontrolü').map((h) => ({ ad: h.ad, due: h.due }))
}

export function endoskopiHatirlatmalari(liste: GastroHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Endoskopi kontrolü').map((h) => ({ ad: h.ad, due: h.due }))
}

export function rejimHatirlatmalari(liste: GastroHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => /rejim kontrolü|tedavi kontrolü/.test(h.ad)).map((h) => ({ ad: h.ad, due: h.due }))
}

export const SINDIRIMIM_NOTU =
  'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Tarihleri muayenehaneniz belirler. Kanlı kusma, siyah dışkı, ani şiddetli karın ağrısı veya bilinç bulanıklığında portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

export const GASTRO_IPUCLARI: readonly string[] = [
  'İlaçlarınızı doktorunuzun söylediği şekilde kullanın; kendi başınıza miktar değiştirmeyin.',
  'Kan tahlili veya endoskopi randevunuz varsa tarihi kaçırmayın.',
  'Kanlı kusma veya siyah dışkıda 112’yi arayın.',
]

/** Hasta yüzü yasak kelimeler: tanı, skor/band, etken madde, mg. */
export function hastaDiliTemizMi(metin: string): boolean {
  return !/(tanı|tani|ICD|Mayo|HBI|IBS-SSS|Crohn|ülseratif|ulseratif|HBV|HCV|siroz|skor|bant|\bmg\b|antiviral|biyolojik doz)/i.test(metin)
}
