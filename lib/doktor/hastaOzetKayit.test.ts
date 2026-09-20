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
})
