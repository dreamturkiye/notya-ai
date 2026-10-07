/**
 * MBYS-YARDIMCI-02 — "Haritayı kopyala": the doctor pastes what the helper's `Form haritasını kopyala` put on the
 * clipboard on each of the two MBYS screens; this turns them into ONE message to send to Notya.
 *
 * The capture holds structure only (labels, ids, option texts, never a typed value; the helper masks long digit runs).
 * This is a second guard before anything leaves the doctor's computer: a text that is not a helper capture is refused,
 * and anything that still looks like a T.C. kimlik number or an e-mail address is refused too. Pure, client-safe.
 */

export type HaritaEkrani = 'hastaKayit' | 'muayene'
export const HARITA_EKRANLARI: { anahtar: HaritaEkrani; ad: string }[] = [
  { anahtar: 'hastaKayit', ad: 'Hasta Kayıt ekranı' },
  { anahtar: 'muayene', ad: 'Muayene ekranı' },
]

export type HaritaMesajSonucu =
  | { ok: true; metin: string; eksik: HaritaEkrani[] }
  | { ok: false; hata: string }

/** Values that must never be in a capture: 11-digit runs (T.C. kimlik) and e-mail addresses. */
export function kisiselVeriVarMi(metin: string): boolean {
  return /(?<!\d)\d{11}(?!\d)/.test(metin) || /[^\s@"]+@[^\s@"]+\.[a-z]{2,}/i.test(metin)
}

function yakalamaMi(metin: string): boolean {
  try {
    const j = JSON.parse(metin) as { arac?: unknown; cerceveler?: unknown }
    return j?.arac === 'notya-mbys-harita' && Array.isArray(j.cerceveler)
  } catch {
    return false
  }
}

export function haritaMesaji(g: Partial<Record<HaritaEkrani, string>>, o: { yardimciSurumu?: string | null; simdi?: Date } = {}): HaritaMesajSonucu {
  const parcalar: string[] = []
  const eksik: HaritaEkrani[] = []
  for (const e of HARITA_EKRANLARI) {
    const metin = String(g[e.anahtar] || '').trim()
    if (!metin) { eksik.push(e.anahtar); continue }
    if (!yakalamaMi(metin)) return { ok: false, hata: `${e.ad}: yapıştırılan metin bir form haritası değil. MBYS'de “Form haritasını kopyala”ya basıp yeniden yapıştırın.` }
    if (kisiselVeriVarMi(metin)) return { ok: false, hata: `${e.ad}: metinde kimlik numarası ya da e-posta adresine benzeyen bir değer var. Haritayı hasta açmadan, boş ekranda yeniden kopyalayın.` }
    parcalar.push(`=== ${e.ad} ===\n${metin}`)
  }
  if (!parcalar.length) return { ok: false, hata: 'Önce en az bir ekranın haritasını yapıştırın.' }
  const tarih = (o.simdi || new Date()).toISOString().slice(0, 10)
  const ust = [
    'Notya MBYS Yardımcısı — form haritası',
    `Tarih: ${tarih}`,
    ...(o.yardimciSurumu ? [`Yardımcı sürümü: ${o.yardimciSurumu}`] : []),
    ...(eksik.length ? [`Eksik ekran: ${eksik.map((k) => HARITA_EKRANLARI.find((e) => e.anahtar === k)!.ad).join(', ')}`] : []),
    'İçerik yalnız alan adları ve etiketlerdir; hasta bilgisi yoktur.',
  ]
  return { ok: true, metin: `${ust.join('\n')}\n\n${parcalar.join('\n\n')}\n`, eksik }
}
