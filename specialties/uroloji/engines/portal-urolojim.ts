/**
 * UROLOJI-EXCEPTIONAL-01 — Sağlığım › "Ürolojimm" hatırlatmaları. SAF fonksiyon.
 *
 * Hasta yüzünde YASAK: tanı, PSA sayı (ng/mL), IPSS skor, doz, kanser, mg.
 * Görev kodu → sabit, hasta-güvenli başlık.
 */
export type HatirlatmaDurum = 'gecikti' | 'yaklasiyor' | 'planli'

export type UroHatirlatma = { ad: string; due: string | null; durum: HatirlatmaDurum }

export const YAKLASIYOR_GUN = 7

const ISO = /^\d{4}-\d{2}-\d{2}$/

const GOREV_BASLIK: Array<[RegExp, string]> = [
  [/^ipss|semptom_form/, 'Semptom formu kontrolü'],
  [/^psa|kan_test|lab/, 'Kan testi randevusu'],
  [/^tas|tash|eswl|stone/, 'Taş takibi randevusu'],
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

export interface UrolojimGirdi {
  bugun: string
  gorevler: Array<{ kod: string; due: string | null }>
  sonrakiKontrolIso: string | null
}

export function urolojimHatirlatmalari(g: UrolojimGirdi): UroHatirlatma[] {
  const map = new Map<string, UroHatirlatma>()
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

export function sonrakiKontrol(liste: UroHatirlatma[]): { tarih: string; neden: string } | null {
  const aday = liste.find((h) => h.due && (h.durum === 'yaklasiyor' || h.durum === 'planli'))
  if (!aday?.due) return null
  return { tarih: aday.due, neden: aday.ad }
}

export function testHatirlatmalari(liste: UroHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste
    .filter((h) => h.ad === 'Kan testi randevusu' || h.ad === 'Semptom formu kontrolü')
    .map((h) => ({ ad: h.ad, due: h.due }))
}

export function islemHatirlatmalari(liste: UroHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste
    .filter((h) => /Taş takibi|Belge/i.test(h.ad))
    .map((h) => ({ ad: h.ad, due: h.due }))
}

export const UROLOJIM_NOTU =
  'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Tarihleri muayenehaneniz belirler. İdrarda gözle görülür kan, idrar yapamama, yan ağrısı ile ateş, testislerde ani ağrı veya travma varsa portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

export const URO_BAKIM_IPUCLARI: readonly string[] = [
  'Bol sıvı alın; doktorunuz farklı söylemedikçe.',
  'İlaçları yalnızca doktorunuzun yazdığı şekilde kullanın.',
  'Kontrol tarihini kaçırmayın; değiştirmek için muayenehanenizi arayın.',
  'Ani şiddetli ağrı veya idrar yapamama durumunda portal mesajı beklemeyin.',
]

/** Hasta dilinde yasak kelime kilidi. */
export function hastaDiliTemizMi(metin: string): boolean {
  return !/(tanı|tani|ICD|PSA|ng\/mL|ng\/ml|IPSS|skor|BPH|prostat kanseri|kanser|malign|doz|\bmg\b|mg\/kg)/i.test(metin)
}
