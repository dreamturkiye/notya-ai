/**
 * NOTYA-DAH-WOW W1.5 — Ev kayıtları (KB / glukoz / kilo): beyaz önlük & maskeli HT kuralı, ortalama, uyum notu.
 * Ev KB eşiği ≥135/85 (Uzlaşı 2025 / ESH); ideal: 7 gün, sabah-akşam ikişer ölçüm, ilk gün atılır.
 */
import type { Dipnot } from './dahiliye'
export interface EvKb { sbp: number; dbp: number; olcumAt: string }
export interface EvGlukoz { deger: number; olcumAt: string; aclik?: boolean }
export interface EvKbOzet { n: number; ortSbp: number | null; ortDbp: number | null; evHt: boolean | null; fenotip: 'kontrolde' | 'beyaz_onluk' | 'maskeli' | 'surdurulen_ht' | 'yetersiz_veri'; not: string; dipnotlar: Dipnot[] }

export function evKbOzeti(kayitlar: EvKb[], ofis: { sbp: number; dbp: number } | null, bugun: string): EvKbOzet {
  const dip: Dipnot[] = [{ ref: 'HT_UZLASI2025', not: 'Ev KB ortalaması ≥135/85 = ev hipertansiyonu; ofis ≥140/90 + ev <135/85 = beyaz önlük; ofis <140/90 + ev ≥135/85 = maskeli' }]
  const son = kayitlar.filter((k) => k.olcumAt.slice(0, 10) >= gunEkle(bugun, -14)).sort((a, b) => a.olcumAt.localeCompare(b.olcumAt))
  if (son.length < 6) return { n: son.length, ortSbp: null, ortDbp: null, evHt: null, fenotip: 'yetersiz_veri', not: `Son 14 günde ${son.length} ölçüm — en az 6 (ideal 7 gün × sabah/akşam) gerekir`, dipnotlar: dip }
  const kullan = son.length >= 12 ? son.slice(2) : son // ilk gün ölçümlerini at (≥12 ise)
  const ortSbp = Math.round(kullan.reduce((s, k) => s + k.sbp, 0) / kullan.length), ortDbp = Math.round(kullan.reduce((s, k) => s + k.dbp, 0) / kullan.length)
  const evHt = ortSbp >= 135 || ortDbp >= 85
  let fenotip: EvKbOzet['fenotip'] = evHt ? 'surdurulen_ht' : 'kontrolde'
  if (ofis) { const ofisHt = ofis.sbp >= 140 || ofis.dbp >= 90; fenotip = ofisHt && !evHt ? 'beyaz_onluk' : !ofisHt && evHt ? 'maskeli' : evHt ? 'surdurulen_ht' : 'kontrolde' }
  const notlar: Record<EvKbOzet['fenotip'], string> = { kontrolde: 'Ev ve ofis hedefte', beyaz_onluk: 'Beyaz önlük etkisi: ilaç yükseltmeden önce ambulatuvar KB / ev takibi', maskeli: 'Maskeli HT: ev yüksek, ofis normal — tedavi kararı ev değerlerine göre (hekim)', surdurulen_ht: 'Ev ortalaması hedef dışı — HT kartında plan', yetersiz_veri: '' }
  return { n: son.length, ortSbp, ortDbp, evHt, fenotip, not: notlar[fenotip], dipnotlar: dip }
}

export function evGlukozOzeti(k: EvGlukoz[], bugun: string): { n: number; aclikOrt: number | null; hipo: number; yuksek: number; not: string } {
  const son = k.filter((x) => x.olcumAt.slice(0, 10) >= gunEkle(bugun, -14))
  const aclik = son.filter((x) => x.aclik !== false)
  const aclikOrt = aclik.length ? Math.round(aclik.reduce((s, x) => s + x.deger, 0) / aclik.length) : null
  const hipo = son.filter((x) => x.deger < 70).length, yuksek = son.filter((x) => x.deger > 180).length
  const not = hipo ? `${hipo} hipoglisemi (<70): ilaç/insülin gözden geçir — hekim` : aclikOrt != null && aclikOrt > 130 ? 'Açlık ortalaması >130: HbA1c ile birlikte değerlendir' : son.length ? 'Ev glukoz kabul edilebilir aralıkta' : 'Kayıt yok'
  return { n: son.length, aclikOrt, hipo, yuksek, not }
}

function gunEkle(t: string, g: number): string { const d = new Date(t + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + g); return d.toISOString().slice(0, 10) }
