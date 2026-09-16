import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  ENABIZ_ARTEFAKTLAR,
  ENABIZ_SCHEMA,
  enabizEDogumFromWizard,
  enabizErecete,
  enabizEpikriz,
  enabizGebeIzlem,
  enabizSgkRapor,
  enabizUsgRapor,
} from './paket'

describe('enabiz paket formats', () => {
  it('catalog covers reçete, rapor, USG, e-Doğum', () => {
    const turler = new Set(ENABIZ_ARTEFAKTLAR.map((a) => a.tur))
    for (const t of ['erecete', 'sgk_rapor', 'usg_rapor', 'e_dogum', 'epikriz', 'muayene_notu'] as const) {
      assert.ok(turler.has(t), t)
    }
  })

  it('USG → FHIR DiagnosticReport bundle, live_write false', () => {
    const p = enabizUsgRapor({
      baslik: 'Obstetrik US — dating',
      govde: '• CRL: 12 mm',
      sutOneri: 'Obstetrik US',
      sablonKod: 'dating',
      hastaId: 'h1',
    })
    assert.equal(p.schema, ENABIZ_SCHEMA)
    assert.equal(p.live_write, false)
    assert.equal(p.kanal, 'fhir_r4')
    const fhir = p.payload.fhir as { resourceType: string; entry: { resource: { resourceType: string; code: { coding: { code: string }[] } } }[] }
    assert.equal(fhir.resourceType, 'Bundle')
    assert.equal(fhir.entry[0].resource.resourceType, 'DiagnosticReport')
    assert.equal(fhir.entry[0].resource.code.coding[0].code, '18748-4')
    assert.match(p.kopya_metin, /DiagnosticReport|görüntüleme/)
  })

  it('e-Doğum wizard → USS form JSON with eksikler', () => {
    const p = enabizEDogumFromWizard({
      alanlar: [
        { kod: 'anne_tc', etiket: 'Anne', deger: '', eksik: true },
        { kod: 'dogum_tarih_saat', etiket: 'Zaman', deger: '2026-09-16T10:00', eksik: false },
        { kod: 'kilo', etiket: 'Kilo', deger: '3200', eksik: false },
      ],
      tamam: false,
      uyari: [],
    })
    assert.equal(p.tur, 'e_dogum')
    assert.equal(p.kanal, 'uss_form_json')
    assert.equal(p.live_write, false)
    assert.ok(p.eksikler.includes('anne_tc'))
    assert.equal((p.payload.alanlar as Record<string, unknown>).kilo, '3200')
  })

  it('e-reçete wraps Medula XML', () => {
    const p = enabizErecete({ xml: '<ereceteBilgisi/>', metin: 'Rp. amoksisilin', eksikler: ['barkod'] })
    assert.equal(p.kanal, 'medula_erecete_xml')
    assert.equal(p.payload.xml, '<ereceteBilgisi/>')
    assert.ok(p.eksikler.includes('barkod'))
  })

  it('SGK rapor → Medula e-rapor alanları + ICD', () => {
    const p = enabizSgkRapor({
      raporTipiId: 'is_goremezlik',
      raporTipiLabel: 'İş Göremezlik',
      draft: {
        hastaAdi: 'Ayşe Y.',
        tani: { icd10: 'O26.9', aciklama: 'Gebelik komplikasyonu' },
        istirahat_suresi_gun: 7,
        baslangicTarihi: '16.09.2026',
        bitisTarihi: '23.09.2026',
        isGoremezlikGerekcesi: 'Yatak istirahati',
      },
      hekim: { adSoyad: 'Dr. Test', tesisKodu: '11068891', diplomaTescilNo: '123' },
    })
    assert.equal(p.kanal, 'medula_erapor_json')
    const m = p.payload.medula as { taniKodu: string; istirahatGun: number }
    assert.equal(m.taniKodu, 'O26.9')
    assert.equal(m.istirahatGun, 7)
    assert.equal(p.eksikler.length, 0)
  })

  it('epikriz → FHIR Composition LOINC 18842-5', () => {
    const p = enabizEpikriz({
      hastaAd: 'Test Hasta',
      taniVeTedavi: 'GDM — diyet',
      taburcuOzeti: 'Kontrol 1 hafta',
      hekimAd: 'Dr. X',
    })
    const fhir = p.payload.fhir as { entry: { resource: { type: { coding: { code: string }[] } } }[] }
    assert.equal(fhir.entry[0].resource.type.coding[0].code, '18842-5')
  })

  it('gebe izlem USS paket', () => {
    const p = enabizGebeIzlem({
      izlem_no: 2,
      bp: '110/70',
      weight: 68,
      urine_protein: false,
      risk: 'dusuk',
      danger_signs: [],
    })
    assert.equal(p.tur, 'gebe_izlem')
    assert.equal((p.payload.alanlar as { izlem_no: number }).izlem_no, 2)
  })
})
