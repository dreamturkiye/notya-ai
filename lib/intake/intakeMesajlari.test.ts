/**
 * NOTYA-BETA-0925 (Dr. Gökhan) — hasta bilgi formu tarayıcının İngilizce doğrulamasını gösteriyordu
 * ("Please include an @ in the email address"). Form artık noValidate; her alanın altında Türkçe satır.
 * Synthetic answers only.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import IntakeBolumleri from '@/components/intake/IntakeBolumleri'
import { BRANS_SORULARI } from './bransSorulari'
import { coreBolumlerIcin, intakeFormBolumleri, type IntakeAlan } from './coreAlanlar'
import { INTAKE_MESAJ, intakeAlanHatalari, intakeBicimHatasi, intakeSunucuHataMetni } from './dogrula'

const NOW = Date.parse('2026-09-25T12:00:00Z')
const INGILIZCE = /please|include|email address|fill out|this field|match the requested/i
const bolumler = (brans: string) => intakeFormBolumleri(coreBolumlerIcin(brans), (BRANS_SORULARI as Record<string, { baslik: string; alanlar: IntakeAlan[] }>)[brans] ?? null)
const alan = (tur: IntakeAlan['tur']): IntakeAlan => ({ id: 'x', etiket: 'X', tur })

describe('Türkçe biçim kuralları', () => {
  it('e-posta: "@" yoksa Türkçe satır (örnekli); geçerli adres geçer', () => {
    assert.equal(intakeBicimHatasi(alan('email'), 'veli.ornek.com'), 'Lütfen geçerli bir e-posta adresi yazın (örnek: ad@ornek.com).')
    assert.equal(intakeBicimHatasi(alan('email'), 'ad@ornek'), INTAKE_MESAJ.eposta)
    assert.equal(intakeBicimHatasi(alan('email'), 'ad@ornek.com'), null)
    assert.equal(intakeBicimHatasi(alan('email'), 'ad.soyad@ornek.com.tr'), null)
  })
  it('telefon: Türk cep, sabit hat ve yurt dışı numarası geçer; harf / kısa numara Türkçe satır', () => {
    for (const t of ['0532 123 45 67', '5321234567', '+90 532 123 45 67', '0212 123 45 67', '+1 202 555 0143']) assert.equal(intakeBicimHatasi(alan('tel'), t), null, t)
    for (const t of ['0532 12', 'yok', '05321234567890123']) assert.equal(intakeBicimHatasi(alan('tel'), t), INTAKE_MESAJ.telefon, t)
  })
  it('tarih: gelecek, 1900 öncesi ve bozuk tarih Türkçe satır', () => {
    assert.equal(intakeBicimHatasi(alan('date'), '2026-09-26', NOW), INTAKE_MESAJ.tarihGelecek)
    assert.equal(intakeBicimHatasi(alan('date'), '1899-12-31', NOW), INTAKE_MESAJ.tarihEski)
    assert.equal(intakeBicimHatasi(alan('date'), '2026-02-30', NOW), INTAKE_MESAJ.tarih)
    assert.equal(intakeBicimHatasi(alan('date'), '2019-04-10', NOW), null)
  })
})

describe('boş form: her zorunlu alan kendi Türkçe satırını alır', () => {
  for (const brans of ['genel', 'pediatri', 'kadin-hastaliklari-dogum', 'kardiyoloji']) {
    it(`${brans}: tüm görünen zorunlu alanlar işaretli, hiçbiri İngilizce değil`, () => {
      const b = bolumler(brans)
      const hatalar = intakeAlanHatalari(b, {}, NOW)
      const zorunlular = b.flatMap((x) => (x.veliKosulu ? [] : x.alanlar)).filter((a) => a.zorunlu && a.tur !== 'bolum-basligi' && !a.gosterEger)
      assert.ok(zorunlular.length > 5)
      for (const a of zorunlular) {
        assert.ok(hatalar[a.id], `${brans}: "${a.etiket}" işaretlenmedi`)
        assert.ok(!INGILIZCE.test(hatalar[a.id]))
        const secim = a.tur === 'radio' || a.tur === 'checkbox-grup' || a.tur === 'select'
        assert.equal(hatalar[a.id], secim ? INTAKE_MESAJ.zorunluSecim : INTAKE_MESAJ.zorunluMetin)
      }
    })
  }
  it('reşit olmayan hastada veli alanları da işaretlenir; e-posta biçimi aynı turda denetlenir', () => {
    const hatalar = intakeAlanHatalari(bolumler('pediatri'), { dogumTarihi: '2019-04-10', eposta: 'veli.ornek.com' }, NOW)
    for (const id of ['veliAd', 'veliSoyad', 'veliYakinligi', 'veliTelefon']) assert.ok(hatalar[id], id)
    assert.equal(hatalar.eposta, INTAKE_MESAJ.eposta)
    assert.equal(hatalar.dogumTarihi, undefined)
  })
  it('sunucu aynı kuralı uygular: bozuk e-posta 400 metni Türkçe', () => {
    const b = bolumler('genel')
    const tam = Object.fromEntries(b.flatMap((x) => x.alanlar).filter((a) => a.zorunlu).map((a) => [a.id, a.tur === 'checkbox-grup' ? [a.secenekler![0]] : a.secenekler ? a.secenekler[0] : a.tur === 'date' ? '1980-01-01' : a.tur === 'tel' ? '0532 123 45 67' : a.tur === 'email' ? 'qa@ornek.com' : a.desen ? '12345678901' : 'Sentetik']))
    assert.equal(intakeSunucuHataMetni(b, tam, NOW), null)
    assert.equal(intakeSunucuHataMetni(b, { ...tam, eposta: 'qa.ornek.com' }, NOW), INTAKE_MESAJ.eposta)
  })
})

describe('form sayfası ve çizim', () => {
  it('sayfa tarayıcı doğrulamasını kapatır (noValidate) ve hataları alanlara verir', () => {
    const sayfa = readFileSync(join(__dirname, '../../app/intake/[token]/page.tsx'), 'utf8')
    assert.match(sayfa, /<form onSubmit=\{gonder\} noValidate/)
    assert.ok(sayfa.includes('hatalar={alanHatalari}'))
    assert.ok(!/required[=\s>]/.test(sayfa))
    const bilesen = readFileSync(join(__dirname, '../../components/intake/IntakeBolumleri.tsx'), 'utf8')
    assert.ok(!/\brequired\b/.test(bilesen), 'native required yok')
    assert.ok(!/setCustomValidity|reportValidity|checkValidity/.test(bilesen))
  })
  it('hata satırı alanın altında, alan aria-invalid; İngilizce metin yok', () => {
    const b = bolumler('genel')
    const hatalar = intakeAlanHatalari(b, { eposta: 'veli.ornek.com' }, NOW)
    const html = renderToStaticMarkup(React.createElement(IntakeBolumleri, { bolumler: b, yanitlar: { eposta: 'veli.ornek.com' }, onDegis: () => {}, nowMs: NOW, hatalar }))
    assert.ok(html.includes('id="alan-eposta"'))
    assert.ok(html.includes('Lütfen geçerli bir e-posta adresi yazın (örnek: ad@ornek.com).'))
    assert.ok(html.includes('aria-invalid="true"'))
    assert.ok(!INGILIZCE.test(html.replace(/placeholder="[^"]*"/g, '')))
  })
})
