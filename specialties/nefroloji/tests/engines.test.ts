/**
 * NEFROLOJI-EXCEPTIONAL-01 + DEEPEN-01 — eGFR / anemi / diyaliz / şerit / kohort / SGK motor testleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { egfrSkorla, gEvre, aEvre, kdigoRenk, sonrakiIzlemTarihi, ILAC_DOZ_UYARI_LISTESI } from '../engines/egfr'
import { anemiSkorla, hbBanti, anemiSonrakiTarih, ANEMI_KONTROL_LISTESI } from '../engines/anemi'
import { diyalizSkorla, diyalizHisIceriyorMu, diyalizGorevleri, DIYALIZ_KONTROL_LISTESI } from '../engines/diyaliz'
import { nefSeridi } from '../engines/serit'
import { nefKohortSatirlari, nefKohortFiltre, nefRecallMesaji } from '../engines/kohort'
import { nefRaporTaslagi, kilitlenebilirMi, raporMetniGuvenliMi, NEF_RAPOR_SABLONLARI } from '../engines/sgkRapor'
import { hastaDiliTemizMi, portalPaketGuvenliMi } from '../engines/portal-bobreklerim'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('nefroloji egfr', () => {
  it('G3a × A2 turuncu', () => {
    const s = egfrSkorla(48, 120)
    assert.equal(s.tamamMi, true)
    assert.equal(s.g, 'G3a')
    assert.equal(s.a, 'A2')
    assert.equal(s.renk, 'turuncu')
    assert.ok(s.sonrakiAy === 6)
  })

  it('G5 kırmızı; G1×A1 yeşil', () => {
    assert.equal(egfrSkorla(12, 50).renk, 'kirmizi')
    assert.equal(egfrSkorla(95, 10).renk, 'yesil')
    assert.equal(egfrSkorla(70, null).g, 'G2')
    assert.equal(egfrSkorla(70, null).a, null)
  })

  it('eksik / uç eGFR yorumlanmaz', () => {
    assert.equal(egfrSkorla(null, 50).tamamMi, false)
    assert.equal(egfrSkorla(1, 50).tamamMi, false)
    assert.equal(egfrSkorla(250, 50).tamamMi, false)
    assert.equal(egfrSkorla(48, -1).tamamMi, false)
  })

  it('g/a helpers + kdigoRenk matrix', () => {
    assert.equal(gEvre(90), 'G1')
    assert.equal(gEvre(45), 'G3a')
    assert.equal(aEvre(15), 'A1')
    assert.equal(aEvre(400), 'A3')
    assert.equal(kdigoRenk('G4', 'A1'), 'kirmizi')
    assert.equal(kdigoRenk('G3b', 'A1'), 'turuncu')
  })

  it('sonraki izlem tarihi ve doz checklist', () => {
    assert.equal(sonrakiIzlemTarihi('2026-01-15', 3), '2026-04-15')
    assert.equal(sonrakiIzlemTarihi('2026-01-15', null), null)
    assert.ok(ILAC_DOZ_UYARI_LISTESI.length >= 5)
    assert.ok(ILAC_DOZ_UYARI_LISTESI.every((x) => !/\d+\s*mg\b/.test(x)))
  })

  it('özet tanı/doz iddiası taşımaz', () => {
    const s = egfrSkorla(28, 400)
    assert.match(s.ozet, /karar desteği|hekim/i)
    assert.doesNotMatch(s.ozet, /tanı koy|ESA dozu\s*\d/i)
  })
})

describe('nefroloji anemi', () => {
  it('Hb düşük → sık izlem, ESA doz yok', () => {
    const s = anemiSkorla(9.2)
    assert.equal(s.tamamMi, true)
    assert.equal(s.bant, 'dusuk')
    assert.equal(s.sonrakiAy, 1)
    assert.match(s.ozet, /ESA dozu Notya yazılmaz/)
  })

  it('hedef / dikkat bantları ve ferritin notu', () => {
    assert.equal(hbBanti(12), 'hedef_yakin')
    assert.equal(hbBanti(10.5), 'dikkat')
    const s = anemiSkorla(11.5, 80)
    assert.match(s.ozet, /Ferritin 80/)
    assert.equal(anemiSonrakiTarih('2026-01-01', 3), '2026-04-01')
  })

  it('eksik / uç Hb yorumlanmaz', () => {
    assert.equal(anemiSkorla(null).tamamMi, false)
    assert.equal(anemiSkorla(1).tamamMi, false)
    assert.ok(ANEMI_KONTROL_LISTESI.some((x) => /ESA/.test(x)))
  })
})

describe('nefroloji diyaliz', () => {
  it('seans kaydı', () => {
    const s = diyalizSkorla({ modalite: 'hd', tarih: '2026-09-19', sonrakiSeans: '2026-09-21' })
    assert.equal(s.tamamMi, true)
    assert.match(s.ozet, /Hemodiyaliz/)
    assert.deepEqual(diyalizGorevleri(s.kayit!), [{ kod: 'diyaliz_seans', ad: 'Diyaliz seans / kontrol', due: '2026-09-21' }])
  })

  it('modalite / tarih eksik → yorumlanmaz', () => {
    assert.equal(diyalizSkorla({ modalite: 'hd' }).tamamMi, false)
    assert.equal(diyalizSkorla({ modalite: 'xx', tarih: '2026-09-19' }).tamamMi, false)
  })

  it('HIS sızıntısı yakalanır', () => {
    assert.equal(diyalizHisIceriyorMu('UF 2.5 L'), true)
    assert.equal(diyalizHisIceriyorMu('Kt/V 1.4'), true)
    assert.equal(diyalizHisIceriyorMu('HD seans 19 Eyl'), false)
    assert.ok(DIYALIZ_KONTROL_LISTESI.some((x) => /HIS|UF/.test(x)))
  })
})

describe('nefroloji şerit', () => {
  it('chips cover acil · eGFR · KDIGO · Hb · kontrol · diyaliz · gecikmiş', () => {
    const s = nefSeridi({
      bugun: '2026-09-19',
      egfr: { deger: 22, g: 'G4', renk: 'kirmizi', tarih: '2026-09-01' },
      hb: { deger: 9.1, bant: 'dusuk', tarih: '2026-09-01' },
      riskBayraklari: ['hiperkalemi'],
      riskHekimOnay: false,
      sonrakiKontrol: '2026-08-01',
      sonrakiDiyaliz: '2026-09-10',
      gorevler: [{ kod: 'egfr_izlem', ad: 'eGFR', due: '2026-08-01' }],
      planlar: [{ kaynak: 'KDIGO', madde: 'G4' }],
    })
    assert.ok(s.chips.some((c) => c.ad === 'Acil bayrak' && c.durum === 'kotu'))
    assert.ok(s.chips.some((c) => c.ad === 'eGFR' && c.deger === '22'))
    assert.ok(s.chips.some((c) => c.ad === 'KDIGO' && c.durum === 'kotu'))
    assert.ok(s.chips.some((c) => c.ad === 'Hb' && c.durum === 'kotu'))
    assert.ok(s.kirmizi.length >= 1)
    assert.ok(s.overdue.length >= 1)
  })
})

describe('nefroloji kohort', () => {
  it('bayrak sıralar ve filtreler', () => {
    const satirlar = nefKohortSatirlari([{
      patientId: '1', ad: 'Ali', sonKdigoRenk: 'kirmizi', acikRiskBayraklari: ['hiperkalemi'],
      sonrakiKontrol: '2026-01-01', gorevler: [{ kod: 'egfr_izlem', due: '2026-01-01' }],
      sonVizit: '2026-08-01', portalVar: true,
    }, {
      patientId: '2', ad: 'Veli', sonKdigoRenk: 'yesil', acikRiskBayraklari: [],
      sonrakiKontrol: '2026-10-01', gorevler: [], sonVizit: null, portalVar: false,
    }], '2026-09-19')
    assert.ok(satirlar[0].bayraklar.includes('risk_acik'))
    assert.ok(satirlar[0].bayraklar.includes('kdigo_kirmizi'))
    assert.equal(nefKohortFiltre(satirlar, ['risk_acik']).length, 1)
    assert.equal(nefKohortFiltre(satirlar, []).length, satirlar.length)
  })

  it('recall tanı / skor taşımaz', () => {
    const m = nefRecallMesaji(['gecikmis_kontrol', 'egfr_izlem_gecikmis'])
    assert.ok(hastaDiliTemizMi(m.metin))
    assert.ok(portalPaketGuvenliMi([m.konu, m.metin]))
    const risk = nefRecallMesaji(['risk_acik'])
    assert.match(risk.metin, /112/)
    assert.doesNotMatch(risk.metin, /eGFR|KDIGO|G4/)
  })
})

describe('nefroloji SGK rapor', () => {
  it('5 şablon; eksik ICD/hekim → kilitlenemez', () => {
    assert.equal(NEF_RAPOR_SABLONLARI.length, 5)
    const bos = nefRaporTaslagi({ sablon: 'esa_anemi', hastaAdi: 'X', bugun: '2026-09-19' })
    assert.ok(bos.eksikler.length >= 2)
    assert.equal(kilitlenebilirMi(bos), false)
    assert.equal(bos.draft.tcSon4, '')
  })

  it('tam checklist + ICD → kilitlenebilir; doz/T.C. yok', () => {
    const isaretli = Object.fromEntries([0, 1, 2, 3, 4].map((i) => [i, true]))
    const s = nefRaporTaslagi({
      sablon: 'diyaliz',
      hastaAdi: 'Ayşe',
      bugun: '2026-09-19',
      tani: { icd10: 'N18.5', aciklama: 'KBH' },
      hekimDegerlendirmesi: 'HD programı devam; seans planı hekimde.',
      isaretli,
    })
    assert.equal(kilitlenebilirMi(s), true)
    const blob = [s.draft.sablonAd, s.draft.hekimDegerlendirmesi, ...s.kontrolListesi.map((k) => k.madde)].join('\n')
    assert.ok(raporMetniGuvenliMi(blob))
    assert.doesNotMatch(blob, /\b\d{11}\b/)
  })
})

describe('NEF prompts lock', () => {
  it('soap-nef kilidi ESA / HIS / tanı yasaklar', () => {
    const p = readFileSync(join(import.meta.dirname, '../prompts/soap-nef.md'), 'utf8')
    assert.match(p, /ESA/)
    assert.match(p, /Diyaliz makinesi HIS|HIS core/)
    assert.match(p, /Tanı kilidi yok/)
  })
})
