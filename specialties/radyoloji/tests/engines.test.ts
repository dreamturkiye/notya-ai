/**
 * RADYOLOJI-EXCEPTIONAL-01 — Kuyruk / rapor / kritik / acil / kohort motor birim testleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { kuyrukSkorla } from '../engines/kuyruk'
import { raporSkorla } from '../engines/rapor'
import { kritikSkorla } from '../engines/kritik'
import { acilTara, hekimOnayiGerekliMi } from '../engines/acil'
import { radyoKohortSatirlari } from '../engines/kohort'
import { uydurmaBulguIceriyorMu } from '../engines/radyoloji'

describe('radyoloji kuyruk', () => {
  it('öncelik karar desteği; AI tanı reddi', () => {
    assert.ok(uydurmaBulguIceriyorMu('AI tanı kilitlendi'))
    const s = kuyrukSkorla({ modalite: 'bt', oncelik: 'acil', durum: 'bekliyor', tarih: '2026-09-20' })
    assert.ok(s.tamamMi)
    assert.match(s.ozet, /karar desteği|hekim|PACS/i)
  })
  it('eksik modalite', () => {
    assert.equal(kuyrukSkorla({}).tamamMi, false)
  })
})

describe('radyoloji rapor BI-RADS', () => {
  it('hekim kategori seçimi; otomatik tanı değil', () => {
    const s = raporSkorla('4', ['endikasyon', 'sonuc_ozet', 'klinisyen_bildirim'])
    assert.ok(s.tamamMi)
    assert.match(s.ozet, /hekim|otomatik tanı değil/i)
  })
  it('AI dil reddi', () => {
    assert.equal(raporSkorla('2', ['endikasyon'], 'otomatik tanı').tamamMi, false)
  })
})

describe('radyoloji kritik', () => {
  it('bayrak + bildirim; onay checklist', () => {
    const s = kritikSkorla(['pnomotoraks'], ['klinisyen_arandi', 'hekim_imza'])
    assert.ok(s.tamamMi)
  })
})

describe('radyoloji acil', () => {
  it('kontrast reaksiyon → hemen + hekim onayı', () => {
    const b = acilTara(['kontrast reaksiyon anafilaksi'])
    assert.ok(b.some((x) => x.kod === 'kontrast_reaksiyon'))
    assert.ok(hekimOnayiGerekliMi(b))
  })
})

describe('radyoloji kohort', () => {
  it('bayrak üretir', () => {
    const s = radyoKohortSatirlari([{
      patientId: '1', ad: 'A', acikKritikBayraklari: [],
      sonrakiKontrol: '2026-01-01',
      gorevler: [{ kod: 'kuyruk_bt', due: '2026-01-01' }],
      sonVizit: null, portalVar: true, belgeBekliyor: false, kuyrukAktif: true,
    }], '2026-09-19')
    assert.ok(s[0].bayraklar.includes('kuyruk_bekliyor') || s[0].bayraklar.includes('gecikmis_kontrol'))
  })
})
