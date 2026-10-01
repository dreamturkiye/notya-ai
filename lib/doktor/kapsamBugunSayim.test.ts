/**
 * NOTYA-KAPSAM-05 (2026-10-01) — live voice bug on Kaan's test account (1 registered patient, nothing today):
 *   "Bugün İstanbul'da hava yağışlı mı?" → "Bugün 0 hasta. Filtre: bugün · Şehir."   (should never run a patient tool)
 *   "bugün kaç hastam var?" → "Bugün 0 hasta. Filtre: bugün."                          (no total, reads like "no patients")
 * "Bugün" = visit or non-cancelled appointment inside the doctor's day, in the doctor's timezone.
 * Runs the real resolver + search against the fake Supabase. Yalnız sentetik QA verisi.
 */
import { describe, it, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { SahteVeritabani } from '../security/testing/sahteSupabase'
import { hastaninSozunuCoz } from './hastaCozumleyici'
import { klinikAramaMi, klinikAramaYurut, sorguyuAyikla } from './hastaDosyaAra'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-kapsam-bugun-anahtari'

let encrypt: (s: string) => string
let db: SahteVeritabani
let doktorId = ''
let hastaId = ''

before(async () => {
  ;({ encrypt } = await import('../security/encryption'))
})

beforeEach(() => {
  db = new SahteVeritabani()
  doktorId = randomUUID()
  db.ekle('users', { id: doktorId, full_name: 'QA Hekim', specialty: 'pediatri' })
  hastaId = db.ekle('patients', {
    doctor_id: doktorId, is_active: true, created_at: '2026-08-14T20:32:50Z',
    name_encrypted: encrypt(JSON.stringify({ ad: 'Deneme Hasta' })), dob_encrypted: encrypt('2021-03-01'),
    notes_encrypted: encrypt(JSON.stringify({ il: 'İstanbul' })),
  }).id
  // Last visit and appointment are in the past, as on the live account.
  db.ekle('sessions', { doctor_id: doktorId, patient_id: hastaId, created_at: '2026-09-25T20:53:13Z', started_at: '2026-09-25T20:53:13Z', archived_at: null })
  db.ekle('randevular', { doktor_id: doktorId, patient_id: hastaId, baslangic: '2026-09-02T13:30:00Z', durum: 'planlandi', tur: 'kontrol', notlar: null })
})

const HAVA = `Bugün İstanbul'da hava yağışlı mı?`
const BUGUN = 'bugün kaç hastam var?'
// 2026-10-01 22:00 in New York = 2026-10-02 05:00 TRT: the doctor's "bugün" and the TRT / UTC day differ.
const AKSAM_NY = new Date('2026-10-02T02:00:00Z')
const NY = 'America/New_York'

describe('NOTYA-KAPSAM-05 — weather question never becomes a patient search', () => {
  it('parser: no city filter, not clinical', () => {
    const q = sorguyuAyikla(HAVA, AKSAM_NY, NY)
    assert.deepEqual(q.alanlar, [])
    assert.equal(q.klinik, false)
    assert.equal(klinikAramaMi(HAVA, AKSAM_NY, NY), false)
  })
  it('resolver: no patient, no count sentence', async () => {
    const c = await hastaninSozunuCoz(db.istemci() as never, doktorId, HAVA, { tz: NY })
    assert.equal(c.tur, 'yok')
    assert.equal((c as { sayiMetin?: string }).sayiMetin, undefined)
  })
  it('a real city question about patients still filters by city', () => {
    const q = sorguyuAyikla(`İstanbul'da oturan hastalarım kimler`, AKSAM_NY, NY)
    assert.deepEqual(q.alanlar.map((a) => a.anahtar), ['il'])
    assert.equal(q.klinik, true)
  })
})

describe('NOTYA-KAPSAM-05 — "bugün kaç hastam var?" in the doctor timezone', () => {
  it('nothing today → 0 plus the registered total (1)', async () => {
    const r = await klinikAramaYurut(db.istemci() as never, doktorId, BUGUN, AKSAM_NY, NY)
    assert.equal(r.istatistik.hastaSayisi, 0)
    assert.equal(r.istatistik.cumle, 'Bugün randevulu ya da muayene edilen hastanız yok; kayıtlı toplam 1 hastanız var.')
  })
  it('appointment today (NY day, already tomorrow in TRT) → 1', async () => {
    db.ekle('randevular', { doktor_id: doktorId, patient_id: hastaId, baslangic: '2026-10-01T14:00:00Z', durum: 'planlandi', tur: 'kontrol', notlar: null })
    const r = await klinikAramaYurut(db.istemci() as never, doktorId, BUGUN, AKSAM_NY, NY)
    assert.equal(r.istatistik.hastaSayisi, 1)
    assert.match(r.istatistik.cumle, /^Bugün 1 hasta\./)
    // TRT default puts "bugün" on 2 Ekim: the same appointment is not today there.
    const trt = await klinikAramaYurut(db.istemci() as never, doktorId, BUGUN, AKSAM_NY)
    assert.equal(trt.istatistik.hastaSayisi, 0)
  })
  it('visit today → 1 through the full resolver (real clock)', async () => {
    const simdi = new Date().toISOString()
    db.ekle('sessions', { doctor_id: doktorId, patient_id: hastaId, created_at: simdi, started_at: simdi, archived_at: null })
    const c = await hastaninSozunuCoz(db.istemci() as never, doktorId, BUGUN, { tz: 'UTC' })
    assert.equal(c.tur, 'yok')
    assert.match(String((c as { sayiMetin?: string }).sayiMetin), /^Bugün 1 hasta/)
  })
  it('cancelled appointment today does not count', async () => {
    db.ekle('randevular', { doktor_id: doktorId, patient_id: hastaId, baslangic: '2026-10-01T14:00:00Z', durum: 'iptal', tur: 'kontrol', notlar: null })
    const r = await klinikAramaYurut(db.istemci() as never, doktorId, BUGUN, AKSAM_NY, NY)
    assert.equal(r.istatistik.hastaSayisi, 0)
  })
})
