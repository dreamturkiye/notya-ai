/**
 * NOTYA-PAKET-01 + NOTYA-SUT-01 — paket, SUT kapısı, kopya.
 * Sentetik. Migration 104 uygulanmaz.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { SahteVeritabani } from '@/lib/security/testing/sahteSupabase'
import { soapGovdesi, paketYaz, paketKalkanIsle, bosGovde } from '@/lib/seansPaketi/doldur'
import { sutKurallari, kopyaKilitliMi, gerekceGecerli } from '@/lib/seansPaketi/sutKurallari'
import { mbysMetni, enabizDosyasi } from '@/lib/seansPaketi/mbys'
import { paketSayaci } from '@/lib/seansPaketi/sayac'
import { fisiltiOnayiPaketeGirer, ilaciIsaretle } from '@/lib/seansPaketi/tip'
import { decryptPII } from '@/lib/security/encryption'

process.env.ENCRYPTION_MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'qa-paket-anahtar'

describe('Seans paketi', () => {
  it('SOAP + Kalkan durdur tek satırda durur, listeyi ikinci kez kesmez', async () => {
    const db = new SahteVeritabani()
    const doktor = randomUUID()
    const hasta = randomUUID()
    const ilac = randomUUID()
    db.ekle('hasta_ilaclar', { id: ilac, doctor_id: doktor, patient_id: hasta, ilac_adi: 'Amoksisilin', aktif: false })
    const govde = soapGovdesi({
      sikayet: 'öksürük\ntanı %72',
      fizik: 'boğaz kızarık',
      icd: [{ code: 'J06.9', description_tr: 'Üst solunum yolu enfeksiyonu' }],
      ilaclar: [{ ad: 'Amoksisilin', sure: '7 gün', eylem: 'basla' }],
      brans: 'pediatri',
      yasAy: 40,
    })
    assert.ok(!govde.sikayet.includes('%'))
    assert.equal(govde.ilaclar.length, 1)
    await paketYaz(db.istemci() as never, { doktorId: doktor, patientId: hasta, noteId: 'not-1', seansId: 'seans-1', kaynak: 'soap', govde, onaylayan: doktor })
    const once = JSON.stringify(db.tablo('hasta_ilaclar'))
    const ok = await paketKalkanIsle(db.istemci() as never, { doktorId: doktor, patientId: hasta, taslakDurum: 'onaylandi', taslakId: 'tas-1', ilacAd: 'Amoksisilin', eylem: 'durdur' })
    assert.equal(ok, true)
    assert.equal(JSON.stringify(db.tablo('hasta_ilaclar')), once)
    const coz = JSON.parse(decryptPII(String(db.tablo('seans_paketleri')[0].json_encrypted)))
    assert.equal(coz.ilaclar.length, 1)
    assert.equal(coz.ilaclar[0].eylem, 'durdur')
    assert.equal(db.tablo('seans_paketleri')[0].kaynak, 'ikisi')
    assert.equal(db.tablo('hasta_ilaclar')[0].aktif, false)
  })

  it('onaysız Fısıltı taslağı pakete girmez', async () => {
    assert.equal(fisiltiOnayiPaketeGirer('bekliyor'), false)
    const db = new SahteVeritabani()
    const yazildi = await paketKalkanIsle(db.istemci() as never, { doktorId: 'd', patientId: 'p', taslakDurum: 'bekliyor', taslakId: 't', ilacAd: 'Amoksisilin', eylem: 'durdur' })
    assert.equal(yazildi, false)
    assert.equal(db.tablo('seans_paketleri').length, 0)
  })

  it('kırmızı süre ve yaş kopyayı kilitler; kısa gerekçe geçmez', () => {
    const sure = sutKurallari(soapGovdesi({ ilaclar: [{ ad: 'Amoksisilin', sure: '21 gün' }], brans: 'pediatri', yasAy: 40 }), { onayli: true })
    assert.ok(sure.some((u) => u.kod === 'antibiyotik_sure' && u.seviye === 'kirmizi'))
    assert.equal(kopyaKilitliMi(null, sure, false), true)
    assert.equal(kopyaKilitliMi('pro', sure, false), false)
    const yas = sutKurallari(soapGovdesi({ ilaclar: [{ ad: 'Amoksisilin 500 mg film tablet', sure: '5 gün' }], brans: 'pediatri', yasAy: 30 }), { onayli: true })
    assert.ok(yas.some((u) => u.kod === 'yas_kilo' && u.seviye === 'kirmizi'))
    assert.equal(gerekceGecerli('kısa'), false)
    assert.equal(gerekceGecerli('Hekim klinik gerekçeyi yazdı'), true)
    assert.equal(kopyaKilitliMi(null, yas, true), false)
    for (const u of [...sure, ...yas]) assert.ok(!/tc|kimlik/i.test(u.cumle))
  })

  it('e-Nabız izni yoksa dosya yok, defter metni durur', () => {
    const g = ilaciIsaretle(bosGovde({ enabizIzin: false, sikayet: 'öksürük' }), { ad: 'Amoksisilin', eylem: 'durdur', kaynak: 'whatsapp' })
    assert.equal(enabizDosyasi(g, { hastaAd: 'Elif' }), null)
    const metin = mbysMetni(g, { tarih: '26 Eylül 2026', hastaAd: 'Elif Yılmaz' })
    assert.match(metin, /Elif Yılmaz/)
    assert.match(metin, /durdur/)
    assert.match(metin, /Notya taslağı/)
    assert.ok(!/resmi belge/i.test(metin))
  })

  it('tablo yoksa yazmaz', async () => {
    const kapali = {
      from: () => ({
        select: () => kapali.from(),
        eq: () => kapali.from(),
        order: () => kapali.from(),
        limit: () => kapali.from(),
        maybeSingle: async () => ({ data: null, error: { code: '42P01', message: 'relation does not exist' } }),
        insert: async () => ({ error: { code: '42P01', message: 'relation does not exist' } }),
      }),
    }
    const ok = await paketYaz(kapali as never, { doktorId: 'd', patientId: 'p', noteId: 'n', kaynak: 'soap', govde: bosGovde(), onaylayan: 'd' })
    assert.equal(ok, false)
  })

  it('sayaç 2 vizit 1 onaylı → 1 açık', () => {
    const s = paketSayaci({ vizit: 2, onayli: 1 })
    assert.equal(s.acik, 1)
    assert.match(s.metin, /2 vizit/)
    assert.match(s.metin, /1 açık/)
    assert.match(paketSayaci({ vizit: 0, onayli: 0 }).metin, /Onaylı seans yok/)
  })
})
