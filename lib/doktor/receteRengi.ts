/**
 * Renkli reçete sınıflandırması — Türkiye (TİTCK "Kontrole Tabi İlaçlar").
 *
 * Kırmızı reçete: uyuşturucu madde ve müstahzarları (2313 sayılı Kanun, 1961 Tek Sözleşme).
 * Yeşil reçete: psikotrop maddeler (02.01.1986 tarih 2677 sayılı Genelge) — benzodiazepinler,
 *   Z-ilaçlar, barbitüratlar, tramadol (TİTCK 20.02.2016 duyurusu), pregabalin, modafinil.
 * Her iki tür de Renkli Reçete Sistemi (RRS) üzerinden düzenlenir; normal kâğıt reçeteye YAZILAMAZ.
 *
 * Kural (Kaan, 2026-09-16): eşleşme ETKEN MADDEYE göre yapılır, marka adı listeye girmez.
 * Emin olunmayan maddeler kırmızı/yeşil listesine alınmaz — BELIRSIZ listesinde durur ve yalnız
 * ekranda "reçete türünü doğrulayın" notu üretir; reçete sayfası ayrılmaz. Liste TİTCK
 * duyurularıyla büyür (kaynak: titck.gov.tr Kontrole Tabi İlaçlar duyuruları).
 */
export type ReceteRengi = 'normal' | 'yesil' | 'kirmizi'

export const RENK_ETIKET: Record<ReceteRengi, string> = {
  normal: 'Reçete',
  yesil: 'YEŞİL REÇETE',
  kirmizi: 'KIRMIZI REÇETE',
}

// Uyuşturucu madde — kırmızı reçete
const KIRMIZI = [
  'morfin', 'fentanil', 'remifentanil', 'sufentanil', 'alfentanil', 'oksikodon', 'hidromorfon',
  'metadon', 'petidin', 'meperidin', 'buprenorfin', 'metilfenidat',
]
// Psikotrop madde — yeşil reçete
const YESIL = [
  'alprazolam', 'diazepam', 'lorazepam', 'klonazepam', 'midazolam', 'bromazepam', 'klordiazepoksit',
  'klobazam', 'oksazepam', 'flurazepam', 'nitrazepam', 'flunitrazepam', 'temazepam',
  'zolpidem', 'zopiklon', 'fenobarbital', 'tramadol', 'pregabalin', 'modafinil',
]
// Kontrole tabi olabilir; renk formdan forma değişir veya TİTCK kararı doğrulanmadı — yalnız ekran notu
const BELIRSIZ = ['kodein', 'tapentadol', 'ketamin', 'gabapentin', 'psodoefedrin', 'dekstrometorfan']

export function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/i̇/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/â/g, 'a')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function icerir(metin: string, madde: string): boolean {
  // kelime başı sınırı: "apomorfin" morfin değildir, "alfentanil" fentanil satırına düşmez (kendi satırı var)
  return new RegExp(`(^|[^a-z])${madde}`).test(metin)
}

/** Etken madde (öncelikli) + ilaç adı metninden reçete rengini bulur. */
export function receteRengi(etkenMadde: string, ilacAdi = ''): ReceteRengi {
  const m = normalize(`${etkenMadde} ${ilacAdi}`)
  if (KIRMIZI.some((k) => icerir(m, k))) return 'kirmizi'
  if (YESIL.some((k) => icerir(m, k))) return 'yesil'
  return 'normal'
}

/** Renk bilinmeyen ama kontrole tabi olabilecek madde — ekranda doğrulama notu için. */
export function belirsizKontrol(etkenMadde: string, ilacAdi = ''): string | null {
  const m = normalize(`${etkenMadde} ${ilacAdi}`)
  return BELIRSIZ.find((k) => icerir(m, k)) ?? null
}

export interface ReceteGrubu<T> { renk: ReceteRengi; satirlar: { s: T; i: number }[] }

/**
 * Satırları basılacak reçete sayfalarına böler. Sıra: normal → yeşil → kırmızı; boş grup basılmaz.
 * Hiç satır yoksa tek boş "normal" sayfa döner (sayfa "Bu notta ilaç yok" der).
 */
export function receteGruplari<T extends { etkenMadde: string; ilacAdi: string }>(satirlar: T[]): ReceteGrubu<T>[] {
  const sira: ReceteRengi[] = ['normal', 'yesil', 'kirmizi']
  const g: Record<ReceteRengi, { s: T; i: number }[]> = { normal: [], yesil: [], kirmizi: [] }
  satirlar.forEach((s, i) => g[receteRengi(s.etkenMadde, s.ilacAdi)].push({ s, i }))
  const out = sira.filter((r) => g[r].length > 0).map((renk) => ({ renk, satirlar: g[renk] }))
  return out.length ? out : [{ renk: 'normal', satirlar: [] }]
}
