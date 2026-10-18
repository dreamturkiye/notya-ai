import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ozelAracDogrula } from '@/lib/klinik/ozelAracDogrula'
import { klinikAraclariListesi } from '@/lib/klinik/klinikAraclari'
import { doktorAraclariListesi } from '@/lib/doktor/doktorAraclari'

describe('medikal-estetik araçları', () => {
  it('dört kendi aracı çalışır ve yabancı branş listesinde yoktur', () => {
    assert.deepEqual(ozelAracDogrula('medikal-estetik'), [])
    const kendi = klinikAraclariListesi('medikal-estetik').map((a) => a.route)
    assert.ok(kendi.filter((r) => r.startsWith('/ozel-branslar/') && !r.endsWith('-kohort') && !['/ozel-branslar/hasta-portali','/ozel-branslar/kayit-kvkk','/ozel-branslar/enabiz'].includes(r)).length >= 4)
    for (const yaban of ['kardiyoloji', 'pediatri', 'dermatoloji'] as const) {
      assert.equal(doktorAraclariListesi(yaban).some((a) => kendi.includes(a.route) && a.route.startsWith('/ozel-branslar/')), false)
    }
  })
})
