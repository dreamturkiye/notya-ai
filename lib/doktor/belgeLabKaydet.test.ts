import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

describe('lab NTP — özet/kilit düğmesi görünür geri bildirim verir', () => {
  it('kaydet hatası sessiz dönmez; mesaj düğmenin yanında; analiz doktor kapsanır', () => {
    const lab = readFileSync(new URL('../../app/dashboard/doktor/hastalar/[id]/belgeler/[belgeId]/lab/page.tsx', import.meta.url), 'utf8')
    const rota = readFileSync(new URL('../../app/api/doktor/belgeler/lab/route.ts', import.meta.url), 'utf8')
    assert.match(lab, /kayitMesaj/)
    assert.match(lab, /Özeti resmi tanıya al/)
    assert.match(lab, /Resmi tanı boş/)
    assert.match(lab, /getAccessTokenAsync\(\)/)
    assert.match(lab, /Oturum bulunamadı/)
    assert.ok(!/if \(!analiz\) return false/.test(lab))
    assert.match(rota, /eq\('id', panel\.analiz_id\)\.eq\('doctor_id', user\.id\)/)
  })
})
