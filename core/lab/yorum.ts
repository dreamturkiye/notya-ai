/**
 * NOTYA-LAB-01 — INTERPRET stage: 30-branş lab emphasis router + persona writer + validator.
 * The model receives the computed table (flags, Δ, trend sentences, criticals) and writes prose around it.
 * It never computes, never invents a value, never locks a diagnosis, never writes a prescription.
 */
import type Anthropic from '@anthropic-ai/sdk'
import { kanonikTr, type KanonikAnahtar } from './kanonik'
import { trendCumlesi, type LabSatir } from './trend'

export type LabVurgu = { anahtarlar: KanonikAnahtar[]; not: string }

export const LAB_ROUTER: Record<string, LabVurgu> = {
  aile: { anahtarlar: ['Glu', 'HbA1c', 'TChol', 'LDL', 'HDL', 'TG', 'Hb', 'WBC', 'Plt', 'TSH', 'Kre', 'ALT', 'CRP', 'B12', 'VitD', 'Ferritin'], not: 'Tam panel; metabolik + hemogram + TSH; yaşam tarzı ve tekrar zamanı önerisi.' },
  acil: { anahtarlar: ['K', 'Na', 'Glu', 'Troponin', 'Hb', 'Lactate', 'INR', 'WBC', 'Kre', 'CRP'], not: 'Önce kritikler; acil_bayrak; kısa.' },
  anestezi: { anahtarlar: ['Hb', 'Plt', 'INR', 'aPTT', 'Kre', 'Glu', 'K', 'Na'], not: 'Preop risk notu; tanı değil.' },
  beyin_cerrahisi: { anahtarlar: ['Na', 'INR', 'aPTT', 'Plt', 'Hb', 'Glu'], not: 'Na trendi varsa SIADH/DI dili; aksi halde yalnız değerler.' },
  cocuk_cerrahisi: { anahtarlar: ['Hb', 'WBC', 'CRP', 'Plt', 'Na', 'K', 'Kre'], not: 'Pediatrik: yalnız basılı referans; erişkin aralığı uygulama.' },
  pediatri: { anahtarlar: ['Hb', 'MCV', 'WBC', 'Neu', 'Lym', 'Plt', 'CRP', 'Ferritin', 'Glu', 'TSH', 'VitD', 'B12', 'ALT', 'Na', 'K'], not: 'Ayşe: yaşa/cinsiyete özgü basılı referans; erişkin lipid/glukoz hedefi uygulama; demir eksikliği ve enfeksiyon ayrımı.' },
  dermatoloji: { anahtarlar: ['IgE', 'Eo', 'EoPct', 'CRP', 'ALT', 'AST'], not: 'Nadiren birincil; IgE/eozinofil varsa yorumla, aksi halde tarif.' },
  enfeksiyon: { anahtarlar: ['CRP', 'PCT', 'WBC', 'Neu', 'Lym', 'Plt', 'ALT', 'Kre'], not: 'Kültür metni olduğu gibi; ampirik ilaç yazma.' },
  ftr: { anahtarlar: ['CK', 'VitD', 'CRP', 'ESR', 'Ca'], not: 'Tarif; kas/kemik bağlamı.' },
  genel_cerrahi: { anahtarlar: ['Hb', 'WBC', 'CRP', 'ALT', 'AST', 'TBil', 'Amy', 'Lip', 'INR', 'Alb'], not: 'Pre/post-op karşılaştırma; önceki varsa Δ.' },
  gogus: { anahtarlar: ['WBC', 'Neu', 'CRP', 'PCT', 'DDimer', 'Eo', 'Hb'], not: 'D-dimer tek başına PE tanısı değil.' },
  gogus_cerrahisi: { anahtarlar: ['Hb', 'WBC', 'CRP', 'INR', 'aPTT', 'Plt', 'Alb'], not: 'Pre/post-op; koagülasyon.' },
  goz: { anahtarlar: ['Glu', 'HbA1c', 'LDL', 'TG'], not: 'DR riski bağlamı; göz tanısı laboratuvardan konmaz.' },
  dahiliye: { anahtarlar: ['Glu', 'HbA1c', 'Kre', 'eGFR', 'Na', 'K', 'ALT', 'AST', 'TSH', 'Hb', 'Ferritin', 'B12', 'LDL', 'TG', 'Uric', 'CRP', 'VitD'], not: 'Elif: tam iç hastalıkları okuması + trendler.' },
  kadin_dogum: { anahtarlar: ['bHCG', 'Hb', 'Plt', 'TSH', 'Glu', 'Ferritin', 'UA_protein'], not: 'Laboratuvardan fetal tanı konmaz; GDM glukoz basılı eşik varsa.' },
  kardiyoloji: { anahtarlar: ['Troponin', 'BNP', 'NTproBNP', 'LDL', 'HDL', 'TG', 'TChol', 'INR', 'K', 'Kre', 'Hb'], not: 'Mehmet: seri troponin trendi; INR/K ilaç bağlamı.' },
  kbb: { anahtarlar: ['WBC', 'Neu', 'CRP', 'Hb'], not: 'Tarif.' },
  nefroloji: { anahtarlar: ['Kre', 'eGFR', 'K', 'Na', 'Ca', 'P', 'Hb', 'Alb', 'Uric', 'UA_protein'], not: '≥2 önceki varsa kreatinin eğimi.' },
  noroloji: { anahtarlar: ['Na', 'B12', 'TSH', 'CK', 'Glu', 'Ca', 'Mg'], not: 'Elif: Na, B12, TSH, CK; BOS değerleri basılıysa.' },
  ortopedi: { anahtarlar: ['WBC', 'CRP', 'ESR', 'Ca', 'VitD', 'Uric'], not: 'Septik vs inflamatuvar ayrımı için CRP/ESR/WBC.' },
  plastik: { anahtarlar: ['Hb', 'Alb', 'TP', 'Glu', 'HbA1c', 'INR'], not: 'Preop; albümin/yara iyileşmesi.' },
  psikiyatri: { anahtarlar: ['TSH', 'B12', 'Li', 'VPA', 'Na', 'Glu'], not: 'Laboratuvardan psikiyatrik tanı KONMAZ; yalnız düzey ve tarama değerleri.' },
  radyoloji: { anahtarlar: ['Kre', 'eGFR', 'TSH', 'INR', 'Plt'], not: 'Kontrast/işlem güvenliği bağlamı; görüntü iddiası yok.' },
  uroloji: { anahtarlar: ['Kre', 'eGFR', 'PSA', 'UA_blood', 'UA_leu', 'UA_nit', 'Uric'], not: 'PSA trendi; kanser kilidi yok.' },
  patoloji: { anahtarlar: ['PSA', 'CEA', 'AFP', 'CA125', 'CA199', 'LDH'], not: 'Belirteçler sayı + trend; histoloji görüntü belgesidir.' },
  gastroenteroloji: { anahtarlar: ['ALT', 'AST', 'GGT', 'ALP', 'TBil', 'DBil', 'Alb', 'INR', 'Amy', 'Lip', 'Hb', 'Ferritin'], not: 'Yeni yüksek vs kronik ayrımı; tek ALT ile siroz deme.' },
  endokrinoloji: { anahtarlar: ['Glu', 'HbA1c', 'TSH', 'FT4', 'FT3', 'LDL', 'HDL', 'TG', 'Ca', 'VitD', 'Kre'], not: 'Önceki HbA1c varsa Δ HbA1c özette zorunlu.' },
  hematoloji: { anahtarlar: ['Hb', 'Hct', 'MCV', 'RDW', 'WBC', 'Neu', 'Lym', 'Plt', 'Ferritin', 'B12', 'Folate', 'LDH', 'Fe', 'TIBC'], not: 'Hemogram indeksleri + Δ Hb/Plt; yayma görüntü belgesidir.' },
  onkoloji: { anahtarlar: ['Hb', 'WBC', 'Neu', 'Plt', 'Kre', 'ALT', 'LDH', 'CEA', 'CA125', 'CA199', 'AFP', 'PSA'], not: 'Sitopeni vs önceki kür; belirteç trendi.' },
  romatoloji: { anahtarlar: ['CRP', 'ESR', 'RF', 'antiCCP', 'Hb', 'WBC', 'Kre', 'ALT', 'Uric'], not: 'Aktivite trendi; tanı kilidi yok.' },
  dis: { anahtarlar: ['Glu', 'HbA1c', 'INR', 'Plt', 'Hb'], not: 'İşlem güvenliği bağlamı.' },
  genel: { anahtarlar: [], not: 'Genel okuma.' },
}

export type LabRapor = {
  ozet: string
  kritik: string[]
  yeni_bozulanlar: string[]
  duzelenler: string[]
  kronik: string[]
  tanilar: { ad: string; icd10: string | null; guven_pct: number; guven_bant: 'yüksek' | 'orta' | 'düşük'; destek: string[] }[]
  klinik_iliski: string
  oneri: string
  recete_ipucu: string | null
  sinirlar: string[]
  acil_bayrak: boolean
}

const PERSONA: Record<string, string> = {
  ayse: 'Sen Ayşe — çocuk sağlığı ve hastalıkları uzmanı. Yaşa/cinsiyete özgü BASILI referansları esas al; erişkin hedefleri çocuğa uygulama.',
  mehmet: 'Sen Mehmet — kardiyoloji uzmanı. Troponin/BNP/lipid/INR/K okumasında seri değişimi ve ilaç bağlamını öne çıkar.',
  elif: 'Sen Elif — nöroloji ve iç hastalıkları uzmanı. Çoklu sistem trend okuması; tek değerle kesin tanı koyma.',
  genel: 'Sen deneyimli bir hekim meslektaşsın.',
}

export function labSistemPromptu(persona: string, bransKey: string): string {
  const r = LAB_ROUTER[bransKey] || LAB_ROUTER.genel
  return `${PERSONA[persona] || PERSONA.genel}

GÖREV: Aşağıdaki laboratuvar tablosu için meslektaşına TÜRKÇE taslak değerlendirme yaz. Sayılar, bayraklar, Δ ve trend cümleleri SİSTEM tarafından hesaplandı — onları aynen kullan, yeniden hesaplama, sayfada olmayan hiçbir değeri yazma.
Branş vurgusu (${bransKey}): ${r.not} Öncelikli anahtarlar: ${r.anahtarlar.map(kanonikTr).join(', ') || 'yok'} — ama tabloda anormal olan her şeyi değerlendir.

KURALLAR
- 1–3 olası tanı, hepsi "…ile uyumlu / düşündürür" düzeyinde; kesin tanı ve reçete YOK. Kilitleme hekimindir.
- Tek ALT ile siroz, tek glukoz ile insülin gibi aşırı çıkarım yapma.
- Önceki panel yoksa "ilk kayıtlı panel" de. Varsa verilen trend cümlelerini özete işle.
- "kritik" listesi sistem tarafından verildi; onu değiştirme, sadece aynen aktar.
- Son SOAP'taki ilaçlar verildiyse ve ilaç-lab ilişkisi varsa (statin + ALT yükselişi, ACEi + K, metformin + eGFR) bunu "oneri" içinde "ilaç gözden geçirilmesi" olarak an; emir verme.
- "recete_ipucu": yalnız öneri cümlesi, doz yazma; gerek yoksa null.
- Hasta kimliği yazma. Yalnızca JSON.

ÇIKTI ŞEMASI
{"ozet": string, "kritik": string[], "yeni_bozulanlar": string[], "duzelenler": string[], "kronik": string[], "tanilar": [{"ad": string, "icd10": string|null, "guven_pct": number, "guven_bant": "yüksek"|"orta"|"düşük", "destek": string[]}], "klinik_iliski": string, "oneri": string, "recete_ipucu": string|null, "sinirlar": string[], "acil_bayrak": boolean}`
}

export function labKullaniciPromptu(satirlar: LabSatir[], baglam: { yasAy: number | null; cinsiyet: string | null; ilaclar: string[]; labAdi: string | null; numuneTarihi: string | null; kritik: string[]; oncekiVar: boolean; ozelSatirlar?: string[] }): string {
  const tablo = satirlar.map((s) => ({ test: s.canonical_key ? kanonikTr(s.canonical_key) : s.raw_name, deger: s.value_num ?? s.value_text, birim: s.unit, ref: s.ref_low != null || s.ref_high != null ? `${s.ref_low ?? '—'}–${s.ref_high ?? '—'}` : null, bayrak: s.flag, onceki: s.prior_value, onceki_tarih: s.prior_date, delta_pct: s.delta_pct, trend: s.trend, dogrulanacak: s.dogrulanacak || undefined }))
  const cumleler = satirlar.filter((s) => s.flag !== 'normal' && s.flag !== 'unknown' || s.trend === 'new_normal').map(trendCumlesi).filter(Boolean)
  return [
    `Hasta: ${baglam.yasAy == null ? 'yaş bilinmiyor' : baglam.yasAy < 24 ? `${baglam.yasAy} ay` : `${Math.floor(baglam.yasAy / 12)} yaş`}${baglam.cinsiyet ? `, ${baglam.cinsiyet}` : ''}. ${baglam.labAdi ? `Laboratuvar: ${baglam.labAdi}. ` : ''}${baglam.numuneTarihi ? `Numune: ${baglam.numuneTarihi}. ` : ''}${baglam.oncekiVar ? 'Bu hastanın önceki onaylı panelleri var.' : 'İlk kayıtlı panel.'}`,
    baglam.ilaclar.length ? `Son SOAP ilaçları: ${baglam.ilaclar.join('; ')}` : 'Son SOAP\'ta ilaç kaydı yok.',
    `KRİTİK (sistem): ${baglam.kritik.length ? baglam.kritik.join(' | ') : 'yok'}`,
    `TABLO (sistem hesapladı): ${JSON.stringify(tablo)}`,
    cumleler.length ? `TREND CÜMLELERİ (aynen kullan): ${cumleler.join(' ')}` : '',
    baglam.ozelSatirlar?.length ? `BRANŞ HESAPLARI (sistem hesapladı, özete aynen işle): ${baglam.ozelSatirlar.join(' ')}` : '',
    'Yalnızca JSON döndür.',
  ].filter(Boolean).join('\n')
}

export async function labRaporYaz(anthropic: Anthropic, persona: string, bransKey: string, satirlar: LabSatir[], baglam: Parameters<typeof labKullaniciPromptu>[1], model = 'claude-sonnet-4-6'): Promise<{ rapor: LabRapor; ham: string }> {
  const y = await anthropic.messages.create({ model, max_tokens: 2500, temperature: 0.2, system: labSistemPromptu(persona, bransKey), messages: [{ role: 'user', content: labKullaniciPromptu(satirlar, baglam) }] })
  const ham = y.content.filter((c) => c.type === 'text').map((c) => (c as { text: string }).text).join('\n').replace(/```json|```/g, '')
  const j = JSON.parse(ham.slice(ham.indexOf('{'), ham.lastIndexOf('}') + 1)) as Partial<LabRapor>
  const arr = (x: unknown) => (Array.isArray(x) ? x.map(String) : [])
  const rapor: LabRapor = {
    ozet: String(j.ozet || ''), kritik: arr(j.kritik), yeni_bozulanlar: arr(j.yeni_bozulanlar), duzelenler: arr(j.duzelenler), kronik: arr(j.kronik),
    tanilar: Array.isArray(j.tanilar) ? j.tanilar.filter((t) => t && typeof t.ad === 'string').slice(0, 3).map((t) => ({ ad: String(t.ad), icd10: t.icd10 ? String(t.icd10) : null, guven_pct: Number(t.guven_pct) || 0, guven_bant: 'düşük' as const, destek: arr(t.destek) })) : [],
    klinik_iliski: String(j.klinik_iliski || ''), oneri: String(j.oneri || ''), recete_ipucu: j.recete_ipucu ? String(j.recete_ipucu) : null, sinirlar: arr(j.sinirlar), acil_bayrak: Boolean(j.acil_bayrak),
  }
  return { rapor, ham }
}

/** Validator: criticals by rule override the model; caps; bands; at most 3 tanılar; recete_ipucu may not contain a dose. */
export function labRaporuDogrula(r: LabRapor, satirlar: LabSatir[], oncekiVar: boolean): { rapor: LabRapor; duzeltmeler: string[] } {
  const d: string[] = []
  const rapor: LabRapor = { ...r, tanilar: [...r.tanilar], sinirlar: [...r.sinirlar], kritik: [...r.kritik] }
  const kritikler = satirlar.filter((s) => s.kritik).map((s) => s.kritik_neden || `${s.raw_name} kritik`)
  if (kritikler.length) { rapor.kritik = kritikler; if (!rapor.acil_bayrak) { rapor.acil_bayrak = true; d.push('acil bayrağı kuralla açıldı') } }
  else if (rapor.kritik.length) { rapor.kritik = []; d.push('model kritik listesi silindi (kural yok)') }
  const cap = oncekiVar ? 85 : 70
  rapor.tanilar = rapor.tanilar.slice(0, 3).map((t) => { let p = Math.round(t.guven_pct); if (p > cap) { d.push(`${t.ad}: %${p} → cap %${cap}`); p = cap } if (p < 0) p = 0; return { ...t, guven_pct: p, guven_bant: p >= 80 ? 'yüksek' : p >= 55 ? 'orta' : 'düşük' } })
  if (r.tanilar.length > 3) d.push(`${r.tanilar.length} tanı → 3`)
  if (rapor.recete_ipucu && /\d+\s*(mg|mcg|µg|ml|iu|ünite|tablet|tb|damla|x\s*\d)/i.test(rapor.recete_ipucu)) { rapor.recete_ipucu = null; d.push('reçete ipucu doz içeriyordu → silindi') }
  const dogrulanacak = satirlar.filter((s) => s.dogrulanacak).length
  if (dogrulanacak && !rapor.sinirlar.some((s) => s.includes('doğrulan'))) rapor.sinirlar.push(`${dogrulanacak} hücre iki çıkarım arasında uyuşmadı — hekim doğrulaması bekleniyor.`)
  if (!oncekiVar && !rapor.sinirlar.some((s) => /ilk/.test(s))) rapor.sinirlar.push('İlk kayıtlı panel — trend değerlendirmesi yapılamadı.')
  return { rapor, duzeltmeler: d }
}
