/**
 * NOROLOJI-EXCEPTIONAL-01 — Sağlığım › "Nörolojimm" hatırlatmaları. SAF fonksiyon.
 * Hasta yüzünde YASAK: tanı adı, MIDAS skoru/bandı, ilaç/etken madde, doz, "inme/TIA" klinik etiketi.
 */
export type HatirlatmaDurum = 'gecikti' | 'yaklasiyor' | 'planli'

export type NoroHatirlatma = { ad: string; due: string | null; durum: HatirlatmaDurum }

export const YAKLASIYOR_GUN = 7
const ISO = /^\d{4}-\d{2}-\d{2}$/

const GOREV_BASLIK: Array<[RegExp, string]> = [
  [/^noro_izlem|ilac|aed|lab/, 'İlaç güvenlik kontrolü'],
  [/^migren|midas|olcek|ölçek/, 'Baş ağrısı takip formu'],
  [/^rapor|sgk|belge/, 'Belge / rapor işlemi'],
  [/^eeg|emg|mr|bt|goruntu/, 'Tetkik randevusu'],
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

export interface NorolojimGirdi {
  bugun: string
  gorevler: Array<{ kod: string; due: string | null }>
  sonrakiKontrolIso: string | null
}

export function norolojimHatirlatmalari(g: NorolojimGirdi): NoroHatirlatma[] {
  const map = new Map<string, NoroHatirlatma>()
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

export function sonrakiKontrol(liste: NoroHatirlatma[]): { tarih: string; neden: string } | null {
  const aday = liste.find((h) => h.due && (h.durum === 'yaklasiyor' || h.durum === 'planli'))
  if (!aday?.due) return null
  return { tarih: aday.due, neden: aday.ad }
}

export function formHatirlatmalari(liste: NoroHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Baş ağrısı takip formu').map((h) => ({ ad: h.ad, due: h.due }))
}

export function ilacHatirlatmalari(liste: NoroHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'İlaç güvenlik kontrolü').map((h) => ({ ad: h.ad, due: h.due }))
}

export const NOROLOJIM_NOTU =
  'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Tarihleri muayenehaneniz belirler. Yüz kayması, konuşma bozukluğu, ani güç kaybı, ani görme kaybı veya bilinç değişikliğinde portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

export const NORO_IPUCLARI: readonly string[] = [
  'İlaçlarınızı doktorunuzun söylediği şekilde kullanın; kendi başınıza miktar değiştirmeyin.',
  'Baş ağrısı veya nöbet günlüğü tutmanız istenirse formu randevuya getirin.',
  'Yeni döküntü, ateş veya ciddi yan etki olursa muayenehanenizi arayın; acil durumda 112.',
]

/** Hasta yüzü yasak kelimeler: tanı, MIDAS/skor, etken madde, mg. */
export function hastaDiliTemizMi(metin: string): boolean {
  return !/(tanı|tani|ICD|MIDAS|skor|bant|\binme\b|\bTIA\b|epilepsi|migren tan|antiepileptik|\bAED\b|\bmg\b|mg\/kg|valproat|karbamazepin|fenitoin)/i.test(metin)
}
