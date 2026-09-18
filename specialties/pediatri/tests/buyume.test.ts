import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { degerlendir, cizgiGecisi, persentilKaymalari, buyumeHizlari, olcumSatirlari, vkiSinifi, egriler, zMetni, type OlcumSatiri } from '../engines/buyume'
import { persentilHesapla } from '@/lib/clinical/buyumeEgrisi'
import { WHO_LMS } from '@/lib/clinical/whoBuyumeLms'

const satir = (tarih: string, ay: number, p: Partial<Record<'kilo' | 'boy' | 'basCevresi', [number, number]>>): OlcumSatiri => ({
  tarih, ay,
  deger: Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v![0]])),
  sonuc: Object.fromEntries(Object.entries(p).map(([k, v]) => [k, { persentil: v![1], z: 0 }])),
})

describe('büyüme stüdyosu motoru', () => {
  it('WHO: medyan değer z≈0, 50. persentil; kapsam dışı null', () => {
    const [ay, , M] = WHO_LMS.boy.male[12]
    const r = degerlendir('who', 'boy', 'male', ay, M)!
    assert.ok(Math.abs(r.z) < 1e-9 && Math.abs(r.persentil - 50) < 0.01)
    assert.equal(degerlendir('who', 'basCevresi', 'female', 61, 50), null)
    assert.equal(degerlendir('who', 'kilo', 'female', 121, 30), null)
    assert.ok(degerlendir('who', 'boy', 'female', 200, 160))
  })
  it('Neyzi: stüdyo mevcut motorla aynı sonucu verir (kopya yok)', () => {
    const a = degerlendir('neyzi', 'kilo', 'female', 30, 13)!
    const b = persentilHesapla('kilo', 'female', 30, 13)!
    assert.equal(a.persentil, b.persentil); assert.equal(a.z, b.zSkor)
    assert.equal(degerlendir('neyzi', 'boy', 'male', 217, 170), null)
  })
  it('majör çizgi geçişi: 3/10/25/50/75/90/97', () => {
    assert.equal(cizgiGecisi(60, 20), -2)
    assert.equal(cizgiGecisi(20, 60), 2)
    assert.equal(cizgiGecisi(55, 70), 0)
    assert.equal(cizgiGecisi(95, 5), -5)
  })
  it('persentil kayması: son ölçüm önceki herhangi birine göre ≥ 2 çizgi', () => {
    const k = persentilKaymalari([
      satir('2025-01-01', 12, { kilo: [10, 60] }),
      satir('2025-07-01', 18, { kilo: [11, 40] }),
      satir('2026-01-01', 24, { kilo: [11.5, 20] }),
    ])
    assert.equal(k.length, 1)
    assert.equal(k[0].cizgi, -2); assert.equal(k[0].oncekiTarih, '2025-01-01')
    assert.deepEqual(persentilKaymalari([satir('2025-01-01', 12, { boy: [75, 50] }), satir('2026-01-01', 24, { boy: [86, 30] })]), [])
  })
  it('büyüme hızı: ≥ 6 ay önceki ölçümle cm/yıl, kısa aralık işaretlenir', () => {
    const h = buyumeHizlari([satir('2025-01-01', 12, { boy: [75, 50] }), satir('2025-04-01', 15, { boy: [78, 50] }), satir('2025-07-01', 18, { boy: [81, 50] })])
    const boy = h.find((x) => x.param === 'boy')!
    assert.equal(boy.oncekiTarih, '2025-01-01'); assert.equal(boy.yillik, 12); assert.equal(boy.kisaAralik, false)
    const kisa = buyumeHizlari([satir('2025-01-01', 12, { boy: [75, 50] }), satir('2025-04-01', 15, { boy: [78, 50] })]).find((x) => x.param === 'boy')!
    assert.equal(kisa.kisaAralik, true); assert.equal(kisa.yillik, 12)
  })
  it('ölçüm satırları: VKİ kilo+boydan, doğum öncesi tarih atılır', () => {
    const s = olcumSatirlari('neyzi', 'male', '2022-01-10', [{ tarih: '2025-01-10', kilo: 15, boy: 95 }, { tarih: '2021-01-01', kilo: 3 }])
    assert.equal(s.length, 1)
    assert.equal(s[0].deger.vki, 16.62)
    assert.ok(s[0].sonuc.kilo && s[0].sonuc.boy && s[0].sonuc.vki)
  })
  it('VKİ sınıfı yalnız Neyzi ve ≥ 24 ay; WHO eğrileri kapsamda kalır', () => {
    assert.equal(vkiSinifi('who', 60, 97), null)
    assert.equal(vkiSinifi('neyzi', 12, 97), null)
    assert.equal(vkiSinifi('neyzi', 36, 97), 'Obez')
    const e = egriler('who', 'basCevresi', 'male', 120)
    assert.ok(e.every((s) => s.noktalar.every((n) => n.ay <= 60)))
    assert.equal(zMetni(-1.234), '−1,23')
  })
})
