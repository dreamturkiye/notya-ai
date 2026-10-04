/**
 * NOTYA-RANDEVU-V2 PR3 — waitlist (in order, expiring offers, first to accept), kontrol proposal date, and the
 * Ayşe appointment tool's gating. Fake database, synthetic data, no network.
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

process.env.ENCRYPTION_MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'qa-sentetik-bekleme-anahtari'

import { SahteVeritabani } from '../../security/testing/sahteSupabase'
import { encrypt } from '../../security/encryption'
import { kontrolTarihi } from './kontrolOnerisi'
import { eylemUygunMu, uygunEylemler, ARAC_TAVANI } from '../../../core/eylemler/araclar'
import { eylemBul } from '../../../core/eylemler/kayit'
import { istanbulYerelUtc, gunEkle, istanbulAn } from './zaman'

describe('kontrolTarihi — date from the doctor’s own plan sentence', () => {
  it('reads digits and words; days, weeks, months', () => {
    assert.deepEqual(kontrolTarihi('Parasetamol devam. 2 hafta sonra kontrol.', '2026-10-05')?.tarih, '2026-10-19')
    assert.equal(kontrolTarihi('Bir ay sonra kontrole gelsin', '2026-10-05')?.tarih, '2026-11-04')
    assert.equal(kontrolTarihi('10 gün sonra kontrol', '2026-10-05')?.tarih, '2026-10-15')
  })
  it('no relative time → no card (never a guessed date)', () => {
    assert.equal(kontrolTarihi('Kontrol önerildi.', '2026-10-05'), null)
    assert.equal(kontrolTarihi('2 hafta sonra hemogram istendi', '2026-10-05'), null)
    assert.equal(kontrolTarihi(null, '2026-10-05'), null)
  })
})

describe('Ayşe randevu_degistir — offered only while Hasta Portalı Randevu is ON, never displacing a tool', () => {
  const hasta = { id: 'h1', ad: 'QA', dogumTarihi: '1990-01-01' } as never
  const e = eylemBul('randevu_degistir')!
  it('is registered as a base, non-T3 action', () => {
    assert.ok(e)
    assert.equal(e.branslar, 'hepsi')
  })
  it('switch OFF → not offered; ON → offered', () => {
    assert.equal(eylemUygunMu(e, { brans: 'pediatri' as never, hasta }), false)
    assert.equal(eylemUygunMu(e, { brans: 'pediatri' as never, hasta, randevuV2: false }), false)
    assert.equal(eylemUygunMu(e, { brans: 'pediatri' as never, hasta, randevuV2: true }), true)
  })
  it('switch OFF → the tool list is exactly what it was', () => {
    const kapali = uygunEylemler({ brans: 'pediatri' as never, hasta }).map((x) => x.anahtar)
    const acik = uygunEylemler({ brans: 'pediatri' as never, hasta, randevuV2: true }).map((x) => x.anahtar)
    assert.ok(!kapali.includes('randevu_degistir'))
    // ON never removes an existing tool: it is appended, and dropped first if the cap bites.
    assert.deepEqual(acik.filter((k) => k !== 'randevu_degistir'), kapali.slice(0, ARAC_TAVANI))
  })
})

describe('bekleme listesi — in order, one open offer per slot, first to accept', () => {
  let db: SahteVeritabani
  let doktor: string
  const hastalar: string[] = []
  const randevular: string[] = []
  // A Monday at 06:00 Istanbul, next week — deterministic working day.
  const pzt = (() => { let g = gunEkle(istanbulAn(Date.now()).gun, 7); while (new Date(`${g}T12:00:00Z`).getUTCDay() !== 1) g = gunEkle(g, 1); return g })()
  const simdi = istanbulYerelUtc(gunEkle(pzt, -3), 10 * 60) // the Friday before, 10:00 (not quiet hours)
  const iso = (gun: string, dk: number) => new Date(istanbulYerelUtc(gun, dk)).toISOString()
  const gonderilen: string[] = []
  const kanal = { kanal: 'eposta' as const, otomatik: true, tasirMi: () => true, gonder: async (_sb: unknown, i: { hasta: { id: string } }) => { gonderilen.push(i.hasta.id); return { durum: 'gonderildi' as const } } }

  beforeEach(() => {
    db = new SahteVeritabani()
    doktor = randomUUID()
    hastalar.length = 0
    randevular.length = 0
    gonderilen.length = 0
    db.ekle('randevu_portal_ayarlari', { doktor_id: doktor, acik: true, min_bildirim_saat: 0, max_ileri_gun: 30, iptal_sinir_saat: 24 })
    // Monday 09:00–10:00 only, 30-minute grid.
    db.ekle('doktor_calisma_saatleri', { doktor_id: doktor, slot_dakika: 30, gunler: { '0': { acik: false, baslangic: '09:00', bitis: '10:00' }, '1': { acik: true, baslangic: '09:00', bitis: '10:00' }, '2': { acik: false, baslangic: '09:00', bitis: '10:00' }, '3': { acik: false, baslangic: '09:00', bitis: '10:00' }, '4': { acik: false, baslangic: '09:00', bitis: '10:00' }, '5': { acik: false, baslangic: '09:00', bitis: '10:00' }, '6': { acik: false, baslangic: '09:00', bitis: '10:00' } } })
    for (const ad of ['Bir', 'Iki']) {
      const h = db.ekle('patients', { doctor_id: doktor, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad })) }).id as string
      hastalar.push(h)
      // Both booked for the Monday a week later, 09:00 / 09:30.
      const g = gunEkle(pzt, 7)
      const dk = ad === 'Bir' ? 540 : 570
      randevular.push(db.ekle('randevular', { doktor_id: doktor, patient_id: h, baslangic: iso(g, dk), bitis: iso(g, dk + 30), durum: 'onaylandi', tur: 'muayene', kaynak: 'portal' }).id as string)
    }
    // Monday 09:00 is taken by someone else; 09:30 is free.
    db.ekle('randevular', { doktor_id: doktor, patient_id: null, baslangic: iso(pzt, 540), bitis: iso(pzt, 570), durum: 'onaylandi', tur: 'muayene' })
  })

  it('offers the free earlier slot to the FIRST patient only; on expiry it moves to the next', async () => {
    const { beklemeyeEkle, teklifTara } = await import('./bekleme')
    const sb = db.istemci() as never
    for (let i = 0; i < 2; i++) assert.deepEqual(await beklemeyeEkle(sb, { doktorId: doktor, patientId: hastalar[i], randevuId: randevular[i], simdi }), { ok: true })
    // Make list order explicit.
    db.tablo('randevu_bekleme_listesi')[0].created_at = new Date(simdi - 2000).toISOString()
    db.tablo('randevu_bekleme_listesi')[1].created_at = new Date(simdi - 1000).toISOString()

    const o1 = await teklifTara(sb, { simdi, bitis: Date.now() + 10_000, kanal })
    assert.equal(o1.teklif, 1)
    assert.deepEqual(gonderilen, [hastalar[0]])
    const t = db.tablo('randevu_bekleme_teklifleri')
    assert.equal(t.length, 1)
    assert.equal(Date.parse(String(t[0].baslangic)), Date.parse(iso(pzt, 570)))

    // Nothing new while the offer is open.
    assert.equal((await teklifTara(sb, { simdi: simdi + 60_000, bitis: Date.now() + 10_000, kanal })).teklif, 0)
    // Expired → the same slot goes to the next patient in line.
    const sonra = simdi + 3 * 3_600_000
    const o3 = await teklifTara(sb, { simdi: sonra, bitis: Date.now() + 10_000, kanal })
    assert.equal(o3.suresiDolan, 1)
    assert.equal(o3.teklif, 1)
    assert.deepEqual(gonderilen, [hastalar[0], hastalar[1]])
  })

  it('accepting moves the patient’s appointment to the slot as a request (default approval mode)', async () => {
    const { beklemeyeEkle, teklifTara, teklifKabul } = await import('./bekleme')
    const sb = db.istemci() as never
    await beklemeyeEkle(sb, { doktorId: doktor, patientId: hastalar[0], randevuId: randevular[0], simdi })
    await teklifTara(sb, { simdi, bitis: Date.now() + 10_000, kanal })
    const teklif = db.tablo('randevu_bekleme_teklifleri')[0]
    // Another patient cannot take it through the portal.
    const yabanci = await teklifKabul(sb, { teklifId: String(teklif.id), doktorId: doktor, patientId: hastalar[1], kanal: 'portal', simdi })
    assert.equal(yabanci.ok, false)
    const s = await teklifKabul(sb, { teklifId: String(teklif.id), doktorId: doktor, patientId: hastalar[0], kanal: 'portal', simdi })
    assert.ok(s.ok, JSON.stringify(s))
    const r = db.tablo('randevular').find((x) => x.id === randevular[0])!
    assert.equal(Date.parse(String(r.baslangic)), Date.parse(iso(pzt, 570)))
    assert.equal(r.durum, 'talep')
    assert.equal(db.tablo('randevu_bekleme_teklifleri')[0].durum, 'kabul')
    assert.equal(db.tablo('randevu_bekleme_listesi')[0].durum, 'kabul')
    // A second accept of the same offer is refused.
    assert.equal((await teklifKabul(sb, { teklifId: String(teklif.id), doktorId: doktor, patientId: hastalar[0], kanal: 'portal', simdi })).ok, false)
  })

  it('switch OFF → no offers are made', async () => {
    const { beklemeyeEkle, teklifTara } = await import('./bekleme')
    const sb = db.istemci() as never
    await beklemeyeEkle(sb, { doktorId: doktor, patientId: hastalar[0], randevuId: randevular[0], simdi })
    db.tablo('randevu_portal_ayarlari')[0].acik = false
    assert.equal((await teklifTara(sb, { simdi, bitis: Date.now() + 10_000, kanal })).teklif, 0)
  })
})
