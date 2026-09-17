/**
 * NOTYA-DAH-WOW-NEXT C4 — D vitamini / B12 eksikliği kartları. Yalnız onaylı lab satırları (VitD = 25-OH D ng/mL, B12 pg/mL,
 * Folat ng/mL). Sonraki test + replasman SINIFI önerir; yol, doz ve süreyi hekim yazar. Plan hekim kilidi (kart=vitamin alan=plan).
 * SGK: sgkRapor.ts 'vitd' / 'b12' şablonları — SUT koşulu hekim güncel metinle doğrular.
 */
import type { Dipnot } from './dahiliye'

export interface VitGirdi {
  vitD: number | null; vitDTarih: string | null; b12: number | null; b12Tarih: string | null; folat: number | null
  hb: number | null; mcv: number | null; ca: number | null; kadin: boolean
  ilacMetinleri: string[]; noroSemptom: boolean; malabsorpsiyon: boolean; vegan: boolean; bugun: string
}
export type DDurum = 'eksik' | 'yetersiz' | 'yeterli' | 'yuksek'
export type B12Durum = 'eksik' | 'sinirda' | 'normal'
export interface VitSonuc {
  d: { durum: DDurum | null; plan: string[]; sonrakiTest: string[]; uyarilar: string[] }
  b12: { durum: B12Durum | null; plan: string[]; sonrakiTest: string[]; uyarilar: string[] }
  sevk: string[]; gorevler: { kod: string; ad: string; due: string }[]; sgkSablonlari: ('vitd' | 'b12')[]; dipnotlar: Dipnot[]
}

const ekleAy = (t: string, ay: number) => { const [y, m, d] = t.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + ay, d)).toISOString().slice(0, 10) }

export function vitaminDegerlendir(g: VitGirdi): VitSonuc {
  const dip: Dipnot[] = [{ ref: 'TEMD_OSTEO2025', not: '25-OH D: <20 ng/mL eksiklik, 20–29 yetersizlik, ≥30 yeterli; replasman sonrası düzey ve kalsiyum izlemi; doz ve süre hekim' }, { ref: 'HARRISON', not: 'B12 <200 pg/mL eksiklik; 200–300 sınırda → metilmalonik asit / homosistein; nörolojik bulguda parenteral yol tercih edilir; folat B12 düzeltilmeden tek başına verilmez' }]
  const r: VitSonuc = { d: { durum: null, plan: [], sonrakiTest: [], uyarilar: [] }, b12: { durum: null, plan: [], sonrakiTest: [], uyarilar: [] }, sevk: [], gorevler: [], sgkSablonlari: [], dipnotlar: dip }
  const t = (re: RegExp) => g.ilacMetinleri.some((x) => re.test(x.toLocaleLowerCase('tr-TR')))

  // ---- D vitamini
  if (g.vitD == null) r.d.sonrakiTest.push('25-OH D vitamini (risk grubunda: osteoporoz, malabsorpsiyon, KBH, yaşlı / az güneş)')
  else {
    r.d.durum = g.vitD < 20 ? 'eksik' : g.vitD < 30 ? 'yetersiz' : g.vitD <= 100 ? 'yeterli' : 'yuksek'
    if (r.d.durum === 'eksik' || r.d.durum === 'yetersiz') {
      r.d.plan.push(`D vitamini replasmanı (kolekalsiferol sınıfı) — ${r.d.durum === 'eksik' ? 'yükleme + idame' : 'idame'}; yol, doz ve süre hekim yazar`)
      r.d.plan.push('Diyet kalsiyumu ve güneş ışığı önerisi; düşme / kas güçsüzlüğü sorgula')
      if (g.ca == null) r.d.sonrakiTest.push('Kalsiyum (replasman öncesi)')
      r.d.sonrakiTest.push('Kalsiyum, fosfor, ALP; eksiklik ağır veya Ca anormalse PTH')
      r.gorevler.push({ kod: 'vitd_kontrol', ad: '25-OH D + Ca kontrolü (replasman sonrası)', due: ekleAy(g.bugun, 3) })
      if (r.d.durum === 'eksik') r.sgkSablonlari.push('vitd')
      if (g.malabsorpsiyon) r.d.uyarilar.push('Malabsorpsiyon: oral yanıt yetersiz olabilir — yol ve düzey izlemi hekim')
    }
    if (r.d.durum === 'yuksek') r.d.uyarilar.push(`25-OH D ${g.vitD} >100 ng/mL: replasmanı gözden geçir; Ca ile toksisite değerlendirmesi (hekim)`)
  }
  if (g.ca != null && g.ca > 10.5) r.d.uyarilar.push(`Ca ${g.ca} >10,5: hiperkalsemi — D vitamini replasmanı öncesi neden araştırılır (PTH), hekim`)
  if (t(/kolekalsiferol|d3 vitamini|d vitamini|kalsitriol|alfakalsidol|devit|d-vit/) && r.d.durum === 'yeterli') r.d.plan.push('Düzey yeterli: idame gerekliliği ve dozu hekim gözden geçirir')

  // ---- B12
  const metformin = t(/metformin/), ppi = t(/omeprazol|esomeprazol|lansoprazol|pantoprazol|rabeprazol/)
  if (g.b12 == null) {
    if (metformin) r.b12.sonrakiTest.push('B12 (metformin kullanımı — yıllık)')
    else if (g.mcv != null && g.mcv > 100) r.b12.sonrakiTest.push('B12 + folat (makrositoz)')
    else if (g.noroSemptom) r.b12.sonrakiTest.push('B12 (nöropati / bilişsel yakınma)')
  } else {
    r.b12.durum = g.b12 < 200 ? 'eksik' : g.b12 <= 300 ? 'sinirda' : 'normal'
    if (r.b12.durum === 'sinirda') r.b12.sonrakiTest.push('Metilmalonik asit veya homosistein (sınırda B12 doğrulaması)')
    if (r.b12.durum === 'eksik') {
      r.b12.plan.push(`B12 replasmanı — ${g.noroSemptom || g.malabsorpsiyon ? 'parenteral yol tercih edilir (nörolojik bulgu / malabsorpsiyon)' : 'oral veya parenteral'}; doz ve süre hekim yazar`)
      r.b12.sonrakiTest.push('Anti-intrinsik faktör antikoru (pernisiyöz anemi)', 'Hemogram + periferik yayma, folat')
      if (!g.vegan && !metformin && !ppi) r.b12.sonrakiTest.push('Neden araştırması: gastrit / malabsorpsiyon (hekim gerekirse gastroenteroloji)')
      r.gorevler.push({ kod: 'b12_kontrol', ad: 'B12 + hemogram kontrolü (replasman sonrası)', due: ekleAy(g.bugun, 3) })
      r.sgkSablonlari.push('b12')
      if (g.noroSemptom) r.sevk.push('Nöroloji: B12 eksikliği + nörolojik bulgu (hekim kararı)')
    }
    if (metformin && r.b12.durum !== 'normal') r.b12.uyarilar.push('Metformin uzun süreli kullanımı B12 düşüklüğüyle ilişkili — yıllık B12 izlemi')
    if (ppi && r.b12.durum !== 'normal') r.b12.uyarilar.push('Uzun süreli PPI B12 emilimini azaltabilir — endikasyon gözden geçir')
    if (g.vegan && r.b12.durum !== 'normal') r.b12.uyarilar.push('Vegan beslenme: diyet kaynaklı eksiklik — sürekli takviye ihtiyacı hekim')
  }
  if (g.folat != null && g.folat < 4) r.b12.uyarilar.push(`Folat ${g.folat} düşük: ${r.b12.durum === 'eksik' ? 'B12 replasmanı başlamadan folat tek başına verilmez' : 'folat replasmanı sınıfı (hekim) — B12 düzeyi doğrulanmış olmalı'}`)
  const anemi = g.hb != null && g.hb < (g.kadin ? 12 : 13)
  if (anemi && g.mcv != null && g.mcv > 100 && r.b12.durum === 'eksik') r.b12.plan.push('Makrositer anemi + B12 eksikliği: Anemi kartındaki tetkik merdiveniyle birlikte değerlendir')
  return r
}
