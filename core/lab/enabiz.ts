/**
 * NOTYA-DAH-WOW-NEXT C5 — e-Nabız "geçmiş tahlil sonuçları" PDF → Belgeler içe aktarma (YALNIZ gelen belge; canlı e-Nabız API çekimi yok).
 * Aynı lab hattı: vault yükleme → belgeler/lab 'cikar' (kaynak=enabiz) → satırlar onayli=false → tablo onayla → raporla → Onayla.
 * Farkı: bir PDF'te birden çok numune tarihi olur → her satır kendi basılı tarihini taşır (lab_satirlar.numune_tarihi).
 * Kimlik koruması (kimlik_uyari) ve onay kapısı lab hattıyla birebir aynıdır. Tarihi okunamayan satır onaylı seriye girmez (numune null).
 */
import type { HamSatir } from './trend'

export const ENABIZ_TALIMAT = `Bu belge bir e-Nabız "Tahlillerim / geçmiş tahlil sonuçları" çıktısıdır; aynı PDF'te farklı tarihli birden çok tetkik olabilir.
Her satır için o satırın BASILI tetkik/numune tarihini "numune_tarihi" alanına YYYY-MM-DD olarak yaz; satırda tarih yoksa ait olduğu tarih başlığını kullan, hiç yoksa null yaz. Tarih UYDURMA.
Aynı test farklı tarihlerde tekrar ediyorsa her tarihi ayrı satır yaz. Tanı, reçete ve randevu bölümlerini satıra çevirme; en fazla "not" alanında kısaca belirt.
lab_adi alanına "e-Nabız geçmiş" yaz.`

export type EnabizSatir = HamSatir & { numune_tarihi?: string | null }

/** Satır tarihi yalnız geçerli ISO, gelecekte değil ve doğumdan önce değilse kabul edilir; aksi halde null + neden. */
export function satirTarihiDogrula(tarih: string | null | undefined, bugun: string, dogum: string | null): { tarih: string | null; not: string | null } {
  if (!tarih) return { tarih: null, not: 'tarih okunamadı — hekim satıra tarih girmeden onaylı seriye girmez' }
  const m = String(tarih).match(/^(\d{4})-(\d{2})-(\d{2})$/) || String(tarih).match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/)
  if (!m) return { tarih: null, not: `tarih biçimi tanınmadı ("${String(tarih).slice(0, 20)}")` }
  const iso = m[1].length === 4 ? `${m[1]}-${m[2]}-${m[3]}` : `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  const d = new Date(`${iso}T00:00:00Z`)
  if (isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso) return { tarih: null, not: `geçersiz tarih (${iso})` }
  if (iso > bugun) return { tarih: null, not: `gelecek tarih (${iso}) — OCR hatası olabilir` }
  if (dogum && iso < dogum) return { tarih: null, not: `doğum tarihinden önce (${iso}) — başka hastaya ait olabilir` }
  return { tarih: iso, not: null }
}

/** Aynı test + tarih + değer tekrarlarını ayıklar (e-Nabız sayfa başlıkları tekrar basabilir). Sıra korunur. */
export function tekrarAyikla<T extends EnabizSatir>(satirlar: T[]): T[] {
  const gor = new Set<string>()
  return satirlar.filter((s) => { const k = `${s.raw_name.trim().toLocaleLowerCase('tr-TR')}|${s.numune_tarihi || ''}|${String(s.value).trim()}`; if (gor.has(k)) return false; gor.add(k); return true })
}

/** Panel başlık tarihi = en yeni geçerli satır tarihi (liste/nota "numune" olarak basılır). */
export function panelTarihi(tarihler: (string | null)[]): string | null {
  return tarihler.filter((t): t is string => !!t).sort().pop() || null
}
