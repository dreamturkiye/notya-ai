/**
 * NOTYA-KALKAN-01 — sınıf, yankı, taslak, onay.
 * Sentetik veri. Migration uygulanmaz; sahte tablo yeter.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { SahteVeritabani } from '@/lib/security/testing/sahteSupabase'
import { encryptPII } from '@/lib/security/encryption'
import { olaylariAyikla, kalkanAyikla } from '@/lib/iletisim/otomatik/whatsapp/webhook'
import { METIN, siniflandir } from '@/lib/iletisim/kalkan/sinif'
import { hekimNiyeti } from '@/lib/iletisim/kalkan/niyet'
import { kalkanIsle } from '@/lib/iletisim/kalkan/isle'
import { kalkanOnayla } from '@/lib/iletisim/kalkan/onayla'

process.env.ENCRYPTION_MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'qa-kalkan-anahtar'

const AN = new Date('2026-09-25T22:14:00.000Z')
const TEL = '905321112233'

function sahne() {
  const db = new SahteVeritabani()
  const doktor = randomUUID()
  const hasta = randomUUID()
  const ilac = randomUUID()
  db.ekle('users', { id: doktor, subscription_tier: 'pro' })
  db.ekle('doktor_whatsapp_baglantilari', { doctor_id: doktor, phone_number_id: 'pn1', token_encrypted: encryptPII('tok'), durum: 'bagli', gorunen_numara: '905550000099' })
  db.ekle('patients', {
    id: hasta, doctor_id: doktor, is_active: true,
    phone_encrypted: encryptPII('0532 111 22 33'),
    name_encrypted: encryptPII(JSON.stringify({ ad: 'Elif', soyad: 'Yılmaz' })),
    dob_encrypted: encryptPII('2019-04-01'),
  })
  db.ekle('hasta_ilaclar', { id: ilac, doctor_id: doktor, patient_id: hasta, ilac_adi: 'Amoksisilin', aktif: true })
  return { db, doktor, hasta, ilac }
}

describe('Kalkan sınıf ve niyet', () => {
  it('üç Türkçe örnek doğru sınıfa düşer', () => {
    assert.equal(siniflandir({ metin: 'amoksisilini 2 gün daha içsin mi' }).sinif, 'tibbi')
    assert.equal(siniflandir({ metin: 'yarın 14:00’ü 16:00 yapabilir miyiz' }).sinif, 'randevu')
    assert.equal(siniflandir({ metin: 'nefesi kesildi' }).sinif, 'kirmizi')
    assert.equal(siniflandir({ metin: '', tip: 'image' }).sinif, 'belirsiz')
    assert.equal(hekimNiyeti('Bu gece ilaca devam etmeye gerek yok')?.kapsam, 'bu_gece')
    assert.equal(hekimNiyeti('yarın sabah tek doz daha')?.eylem, 'son_doz')
    assert.equal(hekimNiyeti('ateş 38,5 olursa yazın')?.eylem, 'ev_talimati')
    assert.equal(hekimNiyeti('yarın gelin')?.eylem, 'kontrol_randevu')
  })

  it('teslim ayıklayıcısı gövde döndürmez; kalkan ayrı okur', () => {
    const govde = {
      object: 'whatsapp_business_account',
      entry: [{ changes: [
        { field: 'messages', value: { metadata: { phone_number_id: 'pn1' }, messages: [{ id: 'w1', from: TEL, timestamp: '1758845640', type: 'text', text: { body: 'GIZLI-GOVDE' } }], statuses: [{ id: 'w0', status: 'delivered', timestamp: '1', recipient_id: TEL }] } },
        { field: 'smb_message_echoes', value: { metadata: { phone_number_id: 'pn1' }, message_echoes: [{ id: 'e1', to: TEL, timestamp: '1', type: 'text', text: { body: 'GIZLI-ECHO' } }] } },
      ] }],
    }
    const eski = JSON.stringify(olaylariAyikla(govde))
    assert.ok(!eski.includes('GIZLI-GOVDE'))
    assert.ok(!eski.includes('GIZLI-ECHO'))
    const ham = kalkanAyikla(govde)
    assert.equal(ham.length, 2)
    assert.equal(ham[0].yon, 'gelen')
    assert.equal(ham[1].yon, 'giden_hekim')
    assert.equal(ham[1].govde, 'GIZLI-ECHO')
  })
})

describe('Kalkan defter ve Fısıltı taslağı', () => {
  it('veli sorusu kilitli cümle yazar, ilaç taslağı açmaz', async () => {
    const s = sahne()
    const gonderilen: string[] = []
    const onceHasta = s.db.tablo('patients').length
    await kalkanIsle(s.db.istemci() as never, [{
      phoneNumberId: 'pn1', wamid: 'gelen-1', karsiNumara: TEL, zaman: AN.toISOString(), tip: 'text',
      govde: 'amoksisilin devam etsin mi?', mediaId: null, yon: 'gelen',
    }], { simdi: AN, gonder: async (b) => { gonderilen.push(b.metin) } })
    assert.equal(s.db.tablo('patients').length, onceHasta)
    assert.equal(s.db.tablo('wa_taslak').length, 0)
    assert.equal(s.db.tablo('hasta_ilaclar')[0].aktif, true)
    const gelen = s.db.tablo('wa_satir').find((r) => r.yon === 'gelen')
    assert.equal(gelen?.sinif, 'tibbi')
    assert.equal(gelen?.eslesme, 'veli')
    assert.equal(gelen?.hasta_id, s.hasta)
    assert.equal(gonderilen.length, 1)
    assert.ok(gonderilen[0].startsWith(METIN.tibbi))
    assert.ok(!/amoksisilin/i.test(gonderilen[0]))
  })

  it('hekim yankısı taslak üretir, kartı değiştirmez, ikinci kez cevaplamaz', async () => {
    const s = sahne()
    const gonderilen: string[] = []
    const opt = { simdi: AN, gonder: async (b: { metin: string }) => { gonderilen.push(b.metin) } }
    await kalkanIsle(s.db.istemci() as never, [{
      phoneNumberId: 'pn1', wamid: 'echo-1', karsiNumara: TEL, zaman: AN.toISOString(), tip: 'text',
      govde: 'Bu gece ilaca devam etmeye gerek yok.', mediaId: null, yon: 'giden_hekim',
    }], opt)
    assert.equal(gonderilen.length, 0)
    assert.equal(s.db.tablo('hasta_ilaclar')[0].aktif, true)
    const taslak = s.db.tablo('wa_taslak')[0]
    assert.ok(taslak)
    assert.match(taslak.metin, /Elif Yılmaz/)
    assert.match(taslak.metin, /Amoksisilin — durduruldu \(bu gece\)/)
    assert.match(taslak.metin, /Kaynak: WhatsApp,/)
    assert.match(taslak.metin, /01:14/)
    assert.match(taslak.metin, /Hekim onayı bekliyor/)
    assert.equal(s.db.tablo('wa_satir').find((r) => r.wamid === 'echo-1')?.yon, 'giden_hekim')
    await kalkanIsle(s.db.istemci() as never, [{
      phoneNumberId: 'pn1', wamid: 'echo-1', karsiNumara: TEL, zaman: AN.toISOString(), tip: 'text',
      govde: 'Bu gece ilaca devam etmeye gerek yok.', mediaId: null, yon: 'giden_hekim',
    }], opt)
    assert.equal(s.db.tablo('wa_taslak').length, 1)
    const onay = await kalkanOnayla(s.db.istemci() as never, { doktorId: s.doktor, taslakId: taslak.id })
    assert.equal(onay.durum, 'onaylandi')
    assert.equal(s.db.tablo('hasta_ilaclar')[0].aktif, false)
    assert.equal(s.db.tablo('wa_taslak')[0].durum, 'onaylandi')
  })

  it('bilinmeyen numara hasta açmaz; iki kardeş taslak açmaz', async () => {
    const s = sahne()
    const gonderilen: string[] = []
    await kalkanIsle(s.db.istemci() as never, [{
      phoneNumberId: 'pn1', wamid: 'yabanci', karsiNumara: '905309998877', zaman: AN.toISOString(), tip: 'text',
      govde: 'randevu alabilir miyim', mediaId: null, yon: 'gelen',
    }], { simdi: AN, gonder: async (b) => { gonderilen.push(b.metin) } })
    assert.equal(s.db.tablo('patients').length, 1)
    assert.equal(s.db.tablo('wa_satir').find((r) => r.wamid === 'yabanci')?.eslesme, 'bilinmeyen')

    const kardes = randomUUID()
    s.db.ekle('patients', {
      id: kardes, doctor_id: s.doktor, is_active: true,
      phone_encrypted: encryptPII('0532 111 22 33'),
      name_encrypted: encryptPII(JSON.stringify({ ad: 'Can', soyad: 'Yılmaz' })),
      dob_encrypted: encryptPII('2021-01-01'),
    })
    await kalkanIsle(s.db.istemci() as never, [{
      phoneNumberId: 'pn1', wamid: 'echo-kardes', karsiNumara: TEL, zaman: AN.toISOString(), tip: 'text',
      govde: 'Bu gece ilaca devam etmeye gerek yok.', mediaId: null, yon: 'giden_hekim',
    }], { simdi: AN, gonder: async () => { gonderilen.push('olmamali') } })
    assert.equal(s.db.tablo('wa_taslak').length, 0)
    assert.equal(s.db.tablo('wa_satir').find((r) => r.wamid === 'echo-kardes')?.eslesme, 'coklu')
    assert.equal(s.db.tablo('hasta_ilaclar')[0].aktif, true)
  })

  it('starter ve eksik tablo susar', async () => {
    const s = sahne()
    s.db.tablo('users')[0].subscription_tier = 'starter'
    const r = await kalkanIsle(s.db.istemci() as never, [{
      phoneNumberId: 'pn1', wamid: 's1', karsiNumara: TEL, zaman: null, tip: 'text', govde: 'merhaba', mediaId: null, yon: 'gelen',
    }], { simdi: AN, gonder: async () => { throw new Error('gitmemeli') } })
    assert.equal(r.yazilan, 0)
    const kapali = {
      from: () => ({
        select: () => kapali.from(),
        eq: () => kapali.from(),
        maybeSingle: async () => ({ data: null, error: { code: '42P01', message: 'relation does not exist' } }),
      }),
    }
    const r2 = await kalkanIsle(kapali as never, [{
      phoneNumberId: 'pn1', wamid: 's2', karsiNumara: TEL, zaman: null, tip: 'text', govde: 'merhaba', mediaId: null, yon: 'gelen',
    }])
    assert.equal(r2.yazilan, 0)
  })
})
