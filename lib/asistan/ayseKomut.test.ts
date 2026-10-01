/**
 * NOTYA-AYSE-GERI-03 — commands reach the tools, end to end (audit §4.4, PR 4).
 *
 * Real /api/asistan/chat and /api/asistan/fish-tur handlers, in-memory database, recording fake model. The fake
 * model answers a forced tool call the way Luna is expected to: it calls the tool the request forces. What is under
 * test is everything around that call — which tool is forced, which patient the card is bound to, what the server
 * resolves by itself (patient name, which appointment), and that NOTHING is written before the doctor confirms.
 *
 * Whether Luna really calls the tool when it is offered is measured by the action audit (S8), not here.
 */
import { ortam, sahneHazirla, sahneKur, hastaEkle, oturumAc, oturumBaglami, yazi, fishTur, sonModelIstegi, zorlananArac, sunulanAraclar, sonRota, sistemde, type Sahne } from './tests/ayseSahne'
import { describe, it, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { bugunTz, isoGunKaydir, yerelAnI } from '../randevu/tarihCozumle'

const TRT = 'Europe/Istanbul'
let s: Sahne
let umutcan: string
const AD = 'Umutcan Türkoğlu'

before(async () => { await sahneHazirla() })
beforeEach(() => {
  s = sahneKur()
  umutcan = hastaEkle(s.doktor.id, AD, { dogum: '2023-04-10', cinsiyet: 'male' })
  hastaEkle(s.doktor.id, 'Rüzgar Kara', { dogum: '2018-01-05' })
  hastaEkle(s.doktor.id, 'Rüzgar Yıldız', { dogum: '2020-07-21' })
  hastaEkle(s.diger.id, 'Zeynep Gizli', { dogum: '2017-03-03' })
})

const taslaklar = () => ortam.db.tablo('eylem_onerileri').filter((r) => r.durum === 'taslak')
const yarin = () => isoGunKaydir(bugunTz(TRT), 1)
const gun = (n: number) => isoGunKaydir(bugunTz(TRT), n)
const kaynak = (alanlar: Record<string, unknown>) => Object.fromEntries(Object.keys(alanlar).map((k) => [k, { kaynak: 'doktor_soyledi' }]))
/** The fake model calls the tool the request forces (or `varsayilan`) with these fields. */
function aracla(alanlar: Record<string, unknown>, varsayilan?: string) {
  ortam.yanit = (istek) => {
    const ad = istek.tool_choice?.type === 'tool' ? String(istek.tool_choice.name) : varsayilan
    return ad ? { metin: '', araclar: [{ name: ad, input: { ...alanlar, alan_kaynaklari: kaynak(alanlar) } }] } : { metin: JSON.stringify({ speech: 'Hangi hasta için Hocam?' }) }
  }
}
function randevuEkle(doktorId: string, patientId: string, tarih: string, saat: string, sureDk = 20) {
  const baslangic = yerelAnI(tarih, saat, TRT)
  return ortam.db.ekle('randevular', { doktor_id: doktorId, patient_id: patientId, baslangic, bitis: new Date(new Date(baslangic).getTime() + sureDk * 60000).toISOString(), tur: 'kontrol', durum: 'planlandi', hatirlatma_gonderildi: true })
}
function hastaNotlari(id: string): Record<string, unknown> {
  const r = ortam.db.tablo('patients').find((x) => x.id === id)!
  return JSON.parse(require('../security/encryption').decrypt(String(r.notes_encrypted))) as Record<string, unknown>
}

describe('komut → zorlanan araç → kart; onaydan önce hiçbir şey yazılmaz', () => {
  const ornekler: { soz: string; arac: string; alanlar: Record<string, unknown>; tablo: string }[] = [
    { soz: 'Penisilin alerjisini ekle', arac: 'alerji_ekle', alanlar: { alerji: 'Penisilin' }, tablo: 'patients' },
    { soz: 'Astım tanısını kronik hastalıklara ekle', arac: 'kronik_hastalik_ekle', alanlar: { hastalik: 'Astım' }, tablo: 'patients' },
    { soz: 'Amoksisilin 250 mg günde iki kez ilaçlarına ekle', arac: 'ilac_ekle', alanlar: { ilac_adi: 'Amoksisilin', doz: '250 mg', kullanim_sikli: 'günde 2 kez' }, tablo: 'hasta_ilaclar' },
    { soz: 'Kilosunu 12,4 kilo olarak ekle', arac: 'olcum_ekle', alanlar: { kilo: 12.4 }, tablo: 'notes' },
    { soz: 'Baş çevresi 47 santim, kaydet', arac: 'bas_cevresi_ekle', alanlar: { basCevresi: 47 }, tablo: 'notes' },
    { soz: 'Dosyasına not al: annesi sigarayı bıraktı', arac: 'dosya_notu_ekle', alanlar: { metin: 'Annesi sigarayı bıraktı.' }, tablo: 'notes' },
    { soz: 'Hepatit B aşısı 1 Eylül 2026’da yapıldı, kaydet', arac: 'asi_kaydi_ekle', alanlar: { asi_adi: 'Hepatit B', uygulama_tarihi: '2026-09-01' }, tablo: 'asilar' },
  ]
  for (const o of ornekler) {
    it(`${o.soz} → ${o.arac}`, async () => {
      const oturum = oturumAc(s, { id: umutcan, ad: AD })
      aracla(o.alanlar)
      const satirOnce = ortam.db.tablo(o.tablo).length
      const notOnce = JSON.stringify(hastaNotlari(umutcan))
      const y = await yazi(s, o.soz, { oturum })
      assert.equal(y.rota, 'model')
      const istek = sonModelIstegi()
      assert.equal(zorlananArac(istek), o.arac, 'araç adıyla zorlanır')
      assert.deepEqual(sunulanAraclar(istek), [o.arac], 'adı geçen araç tek başına sunulur')
      assert.equal(y.eylemOnerileri.length, 1, y.speech)
      assert.equal(y.eylemOnerileri[0].eylem_anahtar, o.arac)
      assert.equal(y.eylemHastasi?.ad, AD)
      assert.equal(taslaklar().length, 1)
      assert.equal(taslaklar()[0].hasta_id, umutcan)
      // Nothing is written: no row in the target table, the chart blob untouched, no audit row.
      assert.equal(ortam.db.tablo(o.tablo).length, satirOnce, 'kart kayıt değildir')
      assert.equal(JSON.stringify(hastaNotlari(umutcan)), notOnce)
      assert.equal(ortam.db.tablo('eylem_kayitlari').length, 0)
    })
  }

  it('ilaç kes / doz değiştir: T2 araçları zorlanır; aktif ilaç kartta bulunur, liste değişmez', async () => {
    const ilac = ortam.db.ekle('hasta_ilaclar', { patient_id: umutcan, doctor_id: s.doktor.id, ilac_adi: 'Ventolin', doz: '100 mcg', kullanim_sikli: '4x2', aktif: true, baslangic_tarihi: '2026-01-01' })
    const oturum = oturumAc(s, { id: umutcan, ad: AD })
    aracla({ ilac_adi: 'Ventolin' })
    const kes = await yazi(s, 'Ventolini kes', { oturum })
    assert.equal(zorlananArac(sonModelIstegi()), 'ilac_sonlandir')
    assert.equal(kes.eylemOnerileri[0]?.eylem_anahtar, 'ilac_sonlandir')
    assert.deepEqual(kes.eylemOnerileri[0].uyarilar, [], 'aktif ilaç bulundu — uyarı yok')
    aracla({ ilac_adi: 'Ventolin', yeni_kullanim: '2x2' })
    const doz = await yazi(s, 'Ventolinin dozunu 2x2 olarak değiştir', { oturum: oturumAc(s, { id: umutcan, ad: AD }) })
    assert.equal(zorlananArac(sonModelIstegi()), 'ilac_doz_degistir')
    assert.equal(doz.eylemOnerileri[0]?.veri.yeni_kullanim, '2x2')
    const satir = ortam.db.tablo('hasta_ilaclar').find((x) => x.id === ilac.id)!
    assert.equal(satir.aktif, true)
    assert.equal(satir.kullanim_sikli, '4x2')
  })

  it('tek araç seçilemeyen kayıt isteği: herhangi bir araç zorlanır, tam araç listesi sunulur', async () => {
    const oturum = oturumAc(s, { id: umutcan, ad: AD })
    aracla({ alerji: 'Penisilin' }, 'alerji_ekle')
    await yazi(s, 'Kilosunu ve penisilin alerjisini kaydet', { oturum })
    const istek = sonModelIstegi()
    assert.equal(zorlananArac(istek), 'any')
    for (const a of ['alerji_ekle', 'olcum_ekle', 'kontrol_randevusu_olustur', 'randevu_tasi', 'randevu_iptal', 'hasta_bilgisi_duzelt']) assert.ok(sunulanAraclar(istek).includes(a), a)
  })

  it('araç şemasında sunucu alanı (randevu_id, mevcut) yoktur; hasta açıkken hasta_adi de yoktur', async () => {
    const oturum = oturumAc(s, { id: umutcan, ad: AD })
    aracla({})
    await yazi(s, 'Randevusunu iptal et', { oturum })
    const arac = (sonModelIstegi()!.govde.tools as { name: string; input_schema: { properties: Record<string, unknown> } }[])[0]
    assert.equal(arac.name, 'randevu_iptal')
    assert.deepEqual(Object.keys(arac.input_schema.properties).sort(), ['alan_kaynaklari', 'mevcut_tarih', 'sebep'])
  })

  it('soru komut değildir: hızlı kart ve takvim eskisi gibi cevaplar', async () => {
    const oturum = oturumAc(s, { id: umutcan, ad: AD })
    assert.equal((await yazi(s, 'Alerjisi var mı?', { oturum })).rota, 'hizli-kart')
    assert.equal((await yazi(s, 'Yarın 15:00 boş mu?', { oturum })).rota, 'takvim')
    assert.equal(ortam.modelIstekleri.length, 0)
  })
})

describe('hasta çözülmeden komut: araç hasta adıyla sunulur, ad sunucuda çözülür', () => {
  it('ad söylenmediyse araç zorlanmaz, hasta_adi alanı sunulur; model sorar', async () => {
    aracla({})
    const y = await yazi(s, 'Bir randevu yapmak istiyorum bir hasta için yardımcı olur musun?')
    assert.equal(y.rota, 'model')
    const istek = sonModelIstegi()
    assert.equal(zorlananArac(istek), null)
    const arac = (istek!.govde.tools as { name: string; input_schema: { properties: Record<string, unknown> } }[]).find((a) => a.name === 'kontrol_randevusu_olustur')!
    assert.ok(arac.input_schema.properties.hasta_adi, 'hasta_adi alanı sunulur')
    assert.ok(!sunulanAraclar(istek).includes('bas_cevresi_ekle'), 'hastaya bağlı araç hasta bilinmeden sunulmaz')
    assert.ok(sistemde(/KOMUT — HASTA HENÜZ BELLİ DEĞİL/), 'hastasız komut bloğu')
    assert.equal(y.speech, 'Hangi hasta için Hocam?')
    assert.ok(!/Filtre:|\d+ hasta\./.test(y.speech))
    assert.equal(taslaklar().length, 0)
  })

  it('model aracı adsız çağırırsa kart çıkmaz: "Hangi hasta için Hocam?"', async () => {
    ortam.yanit = { metin: JSON.stringify({ speech: 'Kartı hazırladım Hocam.' }), araclar: [{ name: 'kontrol_randevusu_olustur', input: { tarih: yarin(), saat: '14:30' } }] }
    const y = await yazi(s, 'Yarın 14:30’a randevu oluştur')
    assert.equal(y.speech, 'Hangi hasta için Hocam?')
    assert.equal(y.eylemOnerileri.length, 0)
    assert.equal(taslaklar().length, 0)
  })

  it('model hasta_adi verirse sunucu kendi hastaları içinde çözer: kart o hastaya, hasta oturumun açık hastası olur', async () => {
    // The resolver did not see a name in THIS sentence (the doctor named the patient a turn earlier); the model passes it.
    ortam.yanit = { metin: '', araclar: [{ name: 'kontrol_randevusu_olustur', input: { hasta_adi: 'Umutcan Türkoğlu', tarih: yarin(), saat: '14:30', alan_kaynaklari: kaynak({ tarih: 1, saat: 1 }) } }] }
    const y = await yazi(s, 'Yarın 14:30’a randevu oluştur')
    assert.equal(y.eylemOnerileri.length, 1, y.speech)
    assert.equal(y.eylemHastasi?.ad, AD)
    assert.equal(y.aktifHasta, AD)
    assert.equal(taslaklar()[0].hasta_id, umutcan)
    assert.equal(taslaklar()[0].veri.hasta_adi, undefined, 'hasta adı kart verisine yazılmaz')
    assert.equal(oturumBaglami(s.oturum).currentPatientId, umutcan)
    assert.equal(ortam.db.tablo('randevular').length, 0, 'onaydan önce randevu yazılmaz')
  })

  it('birden çok hastaya uyan ad: hangisi diye sorulur, kart yok', async () => {
    ortam.yanit = { metin: '', araclar: [{ name: 'alerji_ekle', input: { hasta_adi: 'Rüzgar', alerji: 'Penisilin' } }] }
    const y = await yazi(s, 'Penisilin alerjisini ekle')
    assert.match(y.speech, /Rüzgar Kara/)
    assert.match(y.speech, /Rüzgar Yıldız/)
    assert.match(y.speech, /Hangisini istiyorsunuz/)
    assert.equal(taslaklar().length, 0)
  })

  it('HASTA-IZOLASYON-01: başka doktorun hastasının adı "bulunamadı"dır — var olmayan adla aynı cümle, kart ve okuma yok', async () => {
    const cumle = (ad: string) => `“${ad}” adında bir hasta kayıtlarınızda bulamadım Hocam; adını ve soyadını tam söyler misiniz?`
    for (const ad of ['Zeynep Gizli', 'Olmayan Kişi']) {
      ortam.yanit = { metin: '', araclar: [{ name: 'kontrol_randevusu_olustur', input: { hasta_adi: ad, tarih: yarin(), saat: '10:00' } }] }
      const y = await yazi(s, 'Yarın 10:00’a randevu oluştur', { oturum: oturumAc(s) })
      assert.equal(y.speech, cumle(ad))
      assert.equal(y.eylemOnerileri.length, 0)
      assert.equal(y.aktifHasta, null)
    }
    assert.equal(taslaklar().length, 0)
    assert.equal(ortam.db.tablo('eylem_onerileri').length, 0)
    // The other doctor, same words: his own patient resolves.
    ortam.yanit = { metin: '', araclar: [{ name: 'kontrol_randevusu_olustur', input: { hasta_adi: 'Zeynep Gizli', tarih: yarin(), saat: '10:00', alan_kaynaklari: kaynak({ tarih: 1, saat: 1 }) } }] }
    const digerOturum = ortam.db.ekle('asistan_sessions', { doctor_id: s.diger.id, persona_id: 'aysekaya', messages: [], active_context: {} }).id as string
    const d = await yazi(s, 'Yarın 10:00’a randevu oluştur', { oturum: digerOturum, token: s.diger.token })
    assert.equal(d.eylemHastasi?.ad, 'Zeynep Gizli')
  })

  it('yanlış hasta koruması: açık dosya varken adı anılan başka kişi bulunamazsa açık hastaya kart hazırlanmaz', async () => {
    const oturum = oturumAc(s, { id: umutcan, ad: AD })
    aracla({ tarih: yarin(), saat: '11:00' }, 'kontrol_randevusu_olustur')
    const y = await yazi(s, 'Ali Yılmaz için yarın 11:00’e randevu oluştur', { oturum })
    assert.equal(y.eylemOnerileri.length, 0, 'Ali Yılmaz’ın randevusu Umutcan’ın kartına yazılmaz')
    assert.equal(zorlananArac(sonModelIstegi()), null)
    assert.notEqual(y.eylemHastasi?.ad, AD)
    assert.equal(taslaklar().length, 0)
    assert.ok(sistemde(/BU TURDA AÇIK HASTA DOSYASI YOK/), 'açık dosya bu tura bağlanmaz')
  })

  it('adı cümlede geçen hasta: açık dosya olmadan zorlanan araç o hastaya bağlanır', async () => {
    aracla({ alerji: 'Fıstık' })
    const y = await yazi(s, 'Umutcan Türkoğlu dosyasına fıstık alerjisi ekle')
    assert.equal(zorlananArac(sonModelIstegi()), 'alerji_ekle')
    assert.equal(y.eylemHastasi?.ad, AD)
    assert.equal(taslaklar()[0].hasta_id, umutcan)
  })
})

describe('randevu — oluştur, saat değiştir, iptal; sesle onay (Fish)', () => {
  it('oluştur: tarihli cümle takvim okumasına gitmez; kart → sesli okuma → "Evet" → randevu takvimde', async () => {
    const oturum = oturumAc(s, { id: umutcan, ad: AD })
    aracla({ tarih: yarin(), saat: '14:00' })
    const k = await fishTur(s, 'Yarın saat 14:00 için kontrol randevusu oluştur', { oturum })
    assert.equal(sonRota(), 'model')
    assert.equal(zorlananArac(sonModelIstegi()), 'kontrol_randevusu_olustur')
    assert.match(k.soz, /Umutcan Türkoğlu için Kontrol randevusu hazırladım/)
    assert.match(k.soz, /Saat: 14:00/)
    assert.match(k.soz, /Onaylıyor musunuz\?$/)
    assert.equal(ortam.db.tablo('randevular').length, 0, 'onaydan önce takvime yazılmaz')
    const once = ortam.modelIstekleri.length
    const e = await fishTur(s, 'Evet', { oturum })
    assert.equal(e.soz, 'Randevu oluşturuldu Hocam.')
    assert.equal(ortam.modelIstekleri.length, once)
    const [r] = ortam.db.tablo('randevular')
    assert.equal(r.patient_id, umutcan)
    assert.equal(r.doktor_id, s.doktor.id)
    assert.equal(r.baslangic, yerelAnI(yarin(), '14:00', TRT))
  })

  it('gün ve saat söylenmediyse araç zorlanmaz: tek soru bloğu, boş kart yok', async () => {
    const oturum = oturumAc(s, { id: umutcan, ad: AD })
    ortam.yanit = { metin: JSON.stringify({ speech: 'Hangi gün ve saat kaçta Hocam?' }) }
    const y = await yazi(s, 'Randevu oluştur', { oturum })
    const istek = sonModelIstegi()
    assert.equal(zorlananArac(istek), null)
    assert.ok(sunulanAraclar(istek).includes('kontrol_randevusu_olustur'))
    assert.ok(sistemde(/RANDEVU — EKSİK BİLGİ: gün ve saat/), 'eksik bilgi bloğu')
    assert.equal(y.eylemOnerileri.length, 0)
  })

  it('saat değiştir: tek randevu sunucuda bulunur; yalnız saat söylendiyse gün korunur; "Evet" taşır', async () => {
    const mevcut = randevuEkle(s.doktor.id, umutcan, gun(3), '10:00', 30)
    const oturum = oturumAc(s, { id: umutcan, ad: AD })
    aracla({ saat: '15:30' })
    const k = await fishTur(s, 'Randevu saatini 15:30 olarak değiştir', { oturum })
    assert.equal(zorlananArac(sonModelIstegi()), 'randevu_tasi')
    const [kart] = taslaklar()
    assert.equal(kart.eylem_anahtar, 'randevu_tasi')
    assert.equal(kart.veri.randevu_id, mevcut.id)
    assert.equal(kart.veri.tarih, gun(3), 'gün söylenmedi → mevcut gün')
    assert.equal(kart.veri.saat, '15:30')
    assert.match(k.soz, /Mevcut randevu: .* 10:00/)
    assert.ok(!k.soz.includes(String(mevcut.id)), 'satır kimliği okunmaz')
    assert.match(k.soz, /Onaylıyor musunuz\?$/)
    assert.equal(ortam.db.tablo('randevular')[0].baslangic, mevcut.baslangic, 'onaydan önce değişmez')
    const e = await fishTur(s, 'Evet', { oturum })
    assert.equal(e.soz, 'Randevu yeni saatine alındı Hocam.')
    const r = ortam.db.tablo('randevular')[0]
    assert.equal(r.baslangic, yerelAnI(gun(3), '15:30', TRT))
    assert.equal(new Date(r.bitis).getTime() - new Date(r.baslangic).getTime(), 30 * 60000, 'süre korunur')
    assert.equal(r.hatirlatma_gonderildi, false)
    assert.equal(ortam.db.tablo('randevular').length, 1, 'yeni randevu açılmaz')
  })

  it('saat değiştir: yeni gün ya da saat yoksa kart yok, soru; dolu saat kartta uyarıdır ve onayda reddedilir', async () => {
    randevuEkle(s.doktor.id, umutcan, gun(3), '10:00')
    const rk = ortam.db.tablo('patients').find((x) => x.doctor_id === s.doktor.id && x.id !== umutcan)!.id as string
    randevuEkle(s.doktor.id, rk, gun(3), '15:30')
    const oturum = oturumAc(s, { id: umutcan, ad: AD })
    aracla({})
    const bos = await yazi(s, 'Randevusunu erteleyelim, saati sonra söylerim, perşembeye al', { oturum })
    assert.equal(bos.eylemOnerileri.length, 0)
    assert.match(bos.speech, /Hangi güne ve saate alalım\?$/)
    aracla({ saat: '15:30' })
    const dolu = await yazi(s, 'Randevu saatini 15:30 olarak değiştir', { oturum: oturumAc(s, { id: umutcan, ad: AD }) })
    assert.match(dolu.eylemOnerileri[0].uyarilar.join(' '), /zaten bir randevu var/)
  })

  it('iptal: tek randevu → kart → "Evet" → durum iptal, satır silinmez', async () => {
    const mevcut = randevuEkle(s.doktor.id, umutcan, gun(5), '09:40')
    const oturum = oturumAc(s, { id: umutcan, ad: AD })
    aracla({})
    const k = await fishTur(s, 'Randevusunu iptal et', { oturum })
    assert.equal(zorlananArac(sonModelIstegi()), 'randevu_iptal')
    assert.match(k.soz, /Umutcan Türkoğlu için Randevuyu iptal et hazırladım/)
    assert.equal(ortam.db.tablo('randevular')[0].durum, 'planlandi')
    const e = await fishTur(s, 'Evet', { oturum })
    assert.equal(e.soz, 'Randevu iptal edildi Hocam.')
    assert.equal(ortam.db.tablo('randevular').length, 1)
    assert.equal(ortam.db.tablo('randevular')[0].id, mevcut.id)
    assert.equal(ortam.db.tablo('randevular')[0].durum, 'iptal')
  })

  it('birden çok randevu: hangisi diye sorulur (kart yok); gün söylenirse o günün randevusu seçilir; söylenen günde randevu yoksa işlem yapılmaz', async () => {
    const a = randevuEkle(s.doktor.id, umutcan, gun(2), '10:00')
    randevuEkle(s.doktor.id, umutcan, gun(9), '16:20')
    aracla({})
    const sor = await yazi(s, 'Randevusunu iptal et', { oturum: oturumAc(s, { id: umutcan, ad: AD }) })
    assert.equal(sor.eylemOnerileri.length, 0)
    assert.match(sor.speech, /2 randevu var Hocam: 1\. .* 10:00, 2\. .* 16:20\. Hangisi\?/)
    aracla({ mevcut_tarih: gun(2) })
    const sec = await yazi(s, 'Randevusunu iptal et', { oturum: oturumAc(s, { id: umutcan, ad: AD }) })
    assert.equal(sec.eylemOnerileri[0]?.veri.randevu_id, a.id)
    aracla({ mevcut_tarih: gun(4) })
    const yok = await yazi(s, 'Randevusunu iptal et', { oturum: oturumAc(s, { id: umutcan, ad: AD }) })
    assert.equal(yok.eylemOnerileri.length, 0)
    assert.match(yok.speech, /günü randevu bulamadım Hocam/)
    assert.ok(ortam.db.tablo('randevular').every((r) => r.durum === 'planlandi'))
  })

  it('randevusu olmayan hasta: kart yok, açık cümle', async () => {
    aracla({})
    const y = await yazi(s, 'Randevusunu iptal et', { oturum: oturumAc(s, { id: umutcan, ad: AD }) })
    assert.equal(y.speech, 'Umutcan Türkoğlu için ileri tarihli bir randevu bulamadım Hocam.')
    assert.equal(taslaklar().length, 0)
  })

  it('HASTA-IZOLASYON-01: model randevu_id uydursa da yok sayılır; başka doktorun randevusu bulunmaz, değişmez', async () => {
    const yabanciHasta = ortam.db.tablo('patients').find((x) => x.doctor_id === s.diger.id)!.id as string
    const yabanci = randevuEkle(s.diger.id, yabanciHasta, gun(2), '10:00')
    ortam.yanit = { metin: '', araclar: [{ name: 'randevu_iptal', input: { randevu_id: yabanci.id, mevcut: 'uydurma' } }] }
    const y = await yazi(s, 'Randevusunu iptal et', { oturum: oturumAc(s, { id: umutcan, ad: AD }) })
    assert.equal(y.eylemOnerileri.length, 0)
    assert.equal(y.speech, 'Umutcan Türkoğlu için ileri tarihli bir randevu bulamadım Hocam.')
    assert.equal(ortam.db.tablo('randevular').find((r) => r.id === yabanci.id)!.durum, 'planlandi')
  })
})

describe('tek cümlede bitmeyen komut — bekleyen komut tamamlanınca araç zorlanır', () => {
  it('ses: randevu isteği → hasta → gün → saat → kart → "Evet"; son cümlede fiil yok, araç yine zorlanır', async () => {
    const zorlananlar: (string | null)[] = []
    const kayit = async (soz: string) => { const t = await fishTur(s, soz); zorlananlar.push(zorlananArac(sonModelIstegi())); return t }
    aracla({ tarih: yarin(), saat: '14:30' })
    await kayit('Bir randevu yapmak istiyorum bir hasta için yardımcı olur musun?')
    assert.equal(oturumBaglami(s.oturum).bekleyenKomut?.arac, 'kontrol_randevusu_olustur')
    await kayit('Umutcan Türkoğlu')
    assert.ok(sistemde(/RANDEVU — EKSİK BİLGİ: gün ve saat/), 'gün ve saat eksik')
    assert.equal(sonRota(), 'model', 'hasta adı tek başına "dosyası açık" cevabı değil, komutun devamıdır')
    await kayit('Yarın')
    assert.ok(sistemde(/RANDEVU — EKSİK BİLGİ: saat\] .{0,80}söylenen: gün/), 'yalnız saat eksik, gün biliniyor')
    assert.equal(sonRota(), 'model', '"Yarın" takvim okuması değildir')
    assert.equal(oturumBaglami(s.oturum).bekleyenKomut?.tarih, yarin())
    assert.equal(taslaklar().length, 0)
    const kart = await kayit('14:30')
    assert.deepEqual(zorlananlar, [null, null, null, 'kontrol_randevusu_olustur'])
    assert.equal(taslaklar().length, 1)
    assert.equal(taslaklar()[0].hasta_id, umutcan)
    assert.match(kart.soz, /Onaylıyor musunuz\?$/)
    assert.equal(oturumBaglami(s.oturum).bekleyenKomut, undefined, 'kart çıkınca bekleyen komut biter')
    assert.equal(ortam.db.tablo('randevular').length, 0)
    const e = await fishTur(s, 'Evet')
    assert.equal(e.soz, 'Randevu oluşturuldu Hocam.')
    assert.equal(ortam.db.tablo('randevular')[0].baslangic, yerelAnI(yarin(), '14:30', TRT))
  })

  it('yalnız gün söylenen randevu isteği zorlanmaz (saat sorulur); saat gelince zorlanır', async () => {
    const oturum = oturumAc(s, { id: umutcan, ad: AD })
    aracla({ tarih: yarin(), saat: '15:00' })
    await yazi(s, 'Yarına kontrol randevusu ver', { oturum })
    assert.equal(zorlananArac(sonModelIstegi()), null)
    assert.ok(sistemde(/RANDEVU — EKSİK BİLGİ: saat/), 'saat eksik')
    const y = await yazi(s, 'Saat üçte', { oturum })
    assert.equal(zorlananArac(sonModelIstegi()), 'kontrol_randevusu_olustur')
    assert.equal(y.eylemOnerileri.length, 1)
  })

  it('hastasız kayıt komutu: hasta adı gelince aynı araç o hasta için zorlanır', async () => {
    aracla({ alerji: 'Penisilin' })
    const ilk = await yazi(s, 'Penisilin alerjisini ekle')
    assert.equal(ilk.speech, 'Hangi hasta için Hocam?')
    assert.equal(oturumBaglami(s.oturum).bekleyenKomut?.hastasiz, true)
    const y = await yazi(s, 'Umutcan Türkoğlu')
    assert.equal(zorlananArac(sonModelIstegi()), 'alerji_ekle')
    assert.equal(y.eylemOnerileri[0]?.eylem_anahtar, 'alerji_ekle')
    assert.equal(taslaklar()[0].hasta_id, umutcan)
    assert.equal(hastaNotlari(umutcan).alerjiler, undefined)
  })

  it('araya giren soru komutu bitirir; takvim sorusu bitirmez; hasta adı gün sözüne "onarılmaz"', async () => {
    aracla({})
    await yazi(s, 'Bir randevu yapmak istiyorum bir hasta için yardımcı olur musun?')
    // The live defect: after an appointment turn the follow-up rewriter repaired "Ali" into "Salı" and read Tuesday.
    const ali = await yazi(s, 'Ali Yılmaz için randevu oluştur')
    assert.equal(ali.rota, 'model')
    assert.ok(!/takvim/i.test(ali.speech), ali.speech)
    assert.ok(oturumBaglami(s.oturum).bekleyenKomut)
    assert.equal((await yazi(s, 'Yarın 15:00 boş mu?')).rota, 'takvim')
    assert.ok(oturumBaglami(s.oturum).bekleyenKomut, 'takvim bakışı komutu bitirmez')
    ortam.yanit = { metin: JSON.stringify({ speech: 'Sentetik yanıt.' }) }
    await yazi(s, 'Akut otitte ilk seçenek nedir?')
    assert.equal(oturumBaglami(s.oturum).bekleyenKomut, undefined, 'başka konu komutu bitirir')
    await yazi(s, 'Umutcan Türkoğlu')
    assert.equal(zorlananArac(sonModelIstegi()), null, 'bekleyen komut yokken ad tek başına komut değildir')
  })
})

describe('boş saatler — günün takvimi, modelsiz', () => {
  it('çalışma saatlerinden randevular düşülür; kapalı gün kapalı denir', async () => {
    // A weekday at least two days ahead, so "today" clipping does not interfere.
    let n = 2
    while ([0, 6].includes(new Date(`${gun(n)}T12:00:00Z`).getUTCDay())) n++
    const tarih = gun(n)
    randevuEkle(s.doktor.id, umutcan, tarih, '10:00', 30)
    randevuEkle(s.doktor.id, umutcan, tarih, '14:00', 20)
    const iso = await yazi(s, `${tarih} hangi saatler boş?`, { oturum: oturumAc(s) })
    assert.equal(iso.rota, 'takvim')
    assert.match(iso.speech, /takviminde 2 randevu var; boş saatler \(çalışma saatleri 09:00–18:00\): 09:00–10:00, 10:30–14:00, 14:20–18:00\./)
    assert.equal(ortam.modelIstekleri.filter((m) => JSON.stringify(m.govde.messages).includes(tarih)).length, 0, 'takvim sorusu model turu değildir')
    // The doctor's own working hours are used when set.
    const haftaGunu = new Date(`${tarih}T12:00:00Z`).getUTCDay()
    ortam.db.ekle('doktor_calisma_saatleri', { doktor_id: s.doktor.id, slot_dakika: 30, gunler: { [String(haftaGunu)]: { acik: true, baslangic: '13:00', bitis: '16:00' } } })
    const ozel = await yazi(s, `${tarih} boş saatlerim neler?`, { oturum: oturumAc(s) })
    assert.match(ozel.speech, /boş saatler \(çalışma saatleri 13:00–16:00\): 13:00–14:00, 14:20–16:00\./)
    ortam.db.tablo('doktor_calisma_saatleri')[0].gunler[String(haftaGunu)].acik = false
    const kapali = await yazi(s, `${tarih} müsait saat var mı?`, { oturum: oturumAc(s) })
    assert.match(kapali.speech, /çalışma günü olarak işaretli değil; takvimde 2 randevu var\./)
  })

  it('başka doktorun randevuları boş saat hesabına girmez', async () => {
    let n = 2
    while ([0, 6].includes(new Date(`${gun(n)}T12:00:00Z`).getUTCDay())) n++
    const yabanciHasta = ortam.db.tablo('patients').find((x) => x.doctor_id === s.diger.id)!.id as string
    randevuEkle(s.diger.id, yabanciHasta, gun(n), '11:00', 60)
    const y = await yazi(s, `${gun(n)} hangi saatler boş?`)
    assert.match(y.speech, /takviminde randevu yok; boş saatler \(çalışma saatleri 09:00–18:00\): 09:00–18:00\./)
  })
})
