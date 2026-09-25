import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { antibiyotikMi, ilacAdiKir, klinikAramaMi, pratikKirilimCikar, sikayetAnahtar, siraKir, sorguyuAyikla, tekHastaSorusuMu } from './hastaAramaFiltre'

const PAZAR = new Date('2026-09-20T15:00:00+03:00')

/** Basic practice questions a doctor will ask — must parse, must rank, must not dump a patient list. */
const TEMEL: { soru: string; kirilim: NonNullable<ReturnType<typeof sorguyuAyikla>['kirilim']> | null; pencere?: string; olcum?: string; sinif?: 'antibiyotik' }[] = [
  { soru: 'Son bir ay içinde hangi antibiyotiği en fazla yazdım?', kirilim: 'ilac_adi', pencere: 'son 1 ay', olcum: 'ilac', sinif: 'antibiyotik' },
  { soru: 'Bu ay en çok yazdığım ilaç hangisi?', kirilim: 'ilac_adi', pencere: 'bu ay', olcum: 'ilac' },
  { soru: 'Geçen ay en sık antibiyotik neydi?', kirilim: 'ilac_adi', pencere: 'geçen ay', olcum: 'ilac', sinif: 'antibiyotik' },
  { soru: 'Son bir ayda hangi ilacı daha fazla yazdım?', kirilim: 'ilac_adi', pencere: 'son 1 ay', olcum: 'ilac' },
  { soru: 'En çok verdiğim ilaç bu ay', kirilim: 'ilac_adi', pencere: 'bu ay', olcum: 'ilac' },
  { soru: 'Bu hafta kaç reçete yazdım?', kirilim: null, pencere: 'bu hafta', olcum: 'ilac' },
  { soru: 'Bu ay hangi aşıyı en fazla yaptım?', kirilim: 'asi_adi', pencere: 'bu ay', olcum: 'asi' },
  { soru: 'Son bir ayda en sık tanı neydi?', kirilim: 'tani', pencere: 'son 1 ay' },
  { soru: 'Bu ay hangi tanıyı en fazla koydum?', kirilim: 'tani', pencere: 'bu ay' },
  { soru: 'Bu hafta en sık şikayet neydi?', kirilim: 'sikayet', pencere: 'bu hafta' },
  { soru: 'Geçen hafta hangi şikayetle en çok geldiler?', kirilim: 'sikayet', pencere: 'geçen hafta' },
  { soru: 'Son üç ayda en çok yazdığım antibiyotik?', kirilim: 'ilac_adi', pencere: 'son 3 ay', olcum: 'ilac', sinif: 'antibiyotik' },
]

describe('pratik analiz — temel hekim soruları', () => {
  for (const s of TEMEL) {
    it(s.soru, () => {
      const q = sorguyuAyikla(s.soru, PAZAR)
      assert.equal(q.kirilim, s.kirilim, `${s.soru} kirilim=${q.kirilim}`)
      if (s.pencere) assert.equal(q.pencere?.etiket, s.pencere)
      if (s.olcum) assert.equal(q.olcum, s.olcum)
      if (s.sinif) assert.equal(q.ilacSinif, s.sinif)
      assert.equal(q.klinik, true)
      assert.equal(klinikAramaMi(s.soru, PAZAR), true)
    })
  }

  it('antibiyotik almayan hasta listesi sıralama açmaz', () => {
    const q = sorguyuAyikla('Bu ay astım ile gelen ve antibiyotik almayan 5–12 yaş', PAZAR)
    assert.equal(q.kirilim, null)
    assert.ok(q.haric.includes('antibiyotik'))
  })

  it('hangi hasta listesi ilaç kırılımı açmaz', () => {
    assert.deepEqual(pratikKirilimCikar('hangi hasta bana bu hafta kulak ile geldi'), { kirilim: null, ilacSinif: null })
  })

  it('penceresiz “en fazla yazdım” son 30 güne düşer', () => {
    const q = sorguyuAyikla('Hangi antibiyotiği en fazla yazdım?', PAZAR)
    assert.equal(q.kirilim, 'ilac_adi')
    assert.equal(q.pencere?.etiket, 'son 30 gün')
  })

  it('ilaç sıralaması Augmentin ailesini birleştirir, parasetamolü antibiyotikten atar', () => {
    const kir = ilacAdiKir([
      { ad: 'Augmentin 400', patientId: 'a' },
      { ad: 'Amoklavin', patientId: 'b' },
      { ad: 'Azitromisin', patientId: 'c' },
      { ad: 'Parasetamol', patientId: 'd' },
    ], 'antibiyotik', 'son 1 ay')
    assert.match(kir.cumle, /2 reçete/)
    assert.equal(kir.sira.length, 2)
    assert.equal(antibiyotikMi('İbuprofen'), false)
  })

  it('tanı ve şikayet sıralaması doğru birincili söyler', () => {
    const tani = siraKir([
      { ad: 'Akut otitis media', patientId: '1' },
      { ad: 'Akut otitis media', patientId: '2' },
      { ad: 'ÜSYE', patientId: '3' },
    ], { donem: 'bu ay', birim: 'tanı', yok: 'tanı kaydı yok', fiil: 'koyduğun' })
    assert.match(tani.cumle, /otitis media/i)
    assert.equal(tani.birincil && /otitis/i.test(tani.birincil), true)

    assert.equal(sikayetAnahtar('sağ kulak ağrısı, otitis media'), 'kulak')
    const sik = siraKir([
      { ad: 'sağ kulak ağrısı', patientId: '1' },
      { ad: 'otitis media', patientId: '2' },
      { ad: 'öksürük', patientId: '3' },
    ], { donem: 'bu hafta', birim: 'şikayet', yok: 'şikayet kaydı yok', fiil: 'görülen', anahtar: sikayetAnahtar })
    assert.equal(sik.sira[0].n, 2)
  })
})

// NOTYA-AYSE-HASTA-01 (Kaan, 2026-09-25): adı geçen tek hastanın sorusu pratik geneli istatistiğe düşmez.
const GOKHAN = 'Umutcan Türkoğlu' + String.fromCharCode(39) + 'na hiç antibiyotik vermiş miyim ve verdiysem hangisini vermişim.'

it('tekHastaSorusuMu: canlı vaka — tek hasta adıyla antibiyotik sorusu hastanın dosyasına gider', () => {
  assert.equal(tekHastaSorusuMu('tek', GOKHAN), true)
})

it('tekHastaSorusuMu: hasta çözülmediyse / birden çok adaysa pratik geneli davranış korunur', () => {
  assert.equal(tekHastaSorusuMu('yok', 'Son üç ayda en çok yazdığım antibiyotik?'), false)
  assert.equal(tekHastaSorusuMu('coklu', GOKHAN), false)
})

it('tekHastaSorusuMu: sıralama olmayan tek-hasta sorusu bu kurala girmez', () => {
  assert.equal(tekHastaSorusuMu('tek', 'Umutcan son geldiğinde ateşi kaçtı?'), false)
})
