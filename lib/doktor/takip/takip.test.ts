import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { kontrolVadesiBul, portalKontrolEtiketi, kosulluMu } from './vade'
import { takipSirala, takipBaslik } from './oku'
import { takipHatirlatmaAdaylari, takipHatirlatmaAnahtar } from './hatirlatma'
import type { TakipIsi } from './tipler'

const base = (p: Partial<TakipIsi> & Pick<TakipIsi, 'id' | 'tur'>): TakipIsi => ({
  doktorId: 'd1',
  patientId: 'p1',
  durum: 'acik',
  vade: null,
  kosullu: false,
  kaynakNotId: null,
  kaynakRandevuId: null,
  kaynakSevkId: null,
  ozet: '',
  alinti: null,
  kapandiAt: null,
  kapandiNeden: null,
  createdAt: '2026-10-01T10:00:00Z',
  ...p,
})

describe('NOTYA-TAKIP-01 — vade parser', () => {
  it('2 hafta sonra kontrol → +14 gün', () => {
    const k = kontrolVadesiBul('Parasetamol devam. 2 hafta sonra kontrol.', '2026-10-05')
    assert.equal(k?.vade, '2026-10-19')
    assert.equal(k?.kosullu, false)
  })

  it('1-2 gün içinde tekrar görmek → üst sınır (2 gün)', () => {
    const k = kontrolVadesiBul('Laboratuvar sonuçları geldikten sonra 1-2 gün içinde sizi tekrar görmek istiyorum.', '2026-10-04')
    assert.equal(k?.vade, '2026-10-06')
    assert.equal(k?.kosullu, false)
  })

  it('48-72 saat içinde düzelmezse kontrol → koşullu + 3 gün', () => {
    const k = kontrolVadesiBul('48-72 saat içinde düzelmezse kontrole gelsin.', '2026-10-04')
    assert.equal(k?.vade, '2026-10-07')
    assert.equal(k?.kosullu, true)
  })

  it('bir ay sonra kontrol (yazı sayısı)', () => {
    assert.equal(kontrolVadesiBul('Bir ay sonra kontrole gelsin', '2026-10-05')?.vade, '2026-11-04')
  })

  it('lab-only plan kontrol doğurmaz', () => {
    assert.equal(kontrolVadesiBul('2 hafta sonra hemogram istendi', '2026-10-05'), null)
  })

  it('koşullu algılama', () => {
    assert.equal(kosulluMu('ateş devam ederse kontrole gelsin'), true)
    assert.equal(kosulluMu('2 hafta sonra kontrol'), false)
  })

  it('portal etiketi hasta-güvenli', () => {
    assert.equal(portalKontrolEtiketi('2026-10-04', '2026-10-04'), 'Bugün · kontrol')
    assert.equal(portalKontrolEtiketi('2026-10-05', '2026-10-04'), 'Yarın · kontrol')
    assert.match(portalKontrolEtiketi('2026-10-15', '2026-10-04'), /kontrol/)
  })
})

describe('NOTYA-TAKIP-01 — sıra ve başlık', () => {
  it('gelmedi ve geciken kontrol üstte', () => {
    const liste = takipSirala([
      base({ id: 'a', tur: 'kontrol', vade: '2026-10-20' }),
      base({ id: 'b', tur: 'kontrol', vade: '2026-10-01' }),
      base({ id: 'c', tur: 'gelmedi', vade: '2026-10-04' }),
    ], '2026-10-04')
    assert.deepEqual(liste.map((x) => x.id), ['c', 'b', 'a'])
  })

  it('başlıklar ops dilinde', () => {
    assert.equal(takipBaslik(base({ id: '1', tur: 'gelmedi' }), '2026-10-04'), 'gelmedi — aranacak')
    assert.match(takipBaslik(base({ id: '2', tur: 'kontrol', vade: '2026-10-01' }), '2026-10-04'), /doldu/)
    assert.match(takipBaslik(base({ id: '3', tur: 'kontrol', vade: '2026-10-04', kosullu: true }), '2026-10-04'), /koşullu/)
  })
})

describe('NOTYA-TAKIP-01 — hatırlatma adayları', () => {
  it('yalnız vadesi penceresinde olan koşulsuz kontrol', () => {
    const aday = takipHatirlatmaAdaylari([
      { id: 't1', doktorId: 'd', patientId: 'p', tur: 'kontrol', vade: '2026-10-04', kosullu: false },
      { id: 't2', doktorId: 'd', patientId: 'p', tur: 'kontrol', vade: '2026-10-04', kosullu: true },
      { id: 't3', doktorId: 'd', patientId: 'p', tur: 'gelmedi', vade: '2026-10-04', kosullu: false },
      { id: 't4', doktorId: 'd', patientId: 'p', tur: 'kontrol', vade: '2026-11-01', kosullu: false },
    ], '2026-10-04')
    assert.equal(aday.length, 1)
    assert.equal(aday[0].tur, 'kontrol_hatirlatma')
    assert.equal(aday[0].tekil_anahtar, takipHatirlatmaAnahtar('t1', '2026-10-04'))
  })
})
