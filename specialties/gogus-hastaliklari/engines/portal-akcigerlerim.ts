/**
 * GOGUS-EXCEPTIONAL-01 — Sağlığım › "Akciğerlerim" hatırlatmaları. SAF fonksiyon.
 *
 * Hasta yüzünde YASAK: tanı adı, CAT/mMRC skoru, GOLD grup/evre, ilaç / etken madde, doz, FEV1.
 */
export type HatirlatmaDurum = 'gecikti' | 'yaklasiyor' | 'planli'

export type GogusHatirlatma = { ad: string; due: string | null; durum: HatirlatmaDurum }

export const YAKLASIYOR_GUN = 7

const ISO = /^\d{4}-\d{2}-\d{2}$/

const GOREV_BASLIK: Array<[RegExp, string]> = [
  [/^spiro|sft|solunum_test|fev/, 'Solunum testi randevusu'],
  [/^inhaler|teknik/, 'İnhaler teknik kontrolü'],
  [/^aksiyon|plan/, 'Aksiyon planı gözden geçirme'],
  [/^oksijen|usot|ltot/, 'Oksijen tedavi kontrolü'],
  [/^rapor|sgk|belge/, 'Belge / rapor işlemi'],
  [/^sigara|t[üu]t[üu]n|birak/, 'Tütün bırakma görüşmesi'],
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

export interface AkcigerlerimGirdi {
  bugun: string
  gorevler: Array<{ kod: string; due: string | null }>
  sonrakiKontrolIso: string | null
}

export function akcigerlerimHatirlatmalari(g: AkcigerlerimGirdi): GogusHatirlatma[] {
  const map = new Map<string, GogusHatirlatma>()
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

export function sonrakiKontrol(liste: GogusHatirlatma[]): { tarih: string; neden: string } | null {
  const aday = liste.find((h) => h.due && (h.durum === 'yaklasiyor' || h.durum === 'planli'))
  if (!aday?.due) return null
  return { tarih: aday.due, neden: aday.ad }
}

export function testHatirlatmalari(liste: GogusHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste
    .filter((h) => h.ad === 'Solunum testi randevusu')
    .map((h) => ({ ad: h.ad, due: h.due }))
}

export function bakimHatirlatmalari(liste: GogusHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste
    .filter((h) => /İnhaler|Aksiyon|Oksijen|Tütün/i.test(h.ad))
    .map((h) => ({ ad: h.ad, due: h.due }))
}

export const AKCIGERLERIM_NOTU =
  'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Tarihleri muayenehaneniz belirler. Bol kanlı balgam, belirgin nefes darlığı veya ani göğüs ağrısı olursa portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

export const AKCIGER_BAKIM_IPUCLARI: readonly string[] = [
  'İnhalerinizi doktorunuzun tarif ettiği şekilde kullanın; miktarı kendiniz değiştirmeyin.',
  'Sigara ve dumanlı ortamlardan uzak durun; bırakma desteği için muayenehanenizi veya ALO 171’i arayın.',
  'Nefes darlığınız artarsa veya balgamınız değişirse muayenehanenizi arayın.',
  'Yıllık grip aşısı ve hekiminizin önerdiği diğer aşılar için randevu alın.',
]

export function hastaDiliTemizMi(metin: string): boolean {
  return !/(tanı|tani|ICD|CAT\s*\d|mMRC|GOLD\s*[ABEabe1-4]|FEV\s*1|spirometri sonucu|KOAH evre|ast[ıi]m basamak|\bmg\b|mcg|puff|budesonid|salbutamol|tiotropium)/i.test(metin)
}
