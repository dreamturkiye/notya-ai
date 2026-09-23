import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  altTipSecilmeli,
  analizHref,
  goruntuChip,
  goruntuYuklemeReddi,
  hacimAiKapali,
  modalityFinalIcin,
  onayDurumDipnot,
  paylasimYorumu,
  portaldaGorunurMu,
  portalOzeti,
  TASLAK_DIPNOT,
} from './goruntuCalisma'

describe('görüntü ceketi — tip → Değerlendir modalityFinal', () => {
  it('XR / EKG / Göz / Derm / MG / US doğru kod', () => {
    assert.equal(modalityFinalIcin('xr'), 'cxr')
    assert.equal(modalityFinalIcin('xr', 'xr_kemik'), 'xr_kemik')
    assert.equal(modalityFinalIcin('ekg'), 'ekg')
    assert.equal(modalityFinalIcin('goz', 'oct'), 'oct')
    assert.equal(modalityFinalIcin('derm', 'dermatoskopi'), 'dermatoskopi')
    assert.equal(modalityFinalIcin('mg'), 'mamografi')
    assert.equal(modalityFinalIcin('us'), 'us')
  })

  it('CT/MR/PET hacim AI kapalı, rapor yolu açık', () => {
    assert.equal(hacimAiKapali('mr'), true)
    assert.equal(hacimAiKapali('xr'), false)
    assert.equal(modalityFinalIcin('mr'), 'pdf_rapor')
  })

  it('Değerlendir mevcut analiz sayfasına gider (cxr regresyon)', () => {
    const yol = analizHref('hasta-1', 'belge-9', 'cxr')
    assert.match(yol, /\/belgeler\/belge-9/)
    assert.match(yol, /modalityFinal=cxr/)
    assert.match(yol, /geriTab=goruntuleme/)
  })
})

describe('görüntü ceketi — boyut / zip reddi', () => {
  it('50 MB üstü ve 100 MB sert', () => {
    assert.match(goruntuYuklemeReddi({ name: 'us.mp4', type: 'video/mp4', size: 51 * 1024 * 1024, tip: 'us' }) || '', /50/)
    assert.match(goruntuYuklemeReddi({ name: 'x.jpg', type: 'image/jpeg', size: 100 * 1024 * 1024, tip: 'xr' }) || '', /100/)
  })

  it('tüm MR zip reddedilir', () => {
    assert.match(goruntuYuklemeReddi({ name: 'whole_mr.zip', type: 'application/zip', size: 800_000_000, tip: 'mr' }) || '', /arşiv|zip/i)
  })

  it('video yalnız US', () => {
    assert.match(goruntuYuklemeReddi({ name: 'a.mp4', type: 'video/mp4', size: 1000, tip: 'xr' }) || '', /ultrason/i)
    assert.equal(goruntuYuklemeReddi({ name: 'pa.jpg', type: 'image/jpeg', size: 80_000, tip: 'xr' }), null)
  })
})

describe('görüntü ceketi — portal kapısı', () => {
  it('taslak portala gitmez', () => {
    assert.equal(portaldaGorunurMu({ onay_durum: 'taslak', tip: 'xr', modalite: 'cxr', hekim_yorum: 'ok' }), false)
  })

  it('MG yorum olmadan paylaşılmaz; göz yalnız fundus', () => {
    assert.equal(portaldaGorunurMu({ onay_durum: 'hasta_paylas', tip: 'mg', modalite: 'mamografi', hekim_yorum: '' }), false)
    assert.equal(portaldaGorunurMu({ onay_durum: 'hasta_paylas', tip: 'mg', modalite: 'mamografi', hekim_yorum: 'Yoğun fibroglandüler patern.' }), true)
    assert.equal(portaldaGorunurMu({ onay_durum: 'hasta_paylas', tip: 'goz', modalite: 'oct', hekim_yorum: 'ok' }), false)
    assert.equal(portaldaGorunurMu({ onay_durum: 'hasta_paylas', tip: 'goz', modalite: 'fundus', hekim_yorum: 'ok' }), true)
  })

  it('portal özeti % / PASI / model adı taşımaz', () => {
    const o = portalOzeti('PASI %42 — claude taslak')
    assert.ok(!/%/.test(o) && !/PASI/i.test(o) && !/claude/i.test(o))
  })

  it('chip bugün / tarih', () => {
    // Fixed clock: "today" is an Istanbul date — a UTC date here failed every night 21:00–24:00 UTC.
    const simdi = Date.parse('2026-09-23T21:30:00Z') // 24 Eyl 00:30 İstanbul
    assert.match(goruntuChip('ekg', '2026-09-24', simdi), /bugün/)
    assert.match(goruntuChip('ekg', '2026-09-23', simdi), /23 Eyl/)
    assert.match(goruntuChip('xr', '2026-09-12'), /XR/)
  })

  it('taslak dipnotu kilitli; paylaşılınca taslak yalanı durmaz', () => {
    assert.match(TASLAK_DIPNOT, /Hekim onaylamadan/)
    assert.equal(onayDurumDipnot('taslak'), TASLAK_DIPNOT)
    assert.match(onayDurumDipnot('hasta_paylas'), /paylaşıldı/i)
    assert.ok(!/Taslak/.test(onayDurumDipnot('hasta_paylas')))
  })

  it('XR/Göz/Derm alt tip zorunlu; EKG/US değil', () => {
    assert.equal(altTipSecilmeli('xr'), true)
    assert.equal(altTipSecilmeli('goz'), true)
    assert.equal(altTipSecilmeli('derm'), true)
    assert.equal(altTipSecilmeli('ekg'), false)
    assert.equal(altTipSecilmeli('us'), false)
    assert.equal(altTipSecilmeli('mg'), false)
  })

  it('paylaşım ham Asistan özetini hekim yorumu saymaz', () => {
    assert.equal(paylasimYorumu({ hamAsistan: 'AI taslak', hekimOzet: 'AI taslak' }), null)
    assert.equal(paylasimYorumu({ hamAsistan: 'AI taslak', hekimOzet: 'Hekim: infiltrasyon yok.' }), 'Hekim: infiltrasyon yok.')
    assert.equal(paylasimYorumu({ mevcut: 'Klinik notum.' }), 'Klinik notum.')
  })
})

describe('görüntü ceketi — izolasyon + cxr yolu duruyor', () => {
  const rota = readFileSync(new URL('../../app/api/doktor/goruntuler/route.ts', import.meta.url), 'utf8')
  const tek = readFileSync(new URL('../../app/api/doktor/goruntuler/[id]/route.ts', import.meta.url), 'utf8')
  const analiz = readFileSync(new URL('../../app/api/doktor/belgeler/analiz/route.ts', import.meta.url), 'utf8')
  const ui = readFileSync(new URL('../../components/doktor/HastaGoruntuler.tsx', import.meta.url), 'utf8')

  it('her from doctor_id veya hastaSahibiMi', () => {
    for (const s of [rota, tek]) {
      assert.ok(s.includes('hastaSahibiMi') || s.includes(".eq('doctor_id', user.id)"))
      const fromlar = [...s.matchAll(/\.from\('([^']+)'\)/g)]
      for (const m of fromlar) {
        const parca = s.slice(m.index ?? 0, (m.index ?? 0) + 900)
        assert.ok(/doctor_id|hastaSahibiMi/.test(parca), `${m[1]} doktorsuz`)
      }
    }
  })

  it('analiz POST imzası değişmedi (cxr)', () => {
    assert.match(analiz, /documentId ve modalityFinal gerekli/)
    assert.match(analiz, /fitzpatrickBilinmiyor/)
    assert.match(analiz, /tekAlanFundus/)
  })

  it('UI PACS demez; Değerlendir mevcut POST yoluna gider; alt tip ve paylaşım kapısı var', () => {
    assert.ok(!/PACS/i.test(ui))
    assert.ok(!/PACS/i.test(rota))
    assert.match(ui, /Değerlendir/)
    assert.match(ui, /analizHref/)
    assert.match(ui, /Bu hastanın filmleri/)
    assert.match(ui, /altTipSecilmeli/)
    assert.match(ui, /onayDurumDipnot/)
    assert.match(ui, /portaldaGorunurMu/)
    assert.ok(!ui.includes('analiz?.hekim_ozet || analiz?.sonuc?.ozet || satir.hekim_yorum'))
    assert.match(rota, /altTipSecilmeli/)
  })
})

describe('görüntü ceketi — portal yükleme + göz fundus', () => {
  const portalYukle = readFileSync(new URL('../../app/api/portal/hasta/[token]/goruntu/route.ts', import.meta.url), 'utf8')
  const portalSonuc = readFileSync(new URL('../../app/portal/_components/ResultsView.tsx', import.meta.url), 'utf8')
  const portalPaket = readFileSync(new URL('../../app/api/portal/hasta/[token]/route.ts', import.meta.url), 'utf8')

  it('hasta yüklemesi taslak başlar; demo yükleme yok', () => {
    assert.match(portalYukle, /kaynak: 'hasta_yukleme'/)
    assert.match(portalYukle, /onay_durum: 'taslak'/)
    assert.match(portalSonuc, /Dış film yükle/)
    assert.match(portalSonuc, /\/portal\/hasta\//)
  })

  it('göz portalına yalnız onaylı fundus ceketi eklenir', () => {
    assert.match(portalPaket, /row\.modalite === 'fundus'/)
    assert.match(portalPaket, /portaldaGorunurMu/)
  })
})
