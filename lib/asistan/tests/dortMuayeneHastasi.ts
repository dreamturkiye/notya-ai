/**
 * NOTYA-AYSE-ANALIZ-01 — a SYNTHETIC pediatri patient with four approved visits and four deliberate gaps (QA
 * fixture, no real person). Dates are relative to today, because the engines that find the gaps read today's date.
 *
 *   1. a missed vaccine          Hepatit B: doses 1 and 2 are in the vaccine table, dose 3 is not; the 2nd visit's
 *                                note says it will be given at the next visit
 *   2. a visit without weight    the 3rd visit has no measurement at all
 *   3. a follow-up never scheduled   the 4th (last) visit says "1 ay sonra kontrol"; no appointment, no later visit
 *   4. a lab asked, never resulted   the 1st visit says "Hemogram ve ferritin istendi"; no lab row exists
 *
 * One prescription (the 2nd visit) gives "hangi muayenesinde … yazıldı" a single right answer.
 */
import type { SahteVeritabani } from '@/lib/security/testing/sahteSupabase'
import { adIndeksParcalari, tokenOzeti } from '@/lib/doktor/hastaAramaIndeksi'

export const DORT_MUAYENE_ADI = 'Nehir Karadağ'
export const DORT_MUAYENE_ILAC = 'Augmentin'

const GUN = 86400000
/** A day `n` days ago, as an ISO timestamp at `saat` UTC. */
export const gunOnce = (n: number, saat = 9): string => {
  const d = new Date(Date.now() - n * GUN)
  d.setUTCHours(saat, 0, 0, 0)
  return d.toISOString()
}
const trGun = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`

/** Days ago of the birth, the four visits and the two recorded vaccine doses. */
export const GUNLER = { dogum: 430, vizit: [370, 310, 250, 150], asi: [429, 398] } as const

export interface DortMuayene {
  id: string
  /** The four visit dates as the answers write them (gg.aa.yyyy), oldest first. */
  tarih: [string, string, string, string]
}

interface Not { s: string; o: string; a: string; p: string; tani: string; ilac?: { ad: string; doz: string; kullanim: string }[]; vital: Record<string, number> | null }

/** `ilac` and `tetkik` let another doctor's copy carry markers of its own. */
function notlar(ilac: string, tetkik: string): Not[] {
  return [
    { s: '2 aylık sağlam çocuk izlemi. Yalnız anne sütü alıyor, emmesi iyi.', o: 'Sistem muayeneleri doğal. Ön fontanel açık, normal gergin.', a: 'Sağlıklı bebek, büyüme yaşına uygun.', p: `${tetkik} istendi. Emzirmeye devam.`, tani: 'Sağlam çocuk izlemi', vital: { kilo: 5.4, boy: 58, basCevresi: 39 } },
    { s: 'İki gündür ateş ve huzursuzluk, sağ kulağını çekiştiriyor.', o: 'Sağ timpan zar hiperemik ve bombe. Akciğer sesleri doğal.', a: 'Sağ akut otitis media.', p: `${ilac} başlandı. Hepatit B 3. doz bir sonraki vizitte yapılacak.`, tani: 'Akut otitis media', ilac: [{ ad: ilac, doz: '', kullanim: 'günde 2 kez 7 gün' }], vital: { kilo: 6.8, boy: 63 } },
    { s: '6 aylık sağlam çocuk izlemi. Ek gıdaya başlanmış, uykusu düzenli.', o: 'Sistem muayeneleri doğal. Destekli oturuyor.', a: 'Gelişimi yaşına uygun.', p: 'Ek gıda önerileri anlatıldı.', tani: 'Sağlam çocuk izlemi', vital: null },
    { s: 'Genel değerlendirme için getirildi. Yakınması yok.', o: 'Sistem muayeneleri doğal.', a: 'Sağlıklı çocuk.', p: '1 ay sonra kontrol.', tani: 'Sağlam çocuk izlemi', vital: { kilo: 8.6, boy: 71 } },
  ]
}

export function dortMuayeneHastasiEkle(
  db: SahteVeritabani, encrypt: (s: string) => string, doktorId: string,
  o: { ad?: string; ilac?: string; tetkik?: string } = {},
): DortMuayene {
  const ad = o.ad || DORT_MUAYENE_ADI
  const id = db.ekle('patients', {
    doctor_id: doktorId, is_active: true,
    name_encrypted: encrypt(JSON.stringify({ ad })), dob_encrypted: encrypt(gunOnce(GUNLER.dogum).slice(0, 10)), gender_encrypted: encrypt('female'),
    phone_encrypted: null, email_encrypted: null, notes_encrypted: encrypt(JSON.stringify({})), created_at: gunOnce(GUNLER.dogum),
  }).id as string
  for (const parca of adIndeksParcalari(ad)) db.ekle('patient_search_tokens', { patient_id: id, doctor_id: doktorId, token_hash: tokenOzeti(parca) })

  notlar(o.ilac || DORT_MUAYENE_ILAC, o.tetkik || 'Hemogram ve ferritin').forEach((n, i) => {
    const gun = GUNLER.vizit[i]
    const seans = db.ekle('sessions', { patient_id: id, doctor_id: doktorId, created_at: gunOnce(gun), status: 'completed', specialty: 'pediatri', session_type: 'muayene', archived_at: null }).id
    db.ekle('notes', {
      session_id: seans, doctor_id: doktorId, patient_id: id, created_at: gunOnce(gun, 10), approved_at: gunOnce(gun, 11),
      content_subjektif: n.s, content_objektif: n.o, content_degerlendirme: n.a, content_plan: n.p, content_tani: n.tani,
      basvuru_yakinmasi: n.tani, icd10_codes: [], content_ilaclar: n.ilac || [], vitaller: n.vital, kritik_bulgular: null,
    })
    for (const r of n.ilac || []) {
      db.ekle('hasta_ilaclar', { patient_id: id, doctor_id: doktorId, ilac_adi: r.ad, etken_madde: null, doz: r.doz, kullanim_sikli: r.kullanim, baslangic_tarihi: gunOnce(gun).slice(0, 10), bitis_tarihi: null, aktif: true, durum: 'aktif', created_at: gunOnce(gun) })
    }
  })
  GUNLER.asi.forEach((gun, i) => {
    db.ekle('asilar', { patient_id: id, doktor_id: doktorId, asi_adi: 'Hepatit B', doz_no: i + 1, uygulama_tarihi: gunOnce(gun).slice(0, 10), kaynak: 'klinik', kaynak_note_id: null, kategori: 'cocuk', created_at: gunOnce(gun) })
  })
  const t = GUNLER.vizit.map((g) => trGun(gunOnce(g).slice(0, 10))) as [string, string, string, string]
  return { id, tarih: t }
}
