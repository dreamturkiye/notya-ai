/**
 * NOTYA-UZ-DOKTOR-PERSONA-SES-01 — regresyon kilidi. `uzDoktorPersonaSesi.ts` Claude'un çıkardığı
 * (owner-authored DEĞİL) gender/voice verisidir; bu test sadece "30/30 branş kapsanıyor, hiçbiri
 * çökmez, voiceId gerçek TR_VOICES havuzundan geliyor" garantisini kilitler — isim/branş eşleşmesi
 * countries/uz/klinik/asistanAdlari.test.ts'in sahası (owner fingerprint kilidi orada).
 *
 * NOTYA-ASISTAN-PERSONA-SES-01 (2026-10-18): `uzDoktorPersonaSesi.ts` artık doğrudan
 * `@/countries/uz/...` import ETMİYOR (D1 duvar ihlali düzeltildi — scripts/ulke-duvarlari.mjs) —
 * `countries/active` üzerinden okuyor. Bu yüzden, lib/ulke/ulke.uz.test.ts'teki desenin aynısı:
 * `NOTYA_COUNTRY=uz` her import'tan ÖNCE sabitlenir, ve test altındaki modül dinamik import ile
 * o sabitlemeden SONRA yüklenir.
 */
process.env.NOTYA_COUNTRY = 'uz'

import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'

describe('uzDoktorPersonaSesi — 30 UZ Doktor branşının her biri için gender + voiceId, hiçbiri çökmez', () => {
  let TR_VOICES: typeof import('./elevenVoices').TR_VOICES
  let uzDoktorPersonaSesi: typeof import('./uzDoktorPersonaSesi').uzDoktorPersonaSesi
  // Beklenen 30 anahtar listesi, countries/active ÜZERİNDEN (AKTIF_PAKET.asistanSesleri.bransaGore) — bu
  // dosyadan countries/uz/... DOĞRUDAN import edilmez (D1, lib/ulke/ulkeDuvarlari.test.ts tam denetimi yapar).
  let anahtarlar: string[]

  before(async () => {
    ;({ TR_VOICES } = await import('./elevenVoices'))
    ;({ uzDoktorPersonaSesi } = await import('./uzDoktorPersonaSesi'))
    const { AKTIF_PAKET } = await import('@/countries/active')
    anahtarlar = Object.keys(AKTIF_PAKET.asistanSesleri?.bransaGore ?? {})
  })

  it('asistanAdlari.ts\'in 30 Doktor anahtarının her biri bir sonuç döner (null değil)', () => {
    assert.equal(anahtarlar.length, 30, 'asistanAdlari.ts\'in doktor tarafı 30 olmalı')
    for (const anahtar of anahtarlar) {
      const ses = uzDoktorPersonaSesi(anahtar)
      assert.ok(ses, `${anahtar} için gender/voice eksik`)
      assert.ok(ses!.gender === 'female' || ses!.gender === 'male', `${anahtar} için gender geçersiz`)
      assert.ok(ses!.voiceId, `${anahtar} için voiceId boş`)
    }
  })

  it('her voiceId gerçek TR_VOICES havuzunda var olan bir id — yeni ses İCAT EDİLMEDİ', () => {
    const trVoiceIds = new Set(Object.values(TR_VOICES).map((v): string => v.voiceId))
    for (const anahtar of anahtarlar) {
      const ses = uzDoktorPersonaSesi(anahtar)!
      assert.ok(trVoiceIds.has(ses.voiceId), `${anahtar}: "${ses.voiceId}" TR_VOICES'ta yok — yeni ses uydurulmuş olabilir`)
    }
  })

  it('bilinmeyen/Klinik-taraflı bir anahtar için null döner (icat etmez)', () => {
    assert.equal(uzDoktorPersonaSesi('bu-rosterde-olmayan-yeni-dal'), null)
    // 'sac-ekimi' asistanAdlari.ts'te var ama taraf: 'klinik-hekim' — Doktor ses tablosunda yok.
    assert.equal(uzDoktorPersonaSesi('sac-ekimi'), null)
  })

  it('pediatri → female (Malika), enfeksiyon-hastaliklari → male (Otabek) — bilinen iki örnek çapraz kontrol', () => {
    assert.equal(uzDoktorPersonaSesi('pediatri')!.gender, 'female')
    assert.equal(uzDoktorPersonaSesi('enfeksiyon-hastaliklari')!.gender, 'male')
  })

  it('female/male sayımı toplamı 30 — asistanAdlari.ts\'e yeni bir Doktor branşı eklenip bu dosya unutulursa bu test de kırılır', () => {
    const genders = anahtarlar.map((a) => uzDoktorPersonaSesi(a)!.gender)
    const female = genders.filter((g) => g === 'female').length
    const male = genders.filter((g) => g === 'male').length
    assert.equal(female + male, 30)
    assert.equal(female, 14)
    assert.equal(male, 16)
  })

  it('kaynak dosyada ACTUAL import artık @/countries/active üzerinden, @/countries/uz/... DOĞRUDAN import edilmiyor (D1)', async () => {
    // Tam D1 duvar denetimi lib/ulke/ulkeDuvarlari.test.ts'te (gerçek import graph analiz). Burada sadece bu
    // dosyanın import SATIRINI kilitleriz — başlıktaki tarihçe metnindeki geçmiş bahsi ("used to import …")
    // yanlış eşleşmesin diye yalnız gerçek `import … from '…'` satırlarını tarıyoruz.
    const { readFileSync } = await import('node:fs')
    const kaynak = readFileSync(new URL('./uzDoktorPersonaSesi.ts', import.meta.url), 'utf8')
    const importSatirlari = [...kaynak.matchAll(/^import .*$/gm)].map((m) => m[0])
    assert.ok(importSatirlari.some((s) => s.includes("from '@/countries/active'")), 'uzDoktorPersonaSesi.ts countries/active üzerinden okumalı')
    assert.ok(importSatirlari.every((s) => !s.includes('@/countries/uz/')), 'uzDoktorPersonaSesi.ts hâlâ countries/uz\'u doğrudan import ediyor — D1 ihlali geri geldi')
  })
})
