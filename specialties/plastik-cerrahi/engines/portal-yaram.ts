/**
 * PLASTIK-CERRAHI-EXCEPTIONAL-01 — Sağlığım › "Yaram" hatırlatmaları. SAF fonksiyon.
 * Hasta yüzünde YASAK: tanı adı, skor (PASI…), doz, "keloit/melanom/kanser", işlem endikasyon kilidi.
 */
export type HatirlatmaDurum = 'gecikti' | 'yaklasiyor' | 'planli'

export type PlastikHatirlatma = { ad: string; due: string | null; durum: HatirlatmaDurum }

export const YAKLASIYOR_GUN = 7
const ISO = /^\d{4}-\d{2}-\d{2}$/

const GOREV_BASLIK: Array<[RegExp, string]> = [
  [/^pansuman|yara.?bakim|pansiyel/, 'Pansuman / yara bakımı'],
  [/^dikis/, 'Dikiş alma kontrolü'],
  [/^greft|flep/, 'Greft / flep kontrolü'],
  [/^foto/, 'Foto / izlem kontrolü'],
  [/^onam|belge|kvkk/, 'Onam / belge işlemi'],
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

export interface YaramGirdi {
  bugun: string
  gorevler: Array<{ kod: string; due: string | null }>
  sonrakiKontrolIso: string | null
}

export function yaramHatirlatmalari(g: YaramGirdi): PlastikHatirlatma[] {
  const map = new Map<string, PlastikHatirlatma>()
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

export function sonrakiKontrol(liste: PlastikHatirlatma[]): { tarih: string; neden: string } | null {
  const aday = liste.find((h) => h.due && (h.durum === 'yaklasiyor' || h.durum === 'planli'))
  if (!aday?.due) return null
  return { tarih: aday.due, neden: aday.ad }
}

export function pansumanHatirlatmalari(liste: PlastikHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Pansuman / yara bakımı' || h.ad === 'Greft / flep kontrolü').map((h) => ({ ad: h.ad, due: h.due }))
}

export function fotoHatirlatmalari(liste: PlastikHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Foto / izlem kontrolü').map((h) => ({ ad: h.ad, due: h.due }))
}

export function dikisHatirlatmalari(liste: PlastikHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Dikiş alma kontrolü').map((h) => ({ ad: h.ad, due: h.due }))
}

export const YARAM_NOTU =
  'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Tarihleri muayenehaneniz belirler. Yara veya greftte ani renk değişikliği, hızla büyüyen şişlik veya yüksek ateşte portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

export const PLASTIK_IPUCLARI: readonly string[] = [
  'Pansuman ve kontrol randevularınızı kaçırmayın.',
  'Doktorunuz söylemeden sargı / dikişlere müdahale etmeyin.',
  'Ani renk değişikliği veya şişlikte 112’yi arayın.',
]

/** Hasta yüzü yasak kelimeler: tanı, skor, doz, derm skorları. */
export function hastaDiliTemizMi(metin: string): boolean {
  return !/(tanı|tani|ICD|keloit tan[ıi]|melanom|basal h[üu]cre|PASI|EASI|Fitzpatrick|\bmg\b|doz|ameliyathane plan)/i.test(metin)
}
