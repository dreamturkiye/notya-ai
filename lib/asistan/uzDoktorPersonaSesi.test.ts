/**
 * NOTYA-UZ-DOKTOR-PERSONA-SES-01 — regresyon kilidi. `uzDoktorPersonaSesi.ts` Claude'un çıkardığı
 * (owner-authored DEĞİL) gender/voice verisidir; bu test sadece "30/30 branş kapsanıyor, hiçbiri
 * çökmez, voiceId gerçek TR_VOICES havuzundan geliyor" garantisini kilitler — isim/branş eşleşmesi
 * countries/uz/klinik/asistanAdlari.test.ts'in sahası (owner fingerprint kilidi orada).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { TR_VOICES } from './elevenVoices'
import { UZ_ASISTAN_ADLARI } from '@/countries/uz/klinik/asistanAdlari'
import { uzDoktorPersonaSesi } from './uzDoktorPersonaSesi'

const TR_VOICE_IDS: ReadonlySet<string> = new Set(Object.values(TR_VOICES).map((v): string => v.voiceId))
const UZ_DOKTOR_ANAHTARLARI = UZ_ASISTAN_ADLARI.filter((a) => a.taraf === 'doktor').map((a) => a.bransAnahtari)

describe('uzDoktorPersonaSesi — 30 UZ Doktor branşının her biri için gender + voiceId, hiçbiri çökmez', () => {
  it('asistanAdlari.ts\'in 30 Doktor anahtarının her biri bir sonuç döner (null değil)', () => {
    assert.equal(UZ_DOKTOR_ANAHTARLARI.length, 30, 'asistanAdlari.ts\'in doktor tarafı 30 olmalı')
    for (const anahtar of UZ_DOKTOR_ANAHTARLARI) {
      const ses = uzDoktorPersonaSesi(anahtar)
      assert.ok(ses, `${anahtar} için gender/voice eksik`)
      assert.ok(ses!.gender === 'female' || ses!.gender === 'male', `${anahtar} için gender geçersiz`)
      assert.ok(ses!.voiceId, `${anahtar} için voiceId boş`)
    }
  })

  it('her voiceId gerçek TR_VOICES havuzunda var olan bir id — yeni ses İCAT EDİLMEDİ', () => {
    for (const anahtar of UZ_DOKTOR_ANAHTARLARI) {
      const ses = uzDoktorPersonaSesi(anahtar)!
      assert.ok(TR_VOICE_IDS.has(ses.voiceId), `${anahtar}: "${ses.voiceId}" TR_VOICES'ta yok — yeni ses uydurulmuş olabilir`)
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
    const genders = UZ_DOKTOR_ANAHTARLARI.map((a) => uzDoktorPersonaSesi(a)!.gender)
    const female = genders.filter((g) => g === 'female').length
    const male = genders.filter((g) => g === 'male').length
    assert.equal(female + male, 30)
    assert.equal(female, 14)
    assert.equal(male, 16)
  })
})
