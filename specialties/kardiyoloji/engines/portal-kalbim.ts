/**
 * KARDIO-EXCEPTIONAL-01 — Sağlığım › "Kalbim" hatırlatmaları. SAF fonksiyon.
 * Hasta yüzünde YASAK: tanı adı, SCORE2 %, risk bandı, ilaç adı, doz, EF, NYHA.
 */
export type HatirlatmaDurum = 'gecikti' | 'yaklasiyor' | 'planli'

export type KardioHatirlatma = { ad: string; due: string | null; durum: HatirlatmaDurum }

export const YAKLASIYOR_GUN = 7
const ISO = /^\d{4}-\d{2}-\d{2}$/

const GOREV_BASLIK: Array<[RegExp, string]> = [
  [/^kb_|tansiyon|hipertansiyon/, 'Tansiyon kontrol randevusu'],
  [/^kky_|kilo_izlem|kalp_yetersiz/, 'Kalp takibi kontrol randevusu'],
  [/^af_|ritim/, 'Ritim kontrol randevusu'],
  [/^lab_|inr|elektrolit/, 'Kan tahlili randevusu'],
  [/^ekg|belge/, 'Kalp testi / belge randevusu'],
  [/^rapor|sgk/, 'Belge / rapor işlemi'],
  [/^kontrol|izlem|vizit|randevu|hatirlatma|score/, 'Kontrol randevusu'],
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

export interface KalbimGirdi {
  bugun: string
  gorevler: Array<{ kod: string; due: string | null }>
  sonrakiKontrolIso: string | null
}

export function kalbimHatirlatmalari(g: KalbimGirdi): KardioHatirlatma[] {
  const map = new Map<string, KardioHatirlatma>()
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

export function sonrakiKontrol(liste: KardioHatirlatma[]): { tarih: string; neden: string } | null {
  const aday = liste.find((h) => h.due && (h.durum === 'yaklasiyor' || h.durum === 'planli'))
  if (!aday?.due) return null
  return { tarih: aday.due, neden: aday.ad }
}

export function olcumHatirlatmalari(liste: KardioHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste
    .filter((h) => /Tansiyon|Kan tahlili|Kalp testi/.test(h.ad))
    .map((h) => ({ ad: h.ad, due: h.due }))
}

export const KALBIM_NOTU =
  'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Tarihleri muayenehaneniz belirler. Göğüs baskısı, ani nefes darlığı veya bayılma olursa portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

export const KALP_BAKIM_IPUCLARI: readonly string[] = [
  'Tansiyon ilacınızı doktorunuzun söylediği şekilde kullanın; kendiniz değiştirmeyin.',
  'Ani göğüs baskısı, nefes darlığı veya bayılmada 112’yi arayın.',
  'Tuz ve sigara konusunda doktorunuzun önerilerine uyun.',
  'Kontrol randevularınızı aksatmamaya çalışın.',
]

export function hastaDiliTemizMi(metin: string): boolean {
  return !/(tanı|tani|ICD|SCORE2|%\s*risk|kova|NYHA|EF\b|ejection|stenoz|MI\b|STEMI|NSTEMI|koroner arter hastalığı|kalp yetersizliği tanısı|antibiyotik|\bmg\b|mg\/kg|doz)/i.test(metin)
}
