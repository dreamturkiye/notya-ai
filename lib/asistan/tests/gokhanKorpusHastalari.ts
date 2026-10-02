/**
 * NOTYA-GOKHAN-KORPUS-01 — the corpus PANEL, written into the in-memory scene (QA fixture; no real person, no
 * production row).
 *
 * The complaints in the ledger name four charts of the beta doctor's panel. The corpus never uses those names or
 * their values: every source sentence is re-said about a synthetic stand-in with the same PROPERTY the complaint
 * depended on (a compound surname the recogniser splits, a first name that is also the assistant's name, a chart
 * with no birth date, another doctor's patient). The mapping is in HASTA_ESLEME; the charts are:
 *
 *   bebek    Emircan Karaoğlu   25-month-old boy, 15 visits — lib/asistan/dosyaSorgu/denetim/fikstur.ts korpusBebek()
 *   ayse     Ayşe Bozkurt       5-year-old girl, ONE visit (pneumonia), no vaccine rows; first name = persona name
 *   tarik    Tarık Özdemir      31-month-old boy, ONE visit (otitis, yesterday), no vaccine rows
 *   olcay    Olcay Santoro      no birth date, no clinical record, one past appointment
 *   eriskin  Nermin Aydoğan     46-year-old woman, hypertension + type 2 diabetes — korpusEriskin()
 *   (other doctor)  QA Test Hasta 2, Selim Erkoç — must never resolve for the corpus doctor
 *
 * Not in the panel, added only to the sessions that use it (so every count above stays the same):
 *   doruk    Doruk Akyel        19-month-old boy, three visits ENTERED LATER than they happened — korpusGecGiris()
 */
import type { SahteVeritabani } from '@/lib/security/testing/sahteSupabase'
import { adIndeksParcalari, tokenOzeti } from '@/lib/doktor/hastaAramaIndeksi'
import { gunEkle, ayEkle } from '@/specialties/pediatri/engines/girdi'
import { KORPUS_BEBEK_ADI, KORPUS_ERISKIN_ADI, KORPUS_GEC_GIRIS_ADI, ilk10Dosyasi, korpusBebek, korpusEriskin, korpusGecGiris, type KorpusDosyasi } from '@/lib/asistan/dosyaSorgu/denetim/fikstur'

export type KorpusHasta = 'bebek' | 'ayse' | 'tarik' | 'olcay' | 'eriskin'

export const KORPUS_ADLARI: Record<KorpusHasta, string> = {
  bebek: KORPUS_BEBEK_ADI, ayse: 'Ayşe Bozkurt', tarik: 'Tarık Özdemir', olcay: 'Olcay Santoro', eriskin: KORPUS_ERISKIN_ADI,
}
/** Patients of the scene's SECOND doctor. */
export const YABANCI_HASTALAR = ['QA Test Hasta 2', 'Selim Erkoç'] as const
/** Charts the corpus doctor owns. */
export const PANEL_SAYISI = Object.keys(KORPUS_ADLARI).length

/**
 * Which synthetic chart stands for which chart of the source sentences, and why. Initials only — the sources carry
 * the full names; the corpus does not repeat them.
 */
export const HASTA_ESLEME: { kaynak: string; korpus: KorpusHasta | 'yabanci'; neden: string }[] = [
  { kaynak: 'U.T. (2-year-old boy, the multi-visit chart)', korpus: 'bebek', neden: 'compound first name and surname the recogniser splits; the rich chart' },
  { kaynak: 'A.Y. (5-year-old girl)', korpus: 'ayse', neden: 'first name equals the assistant name (address vs patient); one visit, no vaccine rows' },
  { kaynak: 'R.D. (toddler, one otitis visit)', korpus: 'tarik', neden: 'second small chart for patient switches; visit yesterday' },
  { kaynak: 'O.B. (no birth date)', korpus: 'olcay', neden: 'no birth date, no record, only a past appointment' },
  { kaynak: 'QA / founder test charts of another account', korpus: 'yabanci', neden: 'cross-doctor isolation: must not resolve' },
]

export const KORPUS_AYSE = { kilo: 19.4, boy: 110, ates: 38.9, tansiyon: '95/60', kanGrubu: 'AB Rh+', anneBoyu: 168, yas: 5 } as const
export const KORPUS_TARIK = { kilo: 13.9, boy: 92, bas: 49.5, ates: 38.7, kanGrubu: 'A Rh-', dozMl: '6', sureGun: 7 } as const

/**
 * NOTYA-KALITE-STANDART-01 (Q-31): identity and contact values of the panel's intake forms. None may be spoken on a
 * voice turn — the value is written on the screen. The unit test checks each one against the charts.
 */
export const KORPUS_KIMLIK_DEGERLERI: readonly string[] = [
  'Elif', 'Serdar', '0532 000 11 22', 'qa-veli@example.test', 'QA Mahallesi', '10000000146',
  'Sevgi', 'Orhan', '0534 000 33 44', 'Derya', 'Volkan', '0535 000 44 55',
  'Melis', 'Kerem', '0536 000 55 66',
]

const erkek = /erkek|male/i

function kucukDosyalar(bugunIso: string): Record<'ayse' | 'tarik' | 'olcay', KorpusDosyasi> {
  const once = (n: number) => `${gunEkle(bugunIso, -n)}T09:00:00Z`
  const ayseForm = {
    ad: 'Ayşe', soyad: 'Bozkurt', telefon: '0534 000 33 44', anneAdi: 'Sevgi', babaAdi: 'Orhan',
    veliYakinligi: 'baba', veliAd: 'Orhan', veliSoyad: 'Bozkurt', veliTelefon: '0534 000 33 44',
    cinsiyet: 'Kız', kanGrubu: KORPUS_AYSE.kanGrubu, alerjiVarMi: 'Hayır', kronikHastaliklar: [], anneBoyu: String(KORPUS_AYSE.anneBoyu), babaBoyu: '176',
  }
  const tarikForm = {
    ad: 'Tarık', soyad: 'Özdemir', telefon: '0535 000 44 55', anneAdi: 'Derya', babaAdi: 'Volkan',
    cinsiyet: 'Erkek', kanGrubu: KORPUS_TARIK.kanGrubu, alerjiVarMi: 'Hayır', kronikHastaliklar: [],
  }
  const kimliksiz = (f: Record<string, unknown>) => Object.fromEntries(Object.entries(f).filter(([k]) => !/^(ad|soyad|telefon|veli|anneAdi|babaAdi)/.test(k)))
  return {
    ayse: {
      hasta: { ad: KORPUS_ADLARI.ayse, dogumIso: gunEkle(ayEkle(bugunIso, -62), -9), cinsiyet: 'Kız' },
      brans: 'Pediatri', telefon: '0534 000 33 44', form: ayseForm, intake: kimliksiz(ayseForm), intakeTarih: once(9),
      vizitler: [{
        id: 'a-k1', tarih: once(8),
        subjektif: 'Öksürük ve ateş, 4 gündür. Dün gece nefes almakta zorlanmış.',
        objektif: 'Sağ alt zonda ince raller. Solunum sayısı 32/dk. SpO₂ %96.',
        degerlendirme: 'Toplum kökenli pnömoni.', tani: 'Pnömoni', icd: [{ code: 'J18.9', description_tr: 'Pnömoni' }],
        plan: 'Klacid 5 ml sabah akşam, 10 gün. Calpol ateşte. Akciğer grafisi istendi. 3 gün sonra kontrol.',
        ilaclar: [{ ad: 'Klacid 250 mg/5 ml süspansiyon', doz: '5 ml', kullanim: '2x1, 10 gün' }, { ad: 'Calpol süspansiyon', doz: '7,5 ml', kullanim: 'ateşte, 6 saatte bir' }],
        vitaller: { kilo: KORPUS_AYSE.kilo, boy: KORPUS_AYSE.boy, ates: KORPUS_AYSE.ates, tansiyon: KORPUS_AYSE.tansiyon },
      }],
      ilaclar: [
        { id: 'a-ki1', ilac_adi: 'Klacid 250 mg/5 ml süspansiyon', etken_madde: 'klaritromisin', doz: '5 ml', kullanim_sikli: '2x1, 10 gün', baslangic_tarihi: gunEkle(bugunIso, -8), aktif: true },
        { id: 'a-ki2', ilac_adi: 'Calpol süspansiyon', etken_madde: 'parasetamol', doz: '7,5 ml', kullanim_sikli: 'ateşte, 6 saatte bir', baslangic_tarihi: gunEkle(bugunIso, -8), aktif: true },
      ],
      randevular: [{ id: 'a-kr1', baslangic: `${gunEkle(bugunIso, 1)}T10:00:00+03:00`, tur: 'kontrol', durum: 'planli' }],
      belgeDosyalari: [], goruntuler: [],
    },
    tarik: {
      hasta: { ad: KORPUS_ADLARI.tarik, dogumIso: gunEkle(ayEkle(bugunIso, -31), -6), cinsiyet: 'Erkek' },
      brans: 'Pediatri', telefon: '0535 000 44 55', form: tarikForm, intake: kimliksiz(tarikForm), intakeTarih: once(2),
      vizitler: [{
        id: 't-k1', tarih: once(1),
        subjektif: 'Sol kulak ağrısı ve ateş, 2 gündür.',
        objektif: 'Sol timpanik membran hiperemik ve bombe. Sağ doğal.',
        degerlendirme: 'Sol akut otitis media.', tani: 'Akut otitis media', icd: [{ code: 'H66.9', description_tr: 'Otitis media' }],
        plan: `Amoksisilin ${KORPUS_TARIK.dozMl} ml 12 saatte bir, ${KORPUS_TARIK.sureGun} gün. İbuprofen ağrıda. 48-72 saat içinde düzelmezse kontrol.`,
        ilaclar: [{ ad: 'Amoksisilin 250 mg/5 ml süspansiyon', doz: `${KORPUS_TARIK.dozMl} ml`, kullanim: `2x1, ${KORPUS_TARIK.sureGun} gün` }],
        vitaller: { kilo: KORPUS_TARIK.kilo, boy: KORPUS_TARIK.boy, basCevresi: KORPUS_TARIK.bas, ates: KORPUS_TARIK.ates },
      }],
      ilaclar: [{ id: 't-ki1', ilac_adi: 'Amoksisilin 250 mg/5 ml süspansiyon', etken_madde: 'amoksisilin', doz: `${KORPUS_TARIK.dozMl} ml`, kullanim_sikli: `2x1, ${KORPUS_TARIK.sureGun} gün`, baslangic_tarihi: gunEkle(bugunIso, -1), aktif: true }],
      randevular: [{ id: 't-kr1', baslangic: `${gunEkle(bugunIso, -1)}T11:30:00+03:00`, tur: 'muayene', durum: 'tamamlandi' }],
      belgeDosyalari: [], goruntuler: [],
    },
    olcay: {
      hasta: { ad: KORPUS_ADLARI.olcay, dogumIso: null, cinsiyet: null },
      brans: 'Pediatri', form: {}, intake: {}, vizitler: [],
      randevular: [{ id: 'o-kr1', baslangic: `${gunEkle(bugunIso, -5)}T09:30:00+03:00`, tur: 'muayene', durum: 'gelmedi' }],
      belgeDosyalari: [], goruntuler: [],
    },
  }
}

/**
 * NOTYA-ILK10-* — the "İlk 10" standard chart in the scene: lib/asistan/dosyaSorgu/denetim/fikstur.ts ilk10Dosyasi()
 * (24-month-old boy: two Hepatit B rows on one day, a planned Hepatit A dose with no row, two weights on one day, a
 * suspension dose above the table's range written with another product than the drug list, a follow-up window that
 * closed four days ago, a planned M-CHAT with no result). Not part of the corpus panel: added only by the tests that
 * use it, so every panel count stays the same. The intake form carries identity keys on purpose — the tests check
 * that none of them reaches the model.
 */
export const ILK10_HASTA_ADI = 'Doruk Savaşkan'
export const ILK10_KIMLIK = { tcKimlik: '10000000214', telefon: '0536 000 55 66', anneAdi: 'Zerrin', veliTelefon: '0536 000 55 66' } as const

export function ilk10KorpusDosyasi(bugunIso: string): KorpusDosyasi {
  const ham = ilk10Dosyasi(bugunIso)
  const form = { ad: 'Doruk', soyad: 'Savaşkan', ...ILK10_KIMLIK, babaAdi: 'Tuncay', veliYakinligi: 'anne', veliAd: 'Zerrin', veliSoyad: 'Savaşkan', cinsiyet: 'Erkek', ...ham.intake }
  return { ...ham, hasta: { ...ham.hasta, ad: ILK10_HASTA_ADI }, telefon: ILK10_KIMLIK.telefon, form, belgeDosyalari: [], goruntuler: [] }
}

/**
 * The chart for one doctor; returns the patient id. `gecmiseDonuk`: the visits were entered AFTER the fact — every
 * session row is created on the entry day (yesterday) while each note carries its own visit day, the way the real
 * test chart of 2026-10-02 was entered (NOTYA-VIZIT-TARIHI-01).
 */
export function ilk10HastasiEkle(db: SahteVeritabani, encrypt: (s: string) => string, doktorId: string, bugunIso: string, o: { gecmiseDonuk?: boolean } = {}): string {
  return korpusDosyasiYaz(db, encrypt, doktorId, ilk10KorpusDosyasi(bugunIso), o.gecmiseDonuk ? { seansOlusturma: (_v, i) => `${gunEkle(bugunIso, -1)}T1${i}:00:00Z` } : {})
}

/** One chart with everything every creation path writes (name index rows included). Returns the patient id. */
export function korpusDosyasiYaz(db: SahteVeritabani, encrypt: (s: string) => string, doktorId: string, d: KorpusDosyasi, o: { seansOlusturma?: (vizitTarihi: string, sira: number) => string } = {}): string {
  const ilkTarih = d.intakeTarih || d.vizitler[0]?.tarih || new Date().toISOString()
  const hasta = db.ekle('patients', {
    doctor_id: doktorId, is_active: true,
    name_encrypted: encrypt(JSON.stringify({ ad: d.hasta.ad })),
    dob_encrypted: d.hasta.dogumIso ? encrypt(d.hasta.dogumIso) : null,
    gender_encrypted: d.hasta.cinsiyet ? encrypt(erkek.test(d.hasta.cinsiyet) ? 'male' : 'female') : null,
    phone_encrypted: d.telefon ? encrypt(d.telefon) : null, email_encrypted: null,
    notes_encrypted: encrypt('{}'),
    created_at: ilkTarih,
  }).id as string
  for (const parca of adIndeksParcalari(d.hasta.ad)) db.ekle('patient_search_tokens', { patient_id: hasta, doctor_id: doktorId, token_hash: tokenOzeti(parca) })
  if (Object.keys(d.form).length) {
    db.ekle('hasta_intake_formlari', { patient_id: hasta, doktor_id: doktorId, created_at: ilkTarih, form_data_encrypted: encrypt(JSON.stringify(d.form)) })
  }
  d.vizitler.forEach((v, i) => {
    // A visit entered later than it happened: the session row is created at entry time, the note keeps the visit's day.
    const seansTarihi = d.gecGiris ? new Date(Date.parse(d.gecGiris) + i * 5 * 60_000).toISOString() : v.tarih
    const seans = db.ekle('sessions', { patient_id: hasta, doctor_id: doktorId, created_at: o.seansOlusturma ? o.seansOlusturma(v.tarih, i) : seansTarihi, status: 'completed', specialty: 'pediatri', session_type: 'muayene', archived_at: null }).id
    db.ekle('notes', {
      session_id: seans, doctor_id: doktorId, patient_id: hasta, created_at: v.tarih, approved_at: seansTarihi,
      content_subjektif: v.subjektif ?? null, content_objektif: v.objektif ?? null, content_degerlendirme: v.degerlendirme ?? null,
      content_plan: v.plan ?? null, content_tani: v.tani ?? null,
      basvuru_yakinmasi: String(v.subjektif || '').split('.')[0],
      icd10_codes: v.icd || [], content_ilaclar: v.ilaclar || [], vitaller: v.vitaller || null, kritik_bulgular: null, _sira: i,
    })
  })
  for (const i of d.ilaclar || []) {
    db.ekle('hasta_ilaclar', { patient_id: hasta, doctor_id: doktorId, ilac_adi: i.ilac_adi, etken_madde: i.etken_madde ?? null, doz: i.doz ?? null, kullanim_sikli: i.kullanim_sikli ?? null, kullanim: i.kullanim_sikli ?? null, baslangic_tarihi: i.baslangic_tarihi ?? null, bitis_tarihi: i.bitis_tarihi ?? null, aktif: i.aktif !== false, durum: i.aktif !== false ? 'aktif' : 'sonlandi', kaynak_note_id: null, created_at: `${i.baslangic_tarihi}T09:00:00Z` })
  }
  for (const a of d.asilar || []) {
    db.ekle('asilar', { patient_id: hasta, doktor_id: doktorId, asi_adi: a.asi_adi, doz_no: a.doz_no, uygulama_tarihi: a.uygulama_tarihi, kaynak: a.kaynak || 'klinik', kaynak_note_id: null, created_at: `${a.uygulama_tarihi}T09:00:00Z` })
  }
  for (const l of d.lablar || []) {
    db.ekle('lab_satirlar', { patient_id: hasta, doctor_id: doktorId, canonical_key: l.canonical_key, kanonik_deger: l.kanonik_deger, kanonik_birim: l.kanonik_birim, value_text: l.value_text, numune_tarihi: l.numune_tarihi, onayli: true, ref_low: l.ref_low ?? null, ref_high: l.ref_high ?? null })
  }
  for (const r of d.randevular || []) {
    const bas = new Date(r.baslangic)
    db.ekle('randevular', { patient_id: hasta, doktor_id: doktorId, baslangic: bas.toISOString(), bitis: new Date(bas.getTime() + 20 * 60_000).toISOString(), tur: r.tur ?? 'kontrol', durum: r.durum ?? 'planli', hasta_adi_serbest: null })
  }
  for (const c of d.cihaz || []) db.ekle('cihaz_olcumleri', { patient_id: hasta, doctor_id: doktorId, tur: c.tur, deger: c.deger, birim: c.birim, alindi: c.alindi, onaylandi: true })
  for (const m of d.mchat || []) db.ekle('mchat_testleri', { patient_id: hasta, doctor_id: doktorId, created_at: m.created_at, risk_seviyesi: m.risk_seviyesi, toplam_puan: m.toplam_puan ?? null })
  for (const b of d.belgeler || []) {
    db.ekle('belge_analizleri', { patient_id: hasta, doctor_id: doktorId, modality_final: b.modality_final, durum: 'onaylandi', onaylandi_at: b.onaylandi_at, sonuc: { ozet: b.hekim_ozet, acil_bayrak: false }, hekim_tanisi: [], hekim_ozet: b.hekim_ozet })
  }
  for (const g of d.goruntuler) db.ekle('goruntu_calisma', { patient_id: hasta, doctor_id: doktorId, tip: g.tip, modalite: g.tip, bolge: g.bolge, tarih: g.tarih, onay_durum: 'hekim', hekim_yorum: g.yorum, created_at: `${g.tarih}T09:00:00Z` })
  for (const b of d.belgeDosyalari) db.ekle('hasta_belgeler', { patient_id: hasta, doctor_id: doktorId, baslik: b.baslik, created_at: b.tarih, ai_ozet: { ozet: b.ozet } })
  return hasta
}

export interface KorpusPaneli { idler: Record<KorpusHasta, string>; bugunIso: string }

/** The whole panel for `doktorId`, plus two charts for `digerDoktorId`. `bugunIso` = the doctor's calendar day. */
export function korpusPaneliKur(db: SahteVeritabani, encrypt: (s: string) => string, doktorId: string, digerDoktorId: string, bugunIso: string): KorpusPaneli {
  const kucuk = kucukDosyalar(bugunIso)
  const idler = {
    bebek: korpusDosyasiYaz(db, encrypt, doktorId, korpusBebek(bugunIso)),
    ayse: korpusDosyasiYaz(db, encrypt, doktorId, kucuk.ayse),
    tarik: korpusDosyasiYaz(db, encrypt, doktorId, kucuk.tarik),
    olcay: korpusDosyasiYaz(db, encrypt, doktorId, kucuk.olcay),
    eriskin: korpusDosyasiYaz(db, encrypt, doktorId, korpusEriskin(bugunIso)),
  }
  for (const ad of YABANCI_HASTALAR) {
    korpusDosyasiYaz(db, encrypt, digerDoktorId, { hasta: { ad, dogumIso: gunEkle(bugunIso, -3000), cinsiyet: 'Erkek' }, brans: 'Pediatri', form: {}, intake: {}, vizitler: [], belgeDosyalari: [], goruntuler: [] })
  }
  return { idler, bugunIso }
}

/** NOTYA-KALITE-STANDART-01: the late-entry chart, for the sessions that use it. Returns the patient id. */
export function gecGirisHastasiEkle(db: SahteVeritabani, encrypt: (s: string) => string, doktorId: string, bugunIso: string): string {
  return korpusDosyasiYaz(db, encrypt, doktorId, korpusGecGiris(bugunIso))
}
export { KORPUS_GEC_GIRIS_ADI }
