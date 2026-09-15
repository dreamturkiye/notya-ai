import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  aktifGebelikDurumu,
  ayniGebelikBolumu,
  gebelikTarihAnahtari,
  oncekiGebelikDurumMetni,
  oncekiGebelikleriFiltrele,
} from './gebelikDurum'

describe('gebelikDurum', () => {
  it('treats both aktif and gebe as an ongoing episode', () => {
    assert.equal(aktifGebelikDurumu('aktif'), true)
    assert.equal(aktifGebelikDurumu('gebe'), true)
    assert.equal(aktifGebelikDurumu('ACTIVE'), true)
    assert.equal(aktifGebelikDurumu('sonlandi'), false)
    assert.equal(aktifGebelikDurumu('tamamlandi'), false)
  })

  it('never labels an active pregnancy as Sonlandı', () => {
    assert.equal(oncekiGebelikDurumMetni('gebe'), 'Aktif gebelik')
    assert.equal(oncekiGebelikDurumMetni('aktif'), 'Aktif gebelik')
    assert.equal(oncekiGebelikDurumMetni('sonlandi'), 'Sonlandı')
    assert.equal(oncekiGebelikDurumMetni('sonlandı'), 'Sonlandı')
    assert.equal(oncekiGebelikDurumMetni('tamamlandi'), 'Doğum')
    assert.notEqual(oncekiGebelikDurumMetni('gebe'), 'Sonlandı')
  })

  it('keeps the current episode out of previous-pregnancy lists', () => {
    const rows = [
      { id: 'cur', durum: 'gebe', tdt: '2027-02-02' },
      { id: 'old', durum: 'sonlandi', tdt: '2024-01-01' },
      { id: 'birth', durum: 'tamamlandi', tdt: '2023-06-01' },
      { id: 'still-active', durum: 'aktif', tdt: '2026-12-01' },
    ]
    const prev = oncekiGebelikleriFiltrele(rows, 'cur')
    assert.deepEqual(prev.map((r) => r.id), ['old', 'birth'])
    assert.ok(prev.every((r) => oncekiGebelikDurumMetni(r.durum) !== 'Aktif gebelik'))
  })

  it('prod repro: same TDT as the live card must not appear as Sonlandı', () => {
    // Live card: Aktif gebelik · SAT 2026-04-28 / TDT 2027-02-02
    // Ghost row: same dates, auto-closed as sonlandi when Başlat ran twice.
    const live = {
      id: 'live-aktif',
      durum: 'aktif',
      sat: '2026-04-28',
      tdt: '2027-02-02',
    }
    const ghost = {
      id: 'ghost-sonlandi',
      durum: 'sonlandi',
      sat: '2026-04-28',
      tdt: '2027-02-02T00:00:00.000Z',
    }
    const realOnceki = {
      id: 'old-birth',
      durum: 'tamamlandi',
      sat: '2023-03-01',
      tdt: '2023-12-06',
      dogum_tarihi: '2023-12-01',
    }

    const fromFullList = oncekiGebelikleriFiltrele([live, ghost, realOnceki], live)
    assert.deepEqual(fromFullList.map((r) => r.id), ['old-birth'])

    // API already stripped the live row; client only sees gecmis + live card.
    const fromGecmisOnly = oncekiGebelikleriFiltrele([ghost, realOnceki], live)
    assert.deepEqual(fromGecmisOnly.map((r) => r.id), ['old-birth'])
    assert.equal(fromGecmisOnly.some((r) => oncekiGebelikDurumMetni(r.durum) === 'Sonlandı' && r.tdt?.startsWith('2027-02-02')), false)

    const onlyGhost = oncekiGebelikleriFiltrele([ghost], {
      id: live.id,
      sat: live.sat,
      tdt: live.tdt,
    })
    assert.deepEqual(onlyGhost, [])
  })

  it('treats matching SAT or TDT as the same live episode', () => {
    assert.equal(
      ayniGebelikBolumu({ sat: '2026-04-28', tdt: '2027-02-02' }, { sat: '2026-04-28T00:00:00Z', tdt: '2027-02-02' }),
      true,
    )
    assert.equal(
      ayniGebelikBolumu({ sat: '2026-04-28', tdt: '2027-02-02' }, { sat: '2024-01-01', tdt: '2024-10-08' }),
      false,
    )
    assert.equal(gebelikTarihAnahtari('2027-02-02T21:00:00.000Z'), '2027-02-02')
  })
})
