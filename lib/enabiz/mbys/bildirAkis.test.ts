/**
 * MBYS-BILDIR-01 — confirmation gate, fingerprint, stub adapter and the confirm → audit → hand-over flow.
 * Synthetic data only; the store is in memory (no database).
 *   npx tsx --test lib/enabiz/mbys/bildirAkis.test.ts
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { adaptorSec, bildirimKapisi, devirSonucuCoz, kayitOzeti, taslakAdaptoru, type GunlukSatiri } from './bildir'
import { bildirimOnayla, bildirimOnizle, devirKaydet, type BildirimDeposu, type BildirimNotu } from './bildirAkis'
import type { MbysKayit } from './kontrol'

const TC = '10000000146'

function kayit(ek: Partial<MbysKayit> = {}): MbysKayit {
  return {
    surum: 1,
    kayitTuru: 'vatandas',
    kimlik: { tcKimlikNo: TC, pasaportNo: '', sahisNo: '', ad: 'QA Ayşe', soyad: 'Örnek', cinsiyet: 'K', dogumTarihi: '1990-05-17', uyruk: 'TR' },
    muayene: { sikayet: 'Boğaz ağrısı', hikaye: 'İki gün', bulgu: 'Hiperemi', aciklama: 'Semptomatik', boy: '165', kilo: '58', muayeneTuru: 'Normal Muayene', vakaTuru: 'Normal Vaka', ozellikliHizmet: '' },
    tanilar: [{ kod: 'J02.9', ad: 'Akut farenjit' }],
    hazirlandi: '2026-10-16T10:00:00.000Z',
    ...ek,
  }
}

const DR_A = 'doktor-a'
const DR_B = 'doktor-b'
const NOT = '11111111-1111-4111-8111-111111111111'

/** In-memory store. `notlar` is keyed by doctor, so a foreign doctor's note is simply absent (as in the real reads). */
function depoKur(opts: { not?: Partial<BildirimNotu>; gunlukHatasi?: boolean } = {}) {
  const gunluk: (GunlukSatiri & { id: string })[] = []
  const aktarimlar: string[] = []
  const notlar: Record<string, BildirimNotu> = {
    [`${DR_A}:${NOT}`]: { hastaId: 'hasta-1', hastaAd: 'QA Ayşe Örnek', onayli: true, kilit: false, eksikler: [], kayit: kayit(), ...opts.not },
  }
  const depo: BildirimDeposu = {
    async notKaydi(doktorId, notId) { return notlar[`${doktorId}:${notId}`] ?? null },
    async gunlukEkle(satir) {
      if (opts.gunlukHatasi) return null
      const id = `log-${gunluk.length + 1}`
      gunluk.push({ ...satir, id })
      return { id }
    },
    async onayBul(doktorId, onayId) {
      const s = gunluk.find((g) => g.id === onayId && g.doctor_id === doktorId && g.olay === 'onaylandi')
      return s ? { id: s.id, note_id: s.note_id, patient_id: s.patient_id, payload_hash: s.payload_hash } : null
    },
    async aktarildiIsaretle(doktorId, _h, notId) { aktarimlar.push(`${doktorId}:${notId}`) },
  }
  return { depo, gunluk, aktarimlar }
}

describe('kayitOzeti (payload fingerprint)', () => {
  it('is stable for the same content and ignores the build timestamp', () => {
    assert.equal(kayitOzeti(kayit()), kayitOzeti(kayit({ hazirlandi: '2030-01-01T00:00:00.000Z' })))
    assert.match(kayitOzeti(kayit()), /^[0-9a-f]{64}$/)
  })
  it('changes when anything the doctor would confirm changes', () => {
    const k = kayit()
    const baska = kayit({ tanilar: [{ kod: 'J03.9', ad: 'Akut tonsillit' }] })
    assert.notEqual(kayitOzeti(k), kayitOzeti(baska))
    assert.notEqual(kayitOzeti(k), kayitOzeti(kayit({ kimlik: { ...k.kimlik, ad: 'Başka' } })))
  })
})

describe('bildirimKapisi', () => {
  const temel = { rol: 'doktor' as const, notOnayli: true, kilit: false, eksikler: [], onayVerildi: true, gonderilenOzet: 'a', guncelOzet: 'a' }
  it('lets a confirmed, complete, approved visit through', () => {
    assert.deepEqual(bildirimKapisi(temel), { izin: true })
  })
  it('refuses a secretary, an unapproved note, a patient who refused e-Nabız', () => {
    assert.equal(bildirimKapisi({ ...temel, rol: 'sekreter' }).izin, false)
    const onaysiz = bildirimKapisi({ ...temel, notOnayli: false })
    assert.ok(!onaysiz.izin && onaysiz.kod === 'not_onaysiz')
    const kilitli = bildirimKapisi({ ...temel, kilit: true })
    assert.ok(!kilitli.izin && kilitli.kod === 'hasta_izni_yok')
  })
  it('refuses missing data', () => {
    const r = bildirimKapisi({ ...temel, eksikler: [{ alan: 'tani', mesaj: 'Tanı yok', duzelt: 'not' }] })
    assert.ok(!r.izin && r.kod === 'eksik' && r.durum === 422)
  })
  it('requires explicit confirmation and the SAME fingerprint', () => {
    const yok = bildirimKapisi({ ...temel, onayVerildi: false })
    assert.ok(!yok.izin && yok.kod === 'onay_yok')
    const degisti = bildirimKapisi({ ...temel, gonderilenOzet: 'a', guncelOzet: 'b' })
    assert.ok(!degisti.izin && degisti.kod === 'ozet_uyusmuyor')
    const bos = bildirimKapisi({ ...temel, gonderilenOzet: '', guncelOzet: '' })
    assert.ok(!bos.izin, 'an empty fingerprint never matches')
  })
})

describe('adapter (honest stub)', () => {
  it('the only adapter is the stub and it never claims a submission', async () => {
    assert.equal(adaptorSec(), taslakAdaptoru)
    assert.equal(taslakAdaptoru.gercek, false)
    const s = await taslakAdaptoru.gonder(kayit())
    assert.equal(s.gonderildi, false)
    assert.equal(s.mod, 'stub')
    assert.equal(s.referans, undefined)
  })
  it('no Ministry address is called from the new server code', () => {
    for (const f of ['bildir.ts', 'bildirAkis.ts', 'sunucu.ts', '../../../app/api/doktor/araclar/enabiz/mbys/bildir/route.ts']) {
      const kaynak = readFileSync(new URL(f, import.meta.url), 'utf8')
      assert.ok(!/\bfetch\s*\(/.test(kaynak), `${f} must not call fetch`)
      assert.ok(!/saglik\.gov\.tr/.test(kaynak.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')), `${f} must not name a Ministry host in code`)
    }
  })
})

describe('bildirimOnayla', () => {
  it('writes the audit row BEFORE releasing the record, with ids and a hash only', async () => {
    const { depo, gunluk } = depoKur()
    const on = await bildirimOnizle(depo, { doktorId: DR_A, notId: NOT })
    assert.ok(on.ok)
    const r = await bildirimOnayla(depo, { doktorId: DR_A, rol: 'doktor', notId: NOT, onay: true, gonderilenOzet: on.ok ? on.ozet : '' })
    assert.ok(r.ok)
    if (!r.ok) return
    assert.equal(gunluk.length, 1)
    assert.equal(gunluk[0].olay, 'onaylandi')
    assert.equal(gunluk[0].doctor_id, DR_A)
    assert.equal(gunluk[0].gonderildi, false)
    assert.equal(r.onayId, gunluk[0].id)
    assert.equal(r.adaptor.gonderildi, false)
    const json = JSON.stringify(gunluk[0])
    for (const sizinti of ['QA Ayşe', 'Örnek', TC, 'J02.9', 'Boğaz']) assert.ok(!json.includes(sizinti), `audit row must not hold "${sizinti}"`)
  })
  it('fails closed: no record is released when the audit write fails', async () => {
    const { depo } = depoKur({ gunlukHatasi: true })
    const on = await bildirimOnizle(depo, { doktorId: DR_A, notId: NOT })
    const r = await bildirimOnayla(depo, { doktorId: DR_A, rol: 'doktor', notId: NOT, onay: true, gonderilenOzet: on.ok ? on.ozet : '' })
    assert.ok(!r.ok && r.durum === 500)
    assert.ok(!('kayit' in r))
  })
  it('refuses without the confirmation flag and writes nothing', async () => {
    const { depo, gunluk } = depoKur()
    const on = await bildirimOnizle(depo, { doktorId: DR_A, notId: NOT })
    const r = await bildirimOnayla(depo, { doktorId: DR_A, rol: 'doktor', notId: NOT, onay: false, gonderilenOzet: on.ok ? on.ozet : '' })
    assert.ok(!r.ok && r.kod === 'onay_yok')
    assert.equal(gunluk.length, 0)
  })
  it('refuses a stale fingerprint, an unapproved note, missing data and a secretary — each with no audit row', async () => {
    const eski = depoKur()
    assert.ok(!(await bildirimOnayla(eski.depo, { doktorId: DR_A, rol: 'doktor', notId: NOT, onay: true, gonderilenOzet: 'eski' })).ok)
    const onaysiz = depoKur({ not: { onayli: false } })
    const on = await bildirimOnizle(onaysiz.depo, { doktorId: DR_A, notId: NOT })
    assert.ok(!(await bildirimOnayla(onaysiz.depo, { doktorId: DR_A, rol: 'doktor', notId: NOT, onay: true, gonderilenOzet: on.ok ? on.ozet : '' })).ok)
    const eksik = depoKur({ not: { eksikler: [{ alan: 'tani', mesaj: 'Tanı yok', duzelt: 'not' }] } })
    const on2 = await bildirimOnizle(eksik.depo, { doktorId: DR_A, notId: NOT })
    assert.ok(!(await bildirimOnayla(eksik.depo, { doktorId: DR_A, rol: 'doktor', notId: NOT, onay: true, gonderilenOzet: on2.ok ? on2.ozet : '' })).ok)
    const sek = depoKur()
    const on3 = await bildirimOnizle(sek.depo, { doktorId: DR_A, notId: NOT })
    const r3 = await bildirimOnayla(sek.depo, { doktorId: DR_A, rol: 'sekreter', notId: NOT, onay: true, gonderilenOzet: on3.ok ? on3.ozet : '' })
    assert.ok(!r3.ok && r3.durum === 403)
    for (const d of [eski, onaysiz, eksik, sek]) assert.equal(d.gunluk.length, 0)
  })
  it('a patient who refused e-Nabız sharing gets no record and no audit row', async () => {
    const { depo, gunluk } = depoKur({ not: { kilit: true, kayit: null, eksikler: [{ alan: 'izin', mesaj: 'Hasta izni yok', duzelt: 'yok' }] } })
    const r = await bildirimOnayla(depo, { doktorId: DR_A, rol: 'doktor', notId: NOT, onay: true, gonderilenOzet: 'x' })
    assert.ok(!r.ok && r.kod === 'hasta_izni_yok')
    assert.equal(gunluk.length, 0)
  })
  it('doctor B cannot preview or confirm doctor A’s visit (404, nothing written)', async () => {
    const { depo, gunluk } = depoKur()
    const on = await bildirimOnizle(depo, { doktorId: DR_B, notId: NOT })
    assert.ok(!on.ok && on.durum === 404)
    const r = await bildirimOnayla(depo, { doktorId: DR_B, rol: 'doktor', notId: NOT, onay: true, gonderilenOzet: 'x' })
    assert.ok(!r.ok && r.durum === 404)
    assert.equal(gunluk.length, 0)
  })
})

describe('devirKaydet', () => {
  async function onayli() {
    const d = depoKur()
    const on = await bildirimOnizle(d.depo, { doktorId: DR_A, notId: NOT })
    const r = await bildirimOnayla(d.depo, { doktorId: DR_A, rol: 'doktor', notId: NOT, onay: true, gonderilenOzet: on.ok ? on.ozet : '' })
    assert.ok(r.ok)
    return { ...d, onayId: r.ok ? r.onayId : '' }
  }
  it('records the hand-over, links it to the confirmation and marks the visit Aktarıldı', async () => {
    const { depo, gunluk, aktarimlar, onayId } = await onayli()
    const r = await devirKaydet(depo, { doktorId: DR_A, rol: 'doktor', onayId, sonuc: 'yardimci' })
    assert.deepEqual(r, { ok: true, durum: 'aktarildi' })
    assert.equal(gunluk.at(-1)?.olay, 'devredildi')
    assert.equal(gunluk.at(-1)?.kanal, 'yardimci')
    assert.equal(gunluk.at(-1)?.onay_id, onayId)
    assert.deepEqual(aktarimlar, [`${DR_A}:${NOT}`])
  })
  it('a failed hand-over is logged and does NOT mark the visit Aktarıldı', async () => {
    const { depo, gunluk, aktarimlar, onayId } = await onayli()
    const r = await devirKaydet(depo, { doktorId: DR_A, rol: 'doktor', onayId, sonuc: 'basarisiz' })
    assert.deepEqual(r, { ok: true, durum: 'basarisiz' })
    assert.equal(gunluk.at(-1)?.olay, 'devir_basarisiz')
    assert.equal(aktarimlar.length, 0)
  })
  it('another doctor’s confirmation id, an unknown id and a secretary are refused', async () => {
    const { depo, gunluk, onayId } = await onayli()
    const n = gunluk.length
    const b = await devirKaydet(depo, { doktorId: DR_B, rol: 'doktor', onayId, sonuc: 'yardimci' })
    assert.ok(!b.ok && b.durum === 404)
    const yok = await devirKaydet(depo, { doktorId: DR_A, rol: 'doktor', onayId: 'yok', sonuc: 'yardimci' })
    assert.ok(!yok.ok && yok.durum === 404)
    const sek = await devirKaydet(depo, { doktorId: DR_A, rol: 'sekreter', onayId, sonuc: 'yardimci' })
    assert.ok(!sek.ok && sek.durum === 403)
    assert.equal(gunluk.length, n)
  })
  it('only the three known outcomes parse', () => {
    assert.equal(devirSonucuCoz('yardimci'), 'yardimci')
    assert.equal(devirSonucuCoz('panoya'), 'panoya')
    assert.equal(devirSonucuCoz('basarisiz'), 'basarisiz')
    assert.equal(devirSonucuCoz('gonderildi'), null)
    assert.equal(devirSonucuCoz(undefined), null)
  })
})

describe('migration 167', () => {
  const sql = readFileSync(new URL('../../db/migrations/167_mbys_bildirim_gunlugu.sql', import.meta.url), 'utf8')
  it('is append-only, RLS-protected, patient-isolated and holds no clinical text', () => {
    assert.match(sql, /before update or delete on public\.mbys_bildirim_gunlugu/i)
    assert.match(sql, /enable row level security/i)
    assert.match(sql, /hasta_izolasyon_hasta_sahipligi/)
    const tablo = sql.match(/create table[^;]*?\(([\s\S]*?)\n\);/i)?.[1] ?? ''
    const kolonlar = tablo.split('\n').map((l) => l.trim().split(/\s+/)[0]).filter(Boolean)
    assert.ok(kolonlar.length > 5)
    for (const k of kolonlar) assert.ok(!/encrypted|name|ad$|tani|icd|content|tc/i.test(k), `column ${k} must not hold personal or clinical data`)
  })
})
