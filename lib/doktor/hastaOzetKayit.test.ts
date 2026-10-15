/**
 * PUT /api/doktor/hastalar/[id] — Özet demografi/sağlık alanları birleştirme testleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  cinsiyetSakla,
  demografiEksikMi,
  notesOzetGuncelle,
  notlardanOzetAlanlari,
  saglikGecmisiEksikMi,
} from './hastaOzetKayit'

describe('hastaOzetKayit', () => {
  it('anne/baba/eposta notes + email alanlarından okunur', () => {
    const o = notlardanOzetAlanlari(
      { anneAdi: 'Ayşe', babaAdi: 'Mehmet', sehir: 'İstanbul', kanGrubu: 'B Rh+' },
      {
        ad_soyad: 'Hasta İki',
        dogum_tarihi: '2024-09-12',
        cinsiyetHam: 'female',
        telefon: null,
        eposta: 'aile@ornek.test',
      },
    )
    assert.equal(o.anne_adi, 'Ayşe')
    assert.equal(o.baba_adi, 'Mehmet')
    assert.equal(o.eposta, 'aile@ornek.test')
    assert.equal(o.cinsiyet, 'Kadın')
    assert.equal(demografiEksikMi(o), true) // telefon boş
  })

  it('notesOzetGuncelle anne/baba ve sağlık alanlarını yazar', () => {
    const { notes, notesDegisti } = notesOzetGuncelle(
      { sehir: 'Ankara' },
      {
        anne_adi: 'Fatma',
        baba_adi: 'Ali',
        kronik_hastaliklar: 'Astım, Alerji',
        alerjiler: 'Penisilin',
        surekli_ilaclar: 'D vitamini',
        sigara_alkol: 'Ailede sigara: Hayır',
      },
    )
    assert.equal(notesDegisti, true)
    assert.equal(notes.anneAdi, 'Fatma')
    assert.equal(notes.babaAdi, 'Ali')
    assert.deepEqual(notes.kronikHastaliklar, ['Astım', 'Alerji'])
    assert.equal(notes.alerjiler, 'Penisilin')
    assert.equal(notes.suregenIlaclar, 'D vitamini')
    assert.equal(notes.sehir, 'Ankara') // dokunulmadı
  })

  it('cinsiyetSakla TR → EN', () => {
    assert.equal(cinsiyetSakla('Kadın'), 'female')
    assert.equal(cinsiyetSakla('Erkek'), 'male')
  })

  it('sağlık geçmişi boşsa eksik sayılır', () => {
    assert.equal(
      saglikGecmisiEksikMi({ kronik_hastaliklar: [], alerjiler: null, surekli_ilaclar: null, sigara_alkol: null }),
      true,
    )
    assert.equal(
      saglikGecmisiEksikMi({
        kronik_hastaliklar: [],
        alerjiler: 'Bilinen alerjisi yok',
        surekli_ilaclar: null,
        sigara_alkol: null,
      }),
      false,
    )
  })

  it('NOTYA-OKUL-RAPOR-01: ogrenci_mi notes.ogrenciMi\'den okunur, varsayılan null (iddia edilmez)', () => {
    const bos = notlardanOzetAlanlari({}, { ad_soyad: 'Hasta', dogum_tarihi: null, cinsiyetHam: null, telefon: null, eposta: null })
    assert.equal(bos.ogrenci_mi, null)
    const isaretli = notlardanOzetAlanlari({ ogrenciMi: true }, { ad_soyad: 'Hasta', dogum_tarihi: null, cinsiyetHam: null, telefon: null, eposta: null })
    assert.equal(isaretli.ogrenci_mi, true)
  })

  it('notesOzetGuncelle ogrenci_mi gövdesini notes.ogrenciMi olarak yazar', () => {
    const { notes, notesDegisti } = notesOzetGuncelle({}, { ogrenci_mi: true })
    assert.equal(notesDegisti, true)
    assert.equal(notes.ogrenciMi, true)
    const { notes: notes2 } = notesOzetGuncelle({ ogrenciMi: true }, { ogrenci_mi: false })
    assert.equal(notes2.ogrenciMi, false)
  })
})
