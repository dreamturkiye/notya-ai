/**
 * NOTYA-MALIYET-01 — model politikası ve asistan yönlendirme kuralı.
 * Kaan (2026-09-19, bağlayıcı): KLİNİK KALİTE > MALİYET. Görüntü/inceleme istisnasız GÜÇLÜ; asistan sohbetinde
 * şüphede GÜÇLÜ; HIZLI yalnız dar bir klinik-dışı listede.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  asistanModelYonlendir, gecmisiKirp, GOREV_POLITIKASI, gucluModel, hizliModel, modelSec, netSosyalMi,
  SOHBET_GECMIS_MESAJ, MODEL_GUCLU, MODEL_HIZLI, type Gorev,
} from './modeller'

describe('görev politikası — kademe tablosu', () => {
  it('görüntü/inceleme ayrı bir görev ve istisnasız GÜÇLÜ', () => {
    assert.equal(GOREV_POLITIKASI['goruntu-inceleme'].kademe, 'guclu')
    assert.equal(modelSec('goruntu-inceleme').model, gucluModel())
  })

  it('klinik ve uzman çıktılar GÜÇLÜ (SOAP, not, konsültasyon/ICD/e-reçete/doz, hukuk, uzman sohbet)', () => {
    for (const g of ['soap', 'not-uretimi', 'klinik-analiz', 'uzman-analiz', 'sohbet-uzman'] as Gorev[]) {
      assert.equal(GOREV_POLITIKASI[g].kademe, 'guclu', g)
    }
  })

  it('HIZLI yalnız dar klinik-dışı liste — yeni bir HIZLI görev bu testi bilinçli güncellemeden eklenemez', () => {
    const hizli = (Object.keys(GOREV_POLITIKASI) as Gorev[]).filter((g) => GOREV_POLITIKASI[g].kademe === 'hizli').sort()
    assert.deepEqual(hizli, ['bicimlendirme', 'cikarim', 'kisa-yanit', 'ozet', 'siniflandirma', 'sohbet'])
  })

  it('F3: GÜÇLÜ sohbet turunun tavanı 1600 (800 uzun klinik cevabı JSON ortasında kesiyordu)', () => {
    assert.ok(GOREV_POLITIKASI['sohbet-uzman'].maxTokens >= 1600)
  })

  it('varsayılan modeller: Sonnet 4.6 / Haiku 4.5; ortam değişkeni geçerliyse onu, geçersizse varsayılanı kullanır', () => {
    const eski = { g: process.env.NOTYA_MODEL_GUCLU, h: process.env.NOTYA_MODEL_HIZLI }
    try {
      delete process.env.NOTYA_MODEL_GUCLU
      delete process.env.NOTYA_MODEL_HIZLI
      assert.equal(gucluModel(), MODEL_GUCLU)
      assert.equal(hizliModel(), MODEL_HIZLI)
      process.env.NOTYA_MODEL_GUCLU = 'yeni-model-1'
      assert.equal(modelSec('soap').model, 'yeni-model-1')
      process.env.NOTYA_MODEL_GUCLU = 'bozuk model; drop'
      assert.equal(gucluModel(), MODEL_GUCLU)
    } finally {
      if (eski.g === undefined) delete process.env.NOTYA_MODEL_GUCLU; else process.env.NOTYA_MODEL_GUCLU = eski.g
      if (eski.h === undefined) delete process.env.NOTYA_MODEL_HIZLI; else process.env.NOTYA_MODEL_HIZLI = eski.h
    }
  })

  it('bilinmeyen görev sessizce ucuz modele düşmez — hata fırlatır', () => {
    assert.throws(() => modelSec('bilinmeyen' as Gorev), /Bilinmeyen AI görevi/)
  })
})

describe('asistan sohbeti yönlendirme — şüphede GÜÇLÜ', () => {
  const yon = (mesaj: string, hastaBaglami = false, niyet: string | null = null) => asistanModelYonlendir({ mesaj, hastaBaglami, niyet }).gorev

  it('şüpheli / belirsiz mesaj → GÜÇLÜ', () => {
    for (const m of ['bunu nasıl değerlendirirsin', 'sence ne yapmalıyız', 'devam et', 'evet', 'tamam', 'olur', 'peki', 'iyi', 'hmm', '', 'bir şey soracağım']) {
      assert.equal(yon(m), 'sohbet-uzman', m)
    }
  })

  it('net sosyal mesaj → HIZLI', () => {
    for (const m of ['Merhaba', 'merhaba hocam', 'Günaydın!', 'teşekkürler', 'Çok teşekkür ederim', 'sağ ol', 'sağolun hocam', 'nasılsın?', 'iyi akşamlar', 'kolay gelsin', 'görüşürüz']) {
      assert.equal(yon(m), 'sohbet', m)
    }
  })

  it('hasta bağlamı varsa kısa/sosyal mesaj bile → GÜÇLÜ', () => {
    for (const m of ['teşekkürler', 'merhaba', 'peki', 'ok']) assert.equal(yon(m, true), 'sohbet-uzman', m)
  })

  it('sosyal kelimeyle başlayıp devam eden istek → GÜÇLÜ', () => {
    assert.equal(yon('merhaba, bu tabloyu nasıl yorumlarsın'), 'sohbet-uzman')
    assert.equal(yon('teşekkürler, bir de şunu sorayım'), 'sohbet-uzman')
  })

  it('klinik kök/kısaltma, ilaç, tanı, tetkik, görüntü, lab, doz, risk skoru → GÜÇLÜ', () => {
    for (const m of ['amoksisilin dozu', 'EKG yorumla', 'röntgende ne görüyorsun', 'OCT sonucu', 'lab değerleri', 'SCORE2 risk', 'tetkik öner', 'ayırıcı tanı', 'CRP 45', 'hasta nasıl eklenir']) {
      assert.equal(yon(m), 'sohbet-uzman', m)
    }
  })

  it('eylem niyeti → GÜÇLÜ', () => {
    assert.equal(yon('kaydet', false, 'CREATE_PATIENT'), 'sohbet-uzman')
    assert.equal(yon('yaz', false, 'ADD_PRESCRIPTION'), 'sohbet-uzman')
  })

  it('uygulama kullanımı sorusu (klinik sinyalsiz, hastasız) → HIZLI', () => {
    for (const m of ['şifremi nasıl değiştiririm', 'karanlık mod nerede', 'abonelik ücreti ne kadar', 'ayarlar menüsü nerede']) {
      assert.equal(yon(m), 'sohbet', m)
    }
  })

  it('uygulama sorusu klinik sinyal ya da hasta bağlamı taşıyorsa → GÜÇLÜ', () => {
    assert.equal(yon('ekranda röntgen nerede görünüyor'), 'sohbet-uzman')
    assert.equal(yon('ayarlar menüsü nerede', true), 'sohbet-uzman')
  })

  it('netSosyalMi dolgu kelimesini tek başına sosyal saymaz', () => {
    assert.equal(netSosyalMi('iyi'), false)
    assert.equal(netSosyalMi('hocam'), false)
    assert.equal(netSosyalMi('iyi günler hocam'), true)
  })
})

describe('sohbet geçmişi kırpma', () => {
  it('modele en fazla 8 mesaj gider ve ilk mesaj kullanıcıdır', () => {
    const m = Array.from({ length: 20 }, (_, i) => ({ role: i % 2 === 0 ? 'user' : 'assistant', content: String(i) }))
    const k = gecmisiKirp(m)
    assert.equal(SOHBET_GECMIS_MESAJ, 8)
    assert.ok(k.length <= 8)
    assert.equal(k[0].role, 'user')
    assert.equal(k[k.length - 1].content, '19')
  })

  it('baştaki asistan mesajları atılır; kullanıcı yoksa boş', () => {
    assert.deepEqual(gecmisiKirp([{ role: 'assistant', content: 'a' }, { role: 'user', content: 'b' }]), [{ role: 'user', content: 'b' }])
    assert.deepEqual(gecmisiKirp([{ role: 'assistant', content: 'a' }]), [])
  })
})
