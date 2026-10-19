import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { defterSunucuIle, seansBasaEkle, seansKapisi, seansListesiCoz, seansPortalYuku, yasKucukMu } from './seansDefter'
import { ozelKohortBirlestir } from './ozelKohort'

const seans = {
  id: 'ks-1',
  iso: '2026-10-19',
  metin: 'Yıkama anlatıldı',
  rizaIkiNusha: true,
  veliOnam: null,
  fotoKvkk: false,
  hekimPlani: false,
  kriz112: false,
}

describe('Klinik seans defteri', () => {
  it('boş not, eksik rıza, küçük hasta ve müttefik kapıyı kapatır', () => {
    const taban = { metin: 'not', rizaIkiNusha: true, kucuk: false, veliOnam: false, muttefik: false, hekimPlani: false, fotoKvkk: false, kriz112: false, iso: '2026-10-19' }
    const bos = seansKapisi({ ...taban, metin: '  ' })
    const riza = seansKapisi({ ...taban, rizaIkiNusha: false })
    const veli = seansKapisi({ ...taban, kucuk: true, veliOnam: false })
    const plan = seansKapisi({ ...taban, muttefik: true, hekimPlani: false })
    assert.ok('hata' in bos)
    assert.ok('hata' in riza && /iki nüsha/.test(riza.hata))
    assert.ok('hata' in veli && /veli/.test(veli.hata))
    assert.ok('hata' in plan && /md\.16/.test(plan.hata))
    const acik = seansKapisi(taban)
    assert.ok('seans' in acik && acik.seans.metin === 'not' && acik.seans.veliOnam === null)
  })

  it('18 yaş altı doğum tarihi veli ister; boş tarih istemez', () => {
    assert.equal(yasKucukMu('2012-01-01', Date.parse('2026-10-19T00:00:00Z')), true)
    assert.equal(yasKucukMu('2000-01-01', Date.parse('2026-10-19T00:00:00Z')), false)
    assert.equal(yasKucukMu(''), false)
  })

  it('dolu sunucu cihaz listesini taşımaz; boş sunucu taşır; not portala çıkmaz', () => {
    const yeni = { ...seans, id: 'yeni' }
    const eski = { ...seans, id: 'eski', metin: 'cihaz' }
    assert.equal(seansBasaEkle([seans], yeni, [eski])[1].id, 'ks-1')
    assert.equal(seansBasaEkle([seans], yeni, [eski]).some((s) => s.id === 'eski'), false)
    assert.equal(seansBasaEkle([], yeni, [eski])[1].metin, 'cihaz')
    assert.deepEqual(seansPortalYuku(), { portal_satir: [], acil: null })
    const cozulen = seansListesiCoz({ seanslar: [seans, { iso: 'nope', metin: 'yok' }, { iso: '2026-10-01', metin: '  ' }] })
    assert.equal(cozulen.length, 1)
  })

  it('sunucu defteri kohortta cihaz notunun yerine geçer ve araç planına karışmaz', () => {
    const defter = defterSunucuIle(
      { p1: { patientId: 'p1', dal: 'sac-ekimi', seanslar: [{ ...seans, metin: 'cihaz', kriz112: true }] } },
      [{ patient_id: 'p1', slug: 'sac-ekimi', arac: 'seans-defter', girdi: { seanslar: [seans] } }],
      'sac-ekimi',
    )
    assert.equal(defter.p1.seanslar[0].metin, 'Yıkama anlatıldı')
    assert.equal(defter.p1.seanslar[0].kriz112, false)
    const kohort = ozelKohortBirlestir([], [{
      patient_id: 'p1', slug: 'sac-ekimi', arac: 'seans-defter', riza: false, acil: '112 notu',
      vadeler: [{ iso: '2026-10-01', ad: 'Kontrol' }],
    }], new Map([['p1', 'Ayşe']]), '2026-10-19')
    assert.equal(kohort.length, 0)
  })

  it('seans rotası sahipliği sorar ve notu portal kolonuna koymaz', () => {
    const kaynak = fs.readFileSync(path.join(process.cwd(), 'app/api/ozel-brans/seans/route.ts'), 'utf8')
    assert.match(kaynak, /hastaSahibiMi/)
    assert.match(kaynak, /klinikSlugCoz/)
    assert.match(kaynak, /seansPortalYuku/)
    assert.doesNotMatch(kaynak, /status: 403/)
    const portal = fs.readFileSync(path.join(process.cwd(), 'app/api/portal/hasta/[token]/route.ts'), 'utf8')
    assert.match(portal, /seans-defter/)
  })
})
