/**
 * NOTYA-MALIYET-01 + NOTYA-MODEL-LUNAPRO-01 — model politikası ve asistan yönlendirme kuralı.
 * Kaan (2026-09-27, LUNAPRO-01): her görevin birincil modeli HIZLI (GPT-6 Luna-Pro), görüntü dahil. Sonnet 5 yalnız
 * koruyucu (G1 transport / G2 low_conf / G3 safety / G4 devre — lib/ai/cagir.ts, lib/ai/devre.ts). Asistan
 * yönlendirmesi sohbet ↔ sohbet-uzman ayırır (prompt, F3) — model için değil.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  asistanModelYonlendir, gecmisiKirp, GOREV_POLITIKASI, gucluModel, hizliModel, modelSec, netSosyalMi,
  SOHBET_GECMIS_MESAJ, MODEL_GUCLU, MODEL_HIZLI, type Gorev, gorevNedeni, guvenlikSinyaliVar, dusukGuvenMi,
} from './modeller'

describe('görev politikası — kademe tablosu', () => {
  it('LUNA-02: görüntü/inceleme ayrı bir görev (12000 tavan) ve birincil HIZLI', () => {
    assert.equal(GOREV_POLITIKASI['goruntu-inceleme'].kademe, 'hizli')
    assert.equal(GOREV_POLITIKASI['goruntu-inceleme'].maxTokens, 12000)
    assert.equal(modelSec('goruntu-inceleme').model, hizliModel())
  })

  it('LUNA-02: klinik ve uzman görevler birincil HIZLI (SOAP, not, konsültasyon/ICD/e-reçete/doz, hukuk, uzman sohbet)', () => {
    for (const g of ['soap', 'not-uretimi', 'klinik-analiz', 'uzman-analiz', 'sohbet-uzman'] as Gorev[]) {
      assert.equal(GOREV_POLITIKASI[g].kademe, 'hizli', g)
      assert.equal(modelSec(g).model, hizliModel(), g)
    }
  })

  it('LUNAPRO-01: hiçbir görev birincil GÜÇLÜ değil — Sonnet 5 yalnız cagir.ts kapılarından', () => {
    const guclu = (Object.keys(GOREV_POLITIKASI) as Gorev[]).filter((g) => GOREV_POLITIKASI[g].kademe === 'guclu')
    assert.deepEqual(guclu, [])
  })

  it('LUNAPRO-01: HER görev → birincil (hizli kademe, Luna-Pro), ortam değişkeni yokken', () => {
    const eski = process.env.NOTYA_MODEL_HIZLI
    delete process.env.NOTYA_MODEL_HIZLI
    try {
      for (const g of Object.keys(GOREV_POLITIKASI) as Gorev[]) {
        const s = modelSec(g)
        assert.equal(s.kademe, 'hizli', g)
        assert.equal(s.model, MODEL_HIZLI, g)
        assert.equal(s.model, 'openai/gpt-6-luna-pro', g)
      }
    } finally {
      if (eski !== undefined) process.env.NOTYA_MODEL_HIZLI = eski
    }
  })

  it('görevlerin maxTokens tavanları LUNA-01 ile aynı (F3 — tavan düşürülmedi)', () => {
    const tavan = Object.fromEntries((Object.keys(GOREV_POLITIKASI) as Gorev[]).map((g) => [g, GOREV_POLITIKASI[g].maxTokens]))
    assert.deepEqual(tavan, {
      soap: 8000, 'not-uretimi': 4000, 'klinik-analiz': 2000, 'goruntu-inceleme': 12000, 'uzman-analiz': 2000,
      'sohbet-uzman': 1600, sohbet: 800, siniflandirma: 20, ozet: 300, bicimlendirme: 1000, cikarim: 500, 'kisa-yanit': 300,
    })
  })

  it('F3: GÜÇLÜ sohbet turunun tavanı 1600 (800 uzun klinik cevabı JSON ortasında kesiyordu)', () => {
    assert.ok(GOREV_POLITIKASI['sohbet-uzman'].maxTokens >= 1600)
  })

  it('varsayılan modeller (LUNAPRO-01, 2026-09-27): Sonnet 5 koruyucu / GPT-6 Luna-Pro birincil; ortam değişkeni geçerliyse onu, geçersizse varsayılanı kullanır', () => {
    const eski = { g: process.env.NOTYA_MODEL_GUCLU, h: process.env.NOTYA_MODEL_HIZLI }
    try {
      delete process.env.NOTYA_MODEL_GUCLU
      delete process.env.NOTYA_MODEL_HIZLI
      assert.equal(gucluModel(), MODEL_GUCLU)
      assert.equal(hizliModel(), MODEL_HIZLI)
      process.env.NOTYA_MODEL_GUCLU = 'yeni-model-1'
      assert.equal(gucluModel(), 'yeni-model-1')
      // Geri dönüş anahtarı (LUNAPRO-01): NOTYA_MODEL_HIZLI=anthropic/claude-sonnet-5 → tek yeniden dağıtımda her görev Sonnet 5
      process.env.NOTYA_MODEL_HIZLI = 'anthropic/claude-sonnet-5'
      assert.equal(modelSec('soap').model, 'anthropic/claude-sonnet-5')
      process.env.NOTYA_MODEL_GUCLU = 'bozuk model; drop'
      assert.equal(gucluModel(), MODEL_GUCLU)
      // Geri dönüş anahtarı: OpenRouter slug'ı (eğik çizgi + nokta) geçerli bir değerdir
      process.env.NOTYA_MODEL_HIZLI = 'anthropic/claude-haiku-4.5'
      assert.equal(hizliModel(), 'anthropic/claude-haiku-4.5')
    } finally {
      if (eski.g === undefined) delete process.env.NOTYA_MODEL_GUCLU; else process.env.NOTYA_MODEL_GUCLU = eski.g
      if (eski.h === undefined) delete process.env.NOTYA_MODEL_HIZLI; else process.env.NOTYA_MODEL_HIZLI = eski.h
    }
  })

  it("varsayılan slug'ları: HIZLI (birincil) = openai/gpt-6-luna-pro, GÜÇLÜ (koruyucu) = anthropic/claude-sonnet-5", () => {
    assert.equal(MODEL_HIZLI, 'openai/gpt-6-luna-pro')
    assert.equal(MODEL_GUCLU, 'anthropic/claude-sonnet-5')
  })

  it('LUNA-02 / LUNAPRO-01: görev tek başına yükseltmez — gorevNedeni her görevde null (onayla / vision / uzman emekli)', () => {
    for (const g of Object.keys(GOREV_POLITIKASI) as Gorev[]) assert.equal(gorevNedeni(g), null, g)
    assert.throws(() => gorevNedeni('bilinmeyen' as Gorev), /Bilinmeyen AI görevi/)
  })

  it('güvenlik sinyali: gebe, emzirme, pediatrik doz, warfarin/NSAID, isotretinoin, kontrendikasyon', () => {
    for (const m of ['hasta gebe mi', 'emziren anne', 'çocuk dozu mg/kg', 'warfarin kullanıyor', 'NSAİİ verelim mi', 'ibuprofen', 'isotretinoin başlanacak', 'kontrendike mi']) {
      assert.equal(guvenlikSinyaliVar(m), true, m)
    }
    for (const m of ['şifremi unuttum', 'merhaba', 'karanlık mod']) assert.equal(guvenlikSinyaliVar(m), false, m)
  })

  it('düşük güven: "daha fazla bilgi şart", "emin değilim", ret kalıpları', () => {
    for (const m of ['Bunun için daha fazla bilgi şart.', 'Emin değilim.', 'Bu konuda yardımcı olamam.', "I can't help with that."]) assert.equal(dusukGuvenMi(m), true, m)
    for (const m of ['Merhaba hocam, kolay gelsin!', 'Ayarlar > Tema menüsünden karanlık modu açabilirsiniz.']) assert.equal(dusukGuvenMi(m), false, m)
  })

  it('bilinmeyen görev sessizce ucuz modele düşmez — hata fırlatır', () => {
    assert.throws(() => modelSec('bilinmeyen' as Gorev), /Bilinmeyen AI görevi/)
  })
})

describe('asistan sohbeti yönlendirme — şüphede uzman tur (sohbet-uzman)', () => {
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
