/**
 * BEYIN-CERRAHISI-EXCEPTIONAL-01 — Sağlığım › "Beyin Cerrahisi takibi" hatırlatmaları. SAF fonksiyon.
 * Hasta yüzünde YASAK: tanı adı, AED doz, migren/inme skoru, ameliyat tekniği detayı.
 */
export type HatirlatmaDurum = 'gecikti' | 'yaklasiyor' | 'planli'

export type BeyinHatirlatma = { ad: string; due: string | null; durum: HatirlatmaDurum }

export const YAKLASIYOR_GUN = 7
const ISO = /^\d{4}-\d{2}-\d{2}$/

const GOREV_BASLIK: Array<[RegExp, string]> = [
  [/^postop|yara|pansuman/, 'Ameliyat sonrası kontrol'],
  [/^bilinc|nobet/, 'İzlem kontrolü'],
  [/^goruntu|bt|mri|rapor|belge/, 'Görüntü / belge kontrolü'],
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

export interface BeyinTakipGirdi {
  bugun: string
  gorevler: Array<{ kod: string; due: string | null }>
  sonrakiKontrolIso: string | null
}

export function beyinTakipHatirlatmalari(g: BeyinTakipGirdi): BeyinHatirlatma[] {
  const map = new Map<string, BeyinHatirlatma>()
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

export function sonrakiKontrol(liste: BeyinHatirlatma[]): { tarih: string; neden: string } | null {
  const aday = liste.find((h) => h.due && (h.durum === 'yaklasiyor' || h.durum === 'planli'))
  if (!aday?.due) return null
  return { tarih: aday.due, neden: aday.ad }
}

export function postopHatirlatmalari(liste: BeyinHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Ameliyat sonrası kontrol').map((h) => ({ ad: h.ad, due: h.due }))
}

export function goruntuHatirlatmalari(liste: BeyinHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Görüntü / belge kontrolü').map((h) => ({ ad: h.ad, due: h.due }))
}

export function izlemHatirlatmalari(liste: BeyinHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'İzlem kontrolü').map((h) => ({ ad: h.ad, due: h.due }))
}

export const BEYIN_TAKIP_NOTU =
  'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Tarihleri muayenehaneniz belirler. Ani bilinç kaybı, yeni güçsüzlük veya yara sızıntısında portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

export const BEYIN_IPUCLARI: readonly string[] = [
  'Kontrol randevularınızı kaçırmayın.',
  'İlaçlarınızı doktorunuzun söylediği şekilde kullanın; kendi başınıza miktar değiştirmeyin.',
  'Ani bilinç kaybı veya yeni güçsüzlükte 112’yi arayın.',
]

/** Hasta yüzü yasak kelimeler: tanı, AED doz, migren/inme skoru. */
export function hastaDiliTemizMi(metin: string): boolean {
  return !/(tanı|tani|ICD|migren|inme|stroke|MIDAS|AED dozu|\bmg\b|antiepileptik dozu|glikom|metastaz)/i.test(metin)
}
