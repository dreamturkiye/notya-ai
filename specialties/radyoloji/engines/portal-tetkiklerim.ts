/**
 * RADYOLOJI-EXCEPTIONAL-01 — Sağlığım › "Tetkiklerim" hatırlatmaları. SAF fonksiyon.
 * Hasta yüzünde YASAK: tanı adı, BI-RADS kategori sayısı, AI bulgu, yorum = tanı.
 * Yalnız durum / tarih / hasta-güvenli başlıklar.
 */
export type HatirlatmaDurum = 'gecikti' | 'yaklasiyor' | 'planli'

export type RadyoHatirlatma = { ad: string; due: string | null; durum: HatirlatmaDurum }

export const YAKLASIYOR_GUN = 7
const ISO = /^\d{4}-\d{2}-\d{2}$/

const GOREV_BASLIK: Array<[RegExp, string]> = [
  [/^kuyruk|tetkik|cekim|modalite/, 'Tetkik randevusu'],
  [/^rapor/, 'Rapor durumu'],
  [/^kritik|bildirim|klinisyen/, 'Klinik iletişimi'],
  [/^belge|goruntu|mamografi|bt|mri/, 'Görüntü / belge kontrolü'],
  [/^kontrol|izlem|vizit|randevu|hatirlatma/, 'Kontrol randevusu'],
]

/** Hasta-güvenli durum etiketleri — tanı/yorum yok. */
export type TetkikDurumEtiket = 'Bekliyor' | 'Çekildi' | 'Rapor hazır' | 'Arşiv'

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

export interface TetkiklerimGirdi {
  bugun: string
  gorevler: Array<{ kod: string; due: string | null }>
  sonrakiKontrolIso: string | null
  /** Hekim kaydı — yalnız durum + tarih; yorum yok */
  tetkikler?: Array<{ durum: TetkikDurumEtiket; tarih: string | null; modaliteEtiket: string }>
}

export function tetkiklerimHatirlatmalari(g: TetkiklerimGirdi): RadyoHatirlatma[] {
  const map = new Map<string, RadyoHatirlatma>()
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

export function sonrakiKontrol(liste: RadyoHatirlatma[]): { tarih: string; neden: string } | null {
  const aday = liste.find((h) => h.due && (h.durum === 'yaklasiyor' || h.durum === 'planli'))
  if (!aday?.due) return null
  return { tarih: aday.due, neden: aday.ad }
}

export function tetkikHatirlatmalari(liste: RadyoHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Tetkik randevusu').map((h) => ({ ad: h.ad, due: h.due }))
}

export function raporHatirlatmalari(liste: RadyoHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Rapor durumu').map((h) => ({ ad: h.ad, due: h.due }))
}

export function belgeHatirlatmalari(liste: RadyoHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Görüntü / belge kontrolü').map((h) => ({ ad: h.ad, due: h.due }))
}

export const TETKIKLERIM_NOTU =
  'Bu bilgiler bilgilendirme amaçlıdır; sonuç yorumu ve plan doktorunuzdadır. Tarihleri muayenehaneniz belirler. Ciddi kontrast reaksiyonu veya çekim sırasında ani solunum / bilinç değişikliğinde portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

export const TETKIKLERIM_IPUCLARI: readonly string[] = [
  'Tetkik randevularınızı kaçırmayın.',
  'Rapor hazır olduğunda doktorunuz sizinle konuşur; portalda sonuç yorumu yazılmaz.',
  'Kontrast veya gebelik endişeniz varsa çekim öncesi mutlaka söyleyin.',
]

/** Hasta yüzü yasak: tanı, BI-RADS sayı, AI bulgu, malignite %. */
export function hastaDiliTemizMi(metin: string): boolean {
  return !/(tan[ıi]|tani|ICD|BI-?RADS\s*[0-6]|malignite|kanser olas|AI tan[ıi]|otomatik tan[ıi]|\bmg\b)/i.test(metin)
}
