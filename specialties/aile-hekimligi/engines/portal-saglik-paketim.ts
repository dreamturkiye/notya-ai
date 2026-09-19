/**
 * AILE-HEKIMLIGI-EXCEPTIONAL-01 — Sağlığım › "Sağlık Paketim" hatırlatmaları. SAF fonksiyon.
 * Hasta yüzünde YASAK: tanı adı, skor, ilaç/etken madde, doz, aşı ürün/lot, "diyabet/HT" klinik etiketi.
 */
export type HatirlatmaDurum = 'gecikti' | 'yaklasiyor' | 'planli'

export type AileHatirlatma = { ad: string; due: string | null; durum: HatirlatmaDurum }

export const YAKLASIYOR_GUN = 7
const ISO = /^\d{4}-\d{2}-\d{2}$/

const GOREV_BASLIK: Array<[RegExp, string]> = [
  [/^asi_tarama|asi|tarama|grip|hpv|kolon|meme|serviks|pnomo|tetanoz|kv_risk/, 'Aşı veya tarama randevusu'],
  [/^kronik|dm|ht|lipid|solunum|tiroid|inhaler|ayak|goz/, 'Kronik takip kontrolü'],
  [/^rapor|sgk|belge/, 'Belge / rapor işlemi'],
  [/^sevk|hatirlatma/, 'Kontrol randevusu'],
  [/^kontrol|izlem|vizit|randevu/, 'Kontrol randevusu'],
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

export interface SaglikPaketimGirdi {
  bugun: string
  gorevler: Array<{ kod: string; due: string | null }>
  sonrakiKontrolIso: string | null
}

export function saglikPaketimHatirlatmalari(g: SaglikPaketimGirdi): AileHatirlatma[] {
  const map = new Map<string, AileHatirlatma>()
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

export function sonrakiKontrol(liste: AileHatirlatma[]): { tarih: string; neden: string } | null {
  const aday = liste.find((h) => h.due && (h.durum === 'yaklasiyor' || h.durum === 'planli'))
  if (!aday?.due) return null
  return { tarih: aday.due, neden: aday.ad }
}

export function asiTaramaHatirlatmalari(liste: AileHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Aşı veya tarama randevusu').map((h) => ({ ad: h.ad, due: h.due }))
}

export function kronikHatirlatmalari(liste: AileHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Kronik takip kontrolü').map((h) => ({ ad: h.ad, due: h.due }))
}

export const SAGLIK_PAKETIM_NOTU =
  'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Tarihleri muayenehaneniz belirler. Göğüs ağrısı, ani nefes darlığı, bilinç değişikliği veya şiddetli kanamada portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

export const AILE_IPUCLARI: readonly string[] = [
  'İlaçlarınızı doktorunuzun söylediği şekilde kullanın; kendi başınıza miktar değiştirmeyin.',
  'Aşı veya tarama randevunuz varsa tarihe gelmeden muayenehanenizi arayın.',
  'Evde tansiyon veya şeker ölçümü istenirse sonuçları randevuya getirin; yorum doktorunuzdadır.',
]

/** Hasta yüzü yasak kelimeler: tanı, skor, etken madde, mg, aşı lot. */
export function hastaDiliTemizMi(metin: string): boolean {
  return !/(tanı|tani|ICD|skor|bant|\bDM\b|\bHT\b|diyabet|hipertansiyon|\bmg\b|mg\/kg|lot\b|HbA1c|SCORE2)/i.test(metin)
}
