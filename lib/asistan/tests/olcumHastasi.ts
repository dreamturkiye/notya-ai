/**
 * NOTYA-DANIS-OLCUM — SYNTHETIC patients for "the measurement of ONE named visit" (QA fixture, not a real person).
 *
 * The live question (Dr. Gökhan, 2026-10-02): "bu hasta 12 aylık muayenesine geldiğinde kaç kiloydu". The child
 * below has a visit dated 2025-05-15 titled "12 aylık sağlam çocuk izlemi" whose plan carries an iron dose of
 * 1 mg/kg/gün — the sentence the live answer estimated a weight from. Four variants say where the weight of that
 * visit is recorded:
 *   (a) in the visit's own measurement fields (notes.vitaller),
 *   (b) in the measurement table, dated the same day (cihaz_olcumleri),
 *   (c) only in the note text,
 *   (d) nowhere.
 * The other visits carry their own weights, so a wrong answer (the latest weight, a neighbour's weight) is visible.
 *
 * One definition feeds both test levels: `olcumDosyasi` is the plain file for the pure evidence tests,
 * `olcumHastasiEkle` writes the same file into the in-memory database of the Ayşe scene (real routes).
 */
import type { SahteVeritabani } from '@/lib/security/testing/sahteSupabase'
import type { HamDosya, HamVizit } from '@/lib/doktor/dosyaOlaylari'

export type OlcumVaryanti = 'a' | 'b' | 'c' | 'd'

export const OLCUM_COCUK_ADI = 'QA Bebek Ölçüm'
export const OLCUM_ERISKIN_ADI = 'QA Erişkin Ölçüm'
/** The weight of the 12-month visit, as the answer prints it. */
export const KILO_12AY = '9,8 kg'
export const TARIH_12AY = '15.05.2025'
/** The estimate of the live answer (1 mg/kg/gün ↔ 9,35 mg) — never a recorded value. */
export const TAHMIN_KILO = '9,35'

const PLAN_12AY = 'Demir profilaksisi 1 mg/kg/gün devam (günde 9,35 mg). D vitamini 400 IU/gün. 15. ayda kontrol.'

export function olcumDosyasi(varyant: OlcumVaryanti): HamDosya {
  const onIkiAy: HamVizit = {
    id: 'v-12ay', tarih: '2025-05-15T09:00:00Z',
    subjektif: '12 aylık erkek bebeğin rutin sağlam çocuk izlemi. Yürümeye başlamış, iştahı iyi.',
    objektif: varyant === 'c'
      ? 'Genel durum iyi, aktif. Kilo 9,8 kg, boy 75 cm, baş çevresi 46 cm. Ön fontanel 1x1 cm açık. Sistem muayeneleri doğal.'
      : 'Genel durum iyi, aktif. Ön fontanel 1x1 cm açık. Sistem muayeneleri doğal.',
    tani: '12 aylık sağlam çocuk izlemi',
    plan: PLAN_12AY,
    vitaller: varyant === 'a' ? { kilo: '9,8', boy: '75', basCevresi: '46' } : null,
  }
  return {
    hasta: { ad: OLCUM_COCUK_ADI, dogumIso: '2024-05-15', cinsiyet: 'Erkek' },
    brans: 'Pediatri',
    vizitler: [
      { id: 'v-6ay', tarih: '2024-11-15T09:00:00Z', subjektif: '6 aylık erkek bebeğin rutin sağlam çocuk kontrolü.', objektif: 'Sistem muayeneleri doğal.', tani: '6 aylık sağlam çocuk izlemi', plan: 'Tamamlayıcı beslenme anlatıldı. Demir profilaksisi 1 mg/kg/gün başlandı.', vitaller: { kilo: '7,9', boy: '67', basCevresi: '43' } },
      { id: 'v-9ay', tarih: '2025-02-15T09:00:00Z', subjektif: '9 aylık rutin sağlam çocuk izlemi.', objektif: 'Sistem muayeneleri doğal.', tani: '9 aylık sağlam çocuk izlemi', plan: 'Demir profilaksisi devam.', vitaller: { kilo: '9,1', boy: '72' } },
      onIkiAy,
      { id: 'v-akut', tarih: '2025-09-25T09:00:00Z', subjektif: '2 gündür burun akıntısı; dün gece ateş ve sağ kulak ağrısı.', objektif: 'Sağ timpanik membran hiperemik ve bombe.', tani: 'Sağ akut otitis media', plan: 'Parasetamol 15 mg/kg/doz gerekirse. 10 gün sonra kontrol.', vitaller: { kilo: '10,6', ates: '38,4' } },
    ],
    cihaz: varyant === 'b' ? [{ id: 'c-12ay', tur: 'kilo', deger: '9.8', birim: 'kg', alindi: '2025-05-15T09:20:00Z' }] : [],
  }
}

/** An adult with weight, height and blood pressure — no paediatric measurement anywhere. */
export function eriskinOlcumDosyasi(brans = 'Kardiyoloji'): HamDosya {
  return {
    hasta: { ad: OLCUM_ERISKIN_ADI, dogumIso: '1968-03-10', cinsiyet: 'Kadın' },
    brans,
    vizitler: [
      { id: 'e-1', tarih: '2025-11-03T09:00:00Z', subjektif: 'İlk başvuru: baş ağrısı, ölçümlerde tansiyon yüksekliği.', objektif: 'Kalp sesleri ritmik, üfürüm yok.', tani: 'Esansiyel hipertansiyon', plan: 'Ramipril 5 mg 1x1 başlandı. Tuz kısıtlaması. 3 ay sonra kontrol.', vitaller: { kilo: '84', boy: '162', tansiyon: '158/96', nabiz: '82' } },
      { id: 'e-2', tarih: '2026-02-10T09:00:00Z', subjektif: 'Kontrol. Baş ağrısı azalmış.', objektif: 'TA 142/88 mmHg, nabız 76/dk. Kilo 82 kg. Akciğer sesleri doğal.', tani: 'Esansiyel hipertansiyon', plan: 'Ramipril 10 mg 1x1. 3 ay sonra kontrol.', vitaller: null },
      { id: 'e-3', tarih: '2026-06-15T09:00:00Z', subjektif: 'Kontrol. Yakınması yok.', objektif: 'Kalp sesleri ritmik.', tani: 'Esansiyel hipertansiyon, kontrol altında', plan: 'Tedavi devam. 6 ay sonra kontrol.', vitaller: { kilo: '79,5', boy: '162', tansiyon: '128/82', nabiz: '72' } },
    ],
    cihaz: [],
  }
}

/** Writes a file into the scene database the way the product stores it; returns the patient id. */
export function olcumHastasiEkle(db: SahteVeritabani, encrypt: (s: string) => string, doktorId: string, dosya: HamDosya, brans = 'pediatri'): string {
  const c = String(dosya.hasta.cinsiyet || '')
  const hasta = db.ekle('patients', {
    doctor_id: doktorId, is_active: true,
    name_encrypted: encrypt(JSON.stringify({ ad: dosya.hasta.ad })),
    dob_encrypted: dosya.hasta.dogumIso ? encrypt(dosya.hasta.dogumIso) : null,
    gender_encrypted: encrypt(/^erk/i.test(c) ? 'male' : 'female'),
    phone_encrypted: null, email_encrypted: null,
    notes_encrypted: encrypt(JSON.stringify({})),
    created_at: dosya.vizitler[0]?.tarih || new Date().toISOString(),
  }).id as string
  dosya.vizitler.forEach((v, i) => {
    const seans = db.ekle('sessions', { patient_id: hasta, doctor_id: doktorId, created_at: v.tarih, status: 'completed', specialty: brans, session_type: 'muayene', archived_at: null }).id
    db.ekle('notes', {
      session_id: seans, doctor_id: doktorId, patient_id: hasta, created_at: v.tarih, approved_at: v.tarih,
      content_subjektif: v.subjektif || null, content_objektif: v.objektif || null, content_degerlendirme: v.degerlendirme || null,
      content_plan: v.plan || null, content_tani: v.tani || null,
      basvuru_yakinmasi: String(v.subjektif || '').split('.')[0],
      icd10_codes: [], content_ilaclar: v.ilaclar || [],
      vitaller: v.vitaller || null,
      kritik_bulgular: null,
      _sira: i,
    })
  })
  for (const o of dosya.cihaz || []) {
    db.ekle('cihaz_olcumleri', { patient_id: hasta, doctor_id: doktorId, tur: o.tur, deger: o.deger, birim: o.birim, cihaz: { ad: 'Terazi', uretici: 'QA', model: 'T1' }, profil: 'weight', kaynak: 'ble', alindi: o.alindi, onaylandi: true })
  }
  return hasta
}
