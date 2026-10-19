import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { vadeKohort } from '../engines/kohort'
import { portalSatirlari, OZEL_ARACLAR } from '@/lib/klinik/ozelAracCalistir'
import {
  FOTO_ROLLERI,
  cekimPenceresi,
  fotoDosyaDurumu,
  fotoNotCoz,
  fotoNotu,
  fotoRolMu,
} from '../engines/fotoDosya'

const YASAK = /donör|alıcı|kök|greft|72|m²/i

describe('saç foto dosyası', () => {
  it('dört rol; yabancı rol yok; not round-trip', () => {
    assert.deepEqual(FOTO_ROLLERI.map((r) => r.id), ['donor-once', 'alici-once', 'donor-72', 'alici-72'])
    assert.equal(fotoRolMu('donor-once'), true)
    assert.equal(fotoRolMu('pediatri'), false)
    const not = fotoNotu('alici-72', '2026-10-01', '2026-10-04')
    assert.deepEqual(fotoNotCoz(not), { rol: 'alici-72', islem: '2026-10-01', cekim: '2026-10-04' })
    assert.equal(fotoNotCoz('sac-foto|yaban|2026-10-01|2026-10-04'), null)
    assert.equal(fotoNotCoz('baska|donor-once|2026-10-01|2026-10-01'), null)
  })

  it('öncesi işlemden sonra olamaz; 72 saat üçüncü günde kabul, dördüncü günde ret', () => {
    assert.equal(cekimPenceresi('donor-once', '2026-10-01', '2026-10-01'), true)
    assert.equal(cekimPenceresi('donor-once', '2026-10-01', '2026-09-30'), true)
    assert.equal(typeof cekimPenceresi('alici-once', '2026-10-01', '2026-10-02'), 'string')
    assert.equal(cekimPenceresi('donor-72', '2026-10-01', '2026-10-04'), true)
    assert.equal(cekimPenceresi('alici-72', '2026-10-01', '2026-10-01'), true)
    assert.match(String(cekimPenceresi('alici-72', '2026-10-01', '2026-10-05')), /72 saat/)
    assert.match(String(cekimPenceresi('donor-72', '2026-10-01', '2026-09-30')), /72 saat/)
  })

  it('eksik 72 saat slotu hatırlatır; tamamlanınca hatırlatma kapanır', () => {
    const bos = fotoDosyaDurumu('2026-10-01', [])
    assert.ok(!('hata' in bos))
    if ('hata' in bos) return
    assert.equal(bos.bitis, '2026-10-04')
    assert.equal(bos.hatirlatma?.iso, '2026-10-04')
    assert.equal(bos.hatirlatma?.ad, 'Fotoğraf kaydı')
    assert.equal(bos.slotlar.filter((s) => !s.varMi).length, 4)
    assert.match(bos.ozet, /Ek-4/)
    assert.doesNotMatch(bos.hatirlatma?.ad || '', YASAK)

    const tam = fotoDosyaDurumu('2026-10-01', FOTO_ROLLERI.map((r) => ({
      rol: r.id,
      islem: '2026-10-01',
      cekim: r.pencere === 'once' ? '2026-10-01' : '2026-10-03',
      id: `belge-${r.id}`,
    })))
    assert.ok(!('hata' in tam))
    if ('hata' in tam) return
    assert.equal(tam.hatirlatma, null)
    assert.ok(tam.slotlar.every((s) => s.varMi && s.belgeId.startsWith('belge-')))
    assert.equal(tam.slotlar.find((s) => s.id === 'donor-once')?.belgeId, 'belge-donor-once')

    const portal = portalSatirlari(bos.hatirlatma ? [bos.hatirlatma] : [], '2026-10-02')
    assert.equal(portal.length, 1)
    assert.doesNotMatch(portal[0].ad, YASAK)
    assert.match(portal[0].ad, /Fotoğraf kaydı · 2026-10-04/)
    const kohort = vadeKohort(bos.hatirlatma ? [bos.hatirlatma] : [], '2026-10-02')
    assert.equal(kohort.length, 1)
    assert.match(kohort[0].ozet, /Saç izlemi · Fotoğraf kaydı/)
    assert.doesNotMatch(kohort[0].ozet, /donör|alıcı|kök|greft/i)
  })

  it('rota sahibi doğrular, kasaya yazar, pediatriye 72 saat vermez', () => {
    const rota = fs.readFileSync(path.join(process.cwd(), 'app/api/ozel-brans/foto/route.ts'), 'utf8')
    assert.match(rota, /hastaSahibiMi/)
    assert.match(rota, /klinikSlugCoz/)
    assert.match(rota, /status: 404/)
    assert.doesNotMatch(rota, /status: 403/)
    assert.match(rota, /uploadDocument/)
    assert.match(rota, /SAC_FOTO_KATEGORI/)
    assert.match(rota, /portalSatirlari/)
    assert.match(rota, /riza: dosyalar\.length > 0/)
    assert.equal(OZEL_ARACLAR.length, 40)
    const kart = OZEL_ARACLAR.find((a) => a.route === '/ozel-branslar/sac-foto')
    assert.ok(kart)
    assert.match(kart!.aciklama, /dosyaya yazılır/)
    assert.doesNotMatch(kart!.aciklama, /saklanmaz/)
    const sayfa = fs.readFileSync(path.join(process.cwd(), 'app/dashboard/notya-klinik/hastalar/[id]/page.tsx'), 'utf8')
    assert.match(sayfa, /slug === 'sac-ekimi'/)
    assert.match(sayfa, /SacFotoDosya/)
  })
})
