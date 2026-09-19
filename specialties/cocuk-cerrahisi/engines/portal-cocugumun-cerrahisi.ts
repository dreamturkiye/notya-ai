/**
 * COCUK-CERRAHISI-EXCEPTIONAL-01 — Sağlığım › "Çocuğumun Cerrahisi". SAF.
 * YASAK: tanı, skor, doz, Neyzi, Hedef Boy, ICD.
 */
export type HatirlatmaDurum = 'gecikti' | 'yaklasiyor' | 'planli'

export type CcHatirlatma = { ad: string; due: string | null; durum: HatirlatmaDurum }

export const YAKLASIYOR_GUN = 7

const ISO = /^\d{4}-\d{2}-\d{2}$/

const GOREV_BASLIK: Array<[RegExp, string]> = [
  [/^preop|ameliyat|islem/, 'Ameliyat / işlem hazırlığı'],
  [/^postop|kontrol|izlem|vizit|randevu|hatirlatma/, 'Kontrol randevusu'],
  [/^yara|dren|dikis|pansuman/, 'Yara / pansuman kontrolü'],
  [/^onam|veli/, 'Onam / evrak tamamlaması'],
  [/^goruntu|rontgen|us|bt/, 'Görüntüleme randevusu'],
  [/^rapor|sgk|belge/, 'Belge / rapor işlemi'],
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

export interface CocugumunCerrahisiGirdi {
  bugun: string
  gorevler: Array<{ kod: string; due: string | null }>
  sonrakiKontrolIso: string | null
}

export function cocugumunCerrahisiHatirlatmalari(g: CocugumunCerrahisiGirdi): CcHatirlatma[] {
  const map = new Map<string, CcHatirlatma>()
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

export function sonrakiKontrol(liste: CcHatirlatma[]): { tarih: string; neden: string } | null {
  const aday = liste.find((h) => h.due && (h.durum === 'yaklasiyor' || h.durum === 'planli'))
  if (!aday?.due) return null
  return { tarih: aday.due, neden: aday.ad }
}

export function yaraHatirlatmalari(liste: CcHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => /Yara|pansuman|Dren|Dikiş/i.test(h.ad)).map((h) => ({ ad: h.ad, due: h.due }))
}

export function islemHatirlatmalari(liste: CcHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => /Ameliyat|işlem|Görüntüleme|Onam|Belge/i.test(h.ad)).map((h) => ({ ad: h.ad, due: h.due }))
}

export const COCUGUMUN_CERRAHISI_NOTU =
  'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Tarihleri muayenehaneniz belirler. Şiddetli karın ağrısı ve ateş/kusma, sıkışmış fıtık veya ameliyat sonrası kötüleşme varsa portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

export const CC_BAKIM_IPUCLARI: readonly string[] = [
  'Yara pansumanını doktorunuz söylemeden değiştirmeyin veya ıslatmayın.',
  'Ateş, kızarıklık, irin veya artan ağrı olursa muayenehaneyi arayın; acil bulgularda 112.',
  'Kontrol tarihini kaçırmayın; değiştirmek için muayenehanenizi arayın.',
  'İlaçları yalnızca doktorunuzun yazdığı şekilde kullanın.',
]

/** Hasta dilinde yasak kelime kilidi. */
export function hastaDiliTemizMi(metin: string): boolean {
  return !/(tan[ıi]|ICD|skor|doz|\bmg\b|mg\/kg|Neyzi|Hedef Boy|persentil|apandisit tanısı)/i.test(metin)
}
