/**
 * Patient edit, note addendum and draft-visit delete on a United States build.
 * Synthetic accounts only. The stand-in database. No network.
 */
process.env.NOTYA_COUNTRY = 'us'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ENCRYPTION_MASTER_KEY = 'yalniz-test-icin-sentetik-anahtar-0004'

import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { sahteVeritabani } from '@/lib/ulke/testing/sahteVeritabani'

const vt = sahteVeritabani()
{
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as { exports?: Record<string, { require?: { default?: string }; import?: { default?: string } }>; main?: string; module?: string }
  const kok = dirname(pkgYolu)
  const adaylar = [pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module].filter(Boolean) as string[]
  for (const g of new Set(adaylar.map((x) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: vt.createClient } })
  }
}

const A = '10000000-0000-4000-8000-0000000000a1'
const B = '10000000-0000-4000-8000-0000000000b2'
const SEANS = '30000000-0000-4000-8000-0000000000c3'
const TASLAK_SEANS = '30000000-0000-4000-8000-0000000000c4'
const NOT_ID = '40000000-0000-4000-8000-0000000000d5'
const RANDEVU = '50000000-0000-4000-8000-0000000000e6'

function sifirla() {
  for (const k of Object.keys(vt.tablolar)) delete vt.tablolar[k]
  for (const k of Object.keys(vt.hesaplar)) delete vt.hesaplar[k]
  Object.assign(vt.hesaplar, {
    'jeton-a': { id: A, email: 'qa-a@notya.test', app_metadata: { country: 'us' }, user_metadata: { full_name: 'QA Doctor A' } },
    'jeton-b': { id: B, email: 'qa-b@notya.test', app_metadata: { country: 'us' }, user_metadata: {} },
  })
  vt.tablo('ulke_hesaplari').push(
    { id: A, full_name: 'QA Doctor A', ulke: 'us', ui_language: 'en-US' },
    { id: B, full_name: 'QA Doctor B', ulke: 'us', ui_language: 'en-US' },
  )
}

const GIRDI = { ad: 'Ada Lovelace', otaIsmi: '', dogumTarihi: '1980-01-02', cinsiyet: 'female' as const, telefon: '2025550100', dil: 'en', ulusalKimlik: '' }

describe('United States: patient edit, addendum, draft delete', () => {
  let hastalar: typeof import('@/lib/ulke/uygulama/hastalar')
  let notlar: typeof import('@/lib/ulke/uygulama/notlar')
  let muayene: typeof import('@/lib/ulke/uygulama/muayeneKaydi')
  let meslekRota: typeof import('../../app/api/ulke/meslek-kaydi/route.ulke')
  let NextRequest: typeof import('next/server').NextRequest
  before(async () => {
    hastalar = await import('@/lib/ulke/uygulama/hastalar')
    notlar = await import('@/lib/ulke/uygulama/notlar')
    muayene = await import('@/lib/ulke/uygulama/muayeneKaydi')
    meslekRota = await import('../../app/api/ulke/meslek-kaydi/route.ulke')
    NextRequest = (await import('next/server')).NextRequest
  })
  beforeEach(sifirla)

  const db = () => vt.createClient() as unknown as import('@supabase/supabase-js').SupabaseClient

  it('a doctor edits their own patient, and another doctor\'s id is not found', async () => {
    const hasta = await hastalar.hastaOlustur(db(), A, GIRDI)
    assert.ok(hasta)
    const guncel = await hastalar.hastaGuncelle(db(), A, hasta.id, { ...GIRDI, ad: 'Ada King', telefon: '2025550199' })
    assert.equal(guncel?.ad, 'Ada King')
    assert.equal(guncel?.telefon, '2025550199')
    const once = guncel?.ad
    assert.equal(await hastalar.hastaGuncelle(db(), B, hasta.id, { ...GIRDI, ad: 'Yabanci' }), null)
    assert.equal((await hastalar.hastaGetir(db(), A, hasta.id))?.ad, once)
  })

  it('an addendum is stored beside an approved note and does not change its sections; a draft is refused', async () => {
    const hasta = await hastalar.hastaOlustur(db(), A, GIRDI)
    assert.ok(hasta)
    vt.tablo('ulke_muayeneler').push({ id: SEANS, doctor_id: A, patient_id: hasta.id, ulke: 'us' })
    vt.tablo('ulke_notlar').push({
      id: NOT_ID, session_id: SEANS, doctor_id: A, ulke: 'us', approved_at: null,
      content_subjektif: 'history', content_objektif: 'exam', content_degerlendirme: 'assessment', content_plan: 'plan',
    })
    vt.tablo('not_dil_kaydi').push({ note_id: NOT_ID, doctor_id: A, patient_id: hasta.id, ulke: 'us', not_dili: 'en-US' })
    const taslak = await notlar.notEkKaydet(db(), A, NOT_ID, 'too soon')
    assert.deepEqual(taslak, { tamam: false, kod: 'GECERSIZ', alan: 'taslak' })
    vt.tablo('ulke_notlar')[0].approved_at = '2026-10-12T00:00:00.000Z'
    const yazildi = await notlar.notEkKaydet(db(), A, NOT_ID, 'Addendum text')
    assert.deepEqual(yazildi, { tamam: true })
    const satir = vt.tablo('ulke_notlar')[0]
    assert.equal(satir.ek_metin, 'Addendum text')
    assert.equal(satir.content_subjektif, 'history')
    assert.equal(satir.content_plan, 'plan')
    assert.deepEqual(await notlar.notEkKaydet(db(), B, NOT_ID, 'foreign'), { tamam: false, kod: 'NOT_FOUND' })
    assert.equal(vt.tablo('ulke_notlar')[0].ek_metin, 'Addendum text')
    const okunan = await notlar.notGetir(db(), A, NOT_ID)
    assert.equal(okunan?.ekMetin, 'Addendum text')
    assert.equal(okunan?.icerik.s, 'history')
  })

  it('a draft visit is deleted after the appointment link is cleared; an approved note is kept', async () => {
    const hasta = await hastalar.hastaOlustur(db(), A, GIRDI)
    assert.ok(hasta)
    vt.tablo('ulke_muayeneler').push(
      { id: SEANS, doctor_id: A, patient_id: hasta.id, ulke: 'us' },
      { id: TASLAK_SEANS, doctor_id: A, patient_id: hasta.id, ulke: 'us' },
    )
    vt.tablo('ulke_notlar').push({ id: NOT_ID, session_id: SEANS, doctor_id: A, ulke: 'us', approved_at: '2026-10-12T00:00:00.000Z', content_subjektif: 'history', content_objektif: '', content_degerlendirme: '', content_plan: '' })
    vt.tablo('not_dil_kaydi').push({ note_id: NOT_ID, doctor_id: A, patient_id: hasta.id, ulke: 'us', not_dili: 'en-US' })
    vt.tablo('ulke_randevulari').push({ id: RANDEVU, doctor_id: A, patient_id: hasta.id, ulke: 'us', session_id: TASLAK_SEANS, durum: 'geldi' })
    assert.deepEqual(await muayene.muayeneSil(db(), A, SEANS), { tamam: false, kod: 'ONAYLI' })
    assert.equal(vt.tablo('ulke_notlar').length, 1)
    assert.deepEqual(await muayene.muayeneSil(db(), B, TASLAK_SEANS), { tamam: false, kod: 'NOT_FOUND' })
    assert.equal(vt.tablo('ulke_muayeneler').some((s) => s.id === TASLAK_SEANS), true)
    assert.deepEqual(await muayene.muayeneSil(db(), A, TASLAK_SEANS), { tamam: true })
    assert.equal(vt.tablo('ulke_muayeneler').some((s) => s.id === TASLAK_SEANS), false)
    assert.equal(vt.tablo('ulke_randevulari')[0].session_id, null)
    assert.equal(vt.tablo('ulke_muayeneler').some((s) => s.id === SEANS), true)
  })

  it('the professional registration is stored on the account and a bad value changes nothing', async () => {
    const istek = (govde: unknown) => new NextRequest('https://us.notya.test/api/ulke/meslek-kaydi', { method: 'POST', headers: { authorization: 'Bearer jeton-a', 'content-type': 'application/json' }, body: JSON.stringify(govde) })
    const iyi = await meslekRota.POST(istek({ meslekKaydi: '1234567890' }))
    assert.equal(iyi.status, 200)
    assert.equal(vt.hesaplar['jeton-a'].user_metadata?.meslekKaydi, '1234567890')
    const kotu = await meslekRota.POST(istek({ meslekKaydi: '!' }))
    assert.equal(kotu.status, 400)
    assert.equal(vt.hesaplar['jeton-a'].user_metadata?.meslekKaydi, '1234567890')
    const bos = await meslekRota.POST(istek({ meslekKaydi: '' }))
    assert.equal(bos.status, 200)
    assert.equal(vt.hesaplar['jeton-a'].user_metadata?.meslekKaydi, undefined)
  })
})
