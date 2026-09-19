/**
 * ANESTEZI-EXCEPTIONAL-01 — Sağlığım › "Anestezi Öncesi" hatırlatmaları. SAF fonksiyon.
 * Hasta yüzünde YASAK: tanı adı, ASA skor yorumu, ilaç dozu, ameliyathane makinesi detayı.
 */
export type HatirlatmaDurum = 'gecikti' | 'yaklasiyor' | 'planli'

export type AnesteziHatirlatma = { ad: string; due: string | null; durum: HatirlatmaDurum }

export const YAKLASIYOR_GUN = 7
const ISO = /^\d{4}-\d{2}-\d{2}$/

const GOREV_BASLIK: Array<[RegExp, string]> = [
  [/^asa|preop|pre_op|pre-op|aclik|onam/, 'Anestezi öncesi değerlendirme'],
  [/^hava.?yolu|mallampati|entub/, 'Hava yolu kontrolü'],
  [/^agri|analjezi|postop_agri/, 'Ağrı izlem kontrolü'],
  [/^alerji|ilac/, 'Alerji / ilaç listesi'],
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

export interface AnesteziOncesiGirdi {
  bugun: string
  gorevler: Array<{ kod: string; due: string | null }>
  sonrakiKontrolIso: string | null
}

export function anesteziOncesiHatirlatmalari(g: AnesteziOncesiGirdi): AnesteziHatirlatma[] {
  const map = new Map<string, AnesteziHatirlatma>()
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

export function sonrakiKontrol(liste: AnesteziHatirlatma[]): { tarih: string; neden: string } | null {
  const aday = liste.find((h) => h.due && (h.durum === 'yaklasiyor' || h.durum === 'planli'))
  if (!aday?.due) return null
  return { tarih: aday.due, neden: aday.ad }
}

export function preopHatirlatmalari(liste: AnesteziHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Anestezi öncesi değerlendirme').map((h) => ({ ad: h.ad, due: h.due }))
}

export function havaYoluHatirlatmalari(liste: AnesteziHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Hava yolu kontrolü').map((h) => ({ ad: h.ad, due: h.due }))
}

export function agriHatirlatmalari(liste: AnesteziHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Ağrı izlem kontrolü').map((h) => ({ ad: h.ad, due: h.due }))
}

export const ANESTEZI_ONCESI_NOTU =
  'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Tarihleri muayenehaneniz belirler. Açlık ve ilaç talimatlarını doktorunuzun söylediği şekilde uygulayın. Zor nefes alma, ciddi alerji veya ani göğüs ağrısında portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

export const ANESTEZI_IPUCLARI: readonly string[] = [
  'Anestezi öncesi randevunuzu kaçırmayın.',
  'Doktorunuzun söylediği açlık süresine uyun; kendi başınıza değiştirmeyin.',
  'Kullandığınız ilaç ve alerji listesini yanınızda getirin.',
  'Zor nefes alma veya ciddi alerjide 112’yi arayın.',
]

/** Hasta yüzü yasak kelimeler: tanı, doz, ASA yorumu, makine HIS. */
export function hastaDiliTemizMi(metin: string): boolean {
  return !/(tanı|tani|ICD|ASA\s*[IVX]|propofol|\bmg\b|analjezik dozu|anestezik dozu|entübasyon tekniği|OR HIS|ameliyathane makinesi)/i.test(metin)
}
