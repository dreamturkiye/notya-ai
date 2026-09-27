/**
 * NOTYA-NOT-HIZ-03 — not sayfası / İnceleme öneri yoklaması: yeni + boş notta başlar, öneri gelince ya da 90 sn sonra durur.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ONERI_YOKLAMA, oneriGeldiMi, oneriYoklamasiGerekli, oneriyiYokla } from './oneriBekle'

const saat = () => {
  let t = 1_000_000
  return { simdi: () => t, bekle: async (ms: number) => { t += ms }, gecen: (bas: number) => t - bas, get t() { return t } }
}

describe('oneriGeldiMi / oneriYoklamasiGerekli', () => {
  it('özet, evde dikkat, reçete önerisi ya da kritik bulgudan biri doluysa öneri gelmiştir; aiDegerlendirme sayılmaz', () => {
    assert.equal(oneriGeldiMi({ hastaOzeti: '', alarmBulgulari: [], receteOnerisi: [], kritikBulgular: [] }), false)
    assert.equal(oneriGeldiMi({ hastaOzeti: '  ' }), false)
    assert.equal(oneriGeldiMi({ hastaOzeti: 'Özet' }), true)
    assert.equal(oneriGeldiMi({ alarmBulgulari: ['x'] }), true)
    assert.equal(oneriGeldiMi({ receteOnerisi: [{}] }), true)
    assert.equal(oneriGeldiMi({ kritikBulgular: ['x'] }), true)
    assert.equal(oneriGeldiMi({ aiDegerlendirme: 'Çek listesi' } as never), false)
  })
  it('yalnız 3 dakikadan genç ve önerisi boş not yoklanır', () => {
    const simdi = Date.parse('2026-09-27T10:00:00Z')
    const bos = { hastaOzeti: '', alarmBulgulari: [], receteOnerisi: [] }
    assert.equal(oneriYoklamasiGerekli({ ...bos, createdAt: '2026-09-27T09:59:30Z' }, simdi), true)
    assert.equal(oneriYoklamasiGerekli({ ...bos, createdAt: '2026-09-27T09:56:00Z' }, simdi), false)
    assert.equal(oneriYoklamasiGerekli({ ...bos, hastaOzeti: 'Özet', createdAt: '2026-09-27T09:59:30Z' }, simdi), false)
    assert.equal(oneriYoklamasiGerekli({ ...bos, createdAt: null }, simdi), false)
    assert.equal(oneriYoklamasiGerekli(null, simdi), false)
  })
})

describe('oneriyiYokla', () => {
  it('her 4 sn getirir; öneri gelince durur ve onu döndürür', async () => {
    const s = saat()
    const bas = s.t
    let n = 0
    const sonuc = await oneriyiYokla({
      getir: async () => { n++; return n < 3 ? { hastaOzeti: '' } : { hastaOzeti: 'Özet' } },
      geldiMi: oneriGeldiMi, bekle: s.bekle, simdi: s.simdi,
    })
    assert.deepEqual(sonuc, { hastaOzeti: 'Özet' })
    assert.equal(n, 3)
    assert.equal(s.gecen(bas), 3 * ONERI_YOKLAMA.aralikMs)
  })

  it('öneri hiç gelmezse 90 sn içinde durur ve null döndürür', async () => {
    const s = saat()
    const bas = s.t
    let n = 0
    const sonuc = await oneriyiYokla({ getir: async () => { n++; return { hastaOzeti: '' } }, geldiMi: oneriGeldiMi, bekle: s.bekle, simdi: s.simdi })
    assert.equal(sonuc, null)
    assert.ok(s.gecen(bas) <= ONERI_YOKLAMA.azamiMs, String(s.gecen(bas)))
    assert.equal(n, Math.floor(ONERI_YOKLAMA.azamiMs / ONERI_YOKLAMA.aralikMs))
  })

  it('getirme hatası yoklamayı bitirmez; iptal edilince hemen durur', async () => {
    const s = saat()
    let n = 0
    let iptal = false
    const sonuc = await oneriyiYokla({
      getir: async () => { n++; if (n === 1) throw new Error('ağ'); if (n === 2) iptal = true; return { hastaOzeti: 'Özet' } },
      geldiMi: oneriGeldiMi, bekle: s.bekle, simdi: s.simdi, iptal: () => iptal,
    })
    assert.equal(sonuc, null)
    assert.equal(n, 2)
  })
})
