import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { donorGirdi } from '../engines/girdi'
import { dokulmePenceresi, sonucIzlemi } from '../engines/izlem'
import { fotoSaklama } from '../engines/kayit'
import { ozelAracCalistir, portalSatirlari } from '@/lib/klinik/ozelAracCalistir'
import { foto72Kaydi, uygulamaOdasi, UYGULAMA_ODASI_M2 } from '../engines/sac'

describe('sac motor', () => {
  it('donör kapısı, dökülme penceresi ve saklama', () => {
    assert.equal('hata' in donorGirdi(0, 40), true)
    assert.equal('hata' in donorGirdi(20, 40), false)
    const d = dokulmePenceresi('2026-10-01')
    assert.ok(Array.isArray(d) && d.length === 2)
    assert.equal(d[0].ad.includes('greft'), false)
    const sonuc = sonucIzlemi('2026-10-01')
    assert.ok(Array.isArray(sonuc) && sonuc.map((x) => x.gun).join(',') === '180,365')
    assert.equal(Array.isArray(sonuc) && sonuc.some((x) => /greft/i.test(x.ad)), false)
    const saklama = fotoSaklama(true, '2026-10-01', '12')
    assert.equal('bitis' in saklama && Boolean(saklama.bitis && /^\d{4}-\d{2}-\d{2}$/.test(saklama.bitis)), true)
    assert.equal('hata' in fotoSaklama(true, '2026-10-01', '5'), true)
    assert.equal('hata' in fotoSaklama(false, '2026-10-01', ''), true)
  })

  it('40176 kayıt görevi dosyaya yazılır; portal 72 saat taşımaz', () => {
    assert.equal(UYGULAMA_ODASI_M2, 16)
    assert.equal('hata' in uygulamaOdasi(15), true)
    const oda = uygulamaOdasi(16)
    assert.equal('ozet' in oda && oda.dogrulandi, true)
    assert.equal('hata' in foto72Kaydi('pediatri'), true)
    const foto = foto72Kaydi('2026-10-01')
    assert.equal('bitis' in foto && foto.bitis, '2026-10-04')
    assert.match('ozet' in foto ? foto.ozet : '', /72 saat/)
    assert.match('ozet' in foto ? foto.ozet : '', /dosyaya yazılır/)
    assert.equal('ozet' in foto && foto.dogrulandi, true)
    const cal = ozelAracCalistir('/ozel-branslar/sac-foto', { ameliyat: '2026-10-01', riza: '1', ay: '12' }, '2026-10-19')
    assert.equal('ozet' in cal, true)
    if ('ozet' in cal) {
      assert.match(cal.ozet, /72 saat/)
      assert.match(cal.ozet, /dosyaya yazılır/)
      assert.doesNotMatch(cal.ozet, /saklanmaz/)
      const portal = portalSatirlari(cal.vadeler, '2026-10-19').map((s) => s.ad).join(' ')
      assert.doesNotMatch(portal, /kök|greft|72/)
    }
  })
})
