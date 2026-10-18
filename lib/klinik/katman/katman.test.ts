import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  epostaDogrula,
  haftayiDogrula,
  klinikAdiDogrula,
  koltukMusaitMi,
  paketDogrula,
  rezervasyonDogrula,
  varsayilanHafta,
  varsayilanRezervasyon,
  vergiNoDogrula,
  widgetDogrula,
} from './kurulum'
import { izinVar, varsayilanYetkiler, yetkiDogrula } from './yetki'
import { akisDurumu, gorunurZiyaretler, takvimHastaAdi, yerlestirmeReddi, ziyaretOzeti } from './takvim'
import { resepsiyonCalistir } from './resepsiyon'

describe('klinik kurulum', () => {
  it('vergi numarasını ve çalışma haftasını kabul eder', () => {
    assert.equal(vergiNoDogrula(''), null)
    assert.equal(vergiNoDogrula('1234567890'), null)
    assert.match(vergiNoDogrula('123') || '', /10/)
    assert.equal(haftayiDogrula(varsayilanHafta()), null)
    assert.equal(klinikAdiDogrula('Notya Klinik'), null)
    assert.equal(rezervasyonDogrula(varsayilanRezervasyon()), null)
    assert.equal(widgetDogrula({ acik: true, baslik: 'Randevu' }), null)
    assert.match(widgetDogrula({ acik: true, baslik: ' ' }) || '', /başlık/)
  })

  it('dolu koltuğa yeni davet açmaz', () => {
    assert.equal(koltukMusaitMi({ kapasite: 2, kullanilan: 1, bekleyen: 0 }), true)
    assert.equal(koltukMusaitMi({ kapasite: 2, kullanilan: 1, bekleyen: 1 }), false)
    assert.equal(epostaDogrula('dr@klinik.co'), null)
    assert.equal(paketDogrula({ ad: 'Kontrol paketi', seans: 6, ucretKurus: 150000 }), null)
  })
})

describe('klinik yetki matrisi', () => {
  it('varsayılan matrisi kabul eder ve kurulumu personele kapar', () => {
    const satirlar = varsayilanYetkiler()
    assert.equal(yetkiDogrula(satirlar), null)
    assert.equal(izinVar(satirlar, 'sekreter', 'takvim', 'sil'), true)
    assert.equal(izinVar(satirlar, 'asistan', 'odeme', 'oku'), false)
    assert.equal(izinVar(satirlar, 'hasta_danismani', 'kurulum', 'oku'), false)
  })

  it('yazmayı okumasız satırı reddeder', () => {
    const satirlar = varsayilanYetkiler().map((s) => s.rol === 'sekreter' && s.modul === 'mesaj' ? { ...s, oku: false, yaz: true } : s)
    assert.match(yetkiDogrula(satirlar) || '', /okuma/)
  })
})

describe('paylaşılan takvim', () => {
  const baz = { id: 'a', doktorId: 'd1', odaId: 'o1', bas: 100, son: 200 }

  it('aynı hekimin çakışan saatini ve aynı odayı reddeder', () => {
    assert.equal(yerlestirmeReddi([baz], { ...baz, id: 'b', odaId: 'o2', bas: 150, son: 250 }), 'doktor')
    assert.equal(yerlestirmeReddi([baz], { ...baz, id: 'b', doktorId: 'd2', bas: 150, son: 250 }), 'oda')
    assert.equal(yerlestirmeReddi([baz], { ...baz, id: 'b', doktorId: 'd2', odaId: 'o9', bas: 200, son: 260 }), null)
  })

  it('akışta sıradakini ve gecikeni ayırır; kart not taşımaz', () => {
    const akis = akisDurumu(150, [
      { id: 'icinde', doktorId: 'd1', bas: 100, son: 180, durum: 'onaylandi' },
      { id: 'sonra', doktorId: 'd1', bas: 200, son: 260, durum: 'planlandi' },
      { id: 'gecti', doktorId: 'd2', bas: 10, son: 40, durum: 'onaylandi' },
      { id: 'bitti', doktorId: 'd2', bas: 10, son: 40, durum: 'tamamlandi' },
    ])
    assert.equal(akis.odada[0]?.id, 'icinde')
    assert.equal(akis.siradaki?.id, 'sonra')
    assert.deepEqual(akis.geciken.map((s) => s.id), ['gecti'])
    assert.equal(ziyaretOzeti('kontrol', 'onaylandi'), 'Kontrol · onaylandı')
    const gorunen = gorunurZiyaretler(false, 'd1', [{ doktorId: 'd1' }, { doktorId: 'd2' }])
    assert.equal(gorunen.length, 1)
    assert.equal(gorunurZiyaretler(true, 'd1', [{ doktorId: 'd2' }]).length, 1)
    assert.equal(takvimHastaAdi(false, 'd1', 'd2', 'Ayşe Yılmaz'), 'Dolu')
    assert.equal(takvimHastaAdi(false, 'd1', 'd1', 'Ayşe Yılmaz'), 'Ayşe Yılmaz')
    assert.equal(takvimHastaAdi(true, 'd1', 'd2', 'Ayşe Yılmaz'), 'Ayşe Yılmaz')
  })
})

describe('AI resepsiyon yuvası', () => {
  it('kapalıyken eklentiyi çağırmaz', async () => {
    let cagri = 0
    const sonuc = await resepsiyonCalistir(false, {
      id: 'ai-resepsiyon',
      cevapla: async () => {
        cagri += 1
        return { metin: 'olmaz', eskalasyon: false, kaynak: 'eklenti' }
      },
    }, { gorev: 'randevu', metin: 'yarın' })
    assert.equal(sonuc.durum, 'kapali')
    assert.equal(cagri, 0)
  })

  it('açık ama eklentisizken model aramaz', async () => {
    const sonuc = await resepsiyonCalistir(true, null, { gorev: 'paket', metin: 'kaç seans' })
    assert.equal(sonuc.durum, 'eklenti_yok')
  })
})
