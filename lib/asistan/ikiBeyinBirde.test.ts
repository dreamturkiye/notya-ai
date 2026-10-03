/**
 * NOTYA-IKI-BEYIN-BIRDE — confidence gate unit tests (no DB, no model).
 */
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import {
  aramaCevabiGuvenilirMi,
  bosAramaCumlesiMi,
  acikSayimVeyaListeMi,
  ikiBeyinBirdeKapali,
  kimlikAcikDosyayaDusmesinMi,
} from './ikiBeyinBirde'

describe('NOTYA-IKI-BEYIN-BIRDE confidence gate', () => {
  it('recognises empty search templates', () => {
    assert.equal(bosAramaCumlesiMi('Kayıtlarda 0 hasta. Filtre: Aşı.'), true)
    assert.equal(bosAramaCumlesiMi('Son 90 gün 0 hasta. Filtre: İlaç.'), true)
    assert.equal(bosAramaCumlesiMi('Bugün 0 hasta.'), true)
    assert.equal(bosAramaCumlesiMi('Kayıtlarda 3 hasta: Ali, Veli, Ayşe.'), false)
  })

  it('explicit counts and lists stay on the fast path (no slowdown)', () => {
    assert.equal(acikSayimVeyaListeMi('Kaç hastam var?'), true)
    assert.equal(acikSayimVeyaListeMi('Astım tanılı hastaları listele'), true)
    assert.equal(acikSayimVeyaListeMi('Ateşli hastalarım kimler?'), true)
    assert.equal(acikSayimVeyaListeMi('Otitte ilk seçenek tedavi nedir'), false)
    assert.equal(acikSayimVeyaListeMi('Ateşli çocukta parasetamol dozu nedir'), false)
  })

  it('empty 0-hasta on a non-count question is NOT trusted → model + hasta_bul', () => {
    assert.equal(aramaCevabiGuvenilirMi({
      mesaj: 'Otitte ilk seçenek tedavi nedir',
      aramaCevabi: 'Kayıtlarda 0 hasta. Filtre: Plan.',
      cozumTur: 'yok',
    }), false)
    assert.equal(aramaCevabiGuvenilirMi({
      mesaj: 'İlaç etkileşimi var mı kontrol et',
      aramaCevabi: 'Son 90 gün 0 hasta. Filtre: İlaç.',
      cozumTur: 'yok',
    }), false)
  })

  it('explicit count with 0 hasta IS trusted (empty panel is a real answer)', () => {
    assert.equal(aramaCevabiGuvenilirMi({
      mesaj: 'Kaç hastam var?',
      aramaCevabi: 'Kayıtlarda 0 hasta.',
      cozumTur: 'yok',
    }), true)
    assert.equal(aramaCevabiGuvenilirMi({
      mesaj: 'Astım tanılı hastaları listele',
      aramaCevabi: 'Kayıtlarda 0 hasta. Filtre: Tanı.',
      cozumTur: 'yok',
    }), true)
  })

  it('multi-match, chart-open and named who-answers stay trusted', () => {
    assert.equal(aramaCevabiGuvenilirMi({
      mesaj: 'Ali',
      aramaCevabi: '2 hasta: 1. Ali Yılmaz … Hangisini istiyorsunuz',
      cozumTur: 'coklu',
    }), true)
    assert.equal(aramaCevabiGuvenilirMi({
      mesaj: 'Umutcan Türkoğlu dosyasını aç',
      aramaCevabi: 'Umutcan Türkoğlu dosyası açık Hocam. Ne sormak istersiniz?',
      cozumTur: 'tek',
      dosyaAcma: true,
    }), true)
    assert.equal(aramaCevabiGuvenilirMi({
      mesaj: 'Son gördüğüm hasta kimdi?',
      aramaCevabi: 'Son gördüğünüz hasta: Ayşe Yeşil.',
      cozumTur: 'tek',
      cevapliTek: true,
    }), true)
  })

  it('identity from open chart is refused when another person was named', () => {
    assert.equal(kimlikAcikDosyayaDusmesinMi(
      "Bartu Yabancıoğlu'nun annesinin adı ne?",
      'Umutcan Türkoğlu',
      'Umutcan Türkoğlu',
      'Bartu Yabancıoğlu',
    ), true)
    assert.equal(kimlikAcikDosyayaDusmesinMi(
      "Umutcan'ın annesinin adı ne?",
      'Umutcan Türkoğlu',
      'Umutcan Türkoğlu',
      null,
    ), false)
  })

  describe('kill switch', () => {
    const once = process.env.AYSE_IKI_BEYIN_BIRDE_KAPALI
    before(() => { process.env.AYSE_IKI_BEYIN_BIRDE_KAPALI = '1' })
    after(() => {
      if (once === undefined) delete process.env.AYSE_IKI_BEYIN_BIRDE_KAPALI
      else process.env.AYSE_IKI_BEYIN_BIRDE_KAPALI = once
    })
    it('AYSE_IKI_BEYIN_BIRDE_KAPALI=1 trusts every search sentence again', () => {
      assert.equal(ikiBeyinBirdeKapali(), true)
      assert.equal(aramaCevabiGuvenilirMi({
        mesaj: 'Otitte ilk seçenek tedavi nedir',
        aramaCevabi: 'Kayıtlarda 0 hasta. Filtre: Plan.',
        cozumTur: 'yok',
      }), true)
    })
  })
})
