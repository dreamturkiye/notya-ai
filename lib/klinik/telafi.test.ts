import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { yikamaTakvimi } from '@/specialties/sac-ekimi/engines/sac'
import { ozelAracCalistir } from '@/lib/klinik/ozelAracCalistir'
import { durumSozcugu, telafiIzlem } from '@/lib/klinik/telafi'

describe('izlem telafisi', () => {
  it('geçen adımı silmez; sıradaki yedi gün içindeki ilk gündür', () => {
    const t = telafiIzlem('2026-10-06', [
      { iso: '2026-10-02', ad: 'İlk pansuman' },
      { iso: '2026-10-04', ad: 'Nazik yıkama' },
      { iso: '2026-10-11', ad: 'Kabuk dökülme kontrolü' },
      { iso: '2026-10-15', ad: 'Kontrol muayenesi' },
    ])
    assert.equal('hata' in t, false)
    if ('hata' in t) return
    assert.equal(t.dogrulandi, false)
    assert.equal(t.adimlar[0].durum, 'gecikti')
    assert.equal(t.siradaki?.ad, 'Kabuk dökülme kontrolü')
    assert.equal(t.siradaki?.durum, 'yaklasiyor')
    assert.match(t.cumle, /yaklaşıyor/)
    assert.match(t.cumle, /öneri — hekim kilitler/)
    assert.doesNotMatch(t.cumle, /greft|kcal|ünite|Neyzi/i)
  })

  it('hepsi geçtiyse hekim yeni plan kilitler', () => {
    const t = telafiIzlem('2026-10-19', [{ iso: '2020-01-01', ad: 'Kontrol' }])
    assert.equal('hata' in t, false)
    if ('hata' in t) return
    assert.equal(t.siradaki, null)
    assert.match(t.cumle, /Tüm kontrol günleri geçti/)
  })

  it('yıkama motoru yedi günü yaklaşıyor sayar', () => {
    const t = yikamaTakvimi('2026-10-01', '2026-10-06')
    assert.equal(t.find((x) => x.gun === 1)?.durum, 'gecikti')
    assert.equal(t.find((x) => x.gun === 10)?.durum, 'yaklasiyor')
  })

  it('on dalın tarih aracı sıradaki cümlesini üretir; portal satırı greft taşımaz', () => {
    const sac = ozelAracCalistir('/ozel-branslar/sac-takvim', { ameliyat: '2026-10-01' }, '2026-10-06')
    assert.equal('hata' in sac, false)
    if ('hata' in sac) return
    assert.match(sac.ozet, /Sıradaki: Kabuk dökülme kontrolü · 2026-10-11 · yaklaşıyor/)
    assert.match(sac.ozet, /öneri — hekim kilitler/)
    const yaban = ozelAracCalistir('/ozel-branslar/sac-takvim', { ameliyat: '2026-10-01' }, 'pediatri')
    assert.equal('hata' in yaban, true)
  })

  it('Sağlığım görünümü durum sözcüğünü çizer', () => {
    const kaynak = fs.readFileSync(path.join(process.cwd(), 'app/portal/_components/KlinikHatirlatmaView.tsx'), 'utf8')
    assert.match(kaynak, /durumSozcugu/)
    assert.match(kaynak, /data-durum/)
    assert.equal(durumSozcugu('yaklasiyor'), 'yaklaşıyor')
    assert.equal(durumSozcugu('planli'), 'planlı')
    assert.equal(durumSozcugu('tanı'), '')
  })
})
