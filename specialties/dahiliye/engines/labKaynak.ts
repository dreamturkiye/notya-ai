/**
 * DAH-LAB-BELGELER — Kaynak dipnotu for the shared lab report when the doctor is dahiliye (rubric criterion 4).
 * Deterministic: every model-suggested tanı gets a golden ref_code from its ICD-10 chapter, and every abnormal lab group
 * behind the öneri gets one from its canonical key. ref_code only (shown behind the clinician Kaynak toggle); no book text.
 * The flags themselves come from the printed reference range — no guideline threshold is applied here.
 */
import type { Dipnot, Ref } from './dahiliye'

type Satir = { canonical_key: string | null; flag: string }
type Tani = { ad: string; icd10: string | null }

const ICD_REF: [RegExp, Ref, string][] = [
  [/^(E1[0-4]|R73|O24)/, 'TEMD_DM2026', 'Diyabet / prediyabet tanı ölçütleri — tanıyı hekim kilitler'],
  [/^E78/, 'TEMD_LIPID', 'Dislipidemi sınıflaması; LDL hedefi KVR kategorisine göre hekim kilitler'],
  [/^E0[0-7]/, 'TEMD_TIROID2025', 'Tiroid fonksiyon bozukluğu yorumu — tek TSH ile tanı konmaz'],
  [/^E66/, 'TEMD_OBEZITE2024', 'Obezite sınıflaması'],
  [/^I1[0-5]/, 'HT_UZLASI2025', 'Hipertansiyon evreleme ofis/ev KB ile yapılır; lab tek başına evre vermez'],
  [/^(N1[7-9]|R80)/, 'TIHUD2023', 'Böbrek hastalığı yorumu; kreatinin/eGFR olmadan evre verilmez'],
  [/^(D5[0-3]|D6[34])/, 'TIHUD2023', 'Anemi ayırıcı tanısı (MCV, ferritin, B12)'],
  [/^(K7[0-7]|R74)/, 'TIHUD2023', 'Karaciğer enzim yüksekliği yaklaşımı — tek ALT ile siroz denmez'],
  [/^(E8[37]|E55)/, 'TIHUD2023', 'Elektrolit / vitamin bozukluğu yaklaşımı'],
]

const KEY_REF: [string[], Ref, string][] = [
  [['HbA1c', 'Glu'], 'TEMD_DM2026', 'HbA1c / plazma glukozu tanı ve izlem eşikleri'],
  [['LDL', 'HDL', 'TG', 'TChol'], 'TEMD_LIPID', 'Lipid değerleri: hedef KVR kategorisine göre'],
  [['TSH', 'FT4', 'FT3'], 'TEMD_TIROID2025', 'Tiroid fonksiyon testleri: tekrar ölçüm ve bağlam'],
  [['Kre', 'eGFR', 'UACR', 'K', 'Na'], 'TIHUD2023', 'Böbrek fonksiyonu ve elektrolitler'],
  [['Hb', 'MCV', 'Ferritin', 'B12', 'Folate', 'Fe'], 'TIHUD2023', 'Anemi değerlendirmesi'],
  [['ALT', 'AST', 'GGT', 'ALP', 'TBil'], 'TIHUD2023', 'Karaciğer testleri'],
]

const ANORMAL = new Set(['H', 'L', 'critical'])

export function taniKaynagi(t: Tani): Dipnot {
  const icd = (t.icd10 || '').toUpperCase().replace(/\s/g, '')
  const hit = ICD_REF.find(([re]) => re.test(icd))
  return hit ? { ref: hit[1], not: hit[2] } : { ref: 'HARRISON', not: 'Ayırıcı tanı çerçevesi (genel iç hastalıkları)' }
}

/** Dipnotlar for the öneri: one per abnormal lab group (deduplicated by ref+not), HARRISON fallback when none matched. */
export function labOneriKaynaklari(satirlar: Satir[]): Dipnot[] {
  const anormal = new Set(satirlar.filter((s) => s.canonical_key && ANORMAL.has(s.flag)).map((s) => s.canonical_key as string))
  const out = KEY_REF.filter(([keys]) => keys.some((k) => anormal.has(k))).map(([, ref, not]) => ({ ref, not }))
  return out.length ? out : [{ ref: 'HARRISON', not: 'Laboratuvar yorumu genel çerçeve; bayraklar basılı referans aralığından' }]
}

export function labRaporKaynaklari(satirlar: Satir[], tanilar: Tani[]): { tanilar: Dipnot[]; oneri: Dipnot[] } {
  return { tanilar: tanilar.map(taniKaynagi), oneri: labOneriKaynaklari(satirlar) }
}
