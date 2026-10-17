/**
 * FOTO-ARSIV-01 — guards on the browser layer that a unit test can see without a browser: constants stay in step with the
 * server, the only network door is api.ts (bearer token, no signed URLs), nothing specialty-specific is hard-wired into the shared
 * tab (branş-alan-sızması), the safety framing is present, and AI text can never reach the signed note from this folder.
 * (Pixel behaviour — zoom, annotation, compare — is verified in a real Chromium run; see docs/audits/FOTO-ARSIV-01.md.)
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { RAPOR_OGE_AZAMI } from '../../../lib/doktor/fotoArsiv/raporPdf'
import { RAPOR_OGE_AZAMI_ISTEMCI } from './sabitler'

const DIZIN = __dirname
const dosyalar = readdirSync(DIZIN).filter((f) => /\.(tsx?|css)$/.test(f) && !f.endsWith('.test.ts'))
const oku = (f: string): string => readFileSync(join(DIZIN, f), 'utf8')

describe('istemci katmanı', () => {
  it('rapor sınırı sunucuyla aynı', () => {
    assert.equal(RAPOR_OGE_AZAMI_ISTEMCI, RAPOR_OGE_AZAMI)
  })
  it('tek ağ kapısı api.ts: başka dosya fetch çağırmaz, imzalı URL ve tarayıcı depolaması yok', () => {
    for (const f of dosyalar) {
      const s = oku(f)
      if (f !== 'api.ts') assert.ok(!/\bfetch\(/.test(s), `${f} doğrudan fetch çağırıyor`)
      assert.ok(!/createSignedUrl|signedUrl|getPublicUrl/i.test(s), `${f} imzalı/açık URL kullanıyor`)
      assert.ok(!/localStorage|sessionStorage|indexedDB/.test(s), `${f} tarayıcı depolaması kullanıyor (klinik görüntü/not asla)`)
    }
    assert.match(oku('api.ts'), /ensureDoctorAccessToken/)
    assert.match(oku('api.ts'), /Authorization: `Bearer \$\{t\}`/)
  })
  it('branş alanı sızmaz: ortak sekmede pediatri/çocuk cerrahisi sözcüğü sabit yazılı değil', () => {
    for (const f of dosyalar) {
      const s = oku(f).replace(/veliDili/g, 'VD')
      assert.ok(!/Baş Çevresi|Pediatri|Çocuk Cerrahi|Hedef Boy|\bveli\b|Persentil/i.test(s), `${f} branşa özgü sözcük içeriyor`)
    }
  })
  it('güvenlik çerçevesi görünür ve AI metni imzalı nota gitmez', () => {
    const ai = oku('FotoAiPaneli.tsx')
    assert.match(ai, /Karar destek aracıdır, tanı değildir\./)
    assert.match(ai, /imzalı muayene notuna otomatik eklenmez/)
    for (const f of dosyalar) assert.ok(!/\/api\/(notes|sessions)|soap/i.test(oku(f)), `${f} not/oturum rotasına dokunuyor`)
  })
  it('AI yalnız cihazda küçültülmüş türevi gönderir; özgün byte\'lar tarayıcıdan AI rotalarına gitmez', () => {
    const ai = oku('FotoAiPaneli.tsx')
    assert.match(ai, /turevUret\(/)
    assert.ok(!/dosyaBlob\(/.test(ai))
  })
  it('sekreter ve hasta danışmanı için arayüz sunucu reddine saygı gösterir (403 → kapalı durum)', () => {
    const k = oku('FotoArsivi.tsx')
    assert.match(k, /e\.durum === 403/)
    assert.match(k, /Bu bölüm bu rol için kapalı/)
  })
  it('kalite kapısı kayıttan önce çalışır ve engellemez ("Yine de kaydet")', () => {
    const k = oku('FotoArsivi.tsx')
    assert.ok(k.indexOf('kaliteKontrolEt(') < k.indexOf('await kaydet(f, bolgeOnerisi)'))
    assert.match(k, /Yine de kaydet/)
    assert.match(k, /Çekimi yenileyin/)
  })
})
