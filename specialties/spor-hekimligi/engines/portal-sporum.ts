/**
 * SPOR-HEKIMLIGI-EXCEPTIONAL-01 — Sağlığım › "Sporum" hatırlatmaları. SAF fonksiyon.
 *
 * Hasta yüzünde YASAK: tanı, RTP skor yorumu (klinik jargon), doz, doping, mg.
 * Görev kodu → sabit, hasta-güvenli başlık. Basamak numarası "antrenmana dönüş planı" dilinde.
 */
export type HatirlatmaDurum = 'gecikti' | 'yaklasiyor' | 'planli'

export type SporHatirlatma = { ad: string; due: string | null; durum: HatirlatmaDurum }

export const YAKLASIYOR_GUN = 7

const ISO = /^\d{4}-\d{2}-\d{2}$/

const GOREV_BASLIK: Array<[RegExp, string]> = [
  [/^rtp|donus|return/, 'Antrenmana dönüş planı kontrolü'],
  [/^sakatlik|yaralanma|izlem_sakat/, 'Sakatlık izlem randevusu'],
  [/^yuklenme|yuk|antrenman_yuk/, 'Antrenman yükü değerlendirmesi'],
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

export interface SporumGirdi {
  bugun: string
  gorevler: Array<{ kod: string; due: string | null }>
  sonrakiKontrolIso: string | null
  /** Hekim yüzündeki basamak — hastaya yalnız "plan aşaması" olarak, tanı olmadan */
  rtpBasamak: number | null
}

export function sporumHatirlatmalari(g: SporumGirdi): SporHatirlatma[] {
  const map = new Map<string, SporHatirlatma>()
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

export function sonrakiKontrol(liste: SporHatirlatma[]): { tarih: string; neden: string } | null {
  const aday = liste.find((h) => h.due && (h.durum === 'yaklasiyor' || h.durum === 'planli'))
  if (!aday?.due) return null
  return { tarih: aday.due, neden: aday.ad }
}

export function planHatirlatmalari(liste: SporHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste
    .filter((h) => /Antrenmana dönüş|Sakatlık izlem|Antrenman yükü/i.test(h.ad))
    .map((h) => ({ ad: h.ad, due: h.due }))
}

/** Hasta-güvenli RTP özeti — basamak numarası olabilir; klinik tanı / skor yorumu yok. */
export function rtpHastaOzeti(basamak: number | null): string | null {
  if (basamak == null || !Number.isInteger(basamak) || basamak < 0 || basamak > 5) return null
  return `Doktorunuzun belirlediği antrenmana dönüş planı — aşama ${basamak}. Yorum ve ilerleme kararı doktorunuzdadır.`
}

export const SPORUM_NOTU =
  'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Tarihleri muayenehaneniz belirler. Baş darbesi sonrası kusma/bilinç kaybı, egzersiz göğüs ağrısı, bayılma veya ciddi travma varsa portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

export const SPOR_BAKIM_IPUCLARI: readonly string[] = [
  'Doktorunuz farklı söylemedikçe antrenman yükünü birden artırmayın.',
  'İlaçları yalnızca doktorunuzun yazdığı şekilde kullanın.',
  'Kontrol tarihini kaçırmayın; değiştirmek için muayenehanenizi arayın.',
  'Baş darbesi veya efor sırasında göğüs ağrısı / bayılmada portal mesajı beklemeyin.',
]

/** Hasta dilinde yasak kelime kilidi. */
export function hastaDiliTemizMi(metin: string): boolean {
  return !/(tanı|tani|ICD|doz|\bmg\b|mg\/kg|doping|WADA|yasakl[ıi] madde|ACL y[ıi]rt[ıi][ğg]|k[ıi]r[ıi]k tan[ıi]s[ıi]|konk[üu]zyon tan[ıi])/i.test(metin)
}
