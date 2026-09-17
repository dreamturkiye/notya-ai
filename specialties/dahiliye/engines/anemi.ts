/**
 * NOTYA-DAH-WOW W2.2 — Anemi tetkik merdiveni (TİHUD / Harrison). Onaylı lab satırlarından morfoloji → sonraki test → olası neden.
 * Tanı koymaz; "olası" dili. Plan hekim kilidi (dahiliye_kart_kilitleri kart=anemi alan=plan). Demir/B12 replasmanı sınıf, doz hekim.
 */
import type { Dipnot } from './dahiliye'

export interface AnemiGirdi {
  kadin: boolean; yas: number | null
  hb: number | null; mcv: number | null; rbc: number | null; wbc: number | null; plt: number | null
  ferritin: number | null; b12: number | null; folat: number | null; retic: number | null; crp: number | null
  eGFR: number | null; tsh: number | null; ldh: number | null; tbil: number | null
  menstruasyon?: boolean; gisKanamaSemptom?: boolean
}
export interface AnemiSonuc {
  anemi: boolean | null; derece: 'hafif' | 'orta' | 'agir' | null; morfoloji: 'mikrositer' | 'normositer' | 'makrositer' | null
  olasiNeden: string[]; sonrakiTestler: string[]; plan: string[]; sevk: string[]; kirmizi: string[]; dipnotlar: Dipnot[]
}

export function anemiDegerlendir(g: AnemiGirdi): AnemiSonuc {
  const dip: Dipnot[] = [{ ref: 'TIHUD2023', not: 'Anemi: Hb <13 (E) / <12 (K); MCV ile mikrositer–normositer–makrositer; retikülosit ile yapım/yıkım ayrımı' }, { ref: 'HARRISON', not: 'Demir eksikliğinde ferritin <30 ng/mL; inflamasyon/KBH varlığında <100 demir eksikliğiyle uyumlu olabilir; Mentzer indeksi <13 talasemi taşıyıcılığı lehine' }]
  const r: AnemiSonuc = { anemi: null, derece: null, morfoloji: null, olasiNeden: [], sonrakiTestler: [], plan: [], sevk: [], kirmizi: [], dipnotlar: dip }
  if (g.hb == null) { r.sonrakiTestler.push('Hemogram (Hb, MCV, RBC, WBC, Plt)'); return r }
  const esik = g.kadin ? 12 : 13
  r.anemi = g.hb < esik
  if (!r.anemi) return r
  r.derece = g.hb < 8 ? 'agir' : g.hb < 10 ? 'orta' : 'hafif'
  if (g.hb < 7) r.kirmizi.push(`Hb ${g.hb} <7: ağır anemi — transfüzyon değerlendirmesi / acil`)
  if (g.wbc != null && g.plt != null && g.wbc < 4 && g.plt < 150) r.sevk.push('Hematoloji: pansitopeni (Hb + WBC + Plt düşük) — periferik yayma ile')
  if (g.gisKanamaSemptom) r.sevk.push('Gastroenteroloji: GİS kanama bulgusu (melena/hematokezya) + anemi')
  const inflamasyon = (g.crp != null && g.crp > 10) || (g.eGFR != null && g.eGFR < 60)
  if (g.mcv == null) { r.sonrakiTestler.push('MCV (hemogram indeksleri)'); return r }
  const eksik = (ad: string, v: number | null) => { if (v == null) r.sonrakiTestler.push(ad); return v == null }

  if (g.mcv < 80) {
    r.morfoloji = 'mikrositer'
    if (eksik('Ferritin', g.ferritin)) { if (g.crp == null) r.sonrakiTestler.push('CRP (ferritin yorumu için)'); return r }
    const f = g.ferritin as number
    if (f < 30 || (inflamasyon && f < 100)) {
      r.olasiNeden.push(`Demir eksikliği olası (ferritin ${f}${inflamasyon && f >= 30 ? ', inflamasyon/KBH varlığında' : ''})`)
      r.plan.push('Oral demir sınıfı (hekim dozu yazar); 4–8 haftada Hb + ferritin kontrolü')
      if (!g.kadin || (g.yas != null && g.yas >= 50) || g.menstruasyon === false) r.sevk.push('Gastroenteroloji: erkek / postmenopozal kadında demir eksikliği — üst + alt endoskopi değerlendirmesi')
      else r.plan.push('Premenopozal: menstrüel kayıp öyküsü; açıklanamazsa çölyak serolojisi (doku transglutaminaz IgA) ve GİS değerlendirme')
    } else {
      const mentzer = g.rbc ? Math.round((g.mcv / g.rbc) * 10) / 10 : null
      if (mentzer != null && mentzer < 13) { r.olasiNeden.push(`Talasemi taşıyıcılığı olası (ferritin normal, Mentzer ${mentzer} <13)`); r.sonrakiTestler.push('Hb elektroforezi / HPLC (HbA2)') }
      else { r.olasiNeden.push('Kronik hastalık anemisi olası (ferritin normal/yüksek)'); if (g.crp == null) r.sonrakiTestler.push('CRP'); r.sonrakiTestler.push('Serum demir + TDBK (transferrin satürasyonu)'); if (mentzer == null) r.sonrakiTestler.push('RBC (Mentzer indeksi için)') }
    }
  } else if (g.mcv > 100) {
    r.morfoloji = 'makrositer'
    const b = eksik('Vitamin B12', g.b12), fo = eksik('Folat', g.folat)
    if (b || fo) { if (g.retic == null) r.sonrakiTestler.push('Retikülosit'); return r }
    if ((g.b12 as number) < 200) { r.olasiNeden.push(`B12 eksikliği olası (B12 ${g.b12} pg/mL)`); r.plan.push('B12 replasmanı sınıf (hekim yolu/dozu yazar); metformin/PPI kullanımı ve beslenme sorgula; pernisiyöz anemi için anti-intrinsik faktör antikoru'); }
    else if ((g.b12 as number) < 300) { r.olasiNeden.push(`B12 sınırda (${g.b12}) — fonksiyonel eksiklik olabilir`); r.sonrakiTestler.push('Metilmalonik asit / homosistein') }
    if ((g.folat as number) < 4) { r.olasiNeden.push(`Folat eksikliği olası (folat ${g.folat})`); r.plan.push('Folat replasmanı sınıf — B12 eksikliği dışlanmadan tek başına başlanmaz') }
    if (!r.olasiNeden.length) {
      if (g.retic != null && g.retic >= 2.5) { r.olasiNeden.push('Retikülositoz: hemoliz / akut kanama sonrası'); r.sonrakiTestler.push('LDH', 'Total/indirekt bilirubin', 'Haptoglobin', 'Direkt Coombs', 'Periferik yayma') }
      else { if (g.tsh == null) r.sonrakiTestler.push('TSH'); r.sonrakiTestler.push('ALT / GGT (alkol, karaciğer)'); r.plan.push('İlaç sorgusu (metotreksat, hidroksiüre, antiretroviral)'); if (g.yas != null && g.yas >= 60) r.sevk.push('Hematoloji: açıklanamayan makrositoz ≥60 yaş (MDS dışlama)') }
    }
  } else {
    r.morfoloji = 'normositer'
    if (eksik('Retikülosit', g.retic)) { if (g.ferritin == null) r.sonrakiTestler.push('Ferritin'); if (g.eGFR == null) r.sonrakiTestler.push('Kreatinin / eGFR'); return r }
    if ((g.retic as number) >= 2.5) {
      r.olasiNeden.push(`Artmış yapım (retikülosit %${g.retic}): hemoliz veya akut kanama`)
      if (g.ldh == null) r.sonrakiTestler.push('LDH'); if (g.tbil == null) r.sonrakiTestler.push('Total/indirekt bilirubin')
      r.sonrakiTestler.push('Haptoglobin', 'Direkt Coombs', 'Periferik yayma')
      if (g.ldh != null && g.ldh > 250 && g.tbil != null && g.tbil > 1.2) r.sevk.push('Hematoloji: hemoliz bulguları (LDH + bilirubin yüksek)')
    } else {
      if (g.eGFR != null && g.eGFR < 60) r.olasiNeden.push(`KBH anemisi olası (eGFR ${g.eGFR}) — demir paneli; ESA kararı nefroloji`)
      if (g.ferritin != null && g.ferritin < 100 && inflamasyon) r.olasiNeden.push('Karma demir eksikliği + inflamasyon olası')
      else if (g.ferritin == null) r.sonrakiTestler.push('Ferritin')
      if (g.b12 == null) r.sonrakiTestler.push('Vitamin B12'); if (g.tsh == null) r.sonrakiTestler.push('TSH')
      if (!r.olasiNeden.length && g.ferritin != null && g.b12 != null) { r.olasiNeden.push('Kronik hastalık anemisi olası (hipoproliferatif, neden saptanmadı)'); r.sevk.push('Hematoloji: açıklanamayan hipoproliferatif anemi (hekim kararı)') }
    }
  }
  r.sonrakiTestler = Array.from(new Set(r.sonrakiTestler))
  return r
}
