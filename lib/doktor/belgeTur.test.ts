import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  belgeEkoMi,
  belgeLabMi,
  belgeRontgenMi,
  belgeDegerlendirmeCtalari,
  belgeKategoriEtiket,
  belgeYenidoganTaburcuEpikriziMi,
} from './belgeTur'
import { YENIDOGAN_TABURCULUK_EPIKRIZI } from './belgeTurleri'

describe('belgeTur', () => {
  it('detects mock lab PDF by filename', () => {
    assert.equal(belgeLabMi({ fileName: 'Elif_Celik_Mock_Lab_Results.pdf', category: null }), true)
  })
  it('detects Lab Sonucu category', () => {
    assert.equal(belgeLabMi({ fileName: 'hemogram.pdf', category: 'Lab Sonucu' }), true)
  })
  it('does not treat röntgen as lab', () => {
    assert.equal(belgeLabMi({ fileName: 'chest_pa.jpg', category: 'Röntgen' }), false)
  })
  it('detects röntgen / x-ray filenames', () => {
    assert.equal(belgeRontgenMi({ fileName: 'chest_xray_pa.jpg', category: null }), true)
    assert.equal(belgeRontgenMi({ fileName: 'akciger_grafisi.png', category: 'Röntgen' }), true)
  })
  it('does not treat lab PDF as röntgen', () => {
    assert.equal(belgeRontgenMi({ fileName: 'Elif_Celik_Mock_Lab_Results.pdf', category: 'Lab Sonucu' }), false)
  })
  it('röntgen CTA is only Değerlendir (no lab button)', () => {
    const ctas = belgeDegerlendirmeCtalari({
      fileName: 'Elif_Celik_Mock_Chest_Xray_PA.jpg',
      category: 'X-Ray',
      fileType: 'image/jpeg',
    })
    assert.deepEqual(ctas.map((c) => c.label), ['Değerlendir'])
    assert.equal(ctas[0]?.tur, 'rontgen')
  })
  it('lab CTA is only Değerlendir', () => {
    const ctas = belgeDegerlendirmeCtalari({
      fileName: 'Elif_Celik_Mock_Lab_Results.pdf',
      category: 'Lab Sonucu',
      fileType: 'application/pdf',
    })
    assert.deepEqual(ctas.map((c) => c.label), ['Değerlendir'])
    assert.equal(ctas[0]?.tur, 'lab')
  })
  it('ekokardiyografi PDF is Değerlendir, not a lab button', () => {
    assert.equal(belgeEkoMi({ fileName: 'TTE_rapor.pdf', category: null }), true)
    assert.equal(belgeEkoMi({ fileName: 'eko_rapor.pdf', category: 'Rapor' }), true)
    assert.equal(belgeEkoMi({ fileName: 'transozofageal_eko.pdf', category: null }), true)
    assert.equal(belgeEkoMi({ fileName: 'ekonomik_rapor.pdf', category: null }), false)
    assert.equal(belgeEkoMi({ fileName: 'hasta_ekg.pdf', category: 'EKG' }), false)
    assert.equal(belgeEkoMi({ fileName: 'chest_xray_pa.jpg', category: 'Röntgen' }), false)
    const ctas = belgeDegerlendirmeCtalari({
      fileName: 'ekokardiyografi.pdf',
      category: 'Rapor',
      fileType: 'application/pdf',
    })
    assert.deepEqual(ctas.map((c) => c.tur), ['eko'])
    assert.equal(belgeKategoriEtiket({ fileName: 'echo_study.pdf', category: null }), 'Ekokardiyografi')
    assert.equal(belgeEkoMi({ fileName: 'rapor.pdf', category: 'Ekokardiyografi' }), true)
    const kasadan = belgeDegerlendirmeCtalari({
      fileName: 'rapor.pdf',
      category: 'Ekokardiyografi',
      fileType: 'application/pdf',
    })
    assert.deepEqual(kasadan.map((c) => c.tur), ['eko'])
    assert.equal(belgeKategoriEtiket({ fileName: 'rapor.pdf', category: 'Ekokardiyografi' }), 'Ekokardiyografi')
  })
  it('maps X-Ray category label to Röntgen', () => {
    assert.equal(belgeKategoriEtiket({ fileName: 'chest.jpg', category: 'X-Ray' }), 'Röntgen')
  })

  it('Yenidoğan Taburculuk Epikrizi: kategori + dosya adı; lab CTA yok', () => {
    assert.equal(
      belgeYenidoganTaburcuEpikriziMi({ fileName: 'x.pdf', category: YENIDOGAN_TABURCULUK_EPIKRIZI }),
      true,
    )
    assert.equal(
      belgeYenidoganTaburcuEpikriziMi({
        fileName: 'Hasta_Iki_Yenidogan_Taburculuk_Epikrizi.pdf',
        category: 'Epikriz',
      }),
      true,
    )
    assert.equal(
      belgeLabMi({
        fileName: 'Hasta_Iki_Yenidogan_Taburculuk_Epikrizi.pdf',
        category: 'Epikriz',
        fileType: 'application/pdf',
      }),
      false,
    )
    const ctas = belgeDegerlendirmeCtalari({
      fileName: 'Hasta_Iki_Yenidogan_Taburculuk_Epikrizi.pdf',
      category: YENIDOGAN_TABURCULUK_EPIKRIZI,
      fileType: 'application/pdf',
    })
    assert.deepEqual(ctas.map((c) => c.label), ['Asistana raporla'])
    assert.equal(
      belgeKategoriEtiket({ fileName: 'Hasta_Iki_Yenidogan_Taburculuk_Epikrizi.pdf', category: 'Epikriz' }),
      YENIDOGAN_TABURCULUK_EPIKRIZI,
    )
  })

  it('genel Epikriz PDF’inde ikincil lab CTA yok', () => {
    const ctas = belgeDegerlendirmeCtalari({
      fileName: 'genel_epikriz.pdf',
      category: 'Epikriz',
      fileType: 'application/pdf',
    })
    assert.deepEqual(ctas.map((c) => c.label), ['Asistana raporla'])
  })

  it('NTP / yenidoğan tarama lab dosyası taburculuk epikrizi sayılmaz', () => {
    assert.equal(
      belgeYenidoganTaburcuEpikriziMi({ fileName: 'yenidogan_tarama_panel.pdf', category: 'Lab Sonucu' }),
      false,
    )
  })

  it('yapılmış lab / analiz CTA etiketi Değerlendirildi / Raporlandı olur', () => {
    const lab = belgeDegerlendirmeCtalari(
      { fileName: 'Ali_Kara_Lab.pdf', category: 'Lab Sonucu', fileType: 'application/pdf' },
      { labDurum: 'cikarildi' },
    )
    assert.equal(lab[0]?.yapildi, true)
    assert.equal(lab[0]?.label, 'Değerlendirildi')

    const asistan = belgeDegerlendirmeCtalari(
      { fileName: 'epikriz.pdf', category: YENIDOGAN_TABURCULUK_EPIKRIZI, fileType: 'application/pdf' },
      { analizDurum: 'onaylandi' },
    )
    assert.equal(asistan[0]?.yapildi, true)
    assert.equal(asistan[0]?.label, 'Raporlandı')

    const ham = belgeDegerlendirmeCtalari(
      { fileName: 'chest.jpg', category: 'Röntgen', fileType: 'image/jpeg' },
      {},
    )
    assert.equal(ham[0]?.yapildi, false)
    assert.equal(ham[0]?.label, 'Değerlendir')
  })
})

it('Ultrasonografi: USG kategorisi röntgene karışmaz, doğru CTA ve etiket', async () => {
  const m = await import('./belgeTur')
  const usg = { fileName: 'ece_1.png', category: 'Ultrasonografi', fileType: 'image/png' }
  assert.equal(m.belgeUsgMi(usg), true)
  assert.equal(m.belgeRontgenMi(usg), false)
  assert.equal(m.belgeKategoriEtiket(usg), 'Ultrasonografi')
  assert.equal(m.belgeDegerlendirmeCtalari(usg)[0].tur, 'rontgen')
  assert.equal(m.belgeRontgenMi({ fileName: 'akciger_grafi.png', category: 'Röntgen' }), true)
  assert.equal(m.belgeUsgMi({ fileName: 'abdomen_usg.jpg', category: null }), true)
})
