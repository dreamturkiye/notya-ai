/**
 * NOTYA-AYSE-ALAN-01 — a SYNTHETIC patient whose identity and contact fields are recorded in all three places the
 * identity reader looks (QA fixture, no real person):
 *   patient card        → mother's name, phone
 *   Hasta Bilgi Formu   → address + city, birth place, guardian (name, relation, phone)
 *   document summary    → father's name ("Baba Adı: …" line of an epikriz)
 * The e-mail is deliberately NOT recorded (the "where to add it" sentence).
 *
 * Every value carries a marker no clinical text would contain, so "this value is in a model request" is a string
 * search. The chart also has one approved visit, so a clinical question has something to answer from.
 */
import type { SahteVeritabani } from '@/lib/security/testing/sahteSupabase'
import { adIndeksParcalari, tokenOzeti } from '@/lib/doktor/hastaAramaIndeksi'

export interface KimlikDegerleri {
  ad: string
  annesi: string
  babasi: string
  telefon: string
  adres: string
  il: string
  dogumYeri: string
  veliAd: string
  veliSoyad: string
  veliTelefon: string
}

export const KIMLIK: KimlikDegerleri = {
  ad: 'Tuna Erdemli',
  annesi: 'QA-Anne-Sevgül',
  babasi: 'QA-Baba-Rıfkı',
  telefon: '0555 000 11 22',
  adres: 'QA-Sokak No 7 Daire 3',
  il: 'QA-İl-Eskişehir',
  dogumYeri: 'QA-Doğumyeri-Sinop',
  veliAd: 'QA-Veli-Nezahat',
  veliSoyad: 'QA-Soyad-Erdemli',
  veliTelefon: '0555 000 33 44',
}

/** Another doctor's patient, recorded the same way. None of this may reach the first doctor. */
export const YABANCI_KIMLIK: KimlikDegerleri = {
  ad: 'Bora Yabancıgil',
  annesi: 'GIZLI-Anne-Feraye',
  babasi: 'GIZLI-Baba-Nurettin',
  telefon: '0555 999 11 22',
  adres: 'GIZLI-Sokak No 9',
  il: 'GIZLI-İl-Kars',
  dogumYeri: 'GIZLI-Doğumyeri-Rize',
  veliAd: 'GIZLI-Veli-Feraye',
  veliSoyad: 'GIZLI-Soyad-Yabancıgil',
  veliTelefon: '0555 999 33 44',
}

/** Every identity / contact value of the fixture — what must never appear in anything sent to a model. */
export function kimlikDegerleri(k: KimlikDegerleri): string[] {
  return [k.annesi, k.babasi, k.telefon, k.adres, k.il, k.dogumYeri, k.veliAd, k.veliSoyad, k.veliTelefon, k.telefon.replace(/\s/g, ''), k.veliTelefon.replace(/\s/g, '')]
}

const gunOnce = (n: number, saat = 9) => {
  const d = new Date(Date.now() - n * 86400000)
  d.setUTCHours(saat, 0, 0, 0)
  return d.toISOString()
}

export function kimlikHastasiEkle(db: SahteVeritabani, encrypt: (s: string) => string, doktorId: string, k: KimlikDegerleri = KIMLIK): string {
  const id = db.ekle('patients', {
    doctor_id: doktorId, is_active: true,
    name_encrypted: encrypt(JSON.stringify({ ad: k.ad })), dob_encrypted: encrypt('2021-03-14'), gender_encrypted: encrypt('male'),
    phone_encrypted: encrypt(k.telefon), email_encrypted: null,
    notes_encrypted: encrypt(JSON.stringify({ anneAdi: k.annesi, alerjiler: ['Yumurta'] })), created_at: gunOnce(300),
  }).id as string
  for (const parca of adIndeksParcalari(k.ad)) db.ekle('patient_search_tokens', { patient_id: id, doctor_id: doktorId, token_hash: tokenOzeti(parca) })
  db.ekle('hasta_intake_formlari', {
    patient_id: id, doktor_id: doktorId, created_at: gunOnce(290),
    form_data_encrypted: encrypt(JSON.stringify({
      adres: k.adres, il: k.il, dogumYeri: k.dogumYeri,
      veliAd: k.veliAd, veliSoyad: k.veliSoyad, veliYakinligi: 'Anne', veliTelefon: k.veliTelefon,
      alerjiVarMi: 'Evet', alerjiAciklama: 'Yumurta',
    })),
  })
  db.ekle('hasta_belgeler', {
    patient_id: id, doctor_id: doktorId, created_at: gunOnce(200), baslik: 'Epikriz', belge_turu: 'epikriz',
    ai_ozet: { ozet: `Taburcu özeti.\nBaba Adı: ${k.babasi}\nYatış nedeni: akut bronşiolit, 3 gün izlem.` },
  })
  const seans = db.ekle('sessions', { patient_id: id, doctor_id: doktorId, created_at: gunOnce(30), status: 'completed', specialty: 'pediatri', session_type: 'muayene', archived_at: null }).id
  db.ekle('notes', {
    session_id: seans, doctor_id: doktorId, patient_id: id, created_at: gunOnce(30, 10), approved_at: gunOnce(30, 11),
    content_subjektif: 'İki gündür öksürük ve burun akıntısı.', content_objektif: 'Akciğer sesleri doğal.', content_degerlendirme: 'Akut nazofarenjit.',
    content_plan: 'Burun lavajı, bol sıvı.', content_tani: 'Akut nazofarenjit', basvuru_yakinmasi: 'Öksürük', icd10_codes: [], content_ilaclar: [], vitaller: { kilo: 15.2, boy: 99 }, kritik_bulgular: null,
  })
  return id
}
