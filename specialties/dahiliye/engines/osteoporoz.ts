/**
 * NOTYA-DAH-WOW C7 — Osteoporoz DXA T-skoru kartı (TEMD_OSTEO2025); dxaGorevi hatırlatmasının ötesi.
 * T-skoru yalnız DXA belgesinden (tSkoruCikar → hekim onayı) veya hekim girişinden; motor değer uydurmaz.
 * WHO/TEMD dansitometrik sınıf: T ≤ −2,5 osteoporoz · −2,5 < T < −1,0 osteopeni · T ≥ −1,0 normal; T ≤ −2,5 + kırılganlık kırığı ağır osteoporoz.
 * Vertebra/kalça kırılganlık kırığı → T'den bağımsız klinik osteoporoz bayrağı. Bayrak ≠ tanı; tanı/plan hekim kilitler.
 * FRAX (lisanslı) HESAPLANMAZ, taklit edilmez; kırık olasılığı üretilmez. Tedavi yalnız sınıf düzeyinde — doz yok (hekim yazar).
 */
import type { Dipnot } from './dahiliye'

export type DxaBolge = 'lomber' | 'femurBoyun' | 'totalKalca'
export interface OsteoRiskler { kirilganlikKirigi: boolean; vertebraKalcaKirigi: boolean; glukokortikoid3Ay: boolean; erkenMenopoz: boolean; romatoidArtrit: boolean; sigara: boolean; alkol3Unite: boolean; ebeveynKalcaKirigi: boolean; aromatazInhibitoruAdt: boolean }
export interface OsteoGirdi {
  yas: number | null; kadin: boolean; vki: number | null
  tSkorlari: Partial<Record<DxaBolge, number | null>>; dxaTarihi: string | null
  riskler: OsteoRiskler; dusmePozitif: boolean
  eGFR: number | null; ca: number | null; vitD: number | null /* onaylı lab */
  ilacMetinleri: string[]; bugun: string
}
export type OsteoSinif = 'normal' | 'osteopeni' | 'osteoporoz' | 'agir_osteoporoz'
export interface OsteoSonuc {
  sinif: OsteoSinif | null; enDusukT: number | null; enDusukBolge: DxaBolge | null; klinikOsteoporoz: boolean
  riskBayraklari: string[]; fraxNotu: string; tedavide: boolean; tedaviSinifi: string[]; plan: string[]; sekonderTetkik: string[]
  dxaAraligiAy: number | null; sonrakiDxa: string | null; uyarilar: string[]; sevk: string[]; gorevler: { kod: string; ad: string; due: string }[]; dipnotlar: Dipnot[]
}
export const BOLGE_AD: Record<DxaBolge, string> = { lomber: 'Lomber omurga (L1–L4)', femurBoyun: 'Femur boynu', totalKalca: 'Total kalça' }
const FRAX_NOTU = 'FRAX hesaplanacaksa resmi (lisanslı) araç kullanılır; Notya FRAX hesaplamaz'
const RISK_AD: Record<keyof OsteoRiskler, string> = { kirilganlikKirigi: 'Kırılganlık kırığı öyküsü', vertebraKalcaKirigi: 'Vertebra/kalça kırılganlık kırığı', glukokortikoid3Ay: 'Glukokortikoid kullanımı (3 ay ve üzeri)', erkenMenopoz: 'Erken menopoz', romatoidArtrit: 'Romatoid artrit', sigara: 'Sigara', alkol3Unite: 'Alkol (günde 3 birim ve üzeri)', ebeveynKalcaKirigi: 'Ebeveynde kalça kırığı', aromatazInhibitoruAdt: 'Aromataz inhibitörü / androjen deprivasyon tedavisi' }
const TEDAVI_RE = /alendronat|risedronat|ibandronat|zoledron|denosumab|teriparatid|romosozumab|raloksifen/i
const gecerliT = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= -6 && v <= 4
function ekleAy(t: string, ay: number): string { const [y, m, d] = t.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + ay, d)).toISOString().slice(0, 10) }

const BOLGE_RE: [DxaBolge, RegExp][] = [
  ['lomber', /L\s*1\s*[-–—]\s*L?\s*4|lomber|lumbar|lombar|spine/gi],
  ['femurBoyun', /femur\s*boyn?u?n?|femoral\s*neck|femur\s*neck/gi],
  ['totalKalca', /total\s*kal[çc]a|total\s*hip|total\s*femur|toplam\s*kal[çc]a/gi],
]
/** DXA rapor metninden (belge özet/bulgular) T-skorlarını çıkarır; bulunamayan bölge alınmaz. Hekim onayına ön-doldurma içindir. */
export function tSkoruCikar(metin: string): Partial<Record<DxaBolge, number>> {
  const out: Partial<Record<DxaBolge, number>> = {}
  if (!metin) return out
  const m = metin.replace(/−/g, '-')
  const esler: { b: DxaBolge; bas: number; son: number }[] = []
  for (const [b, re] of BOLGE_RE) for (const x of m.matchAll(re)) esler.push({ b, bas: x.index!, son: x.index! + x[0].length })
  esler.sort((a, b) => a.bas - b.bas)
  const T_RE = /\bT(?:\s*[-‐ ]?\s*(?:skoru|skor|score))?\s*[:=]?\s*(-?\s?\d+(?:[.,]\d+)?)/i
  for (let i = 0; i < esler.length; i++) {
    const e = esler[i]
    if (out[e.b] != null) continue
    const sonraki = esler.slice(i + 1).find((x) => x.b !== e.b && x.bas >= e.son)
    const pencere = m.slice(e.son, Math.min(e.son + 80, sonraki ? sonraki.bas : Infinity))
    const t = T_RE.exec(pencere)
    if (!t) continue
    const v = Number(t[1].replace(/\s/g, '').replace(',', '.'))
    if (gecerliT(v)) out[e.b] = v
  }
  return out
}

export function osteoDegerlendir(g: OsteoGirdi): OsteoSonuc {
  const dip: Dipnot[] = [
    { ref: 'TEMD_OSTEO2025', not: 'DXA T-skoru sınıflaması (postmenopozal kadın / 50 yaş ve üzeri erkek): T ≤ −2,5 osteoporoz, −2,5 ile −1,0 arası osteopeni; vertebra/kalça kırılganlık kırığında T-skorundan bağımsız klinik osteoporoz tanısı; antirezorptif (bisfosfonat, denosumab) ve çok yüksek riskte anabolik tedavi sınıfları; kalsiyum ve D vitamini yeterliliği; DXA izlem aralığı hekim belirler' },
    { ref: 'TEMD_OSTEO2025', not: FRAX_NOTU + ' — kırık olasılığı üretilmez' },
    { ref: 'HARRISON', not: 'Sekonder osteoporoz nedenleri: hiperparatiroidi, hipertiroidi, hipogonadizm, D vitamini eksikliği, multipl miyelom, glukokortikoid, malabsorpsiyon, KBH' },
    { ref: 'TIHUD2023', not: 'Yaşlıda düşme önleme: ev güvenliği, denge/kuvvet egzersizi, görme değerlendirmesi, düşme riskini artıran ilaçların gözden geçirilmesi' },
  ]
  const R = g.riskler
  const r: OsteoSonuc = { sinif: null, enDusukT: null, enDusukBolge: null, klinikOsteoporoz: !!R.vertebraKalcaKirigi, riskBayraklari: [], fraxNotu: FRAX_NOTU, tedavide: g.ilacMetinleri.some((s) => TEDAVI_RE.test(s)), tedaviSinifi: [], plan: [], sekonderTetkik: [], dxaAraligiAy: null, sonrakiDxa: null, uyarilar: [], sevk: [], gorevler: [], dipnotlar: dip }
  for (const b of Object.keys(BOLGE_AD) as DxaBolge[]) { const v = g.tSkorlari[b]; if (gecerliT(v) && (r.enDusukT == null || v < r.enDusukT)) { r.enDusukT = v; r.enDusukBolge = b } }
  const T = r.enDusukT
  if (T != null) r.sinif = T <= -2.5 ? (R.kirilganlikKirigi ? 'agir_osteoporoz' : 'osteoporoz') : T < -1.0 ? 'osteopeni' : 'normal'
  for (const k of Object.keys(RISK_AD) as (keyof OsteoRiskler)[]) if (R[k]) r.riskBayraklari.push(RISK_AD[k])
  if (g.vki != null && g.vki < 20) r.riskBayraklari.push('Düşük VKİ')
  if (g.dusmePozitif) r.riskBayraklari.push('Düşme taraması pozitif')
  if (g.yas != null && ((g.kadin && g.yas >= 65) || (!g.kadin && g.yas >= 70))) r.riskBayraklari.push('İleri yaş')
  if (T != null && g.yas != null && g.yas < 50 && (!g.kadin || !R.erkenMenopoz)) r.uyarilar.push('Genç erişkinde/premenopozal kadında Z-skoru yorumlanır; T-skoru sınıflaması uygun olmayabilir')
  const oporoz = r.sinif === 'osteoporoz' || r.sinif === 'agir_osteoporoz' || r.klinikOsteoporoz
  if (r.klinikOsteoporoz) r.plan.push(`Vertebra/kalça kırılganlık kırığı: T-skorundan bağımsız klinik osteoporoz${T == null ? ' (T-skoru yok)' : ''} — tanıyı hekim kilitler`)
  if (oporoz && !r.tedavide) {
    const cokYuksek = r.sinif === 'agir_osteoporoz' || (r.klinikOsteoporoz && R.vertebraKalcaKirigi)
    r.tedaviSinifi.push('Antirezorptif — oral bisfosfonat sınıfı (birinci basamak) — hekim dozu yazar', 'Parenteral bisfosfonat veya denosumab (oral intolerans/uyum sorunu) — hekim')
    if (cokYuksek) r.tedaviSinifi.push('Çok yüksek kırık riski: anabolik ajan değerlendirmesi — endokrinoloji/FTR (hekim)')
    if (g.eGFR != null && g.eGFR < 35) { r.tedaviSinifi = r.tedaviSinifi.filter((s) => !/bisfosfonat/i.test(s)); r.uyarilar.push('eGFR <35: bisfosfonatlardan kaçınılır — denosumab sınıfı / uzman (hekim)') }
    r.tedaviSinifi.push('Denosumab sınıfı — kesilirse ardışık tedavi planı gerekir (hekim)')
  }
  if (r.sinif === 'osteopeni' && !r.tedavide && (R.kirilganlikKirigi || R.glukokortikoid3Ay)) r.tedaviSinifi.push('Osteopenide yüksek risk bayrakları: farmakolojik tedavi hekim değerlendirmesi (FRAX gerekiyorsa resmi araç)')
  if (r.sinif != null || r.klinikOsteoporoz) {
    r.plan.push('Kalsiyum (diyet öncelikli) ve D vitamini yeterliliği — replasman hekim dozu yazar', 'Düşme önleme: ev güvenliği, denge/kuvvet egzersizi, görme ve ilaç gözden geçirme')
    if (R.sigara || R.alkol3Unite) r.plan.push('Sigara bırakma, alkol kısıtlama')
  }
  if (g.vitD != null && g.vitD < 20) r.uyarilar.push('25-OH D <20 ng/mL: antirezorptif öncesi D vitamini replasmanı (Vit D/B12 kartı)')
  if (g.ca != null && g.ca < 8.5) r.uyarilar.push('Hipokalsemi: antirezorptif (özellikle denosumab/zoledronik) öncesi düzeltilmeli — hekim')
  if (g.ca != null && g.ca > 10.5) r.uyarilar.push('Kalsiyum yüksek: sekonder neden — primer hiperparatiroidi araştır (PTH) — hekim')
  if (oporoz) {
    r.sekonderTetkik.push('Kalsiyum, fosfor, ALP', '25-OH D vitamini', 'Kreatinin/eGFR', 'TSH', 'PTH (Ca yüksek/düşük sınırda ise)')
    if (!g.kadin || (g.yas != null && g.yas < 60)) r.sekonderTetkik.push('Testosteron (erkek) / protein elektroforezi — sekonder neden (hekim)')
  }
  if (r.sinif != null) {
    r.dxaAraligiAy = r.tedavide ? 24 : r.sinif === 'osteoporoz' || r.sinif === 'agir_osteoporoz' ? 12 : r.sinif === 'osteopeni' ? 24 : r.riskBayraklari.length >= 2 ? 24 : 60
    if (r.tedavide) r.plan.push('Tedavi yanıtı: 1–2 yılda DXA — hekim')
    if (g.dxaTarihi) r.sonrakiDxa = ekleAy(g.dxaTarihi, r.dxaAraligiAy)
    r.plan.push('DXA aralığı taslak — hekim kilitler')
  }
  if (r.sonrakiDxa) r.gorevler.push({ kod: 'dxa_tekrar', ad: 'DXA tekrar (TEMD Osteoporoz 2025)', due: r.sonrakiDxa })
  if (r.sinif == null && T == null && ((g.yas != null && ((g.kadin && g.yas >= 65) || (!g.kadin && g.yas >= 70))) || r.riskBayraklari.length >= 1)) r.gorevler.push({ kod: 'dxa', ad: 'DXA (T-skoru yok)', due: g.bugun })
  if (r.sinif === 'agir_osteoporoz' || (T != null && T <= -3.5)) r.sevk.push('Endokrinoloji/FTR: çok yüksek kırık riski — anabolik tedavi değerlendirmesi')
  if (r.tedavide && R.kirilganlikKirigi) r.sevk.push('Tedavi altında yeni kırık: uzman değerlendirmesi (tedavi başarısızlığı)')
  if (r.klinikOsteoporoz && T == null) r.sevk.push('DXA + uzman değerlendirmesi')
  return r
}
