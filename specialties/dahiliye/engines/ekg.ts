/**
 * NOTYA-DAH-WOW W3.5 — EKG 1-tap Türkçe rapor şablonları + acil bayraklar (mevcut kırmızı bayrak kapısına bağlanır).
 * QTc Bazett (hız 60–90 dışında Fridericia da verilir). Rapor taslaktır; hekim onaylar. Acil bayrak → Onayla öncesi "acil / sevk" kutusu.
 */
import type { Dipnot } from './dahiliye'

export type Ritim = 'sinus' | 'af' | 'flutter' | 'svt' | 'vt' | 'pacemaker' | 'diger'
export type AvBlok = 'yok' | '1' | '2_mobitz1' | '2_mobitz2' | '3'
export interface EkgGirdi { ritim: Ritim; hiz: number | null; pr: number | null; qrs: number | null; qt: number | null; aks: 'normal' | 'sol' | 'sag' | 'belirsiz'; stElevasyon: boolean; stDepresyon: boolean; tInversiyon: boolean; yeniLbbb: boolean; rbbb: boolean; avBlok: AvBlok; deltaDalga: boolean; lvh: boolean; gogusAgrisi: boolean; not?: string }
export interface EkgSonuc { qtcBazett: number | null; qtcFridericia: number | null; acil: string[]; dikkat: string[]; rapor: string; dipnotlar: Dipnot[] }

export const EKG_SABLONLARI: Record<string, { ad: string; g: Partial<EkgGirdi> }> = {
  normal: { ad: 'Normal sinüs ritmi', g: { ritim: 'sinus', hiz: 72, pr: 160, qrs: 90, qt: 380, aks: 'normal' } },
  af: { ad: 'Atriyal fibrilasyon', g: { ritim: 'af', hiz: 95, pr: null, qrs: 90, qt: 360, aks: 'normal' } },
  lvh: { ad: 'Sol ventrikül hipertrofisi (HT)', g: { ritim: 'sinus', hiz: 70, pr: 170, qrs: 100, qt: 400, aks: 'sol', lvh: true } },
  rbbb: { ad: 'Sağ dal bloğu', g: { ritim: 'sinus', hiz: 75, pr: 160, qrs: 130, qt: 400, aks: 'normal', rbbb: true } },
  bradi: { ad: 'Sinüs bradikardisi', g: { ritim: 'sinus', hiz: 52, pr: 170, qrs: 90, qt: 420, aks: 'normal' } },
  avb1: { ad: '1. derece AV blok', g: { ritim: 'sinus', hiz: 68, pr: 240, qrs: 90, qt: 400, aks: 'normal', avBlok: '1' } },
}

export function qtc(qtMs: number, hiz: number): { bazett: number; fridericia: number } {
  const rr = 60 / hiz
  return { bazett: Math.round(qtMs / Math.sqrt(rr)), fridericia: Math.round(qtMs / Math.cbrt(rr)) }
}

const RITIM_AD: Record<Ritim, string> = { sinus: 'sinüs ritmi', af: 'atriyal fibrilasyon', flutter: 'atriyal flutter', svt: 'supraventriküler taşikardi', vt: 'ventriküler taşikardi', pacemaker: 'pacemaker ritmi', diger: 'diğer ritim' }
const AV_AD: Record<AvBlok, string> = { yok: '', '1': '1. derece AV blok', '2_mobitz1': '2. derece AV blok (Mobitz I)', '2_mobitz2': '2. derece AV blok (Mobitz II)', '3': '3. derece (tam) AV blok' }

export function ekgDegerlendir(g: EkgGirdi): EkgSonuc {
  const dip: Dipnot[] = [{ ref: 'HARRISON', not: 'Acil EKG bulguları: ST elevasyonu, yeni LBBB + göğüs ağrısı, VT, Mobitz II / tam AV blok, ciddi bradi/taşikardi, QTc >500 ms, preeksitasyon + AF' }]
  const acil: string[] = [], dikkat: string[] = []
  let qb: number | null = null, qf: number | null = null
  if (g.qt && g.hiz && g.hiz > 0) { const q = qtc(g.qt, g.hiz); qb = q.bazett; qf = q.fridericia }
  if (g.stElevasyon) acil.push('ST elevasyonu: STEMI dışlanmalı — 112 / acil kardiyoloji')
  if (g.yeniLbbb && g.gogusAgrisi) acil.push('Yeni LBBB + göğüs ağrısı: akut koroner sendrom eşdeğeri — acil')
  if (g.ritim === 'vt') acil.push('Ventriküler taşikardi — acil')
  if (g.avBlok === '3' || g.avBlok === '2_mobitz2') acil.push(`${AV_AD[g.avBlok]} — pacemaker değerlendirmesi, acil kardiyoloji`)
  if (g.hiz != null && g.hiz < 40) acil.push(`Hız ${g.hiz}/dk <40 — acil`)
  if (g.hiz != null && g.hiz > 150) acil.push(`Hız ${g.hiz}/dk >150 — acil`)
  if (qb != null && qb > 500) acil.push(`QTc ${qb} ms >500 — torsades riski; QT uzatan ilaçları kes, K/Mg (acil)`)
  if (g.deltaDalga && (g.ritim === 'af' || g.ritim === 'flutter')) acil.push('Preeksitasyon + AF/flutter — AV nod blokeri verilmez, acil')
  if (g.stDepresyon && g.gogusAgrisi) acil.push('Göğüs ağrısı + ST depresyonu: NSTE-AKS dışlanmalı — acil')
  if ((g.ritim === 'af' || g.ritim === 'flutter') && g.hiz != null && g.hiz > 110 && g.hiz <= 150) dikkat.push(`AF hızlı ventrikül yanıtı (${g.hiz}/dk): hız kontrolü + antikoagülasyon değerlendirmesi (CHA₂DS₂-VASc) — kardiyoloji`)
  if (g.ritim === 'af' || g.ritim === 'flutter') dikkat.push('AF/flutter: antikoagülan kartı (inme riski) ve TSH')
  if (qb != null && qb > 470 && qb <= 500) dikkat.push(`QTc ${qb} ms sınırda uzun: QT uzatan ilaç / elektrolit kontrolü`)
  if (g.avBlok === '1') dikkat.push('1. derece AV blok: AV nodu yavaşlatan ilaçları gözden geçir')
  if (g.lvh) dikkat.push('SVH bulguları: HT hedef organ hasarı — ekokardiyografi değerlendir')
  if (g.tInversiyon && !g.stDepresyon) dikkat.push('T negatifliği: önceki EKG ile karşılaştır; semptom varsa kardiyoloji')
  if (g.deltaDalga && !acil.some((a) => /Preeksitasyon/.test(a))) dikkat.push('Delta dalgası (preeksitasyon): kardiyoloji sevki (elektif)')
  const s: string[] = []
  s.push(`Ritim: ${RITIM_AD[g.ritim]}${g.hiz != null ? `, hız ${g.hiz}/dk` : ''}.`)
  s.push([g.pr != null && g.ritim === 'sinus' ? `PR ${g.pr} ms` : null, g.qrs != null ? `QRS ${g.qrs} ms` : null, qb != null ? `QTc ${qb} ms (Bazett${qf != null && g.hiz != null && (g.hiz < 60 || g.hiz > 90) ? `; Fridericia ${qf} ms` : ''})` : null].filter(Boolean).join(', ') + '.')
  s.push(`Aks: ${g.aks === 'normal' ? 'normal' : g.aks === 'sol' ? 'sola sapmış' : g.aks === 'sag' ? 'sağa sapmış' : 'belirsiz'}.`)
  const bulgu = [AV_AD[g.avBlok], g.rbbb ? 'sağ dal bloğu' : '', g.yeniLbbb ? 'sol dal bloğu (yeni)' : '', g.lvh ? 'sol ventrikül hipertrofisi kriterleri' : '', g.stElevasyon ? 'ST elevasyonu' : '', g.stDepresyon ? 'ST depresyonu' : '', g.tInversiyon ? 'T dalga negatifliği' : '', g.deltaDalga ? 'delta dalgası' : ''].filter(Boolean)
  s.push(bulgu.length ? `Bulgular: ${bulgu.join(', ')}.` : 'ST-T değişikliği saptanmadı.')
  if (g.not) s.push(`Not: ${g.not}`)
  s.push(`Sonuç: ${acil.length ? 'ACİL değerlendirme gerektiren bulgu' : dikkat.length || bulgu.length ? 'anormal EKG — klinik korelasyon' : 'normal sınırlarda EKG'} (taslak — hekim onaylar).`)
  return { qtcBazett: qb, qtcFridericia: qf, acil, dikkat, rapor: s.join(' '), dipnotlar: dip }
}
