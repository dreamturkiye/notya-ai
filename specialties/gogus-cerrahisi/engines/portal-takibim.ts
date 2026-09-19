/**
 * GOGUS-CERRAHISI-EXCEPTIONAL-01 — Sağlığım › "Göğüs Cerrahisi takibi" hatırlatmaları. SAF fonksiyon.
 * Hasta yüzünde YASAK: tanı adı, CAT/mMRC, GOLD, inhaler doz, ilaç dozu, "kanser/tümör".
 */
export type HatirlatmaDurum = 'gecikti' | 'yaklasiyor' | 'planli'

export type GcHatirlatma = { ad: string; due: string | null; durum: HatirlatmaDurum }

export const YAKLASIYOR_GUN = 7
const ISO = /^\d{4}-\d{2}-\d{2}$/

const GOREV_BASLIK: Array<[RegExp, string]> = [
  [/^preop|ameliyat.?[öo]ncesi/, 'Ameliyat öncesi hazırlık'],
  [/^tup_yara|toraks.?t[üu]p|yara|dren/, 'Tüp / yara kontrolü'],
  [/^patoloji/, 'Patoloji raporu kontrolü'],
  [/^goruntu|bt|xray|rapor/, 'Görüntü / rapor kontrolü'],
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

export interface TakibimGirdi {
  bugun: string
  gorevler: Array<{ kod: string; due: string | null }>
  sonrakiKontrolIso: string | null
}

export function takibimHatirlatmalari(g: TakibimGirdi): GcHatirlatma[] {
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

export function tupYaraHatirlatmalari(liste: GcHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Tüp / yara kontrolü').map((h) => ({ ad: h.ad, due: h.due }))
}

export function patolojiHatirlatmalari(liste: GcHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Patoloji raporu kontrolü').map((h) => ({ ad: h.ad, due: h.due }))
}

export function preopHatirlatmalari(liste: GcHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Ameliyat öncesi hazırlık').map((h) => ({ ad: h.ad, due: h.due }))
}

export const TAKIBIM_NOTU =
  'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Tarihleri muayenehaneniz belirler. Ani göğüs ağrısı ve nefes darlığı veya bol kanlı balgamda portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

export const GC_IPUCLARI: readonly string[] = [
  'Kontrol ve tüp / yara randevularınızı kaçırmayın.',
  'Toraks tüpünüz varsa yerinden çıkarsa hemen 112’yi arayın.',
  'İlaçlarınızı doktorunuzun söylediği şekilde kullanın; kendi başınıza miktar değiştirmeyin.',
]

/** Hasta yüzü yasak kelimeler: tanı, CAT/mMRC, doz. */
export function hastaDiliTemizMi(metin: string): boolean {
  return !/(tanı|tani|ICD|evre|stage|TNM|kanser|t[üu]m[öo]r|CAT\b|mMRC|GOLD\s*[ABCD]|inhaler doz|\bmg\b|malign|karsinom)/i.test(metin)
}
