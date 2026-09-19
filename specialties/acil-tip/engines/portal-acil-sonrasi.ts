/**
 * ACIL-TIP-EXCEPTIONAL-01 — Sağlığım › "Acil sonrası takip" hatırlatmaları. SAF fonksiyon.
 * Hasta yüzünde YASAK: tanı adı, doz, ESI sayı, STEMI/inme skoru, bed board.
 * ED hastalarında uzun portal döngüsü yoktur — Strong ama dürüst (kısa takip).
 */
export type HatirlatmaDurum = 'gecikti' | 'yaklasiyor' | 'planli'

export type AcilSonrasiHatirlatma = { ad: string; due: string | null; durum: HatirlatmaDurum }

export const YAKLASIYOR_GUN = 7
const ISO = /^\d{4}-\d{2}-\d{2}$/

const GOREV_BASLIK: Array<[RegExp, string]> = [
  [/^taburcu|kontrol|acil_sonrasi|randevu/, 'Acil sonrası kontrol'],
  [/^kritik|stemi|inme|travma|sepsis/, 'Takip kontrolü'],
  [/^sevk|yat[iı][sş]/, 'Sevk / yatış takibi'],
  [/^esi|resus|yeniden/, 'Yeniden değerlendirme'],
]

export function gorevBasligi(kod: string | null | undefined): string {
  const k = String(kod || '').toLocaleLowerCase('tr-TR')
  for (const [re, ad] of GOREV_BASLIK) if (re.test(k)) return ad
  return 'Acil sonrası kontrol'
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

export interface AcilSonrasiGirdi {
  bugun: string
  gorevler: Array<{ kod: string; due: string | null }>
  sonrakiKontrolIso: string | null
}

export function acilSonrasiHatirlatmalari(g: AcilSonrasiGirdi): AcilSonrasiHatirlatma[] {
  const map = new Map<string, AcilSonrasiHatirlatma>()
  for (const gorev of g.gorevler) {
    const ad = gorevBasligi(gorev.kod)
    const due = gorev.due && ISO.test(gorev.due.slice(0, 10)) ? gorev.due.slice(0, 10) : null
    const key = `${ad}|${due || ''}`
    if (map.has(key)) continue
    map.set(key, { ad, due, durum: hatirlatmaDurumu(due, g.bugun) })
  }
  if (g.sonrakiKontrolIso && ISO.test(g.sonrakiKontrolIso.slice(0, 10))) {
    const due = g.sonrakiKontrolIso.slice(0, 10)
    const ad = 'Acil sonrası kontrol'
    const key = `${ad}|${due}`
    if (!map.has(key)) map.set(key, { ad, due, durum: hatirlatmaDurumu(due, g.bugun) })
  }
  return [...map.values()].sort((a, b) => {
    if (!a.due) return b.due ? 1 : 0
    if (!b.due) return -1
    return a.due.localeCompare(b.due)
  })
}

export function sonrakiKontrol(liste: AcilSonrasiHatirlatma[]): { tarih: string; neden: string } | null {
  const aday = liste.find((h) => h.due && (h.durum === 'yaklasiyor' || h.durum === 'planli'))
  if (!aday?.due) return null
  return { tarih: aday.due, neden: aday.ad }
}

export function taburcuHatirlatmalari(liste: AcilSonrasiHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Acil sonrası kontrol').map((h) => ({ ad: h.ad, due: h.due }))
}

export function takipHatirlatmalari(liste: AcilSonrasiHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Takip kontrolü' || h.ad === 'Yeniden değerlendirme').map((h) => ({ ad: h.ad, due: h.due }))
}

export function sevkHatirlatmalari(liste: AcilSonrasiHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Sevk / yatış takibi').map((h) => ({ ad: h.ad, due: h.due }))
}

export const ACIL_SONRASI_NOTU =
  'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Acil servis sonrası takip kısa tutulur. Ani kötüleşme, nefes darlığı, göğüs ağrısı veya bilinç değişikliğinde portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

export const ACIL_SONRASI_IPUCLARI: readonly string[] = [
  'Kontrol randevunuzu kaçırmayın.',
  'İlaçlarınızı doktorunuzun söylediği şekilde kullanın; kendi başınıza miktar değiştirmeyin.',
  'Ani kötüleşme veya nefes darlığında 112’yi arayın.',
]

/** Hasta yüzü yasak kelimeler: tanı, doz, ESI sayı, STEMI/inme skoru. */
export function hastaDiliTemizMi(metin: string): boolean {
  return !/(tanı|tani|ICD|ESI\s*[1-5]|STEMI|inme skoru|NIHSS|doz|\bmg\b|bed board|yatak panosu)/i.test(metin)
}
