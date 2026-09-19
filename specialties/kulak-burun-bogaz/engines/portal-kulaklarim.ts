/**
 * KBB-EXCEPTIONAL-01 — Sağlığım › "Kulaklarım" hatırlatmaları. SAF fonksiyon.
 *
 * Bu dosya hasta yüzünün TEK kapısıdır. Hekimin görev metni asla olduğu gibi taşınmaz: her satır
 * kod → sabit, hasta-güvenli başlığa çevrilir. Hasta yüzünde YASAK: tanı adı, dB değeri, PTA,
 * kayıp bandı / derecesi, ilaç ve etken madde adı, doz, "perforasyon / kolesteatom / BPPV" gibi
 * klinik etiketler.
 *
 * Aynı desen: specialties/psikiyatri/engines/portal-ruhsagligim.ts ve dahiliye portal-takibim.
 */
export type HatirlatmaDurum = 'gecikti' | 'yaklasiyor' | 'planli'

export type KbbHatirlatma = { ad: string; due: string | null; durum: HatirlatmaDurum }

export const YAKLASIYOR_GUN = 7

const ISO = /^\d{4}-\d{2}-\d{2}$/

/**
 * Görev kodu → hasta-güvenli başlık.
 * Odyometri görevleri "işitme testi randevusu" olur — dB, bant veya kayıp tipi söylenmez.
 * Rapor görevleri "belge / rapor işlemi" olur — rapor türü ve tanı söylenmez.
 */
const GOREV_BASLIK: Array<[RegExp, string]> = [
  [/^odyo|isitme_test|i[şs]itme|^pta/, 'İşitme testi randevusu'],
  [/^osas|uyku|apne/, 'Uyku tetkiki randevusu'],
  [/^manevra|vertigo|denge/, 'Denge muayenesi kontrolü'],
  [/^cihaz|isitme_cihaz/, 'İşitme cihazı kontrol randevusu'],
  [/^rapor|sgk|belge/, 'Belge / rapor işlemi'],
  [/^pansuman|temizlik|bu[şs]on|aspirasyon/, 'Kulak temizliği / pansuman randevusu'],
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

export interface KulaklarimGirdi {
  bugun: string
  gorevler: Array<{ kod: string; due: string | null }>
  sonrakiKontrolIso: string | null
}

/** Tek hatırlatma listesi: kod → sabit başlık, tekilleştirilmiş, tarihe göre sıralı. */
export function kulaklarimHatirlatmalari(g: KulaklarimGirdi): KbbHatirlatma[] {
  const map = new Map<string, KbbHatirlatma>()
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

export function sonrakiKontrol(liste: KbbHatirlatma[]): { tarih: string; neden: string } | null {
  const aday = liste.find((h) => h.due && (h.durum === 'yaklasiyor' || h.durum === 'planli'))
  if (!aday?.due) return null
  return { tarih: aday.due, neden: aday.ad }
}

/** Test / tetkik hatırlatmaları — hangi test olduğu "işitme testi" düzeyinde kalır, sonuç yazılmaz. */
export function testHatirlatmalari(liste: KbbHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste
    .filter((h) => h.ad === 'İşitme testi randevusu' || h.ad === 'Uyku tetkiki randevusu')
    .map((h) => ({ ad: h.ad, due: h.due }))
}

/** İşlem / bakım hatırlatmaları — pansuman, cihaz kontrolü, denge muayenesi. */
export function islemHatirlatmalari(liste: KbbHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste
    .filter((h) => /pansuman|cihaz|Denge/i.test(h.ad))
    .map((h) => ({ ad: h.ad, due: h.due }))
}

/** Hasta yüzü sabit alt not — 112 var, tanı dili yok. */
export const KULAKLARIM_NOTU =
  'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Tarihleri muayenehaneniz belirler. Aniden duymamaya başlarsanız, burun kanamanız durmazsa veya nefes almakta zorlanırsanız portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Kulak bakımı için hasta-güvenli, tanı içermeyen genel öneriler (hekim değiştirebilir). */
export const KULAK_BAKIM_IPUCLARI: readonly string[] = [
  'Kulağınıza pamuklu çubuk veya sivri cisim sokmayın.',
  'Kulağınıza doktorunuz söylemediği sürece hiçbir sıvı damlatmayın.',
  'Yüksek sesli ortamlarda koruyucu kullanın ve kulaklığı uzun süre yüksek sesle dinlemeyin.',
  'Uçuş ve dalış öncesi şikâyetiniz varsa muayenehanenizi arayın.',
]

/**
 * Hasta dilinde yasak kelime kilidi — test bunu her hasta-yüzü metni için çağırır.
 * Ölçüm birimleri, kayıp dereceleri, tanı adları ve ilaç etken maddeleri yasaktır.
 */
export function hastaDiliTemizMi(metin: string): boolean {
  return !/(tanı|tani|ICD|\bdB\b|desibel|PTA|odyogram|sensorin[öo]ral|iletim tipi|mikst tip|perforasyon|kolesteatom|otoskleroz|BPPV|Meniere|otitis|sin[üu]zit|tonsillit|antibiyotik|kortikosteroid|damla.{0,10}\bmg\b|\bmg\b|mg\/kg)/i.test(metin)
}
