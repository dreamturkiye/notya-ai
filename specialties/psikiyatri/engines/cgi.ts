/**
 * PSIK-EXCEPTIONAL-01 — CGI-S / CGI-I (Clinical Global Impression). SAF fonksiyon.
 *
 * Kaynak: Guy W. ECDEU Assessment Manual for Psychopharmacology. Rockville: NIMH, 1976.
 * CGI KLİNİSYEN değerlendirmesidir — hasta doldurmaz, portala geçmez. 1–7 arası tek değer.
 *
 * ÜRÜN KİLİDİ: CGI hekimin kendi genel izlenimidir; Notya bu değeri hesaplamaz veya önermez,
 * yalnız hekimin girdiği değeri saklar ve etiketler. Tanı / doz kararı hekimin.
 */
import type { Dipnot } from './psikiyatri'

export type CgiDeger = 1 | 2 | 3 | 4 | 5 | 6 | 7

/** CGI-S — hastalık şiddeti (Severity of Illness). */
export const CGI_S_ETIKET: Record<CgiDeger, string> = {
  1: 'Hasta değil',
  2: 'Sınırda hasta',
  3: 'Hafif hasta',
  4: 'Orta derecede hasta',
  5: 'Belirgin hasta',
  6: 'Ağır hasta',
  7: 'Aşırı ağır hasta',
}

/** CGI-I — genel düzelme (Global Improvement), başlangıca göre. */
export const CGI_I_ETIKET: Record<CgiDeger, string> = {
  1: 'Çok fazla düzeldi',
  2: 'Fazla düzeldi',
  3: 'Az düzeldi',
  4: 'Değişiklik yok',
  5: 'Az kötüleşti',
  6: 'Fazla kötüleşti',
  7: 'Çok fazla kötüleşti',
}

export const CGI_DIPNOT: Dipnot = {
  ref: 'CGI_KAYNAK',
  not: 'CGI-S ve CGI-I 1–7 arası klinisyen değerlendirmesidir; hasta tarafından doldurulmaz ve hasta yüzünde gösterilmez.',
}

export function gecerliMi(deger: unknown): deger is CgiDeger {
  const n = Number(deger)
  return Number.isInteger(n) && n >= 1 && n <= 7
}

export interface CgiSonuc { tip: 'cgi_s' | 'cgi_i'; deger: CgiDeger; etiket: string; ozet: string; dipnot: Dipnot }

export function cgiS(deger: unknown): CgiSonuc | null {
  if (!gecerliMi(deger)) return null
  const d = Number(deger) as CgiDeger
  return { tip: 'cgi_s', deger: d, etiket: CGI_S_ETIKET[d], ozet: `CGI-S ${d} — ${CGI_S_ETIKET[d]} (hekim değerlendirmesi)`, dipnot: CGI_DIPNOT }
}

export function cgiI(deger: unknown): CgiSonuc | null {
  if (!gecerliMi(deger)) return null
  const d = Number(deger) as CgiDeger
  return { tip: 'cgi_i', deger: d, etiket: CGI_I_ETIKET[d], ozet: `CGI-I ${d} — ${CGI_I_ETIKET[d]} (hekim değerlendirmesi)`, dipnot: CGI_DIPNOT }
}

/** CGI-I 1–2 "yanıt", CGI-S ≤2 "remisyon benzeri" olarak yorumlanır — yorum TASLAKTIR, karar hekimin. */
export function yanitTaslagi(cgiIDeger: unknown): string | null {
  if (!gecerliMi(cgiIDeger)) return null
  const d = Number(cgiIDeger)
  if (d <= 2) return 'CGI-I 1–2: yanıt olarak yorumlanabilir (hekim kararı)'
  if (d === 3) return 'CGI-I 3: kısmi düzelme — plan gözden geçirilir (hekim)'
  if (d === 4) return 'CGI-I 4: değişiklik yok — plan gözden geçirilir (hekim)'
  return 'CGI-I ≥5: kötüleşme — aynı vizitte plan ve güvenlik değerlendirmesi (hekim)'
}
