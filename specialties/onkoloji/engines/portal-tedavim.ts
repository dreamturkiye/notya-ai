/**
 * ONKOLOJI-EXCEPTIONAL-01 — Sağlığım › "Tedavim" hatırlatmaları. SAF fonksiyon.
 * Hasta yüzünde YASAK: tanı adı, evre/stage/TNM, ilaç/etken madde, doz, "kanser/tümör/metastaz".
 */
export type HatirlatmaDurum = 'gecikti' | 'yaklasiyor' | 'planli'

export type OnkoHatirlatma = { ad: string; due: string | null; durum: HatirlatmaDurum }

export const YAKLASIYOR_GUN = 7
const ISO = /^\d{4}-\d{2}-\d{2}$/

const GOREV_BASLIK: Array<[RegExp, string]> = [
  [/^kur|tedavi|cycle|inf[üu]zyon/, 'Tedavi / kür günü'],
  [/^tox_|toksisite|yan.?etki/, 'Yan etki kontrolü'],
  [/^lab|kan.?tahlil|hemogram/, 'Kan tahlili kontrolü'],
  [/^goruntu|pet|bt|mri|rapor/, 'Görüntü / rapor kontrolü'],
  [/^rapor|sgk|belge|sut/, 'Belge / rapor işlemi'],
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

export interface TedavimGirdi {
  bugun: string
  gorevler: Array<{ kod: string; due: string | null }>
  sonrakiKontrolIso: string | null
}

export function tedavimHatirlatmalari(g: TedavimGirdi): OnkoHatirlatma[] {
  const map = new Map<string, OnkoHatirlatma>()
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

export function sonrakiKontrol(liste: OnkoHatirlatma[]): { tarih: string; neden: string } | null {
  const aday = liste.find((h) => h.due && (h.durum === 'yaklasiyor' || h.durum === 'planli'))
  if (!aday?.due) return null
  return { tarih: aday.due, neden: aday.ad }
}

export function kurHatirlatmalari(liste: OnkoHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Tedavi / kür günü').map((h) => ({ ad: h.ad, due: h.due }))
}

export function labHatirlatmalari(liste: OnkoHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Kan tahlili kontrolü').map((h) => ({ ad: h.ad, due: h.due }))
}

export function yanEtkiHatirlatmalari(liste: OnkoHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Yan etki kontrolü').map((h) => ({ ad: h.ad, due: h.due }))
}

export const TEDAVIM_NOTU =
  'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Tarihleri muayenehaneniz belirler. Ateş ile halsizlik, ani sırt ağrısı ve bacak güçsüzlüğü veya şiddetli nefes darlığında portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

export const ONKO_IPUCLARI: readonly string[] = [
  'Tedavi günü ve kontrol randevularınızı kaçırmayın.',
  'İlaçlarınızı doktorunuzun söylediği şekilde kullanın; kendi başınıza miktar değiştirmeyin.',
  'Ateş veya ani nefes darlığında 112’yi arayın.',
]

/** Hasta yüzü yasak kelimeler: tanı, evre, etken madde, mg/m². */
export function hastaDiliTemizMi(metin: string): boolean {
  return !/(tanı|tani|ICD|evre|stage|TNM|kanser|t[üu]m[öo]r|metastaz|kemoterapi dozu|mg\/m|AUC|\bmg\b|protokol dozu)/i.test(metin)
}
