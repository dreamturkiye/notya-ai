/**
 * NOTYA-DAH-WOW W4.2 — Bakım kalitesi dürtmeleri (her kartın üstünde): ≥65 kırılganlık (FRAIL ölçeği) + düşme taraması
 * (3 anahtar soru), kronik kartlarda PHQ-2, HT'de "kontrolsüz" demeden önce KB ölçüm tekniği kontrol listesi.
 * Tarama ≠ tanı; pozitif sonuç → hekim değerlendirmesi. Sonuçlar dahiliye_taramalar'a, hekim kilidi kart=nudge.
 */
import type { Dipnot } from './dahiliye'

export const KB_TEKNIK = ['5 dk sessiz oturma, sırt destekli, ayaklar yerde', 'Kol kalp hizasında, destekli', 'Kol çevresine uygun manşet', 'Son 30 dk kafein / sigara / egzersiz yok', 'Ölçüm sırasında konuşma yok', '1–2 dk arayla en az 2 ölçüm, ortalama', 'İlk vizitte iki koldan ölçüm (yüksek olan kol)']
export const FRAIL_SORULAR = [{ kod: 'yorgunluk', ad: 'Son 4 haftada çoğu zaman yorgun hissetti mi?' }, { kod: 'direnc', ad: 'Yardımsız 10 basamak merdiven çıkmakta zorlanıyor mu?' }, { kod: 'ambulasyon', ad: 'Yardımsız birkaç yüz metre yürümekte zorlanıyor mu?' }, { kod: 'hastalik', ad: '5 veya daha fazla kronik hastalığı var mı?' }, { kod: 'kilo', ad: 'Son 1 yılda istemsiz >%5 kilo kaybı oldu mu?' }] as const
export const DUSME_SORULAR = [{ kod: 'dustu', ad: 'Son 1 yılda düştü mü?' }, { kod: 'dengesiz', ad: 'Ayakta dururken / yürürken dengesiz hissediyor mu?' }, { kod: 'endise', ad: 'Düşmekten endişe ediyor mu?' }] as const
export const PHQ2_SORULAR = [{ kod: 'ilgi', ad: 'Son 2 haftada bir şeyler yapmaya ilgi veya zevk azlığı' }, { kod: 'cokkunluk', ad: 'Son 2 haftada çökkün, depresif veya umutsuz hissetme' }] as const
export const PHQ2_SECENEK: [number, string][] = [[0, 'Hiç'], [1, 'Birkaç gün'], [2, 'Günlerin yarısından fazla'], [3, 'Neredeyse her gün']]

export function frailSkoru(c: Record<string, boolean>): { skor: number; sinif: 'saglam' | 'on_kirilgan' | 'kirilgan'; not: string } {
  const skor = FRAIL_SORULAR.filter((q) => c[q.kod]).length
  const sinif = skor >= 3 ? 'kirilgan' : skor >= 1 ? 'on_kirilgan' : 'saglam'
  return { skor, sinif, not: sinif === 'kirilgan' ? 'Kırılgan (≥3): KB/HbA1c hedeflerini gevşetmeyi, polifarmasiyi, beslenme ve egzersiz programını değerlendir (hekim). HT kartında "kırılgan" kutusu hekim kararıdır.' : sinif === 'on_kirilgan' ? 'Ön-kırılgan (1–2): direnç egzersizi, protein alımı, yıllık tekrar' : 'Sağlam: yıllık tekrar' }
}
export function dusmeRiski(c: Record<string, boolean>): { pozitif: boolean; not: string } {
  const pozitif = DUSME_SORULAR.some((q) => c[q.kod])
  return { pozitif, not: pozitif ? 'Düşme riski: yürüme/denge testi (Kalk-Yürü), ortostatik KB, görme, düşme riskini artıran ilaçlar (sedatif, antihipertansif, hipoglisemik), D vitamini, ev güvenliği — hekim' : 'Düşme taraması negatif — yıllık tekrar' }
}
export function phq2Skoru(c: Record<string, number>): { skor: number; pozitif: boolean; not: string } {
  const skor = PHQ2_SORULAR.reduce((s, q) => s + Math.max(0, Math.min(3, Number(c[q.kod]) || 0)), 0)
  const pozitif = skor >= 3
  return { skor, pozitif, not: pozitif ? 'PHQ-2 ≥3: PHQ-9 ile ayrıntılı değerlendirme; kendine zarar verme düşüncesini sor — varsa aynı gün psikiyatri/acil' : 'PHQ-2 negatif' }
}

export interface NudgeGirdi { yas: number | null; kronikKart: boolean; sonFrail: string | null; sonDusme: string | null; sonPhq2: string | null; kbHedefDisi: boolean; kbTeknikOnay: boolean; bugun: string }
export interface Nudge { kod: 'frail' | 'dusme' | 'phq2' | 'kb_teknik'; ad: string; neden: string; dipnot: Dipnot }

function ekleAy(t: string, ay: number): string { const [y, m, d] = t.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + ay, d)).toISOString().slice(0, 10) }
export function nudgeListesi(g: NudgeGirdi): Nudge[] {
  const out: Nudge[] = []
  const eski = (t: string | null) => !t || t < ekleAy(g.bugun, -12)
  if (g.kbHedefDisi && !g.kbTeknikOnay) out.push({ kod: 'kb_teknik', ad: 'KB ölçüm tekniği', neden: '"Kontrolsüz" demeden önce ölçüm tekniğini doğrulayın', dipnot: { ref: 'HT_UZLASI2025', not: 'Standart ofis ölçümü: 5 dk oturma, uygun manşet, kol kalp hizası, ≥2 ölçüm ortalaması; ev/ambulatuvar KB ile doğrulama' } })
  if (g.yas != null && g.yas >= 65 && eski(g.sonFrail)) out.push({ kod: 'frail', ad: 'Kırılganlık taraması (FRAIL)', neden: '≥65 yaş — yıllık', dipnot: { ref: 'TIHUD2023', not: 'Yaşlıda kırılganlık taraması hedef bireyselleştirmesi ve polifarmasi kararlarını etkiler' } })
  if (g.yas != null && g.yas >= 65 && eski(g.sonDusme)) out.push({ kod: 'dusme', ad: 'Düşme taraması (3 soru)', neden: '≥65 yaş — yıllık', dipnot: { ref: 'HYP', not: 'Yaşlı izleminde yıllık düşme riski sorgulaması' } })
  if (g.kronikKart && eski(g.sonPhq2)) out.push({ kod: 'phq2', ad: 'Depresyon taraması (PHQ-2)', neden: 'Kronik hastalık izlemi — yıllık', dipnot: { ref: 'HYP', not: 'Kronik hastalık izleminde depresyon taraması (PHQ-2, pozitifse PHQ-9)' } })
  return out
}
