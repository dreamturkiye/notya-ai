/**
 * NOTYA-AYSE-ARAC-PARITE — a small SYNTHETIC practice for the read-tool acceptance tests (QA fixture, no real person).
 *
 * One doctor's last month: antibiotic prescriptions on approved notes (so a ranking has a clear winner), vaccines
 * given, one appointment today, and working hours open all day (so "free today" does not depend on the clock).
 * `yabanciPratikEkle` gives ANOTHER doctor louder data of the same kinds — if any of it shows up in the first
 * doctor's answer, a read tool leaked across doctors.
 */
import type { SahteVeritabani } from '@/lib/security/testing/sahteSupabase'
import { adIndeksParcalari, tokenOzeti } from '@/lib/doktor/hastaAramaIndeksi'

const gunOnce = (n: number, saat = 9) => {
  const d = new Date(Date.now() - n * 86400000)
  d.setUTCHours(saat, 0, 0, 0)
  return d.toISOString()
}

type Sifrele = (s: string) => string

function hasta(db: SahteVeritabani, encrypt: Sifrele, doktorId: string, ad: string, dogum: string, notlar: Record<string, unknown> = {}): string {
  const id = db.ekle('patients', {
    doctor_id: doktorId, is_active: true,
    name_encrypted: encrypt(JSON.stringify({ ad })), dob_encrypted: encrypt(dogum), gender_encrypted: encrypt('female'),
    phone_encrypted: null, email_encrypted: null, notes_encrypted: encrypt(JSON.stringify(notlar)), created_at: gunOnce(200),
  }).id as string
  for (const parca of adIndeksParcalari(ad)) db.ekle('patient_search_tokens', { patient_id: id, doctor_id: doktorId, token_hash: tokenOzeti(parca) })
  return id
}

/** One approved visit with a prescription line, `gun` days ago. */
function recete(db: SahteVeritabani, doktorId: string, hastaId: string, gun: number, ilac: string, tani: string): void {
  const seans = db.ekle('sessions', { patient_id: hastaId, doctor_id: doktorId, created_at: gunOnce(gun), status: 'completed', specialty: 'pediatri', session_type: 'muayene', archived_at: null }).id
  db.ekle('notes', {
    session_id: seans, doctor_id: doktorId, patient_id: hastaId, created_at: gunOnce(gun, 10), approved_at: gunOnce(gun, 11),
    content_subjektif: `${tani} yakınması.`, content_objektif: 'Sistem muayeneleri doğal.', content_degerlendirme: tani, content_plan: `${ilac} başlandı.`, content_tani: tani,
    basvuru_yakinmasi: tani, icd10_codes: [], content_ilaclar: [{ ad: ilac, doz: '', kullanim: 'günde 2 kez' }], vitaller: null, kritik_bulgular: null,
  })
  db.ekle('hasta_ilaclar', { patient_id: hastaId, doctor_id: doktorId, ilac_adi: ilac, etken_madde: null, doz: '', kullanim_sikli: 'günde 2 kez', baslangic_tarihi: gunOnce(gun).slice(0, 10), bitis_tarihi: null, aktif: true, durum: 'aktif', created_at: gunOnce(gun) })
}

function asi(db: SahteVeritabani, doktorId: string, hastaId: string, gun: number, ad: string): void {
  db.ekle('asilar', { patient_id: hastaId, doktor_id: doktorId, asi_adi: ad, doz_no: 1, uygulama_tarihi: gunOnce(gun).slice(0, 10), kaynak: 'klinik', kaynak_note_id: null, created_at: gunOnce(gun) })
}

/** Every weekday open 00:00–23:59, so the free ranges of "today" exist at any hour the test runs. */
function tumGunAcik(db: SahteVeritabani, doktorId: string): void {
  const gunler = Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((g) => [String(g), { acik: true, baslangic: '00:00', bitis: '23:59' }]))
  db.ekle('doktor_calisma_saatleri', { doktor_id: doktorId, gunler, slot_dakika: 20 })
}

export const PRATIK = {
  /** Written 3 times in the last month — the winner of the ranking. */
  enCokAntibiyotik: 'Augmentin',
  ikinciAntibiyotik: 'Klacid',
  /** Vaccines given in the last month. */
  asiSayisi: 3,
  randevuHastasi: 'QA Bugün Randevu',
  annesi: 'QA-Anne-Nermin',
  babasi: 'QA-Baba-Kemal',
  kimlikHastasi: 'Elif Sarıkaya',
} as const

/** The doctor's own practice. Returns the id of the patient whose parents' names are recorded. */
export function pratikEkle(db: SahteVeritabani, encrypt: Sifrele, doktorId: string, bugunIso: string): { kimlikHastasi: string } {
  const a = hasta(db, encrypt, doktorId, PRATIK.kimlikHastasi, '2021-02-03', { anneAdi: PRATIK.annesi, babaAdi: PRATIK.babasi })
  const b = hasta(db, encrypt, doktorId, 'Mert Kılınç', '2020-06-11')
  const c = hasta(db, encrypt, doktorId, 'Zehra Poyraz', '2022-09-25')
  recete(db, doktorId, a, 5, 'Augmentin', 'Akut otitis media')
  recete(db, doktorId, b, 9, 'Augmentin', 'Akut sinüzit')
  recete(db, doktorId, c, 14, 'Augmentin', 'Akut tonsillit')
  recete(db, doktorId, b, 18, 'Klacid', 'Pnömoni')
  // The vaccinated patients have at most one visit in the window: the existing practice search drops a vaccine from
  // the count when the patient has many other hits in the same window (NOTYA-AYSE-ARAC-PARITE-06, not fixed here).
  const d = hasta(db, encrypt, doktorId, 'Defne Akarsu', '2025-08-19')
  asi(db, doktorId, a, 4, 'KKK')
  asi(db, doktorId, d, 8, 'Hepatit A')
  asi(db, doktorId, c, 12, 'Suçiçeği')
  tumGunAcik(db, doktorId)
  // One appointment today, 12:00–12:20 UTC (15:00 in Turkey).
  db.ekle('randevular', { doktor_id: doktorId, patient_id: null, hasta_adi_serbest: PRATIK.randevuHastasi, baslangic: `${bugunIso}T12:00:00Z`, bitis: `${bugunIso}T12:20:00Z`, durum: 'planlandi', tur: 'kontrol' })
  return { kimlikHastasi: a }
}

export const YABANCI = {
  /** Written 6 times by the OTHER doctor — would top the ranking if it leaked. */
  antibiyotik: 'Zinnat',
  asiSayisi: 5,
  randevuHastasi: 'GIZLI Yabancı Randevu',
  hasta: 'Bartu Yabancıoğlu',
  annesi: 'GIZLI-Anne-Yabancı',
  babasi: 'GIZLI-Baba-Yabancı',
  alerji: 'GIZLI-Alerji-Fıstık',
} as const

/** Another doctor's practice: more of everything, and a patient whose name the first doctor might say. */
export function yabanciPratikEkle(db: SahteVeritabani, encrypt: Sifrele, digerDoktorId: string, bugunIso: string): string {
  const y = hasta(db, encrypt, digerDoktorId, YABANCI.hasta, '2020-01-15', { anneAdi: YABANCI.annesi, babaAdi: YABANCI.babasi, alerjiler: [YABANCI.alerji] })
  for (let i = 0; i < 6; i++) recete(db, digerDoktorId, y, 3 + i, YABANCI.antibiyotik, 'Akut otitis media')
  for (let i = 0; i < YABANCI.asiSayisi; i++) asi(db, digerDoktorId, y, 2 + i, 'Rotavirüs')
  tumGunAcik(db, digerDoktorId)
  db.ekle('randevular', { doktor_id: digerDoktorId, patient_id: y, hasta_adi_serbest: YABANCI.randevuHastasi, baslangic: `${bugunIso}T09:00:00Z`, bitis: `${bugunIso}T09:20:00Z`, durum: 'planlandi', tur: 'kontrol' })
  return y
}
