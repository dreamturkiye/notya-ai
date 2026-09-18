import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { DAHILIYE_PROFILE } from '@/lib/specialties/dahiliye'
import { portalModulAktif } from '@/lib/portal/moduller'
import {
  gorevBasligi, hatirlatmaDurumu, takibimHatirlatmalari, hedefOzetleri, hastaDiliTemizMi, sonrakiKontrol,
} from '@/specialties/dahiliye/engines/portal-takibim'

const kok = path.join(import.meta.dirname, '../..')
const oku = (p: string) => fs.readFileSync(path.join(kok, p), 'utf8')
const BUGUN = '2026-09-18'

describe('DAH-EXCEPTIONAL-01 Takibim portal', () => {
  it('dahiliye profile declares Takibim Strong with /takibim + /on-anket', () => {
    const m = DAHILIYE_PROFILE.portal![0]
    assert.equal(m.derinlik, 'Strong')
    assert.equal(DAHILIYE_PROFILE.olgunluk, 'beta-hazir')
    assert.deepEqual(m.nav.map((n) => n.path), ['/takibim', '/on-anket'])
  })

  it('page gates on dahiliye module', () => {
    const page = oku('app/portal/hasta/[token]/takibim/page.tsx')
    assert.match(page, /portalModulAktif\(data, 'dahiliye'\)/)
    assert.match(page, /TakibimView/)
  })

  it('bundle route builds kronik only when modulAktif dahiliye', () => {
    const rota = oku('app/api/portal/hasta/[token]/route.ts')
    assert.match(rota, /modulAktif\('dahiliye'\)/)
    assert.match(rota, /takibimHatirlatmalari\(/)
    assert.match(rota, /bundle\.kronik\s*=/)
    assert.ok(!/gorevleri'\)\.select\('ad/.test(rota.slice(rota.indexOf("modulAktif('dahiliye')"), rota.indexOf("[portal] takibim"))))
  })

  it('foreign module token does not activate dahiliye', () => {
    assert.equal(portalModulAktif({ portal: { moduller: ['gozlerim'] } }, 'dahiliye'), false)
  })

  it('gorevBasligi never leaks clinical jargon', () => {
    assert.equal(gorevBasligi('hba1c_9'), 'Şeker kontrol kan testi')
    assert.equal(gorevBasligi('bilinmeyen_xyz'), 'Kontrol randevusu')
    assert.ok(hastaDiliTemizMi(gorevBasligi('hba1c_9')))
  })

  it('hatirlatmaDurumu windows', () => {
    assert.equal(hatirlatmaDurumu('2026-09-10', BUGUN), 'gecikti')
    assert.equal(hatirlatmaDurumu('2026-09-20', BUGUN), 'yaklasiyor')
    assert.equal(hatirlatmaDurumu('2026-10-20', BUGUN), 'planli')
  })

  it('takibimHatirlatmalari sorts and dedupes', () => {
    const liste = takibimHatirlatmalari({
      bugun: BUGUN,
      gorevler: [
        { kod: 'hba1c', due: '2026-09-20' },
        { kod: 'kb_izlem', due: '2026-09-12' },
      ],
      hedefler: [],
      evKbOzet: null,
      evGlukozOzet: null,
      sonrakiKontrolIso: null,
    })
    assert.ok(liste.length >= 2)
    assert.equal(liste[0].durum, 'gecikti')
    const sk = sonrakiKontrol(liste)
    assert.ok(sk?.tarih)
  })

  it('hedefOzetleri strips diagnosis tokens', () => {
    const h = hedefOzetleri([{ kod: 'kb', metin: 'Hipertansiyon hedefi I10 <130/80' }])
    assert.equal(h[0].ad, 'Kan basıncı hedefi')
    assert.ok(hastaDiliTemizMi(h[0].ozet))
    assert.doesNotMatch(h[0].ozet, /I10|Hipertansiyon/i)
  })
})
