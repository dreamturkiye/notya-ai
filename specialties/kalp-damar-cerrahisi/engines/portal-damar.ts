/**
 * KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01 — Sağlığım › "Damar Cerrahisi takibi". SAF fonksiyon.
 * Hasta yüzünde YASAK: tanı adı, SCORE2, Kalbim, ilaç dozu, INR hedef.
 */
export type HatirlatmaDurum = 'gecikti' | 'yaklasiyor' | 'planli'

export type KdcHatirlatma = { ad: string; due: string | null; durum: HatirlatmaDurum }

export const YAKLASIYOR_GUN = 7
const ISO = /^\d{4}-\d{2}-\d{2}$/

const GOREV_BASLIK: Array<[RegExp, string]> = [
  [/^preop|ameliyat.?[öo]ncesi/, 'Ameliyat öncesi hazırlık'],
  [/^greft_yara|greft|yara|bypass|stent/, 'Greft / yara kontrolü'],
  [/^antikoag/, 'İlaç izlem / lab vadesi'],
  [/^goruntu|bt|eko|rapor/, 'Görüntü / rapor kontrolü'],
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

export interface DamarTakipGirdi {
  bugun: string
  gorevler: Array<{ kod: string; due: string | null }>
  sonrakiKontrolIso: string | null
}

export function damarHatirlatmalari(g: DamarTakipGirdi): KdcHatirlatma[] {
  const map = new Map<string, KdcHatirlatma>()
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

export function sonrakiKontrol(liste: KdcHatirlatma[]): { tarih: string; neden: string } | null {
  const aday = liste.find((h) => h.due && (h.durum === 'yaklasiyor' || h.durum === 'planli'))
  if (!aday?.due) return null
  return { tarih: aday.due, neden: aday.ad }
}

export function greftYaraHatirlatmalari(liste: KdcHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Greft / yara kontrolü').map((h) => ({ ad: h.ad, due: h.due }))
}

export function antikoagHatirlatmalari(liste: KdcHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'İlaç izlem / lab vadesi').map((h) => ({ ad: h.ad, due: h.due }))
}

export function preopHatirlatmalari(liste: KdcHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Ameliyat öncesi hazırlık').map((h) => ({ ad: h.ad, due: h.due }))
}

export const DAMAR_TAKIP_NOTU =
  'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Tarihleri muayenehaneniz belirler. Ani soğuk ekstremite, greft bölgesinde bol kanama veya yırtıcı göğüs/sırt ağrısında portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

export const KDC_IPUCLARI: readonly string[] = [
  'Kontrol ve greft / yara randevularınızı kaçırmayın.',
  'İlaçlarınızı doktorunuzun söylediği şekilde kullanın; kendi başınıza miktar değiştirmeyin.',
  'El veya ayağınız aniden soğuk/soluk olursa hemen 112’yi arayın.',
]

/** Hasta yüzü yasak kelimeler: tanı, SCORE2, doz. */
export function hastaDiliTemizMi(metin: string): boolean {
  return !/(tanı|tani|ICD|evre|stage|SCORE\s*2|SCORE2|Kalbim|\bmg\b|INR\s*hedef|malign|tromboz tan[ıi])/i.test(metin)
}
