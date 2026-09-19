/**
 * ENFEKSIYON-EXCEPTIONAL-01 — Sağlığım › "Enfeksiyon Takibim" hatırlatmaları. SAF fonksiyon.
 * Hasta yüzünde YASAK: tanı adı, CD4/viral sayı, ilaç/etken madde, doz, "HIV/hepatit tanısı".
 */
export type HatirlatmaDurum = 'gecikti' | 'yaklasiyor' | 'planli'

export type EnfHatirlatma = { ad: string; due: string | null; durum: HatirlatmaDurum }

export const YAKLASIYOR_GUN = 7
const ISO = /^\d{4}-\d{2}-\d{2}$/

const GOREV_BASLIK: Array<[RegExp, string]> = [
  [/^viral|hiv|hbv|hcv|cd4|lab|kan.?tahlil/, 'Kan tahlili kontrolü'],
  [/^atb/, 'İlaç süre kontrolü'],
  [/^izolasyon|bildirim/, 'İzolasyon / takip kontrolü'],
  [/^asi|as[ıi]/, 'Aşı hatırlatması'],
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

export interface EnfeksiyonTakibimGirdi {
  bugun: string
  gorevler: Array<{ kod: string; due: string | null }>
  sonrakiKontrolIso: string | null
}

export function enfeksiyonTakibimHatirlatmalari(g: EnfeksiyonTakibimGirdi): EnfHatirlatma[] {
  const map = new Map<string, EnfHatirlatma>()
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

export function sonrakiKontrol(liste: EnfHatirlatma[]): { tarih: string; neden: string } | null {
  const aday = liste.find((h) => h.due && (h.durum === 'yaklasiyor' || h.durum === 'planli'))
  if (!aday?.due) return null
  return { tarih: aday.due, neden: aday.ad }
}

export function viralHatirlatmalari(liste: EnfHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Kan tahlili kontrolü').map((h) => ({ ad: h.ad, due: h.due }))
}

export function atbHatirlatmalari(liste: EnfHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'İlaç süre kontrolü').map((h) => ({ ad: h.ad, due: h.due }))
}

export function izolasyonHatirlatmalari(liste: EnfHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'İzolasyon / takip kontrolü').map((h) => ({ ad: h.ad, due: h.due }))
}

export const ENFEKSIYON_TAKIBIM_NOTU =
  'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Tarihleri muayenehaneniz belirler. Yüksek ateş ile bilinç bulanıklığı, boyun sertliği veya yaygın döküntüde portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

export const ENF_IPUCLARI: readonly string[] = [
  'İlaçlarınızı doktorunuzun söylediği şekilde ve sürede kullanın; kendi başınıza kesmeyin veya uzatmayın.',
  'Kan tahlili veya kontrol randevunuz varsa tarihi kaçırmayın.',
  'Yüksek ateş, bilinç bulanıklığı veya boyun sertliğinde 112’yi arayın.',
]

/** Hasta yüzü yasak kelimeler: tanı, lab sayı, etken madde, mg. */
export function hastaDiliTemizMi(metin: string): boolean {
  return !/(tanı|tani|ICD|CD4|viral y[üu]k|HIV tan|hepatit [BC] tan|\bmg\b|mg\/kg|doz şeması|sepsis tan)/i.test(metin)
}
