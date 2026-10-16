/**
 * NOTYA-HASTA-ILETISIMI-01 Phase 2 — proves the country consent-wording data layer is complete,
 * distinct per country (no accidental copy-paste of English text into UZ or vice versa), and never
 * drifts into clinical content — same "no diagnosis/dose/ilaç" rule as the Turkish templates
 * (lib/iletisim/toplu/sablonlar.test.ts) and the same shape check the asi-stok/asi-onam country
 * packs already use for their own data layers.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ILETISIM_IZIN_ULKE_PAKETLERI, iletisimIzinPaketi } from './ulkeIzinMetinleri'

const KODLAR = ['US', 'GB', 'CA', 'AU', 'NZ', 'UZ'] as const
const YASAK_KELIMELER = /\btanı\b|\bdoz\b|\d+\s*mg\b|teşhis|diagnosis|prescription|dosage|test result|tahlil/i

describe('NOTYA-HASTA-ILETISIMI-01 Phase 2 · ülke izin metinleri', () => {
  it('altı ülke paketi de tanımlı, her biri kendi kodunu ve dilini taşıyor', () => {
    assert.equal(KODLAR.length, 6)
    for (const kod of KODLAR) {
      const paket = ILETISIM_IZIN_ULKE_PAKETLERI[kod]
      assert.ok(paket, kod)
      assert.equal(paket.ulkeKodu, kod)
      assert.ok(paket.dil.length > 0, kod)
      assert.ok(paket.kaynaklar.length > 0, `${kod}: en az bir kaynak`)
    }
  })

  it('her paketin whatsapp/eposta/sms metni ve açıklaması dolu, ve İngilizce beşlisi birbirinden kopya değil', () => {
    const ingilizceler = (['US', 'GB', 'CA', 'AU', 'NZ'] as const).map((k) => ILETISIM_IZIN_ULKE_PAKETLERI[k].metin.sms)
    for (const kod of KODLAR) {
      const m = ILETISIM_IZIN_ULKE_PAKETLERI[kod].metin
      assert.ok(m.whatsapp.length > 0, `${kod}.whatsapp`)
      assert.ok(m.eposta.length > 0, `${kod}.eposta`)
      assert.ok(m.sms.length > 0, `${kod}.sms`)
      assert.ok(m.aciklama.length > 0, `${kod}.aciklama`)
    }
    // Straight copy-paste across English-speaking countries would defeat the point of localizing
    // wording to each country's actual legal disclosure norm (coordinator instruction) — assert
    // they are not byte-identical to each other.
    assert.equal(new Set(ingilizceler).size, ingilizceler.length)
  })

  it('UZ paketi Uzbek (uz-Latn) dilinde, İngilizce metinlerin birebir çevirisi değil', () => {
    const uz = ILETISIM_IZIN_ULKE_PAKETLERI.UZ
    assert.equal(uz.dil, 'uz-Latn')
    assert.match(uz.metin.sms, /SMS/)
    assert.match(uz.metin.sms, /STOP/)
    assert.doesNotMatch(uz.metin.sms, /[a-zA-Z]{4,}.*consent/i, 'düz İngilizce metin kopyalanmamış olmalı')
  })

  it('hiçbir ülkenin consent satırı (whatsapp/eposta/sms) klinik içerik taşımaz (tanı/doz/ilaç/tahlil)', () => {
    // aciklama hariç: onun tek işi tam olarak "bu mesajlar tanı/tahlil/ilaç İÇERMEZ" demek — negasyon
    // içinde geçen bu kelimeler klinik içerik eklemek değil, tersini güvence altına almaktır.
    for (const kod of KODLAR) {
      const { whatsapp, eposta, sms } = ILETISIM_IZIN_ULKE_PAKETLERI[kod].metin
      assert.doesNotMatch(`${whatsapp}\n${eposta}\n${sms}`, YASAK_KELIMELER, kod)
    }
  })

  it('her paketin aciklama metni vazgeçme/opt-out mekanizmasını adlandırır (STOP veya unsubscribe/obuna)', () => {
    for (const kod of KODLAR) {
      const a = ILETISIM_IZIN_ULKE_PAKETLERI[kod].metin.aciklama
      assert.match(a, /STOP|unsubscribe|bekor/i, kod)
    }
  })

  it('iletisimIzinPaketi: büyük/küçük harf duyarsız arar; bilinmeyen kod null döner', () => {
    assert.equal(iletisimIzinPaketi('gb')?.ulkeKodu, 'GB')
    assert.equal(iletisimIzinPaketi('XX'), null)
  })
})
