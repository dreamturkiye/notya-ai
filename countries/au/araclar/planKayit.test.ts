/**
 * A general-practice wellness plan and a non-surgical cosmetic plan are rows in ulke_arac_kayitlari.
 * The stand-in database is in this process. Synthetic patients only.
 */
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ENCRYPTION_MASTER_KEY = 'yalniz-test-icin-sentetik-anahtar-0011'
process.env.NOTYA_COUNTRY = 'au'

import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { sahteVeritabani } from '@/lib/ulke/testing/sahteVeritabani'
import { encrypt } from '@/lib/security/encryption'
import { aktifAracIcerigi, aracKaydet } from '@/lib/ulke/araclar/kayit'

const vt = sahteVeritabani()
const sb = () => vt.createClient() as never
const DA = '10000000-0000-4000-8000-00000000000a'
const DB = '10000000-0000-4000-8000-00000000000b'
const H1 = '30000000-0000-4000-8000-000000000001'

function hastaEkle(id: string, doktor: string) {
  vt.tablo('ulke_hastalar').push({
    id, ulke: 'au', doctor_id: doktor,
    name_encrypted: encrypt(JSON.stringify({ ad: 'QA Patient' })),
    dob_encrypted: encrypt('1990-05-05'),
    gender_encrypted: null, phone_encrypted: null, is_active: true,
    created_at: new Date().toISOString(),
  })
  vt.tablo('hasta_ulke_bilgisi').push({
    patient_id: id, ulke: 'au', doctor_id: doktor, dil: 'en',
    ota_ismi_encrypted: null, ulusal_kimlik_encrypted: null,
  })
}

function rolYaz(doktor: string, rol: string) {
  vt.tablolar.hekim_rolu = vt.tablo('hekim_rolu').filter((x) => x.doctor_id !== doktor)
  vt.tablo('hekim_rolu').push({ ulke: 'au', doctor_id: doktor, rol })
}

beforeEach(() => {
  for (const k of Object.keys(vt.tablolar)) delete vt.tablolar[k]
  hastaEkle(H1, DA)
  vt.tablo('ulke_hesaplari').push({ id: DA, full_name: 'QA Doctor A', ulke: 'au', ui_language: 'en-AU' })
  vt.tablo('ulke_hesaplari').push({ id: DB, full_name: 'QA Doctor B', ulke: 'au', ui_language: 'en-AU' })
})

describe('Australia plan rows on ulke_arac_kayitlari', () => {
  it('general practice can keep a wellness plan, cardiology cannot, and another doctor cannot write this patient', async () => {
    const icerik = aktifAracIcerigi()
    assert.ok(icerik)
    rolYaz(DA, 'family-medicine')
    const wellness = await aracKaydet(sb(), DA, { hastaId: H1, arac: 'au-wellness-plan', ham: { konu: 'saglik', yer: true, yazildi: true } }, icerik)
    assert.equal(wellness.tamam, true, JSON.stringify(wellness))
    rolYaz(DA, 'cardiology')
    const kalp = await aracKaydet(sb(), DA, { hastaId: H1, arac: 'au-wellness-plan', ham: { konu: 'saglik', yer: true } }, icerik)
    assert.deepEqual(kalp, { tamam: false, kod: 'ARAC_YOK' })
    rolYaz(DA, 'aesthetic-medicine')
    const sac = await aracKaydet(sb(), DA, { hastaId: H1, arac: 'au-nonsurgical-plan', ham: { islem: 'sac', listede: true, foto: true } }, icerik)
    assert.equal(sac.tamam, true, JSON.stringify(sac))
    rolYaz(DA, 'aesthetic-surgery')
    const cerrahi = await aracKaydet(sb(), DA, { hastaId: H1, arac: 'au-nonsurgical-plan', ham: { islem: 'sac', listede: true } }, icerik)
    assert.deepEqual(cerrahi, { tamam: false, kod: 'ARAC_YOK' })
    rolYaz(DB, 'aesthetic-medicine')
    const yabanci = await aracKaydet(sb(), DB, { hastaId: H1, arac: 'au-nonsurgical-plan', ham: { islem: 'sac', foto: true } }, icerik)
    assert.deepEqual(yabanci, { tamam: false, kod: 'NOT_FOUND' })
    const satirlar = vt.tablo('ulke_arac_kayitlari').filter((s) => s.doctor_id === DA && s.patient_id === H1)
    assert.deepEqual(satirlar.map((s) => s.arac).sort(), ['au-nonsurgical-plan', 'au-wellness-plan'])
    assert.ok(satirlar.every((s) => s.ulke === 'au' && typeof s.kayit_encrypted === 'string' && String(s.kayit_encrypted).length > 20))
  })
})
