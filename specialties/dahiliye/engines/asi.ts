/**
 * NOTYA-DAH-WOW W2.6 — Erişkin aşı takvimi (HYP erişkin bağışıklama + TİHUD). Kural tabanlı due çipleri; doz miktarı yok.
 * Grip yıllık (sezon 1 Eylül) · pnömokok PCV20 tek doz VEYA PCV13 → PPSV23 · zona (rekombinant) ≥50 iki doz · Td/Tdap 10 yıl
 * · HBV yalnız seronegatifte (HBsAg negatif + anti-HBs <10) · COVID-19 Sağlık Bakanlığı güncel önerisi.
 * Hekim uygulama kararını verir; görevler dahiliye_gorevleri'ne düşer.
 */
import type { Dipnot } from './dahiliye'

export type AsiKod = 'grip' | 'pcv20' | 'pcv13' | 'ppsv23' | 'zona' | 'td' | 'hbv' | 'covid'
export const ASI_ADLARI: Record<AsiKod, string> = { grip: 'İnfluenza (grip)', pcv20: 'Pnömokok PCV20', pcv13: 'Pnömokok PCV13', ppsv23: 'Pnömokok PPSV23', zona: 'Zona (rekombinant)', td: 'Td / Tdap', hbv: 'Hepatit B', covid: 'COVID-19' }
export interface AsiKronik { dm?: boolean; kbh?: boolean; kvh?: boolean; akciger?: boolean; karaciger?: boolean; immunsup?: boolean; asplenik?: boolean; sigara?: boolean; alkol?: boolean }
export interface AsiGirdi { yas: number | null; kronik: AsiKronik; dozlar: { asi: AsiKod; tarih: string }[]; hbsag?: string | null; antiHbs?: number | null; bugun: string }
export type AsiDurum = 'gecikti' | 'zamani' | 'planli' | 'tamam' | 'seroloji' | 'uygun_degil'
export interface AsiDue { kod: string; ad: string; due: string | null; durum: AsiDurum; not: string; dipnot: Dipnot }

const HYP: Dipnot = { ref: 'HYP', not: 'Erişkin bağışıklama: risk grubu ve yaşa göre grip, pnömokok, zona, Td, HBV; COVID-19 Sağlık Bakanlığı güncel önerisi' }
function ekleAy(t: string, ay: number): string { const [y, m, d] = t.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + ay, d)).toISOString().slice(0, 10) }
function gunEkle(t: string, g: number): string { const d = new Date(t + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + g); return d.toISOString().slice(0, 10) }

export function asiTakvimi(g: AsiGirdi): AsiDue[] {
  const out: AsiDue[] = []
  const son = (k: AsiKod) => g.dozlar.filter((d) => d.asi === k).map((d) => d.tarih).sort().reverse()
  const y = g.yas
  const riskli = !!(g.kronik.dm || g.kronik.kbh || g.kronik.kvh || g.kronik.akciger || g.kronik.karaciger || g.kronik.immunsup || g.kronik.asplenik || g.kronik.sigara || g.kronik.alkol)
  const durum = (due: string): AsiDurum => (due < g.bugun ? 'gecikti' : due === g.bugun ? 'zamani' : 'planli')
  if (y == null || y < 18) return [{ kod: 'yas', ad: 'Erişkin aşı takvimi', due: null, durum: 'uygun_degil', not: 'Yaş bilinmiyor veya <18 — pediatri takvimi', dipnot: HYP }]

  // Grip — sezon 1 Eylül; ≥65 veya kronik hastalık öncelikli (herkese önerilebilir)
  const [by, bm] = g.bugun.split('-').map(Number)
  const sezon = `${bm >= 9 ? by : by - 1}-09-01`
  const gripSon = son('grip')[0]
  if (gripSon && gripSon >= sezon) out.push({ kod: 'grip', ad: ASI_ADLARI.grip, due: `${Number(sezon.slice(0, 4)) + 1}-09-01`, durum: 'tamam', not: `Bu sezon yapıldı (${gripSon})`, dipnot: HYP })
  else if (y >= 65 || riskli) out.push({ kod: 'grip', ad: ASI_ADLARI.grip, due: bm >= 4 && bm < 9 ? `${by}-09-01` : g.bugun, durum: bm >= 4 && bm < 9 ? 'planli' : 'zamani', not: `${y >= 65 ? '≥65 yaş' : 'Kronik hastalık'} — yıllık grip aşısı (sezon Eylül–Mart)`, dipnot: HYP })

  // Pnömokok — ≥65 veya 19–64 risk grubu
  if (y >= 65 || riskli) {
    const pcv20 = son('pcv20')[0], pcv13 = son('pcv13')[0], ppsv = son('ppsv23')[0]
    const kisa = !!(g.kronik.immunsup || g.kronik.asplenik || g.kronik.kbh)
    if (pcv20) out.push({ kod: 'pnomokok', ad: 'Pnömokok', due: null, durum: 'tamam', not: `PCV20 yapıldı (${pcv20}) — seri tamam`, dipnot: HYP })
    else if (pcv13 && ppsv) out.push({ kod: 'pnomokok', ad: 'Pnömokok', due: null, durum: 'tamam', not: `PCV13 (${pcv13}) + PPSV23 (${ppsv}) — seri tamam${y >= 65 && ppsv < ekleAy(g.bugun, -12 * (y - 65)) ? '; 65 yaş öncesi PPSV23 ise hekim ek doz değerlendirir' : ''}`, dipnot: HYP })
    else if (pcv13) { const due = kisa ? gunEkle(pcv13, 56) : ekleAy(pcv13, 12); out.push({ kod: 'pnomokok', ad: 'Pnömokok PPSV23 (PCV13 sonrası)', due, durum: durum(due), not: `PCV13 ${pcv13}; PPSV23 ${kisa ? '≥8 hafta (immünsüpresyon/asplenia/KBH)' : '≥1 yıl'} sonra`, dipnot: HYP }) }
    else if (ppsv) { const due = ekleAy(ppsv, 12); out.push({ kod: 'pnomokok', ad: 'Pnömokok konjuge aşı (PPSV23 sonrası)', due, durum: durum(due), not: `PPSV23 ${ppsv}; konjuge aşı (PCV20 veya PCV13) ≥1 yıl sonra`, dipnot: HYP }) }
    else out.push({ kod: 'pnomokok', ad: 'Pnömokok', due: g.bugun, durum: 'zamani', not: 'Hiç yapılmamış: PCV20 tek doz VEYA PCV13 → PPSV23 dizisi (hekim seçer)', dipnot: HYP })
  }

  // Zona — ≥50 (immünsüpresede ≥18), rekombinant 2 doz, 2–6 ay ara
  if (y >= 50 || g.kronik.immunsup) {
    const z = son('zona')
    if (z.length >= 2) out.push({ kod: 'zona', ad: ASI_ADLARI.zona, due: null, durum: 'tamam', not: '2 doz tamam', dipnot: HYP })
    else if (z.length === 1) { const due = ekleAy(z[0], 2); out.push({ kod: 'zona', ad: `${ASI_ADLARI.zona} — 2. doz`, due, durum: durum(due), not: `1. doz ${z[0]}; 2. doz 2–6 ay sonra`, dipnot: HYP }) }
    else out.push({ kod: 'zona', ad: ASI_ADLARI.zona, due: g.bugun, durum: 'zamani', not: `${y >= 50 ? '≥50 yaş' : 'İmmünsüpresyon'}: rekombinant zona aşısı 2 doz (özel ödeme olabilir)`, dipnot: HYP })
  }

  // Td/Tdap — 10 yılda bir
  const td = son('td')[0]
  if (td && td >= ekleAy(g.bugun, -120)) out.push({ kod: 'td', ad: ASI_ADLARI.td, due: ekleAy(td, 120), durum: 'tamam', not: `Son doz ${td}`, dipnot: HYP })
  else { const due = td ? ekleAy(td, 120) : g.bugun; out.push({ kod: 'td', ad: ASI_ADLARI.td, due, durum: td ? durum(due) : 'zamani', not: td ? `Son doz ${td} — 10 yıl doldu` : 'Kayıt yok: Td/Tdap (tamamlanmamış seri ise 0-1-6 ay)', dipnot: HYP }) }

  // HBV — seroloji önce
  const hbv = son('hbv')
  const hbsagPoz = g.hbsag != null && /pozitif|reaktif|\+|positive/i.test(g.hbsag) && !/negatif|non-?reaktif/i.test(g.hbsag)
  if (hbsagPoz) out.push({ kod: 'hbv', ad: 'Hepatit B', due: null, durum: 'uygun_degil', not: 'HBsAg pozitif — aşı değil, hepatit B izlem/gastro sevk', dipnot: { ref: 'TIHUD2023', not: 'HBsAg pozitifliği kronik HBV değerlendirmesi gerektirir' } })
  else if (g.antiHbs != null && g.antiHbs >= 10) out.push({ kod: 'hbv', ad: 'Hepatit B', due: null, durum: 'tamam', not: `Anti-HBs ${g.antiHbs} mIU/mL — bağışık`, dipnot: HYP })
  else if (hbv.length >= 3) out.push({ kod: 'hbv', ad: 'Hepatit B', due: null, durum: 'tamam', not: '3 doz tamam — yanıt için anti-HBs (hekim)', dipnot: HYP })
  else if (g.hbsag == null || g.antiHbs == null) { if (riskli || y < 60) out.push({ kod: 'hbv', ad: 'Hepatit B serolojisi', due: g.bugun, durum: 'seroloji', not: 'HBsAg + anti-HBs iste; seronegatifse 0-1-6 ay aşı', dipnot: HYP }) }
  else { const due = hbv.length === 0 ? g.bugun : hbv.length === 1 ? ekleAy(hbv[0], 1) : ekleAy(hbv[hbv.length - 1], 5); out.push({ kod: 'hbv', ad: `Hepatit B — ${hbv.length + 1}. doz`, due, durum: hbv.length === 0 ? 'zamani' : durum(due), not: 'Seronegatif: 0-1-6 ay şeması', dipnot: HYP }) }

  // COVID-19 — ≥65 veya risk: MoH güncel önerisi
  if (y >= 65 || riskli) {
    const c = son('covid')[0]
    if (c && c >= ekleAy(g.bugun, -12)) out.push({ kod: 'covid', ad: ASI_ADLARI.covid, due: ekleAy(c, 12), durum: 'tamam', not: `Son doz ${c}`, dipnot: { ref: 'HYP', not: 'COVID-19: Sağlık Bakanlığı güncel risk grubu önerisi' } })
    else out.push({ kod: 'covid', ad: ASI_ADLARI.covid, due: g.bugun, durum: 'zamani', not: 'Risk grubu: Sağlık Bakanlığı güncel önerisine göre güncel doz (hekim)', dipnot: { ref: 'HYP', not: 'COVID-19: Sağlık Bakanlığı güncel risk grubu önerisi' } })
  }
  return out
}
