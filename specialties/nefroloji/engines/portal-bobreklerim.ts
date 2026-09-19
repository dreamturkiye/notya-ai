/**
 * NEFROLOJI-EXCEPTIONAL-01 — Sağlığım › "Böbreklerim" hatırlatmaları. SAF fonksiyon.
 * Hasta yüzünde YASAK: tanı adı, eGFR/KDIGO sayı/evresi, ilaç/etken madde, ESA dozu, "KBH/G4".
 */
export type HatirlatmaDurum = 'gecikti' | 'yaklasiyor' | 'planli'

export type NefHatirlatma = { ad: string; due: string | null; durum: HatirlatmaDurum }

export const YAKLASIYOR_GUN = 7
const ISO = /^\d{4}-\d{2}-\d{2}$/

const GOREV_BASLIK: Array<[RegExp, string]> = [
  [/^egfr|uacr|kdigo|lab|kan.?tahlil/, 'Kan tahlili kontrolü'],
  [/^anemi|hb|hemoglobin|kan.?say/, 'Kan sayımı kontrolü'],
  [/^diyaliz|seans/, 'Diyaliz seans / takip'],
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

export interface BobreklerimGirdi {
  bugun: string
  gorevler: Array<{ kod: string; due: string | null }>
  sonrakiKontrolIso: string | null
}

export function bobreklerimHatirlatmalari(g: BobreklerimGirdi): NefHatirlatma[] {
  const map = new Map<string, NefHatirlatma>()
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

export function sonrakiKontrol(liste: NefHatirlatma[]): { tarih: string; neden: string } | null {
  const aday = liste.find((h) => h.due && (h.durum === 'yaklasiyor' || h.durum === 'planli'))
  if (!aday?.due) return null
  return { tarih: aday.due, neden: aday.ad }
}

export function labHatirlatmalari(liste: NefHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Kan tahlili kontrolü').map((h) => ({ ad: h.ad, due: h.due }))
}

export function anemiHatirlatmalari(liste: NefHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Kan sayımı kontrolü').map((h) => ({ ad: h.ad, due: h.due }))
}

export function diyalizHatirlatmalari(liste: NefHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Diyaliz seans / takip').map((h) => ({ ad: h.ad, due: h.due }))
}

export const BOBREKLERIM_NOTU =
  'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Tarihleri muayenehaneniz belirler. Ani nefes darlığı, göğüs ağrısı veya bilinç bulanıklığında portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

export const NEF_IPUCLARI: readonly string[] = [
  'İlaçlarınızı doktorunuzun söylediği şekilde kullanın; kendi başınıza miktar değiştirmeyin.',
  'Kan tahlili veya diyaliz randevunuz varsa tarihi kaçırmayın.',
  'Ani nefes darlığı veya şiddetli halsizlikte 112’yi arayın.',
]

/** Hasta yüzü yasak kelimeler: tanı, eGFR/KDIGO, ESA, mg. */
export function hastaDiliTemizMi(metin: string): boolean {
  return !/(tanı|tani|\bICD\b|eGFR|KDIGO|\bG[1-5]\b|\bA[1-3]\b|\bKBH\b|kronik b[öo]brek|\bESA\b|eritropoietin|\bskor\b|\bbant\b|\bmg\b|\bIU\b)/i.test(metin)
}
