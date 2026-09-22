import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { satirBasiNumarala, soapNumaraliAlanlariDuzenle } from './satirBasiNumarala'

describe('satirBasiNumarala — tanı/tedavi satır başı (gerileme kilidi)', () => {
  it('1. 3 günlük (rakamla başlayan) ve 2. Fizyolojik ayrı satır olur', () => {
    const ham = '1. 3 günlük sağlam yenidoğan — rutin kontrol 2. Fizyolojik kilo kaybından toparlanma 3. Göbek kordonu düşmemiş — enfeksiyon bulgusu yok 4. Yenidoğan sarılığı — gerileme sürecinde'
    const c = satirBasiNumarala(ham)
    const satirlar = c.split('\n').map((s) => s.trim()).filter(Boolean)
    assert.equal(satirlar.length, 4)
    assert.match(satirlar[0], /^1\.\s+3 günlük/)
    assert.match(satirlar[1], /^2\.\s+Fizyolojik/)
    assert.match(satirlar[2], /^3\.\s+Göbek/)
    assert.match(satirlar[3], /^4\.\s+Yenidoğan/)
  })

  it('TEDAVİ alt maddeleri a) b) satır başına iner; ikinci geçiş aynı kalır', () => {
    const ham = '1. TEDAVİ: a) D vitamini — günlük 1000 IU b) Gaz için ilaç önerilmedi 2. TAKİP / İZLEM: a) Kilo gidişi izlenecek 3. KONTROL: planlanan sağlam çocuk takibi'
    const c = satirBasiNumarala(ham)
    assert.match(c, /^1\.\s*TEDAVİ/m)
    assert.match(c, /\na\) D vitamini/)
    assert.match(c, /\nb\) Gaz/)
    assert.match(c, /\n2\.\s*TAKİP/)
    assert.match(c, /\n3\.\s*KONTROL/)
    assert.equal(satirBasiNumarala(c), c)
  })

  it('ICD, ondalık kilo ve Neyzi persentiline dokunmaz', () => {
    assert.equal(satirBasiNumarala('Z00.110 — 8 günden küçük, tanısal değil.'), 'Z00.110 — 8 günden küçük, tanısal değil.')
    assert.equal(satirBasiNumarala('P59.9 yenidoğan sarılığı.'), 'P59.9 yenidoğan sarılığı.')
    assert.equal(satirBasiNumarala('kilo 3.18, boy 50.5'), 'kilo 3.18, boy 50.5')
    assert.equal(satirBasiNumarala('kilo 25. persentil · boy 50. persentil'), 'kilo 25. persentil · boy 50. persentil')
  })

  it('zaten satır başındaki numarayı çiftlemez', () => {
    const hazir = '1. A\n2. B\n3. C'
    assert.equal(satirBasiNumarala(hazir), hazir)
  })

  it('SOAP vitallerine ve aiDegerlendirme\'ye dokunmaz', () => {
    const veri = soapNumaraliAlanlariDuzenle({
      soap: { degerlendirme: '1. 3 günlük izlem 2. Sarılık', plan: '1. TEDAVİ: a) D vitamini b) izlem', subjektif: '', objektif: '' },
      tani: '1. Sağlam 2. Sarılık',
      tedavi: '1) D vit 2) kontrol',
      aiDegerlendirme: 'Büyüme (Neyzi): kilo 25. persentil',
      vitaller: { kilo: '3.18', boy: '50.5' },
    } as { soap: { degerlendirme: string; plan: string; subjektif: string; objektif: string }; tani: string; tedavi: string; aiDegerlendirme: string; vitaller: { kilo: string; boy: string } })
    assert.match(veri.soap.degerlendirme, /\n2\.\s+Sarılık/)
    assert.match(veri.soap.plan, /\na\) D vitamini/)
    assert.match(veri.tani, /\n2\.\s+Sarılık/)
    assert.equal(veri.aiDegerlendirme, 'Büyüme (Neyzi): kilo 25. persentil')
    assert.equal(veri.vitaller.kilo, '3.18')
  })
})
