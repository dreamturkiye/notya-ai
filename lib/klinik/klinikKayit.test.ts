import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { klinikKohortDerle, rizaEksikMi, seansEkle, vadeYaz, klinikKayitCoz } from './klinikKayit'

describe('KLINIK-90 — seans / rıza / kohort kaydı', () => {
  it('boş defter rıza eksik sayılır', () => {
    assert.equal(rizaEksikMi(undefined, 'fizyoterapi'), true)
  })

  it('seans ekler; müttefikte hekim planı yoksa rıza eksik', () => {
    const d = seansEkle({}, {
      patientId: 'p1',
      dal: 'fizyoterapi',
      seans: { iso: '2026-09-22', metin: 'ICF yürüme', rizaIkiNusha: true, veliOnam: null, fotoKvkk: false, hekimPlani: false, kriz112: false },
    })
    assert.equal(rizaEksikMi(d.p1, 'fizyoterapi'), true)
    const d2 = seansEkle({}, {
      patientId: 'p1',
      dal: 'fizyoterapi',
      seans: { iso: '2026-09-22', metin: 'ICF yürüme', rizaIkiNusha: true, veliOnam: null, fotoKvkk: false, hekimPlani: true, kriz112: false },
    })
    assert.equal(rizaEksikMi(d2.p1, 'fizyoterapi'), false)
  })

  it('kohort: 112 > rıza > geciken vade > bugün randevu', () => {
    let defter = seansEkle({}, {
      patientId: 'a',
      dal: 'sac-ekimi',
      seans: { iso: '2026-09-01', metin: 'ekim', rizaIkiNusha: true, veliOnam: null, fotoKvkk: true, hekimPlani: false, kriz112: true },
    })
    defter = vadeYaz(defter, { patientId: 'b', dal: 'sac-ekimi', vade: '2026-09-10', etiket: 'Yıkama 10' })
    defter = seansEkle(defter, {
      patientId: 'b',
      dal: 'sac-ekimi',
      seans: { iso: '2026-09-01', metin: 'ekim', rizaIkiNusha: true, veliOnam: null, fotoKvkk: true, hekimPlani: false, kriz112: false },
    })
    const satir = klinikKohortDerle({
      dal: 'sac-ekimi',
      bugun: '2026-09-22',
      hastalar: [
        { id: 'a', name: 'Ada' },
        { id: 'b', name: 'Bora' },
        { id: 'c', name: 'Cem' },
      ],
      randevular: [{ patientId: 'c', hastaAdi: 'Cem', baslangic: '2026-09-22T10:00:00Z' }],
      defter,
    })
    assert.equal(satir[0].durum, '112')
    assert.ok(satir.some((s) => s.patientId === 'b' && s.durum === 'gecikti'))
    assert.ok(satir.some((s) => s.ad === 'Cem' && s.durum === 'bugun'))
  })

  it('bozuk JSON boş defter', () => {
    assert.deepEqual(klinikKayitCoz('nope'), {})
  })
})
