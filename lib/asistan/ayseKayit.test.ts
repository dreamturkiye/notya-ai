/**
 * NOTYA-AYSE-GERI-05 — records on screen, end to end (Dr. Gökhan items 2–4; audit PR 5 / PR 6).
 *
 * Real /api/asistan/chat and /api/asistan/fish-tur handlers over the realistic synthetic patient
 * (lib/asistan/tests/gercekciHasta.ts: 14 approved visits with weight and height, 18 vaccine rows, device weights).
 * Asserted here: the table on screen, the SAME screen text on both channels, a short spoken line, no model call,
 * and that no value appears that is not in the record.
 */
import { ortam, sahneHazirla, sahneKur, hastaEkle, adIndeksle, oturumAc, yazi, fishTur, sonRota, sonAsistanMesaji, encrypt, type Sahne } from './tests/ayseSahne'
import { describe, it, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { gercekciHastaEkle, GERCEKCI_HASTA_ADI as D } from './tests/gercekciHasta'
import { sozCumleleri, SOZ_BEAT_SINIRI, TABLO_EKRANDA } from './konusma'

let s: Sahne
let hasta: string

before(async () => { await sahneHazirla() })
beforeEach(() => {
  s = sahneKur()
  hasta = gercekciHastaEkle(ortam.db, encrypt, s.doktor.id)
  adIndeksle(s.doktor.id, hasta, D)
})

const acik = () => oturumAc(s, { id: hasta, ad: D })
const satirlar = (ekran: string): string[][] => ekran.split('\n').filter((x) => x.startsWith('|') && !/^\|\s*-/.test(x)).map((x) => x.split('|').slice(1, -1).map((h) => h.trim()))
/** The fixture's weights and heights as the table prints them (Turkish decimal comma). */
const KILOLAR = ['16,2', '16,8', '16,9', '17,6', '18,9', '19,1', '19,4', '20,2', '20,3', '21,4', '21,8', '23,9', '24,2', '24,6']
const BOYLAR = ['103', '104', '104', '107', '110', '111', '112', '114', '114', '117', '118', '122', '123', '124']

describe('aşı kaydı — tablo ekranda, seste tek kısa cümle', () => {
  it('yazı ve ses aynı ekran metnini verir; model çağrılmaz; 18 kayıt, karnenin sütunlarıyla', async () => {
    const y = await yazi(s, 'Aşı karnesini tablo olarak göster', { oturum: acik() })
    assert.equal(y.rota, 'kayit')
    assert.equal(y.aktifHasta, D)
    const t = satirlar(y.speech)
    assert.deepEqual(t[0], ['Aşı', 'Tarih', 'Doz', 'Yaş'])
    assert.equal(t.length - 1, 18)
    assert.match(y.speech, /^\*\*Deniz Aksoy — Aşı Karnesi\*\* \(18 kayıt\)/)
    assert.ok(t.slice(1).some((r) => r[0] === 'KKK' && r[2] === '2. doz'))
    assert.ok(!/eksik|gecikmiş|sıradaki/i.test(y.speech), 'kayıt tablosu takvim yorumu içermez')

    const oturum = acik()
    const v = await fishTur(s, 'Aşılarını göster', { oturum })
    assert.equal(sonRota(), 'kayit')
    assert.equal(v.soz, 'Deniz Aksoy\'un aşı karnesini ekrana getirdim Hocam; 18 kayıt var.')
    assert.equal(sozCumleleri(v.soz).length, 1)
    assert.equal(sonAsistanMesaji(oturum), y.speech, 'ses ve yazı aynı ekran metni')
    assert.equal(ortam.modelIstekleri.length, 0)
  })

  it('adı cümlede geçen hasta, açık dosya olmadan: aynı tablo', async () => {
    const y = await yazi(s, `${D} aşı karnesini tablo olarak göster`)
    assert.equal(y.rota, 'kayit')
    assert.equal(satirlar(y.speech).length - 1, 18)
  })

  it('"Toplam kaç aşısı var": sayı sesle söylenir, tablo ekranda', async () => {
    const v = await fishTur(s, 'Toplam kaç aşısı var', { oturum: acik() })
    assert.equal(sonRota(), 'kayit')
    assert.match(v.soz, /18 kayıt var\.$/)
  })

  it('aşı kaydı olmayan hasta: uydurma tablo yok, tek cümle', async () => {
    const bos = hastaEkle(s.doktor.id, 'Rüzgar Kara', { dogum: '2022-01-05' })
    const y = await yazi(s, 'Aşılarını göster', { oturum: oturumAc(s, { id: bos, ad: 'Rüzgar Kara' }) })
    assert.equal(y.speech, 'Rüzgar Kara için kayıtlı aşı yok Hocam.')
  })

  it('değerlendirme sorusu ("Aşıları tam mı?") kanıt yolunda kalır', async () => {
    const y = await yazi(s, 'Aşıları tam mı?', { oturum: acik() })
    assert.equal(y.rota, 'model')
  })
})

describe('antropometri — tek muayene, seri, tüm muayeneler', () => {
  it('seri: 14 muayenenin kilosu zaman sırasıyla, cihaz ölçümleri ayrı satır; yalnız kayıtlı değerler', async () => {
    const oturum = acik()
    const y = await yazi(s, 'Bütün muayenelerdeki kilo ölçümlerini sırayla göster', { oturum })
    assert.equal(y.rota, 'kayit')
    const t = satirlar(y.speech)
    assert.deepEqual(t[0], ['Tarih', 'Kaynak', 'Kilo (kg)'])
    const muayene = t.slice(1).filter((r) => r[1] === 'muayene')
    assert.deepEqual(muayene.map((r) => r[2]), KILOLAR)
    assert.equal(t.slice(1).filter((r) => r[1] === 'cihaz ölçümü').length, 3)
    const tarihler = t.slice(1).map((r) => r[0].split('.').reverse().join('-'))
    assert.deepEqual(tarihler, [...tarihler].sort(), 'eskiden yeniye')
    for (const r of t.slice(1)) assert.ok(KILOLAR.includes(r[2]), `kayıtta olmayan değer: ${r[2]}`)
    assert.equal(ortam.modelIstekleri.length, 0)
  })

  it('kilo + boy + baş çevresi: kaydı olmayan ölçüm "kayıt yok" ve notta söylenir; ses kısa', async () => {
    const oturum = acik()
    const v = await fishTur(s, 'Kilo, boy ve baş çevresi ölçümlerini tablo yap', { oturum })
    const ekran = sonAsistanMesaji(oturum)
    const t = satirlar(ekran)
    assert.deepEqual(t[0], ['Tarih', 'Kaynak', 'Kilo (kg)', 'Boy (cm)', 'Baş çevresi (cm)'])
    const muayene = t.slice(1).filter((r) => r[1] === 'muayene')
    assert.deepEqual(muayene.map((r) => r[3]), BOYLAR)
    assert.ok(muayene.every((r) => r[4] === 'kayıt yok'), 'baş çevresi hiçbir muayenede kayıtlı değil')
    assert.match(ekran, /Baş çevresi: hiçbir kayıtta ölçüm yok\./)
    assert.match(v.soz, /^Deniz Aksoy'un kilo, boy ve baş çevresi ölçümlerini tablo olarak ekrana getirdim Hocam; 17 kayıt var\. Son kilo 24,6 kg \(\d{2}\.\d{2}\.\d{4}\)\. Baş çevresi için kayıtlı ölçüm yok\.$/)
    assert.ok(sozCumleleri(v.soz).length <= SOZ_BEAT_SINIRI)
    assert.ok(!v.soz.includes(TABLO_EKRANDA) && !v.soz.includes('|'), 'tablo satırları okunmaz')
  })

  it('tek muayene: son muayenedeki boy ve kilo — tek satır, değerler sesle söylenir', async () => {
    const v = await fishTur(s, 'Son muayenedeki boy ve kilo ölçümlerini göster', { oturum: acik() })
    assert.match(v.soz, /^Deniz Aksoy, son muayene \(\d{2}\.\d{2}\.\d{4}\): kilo 24,6 kg ve boy 124 cm\.$/)
  })

  it('baş çevresi sorusu kilo ile cevaplanmaz: kayıt yoksa öyle denir', async () => {
    const y = await yazi(s, 'Baş çevresi ölçümleri neler', { oturum: acik() })
    assert.equal(y.rota, 'kayit')
    assert.equal(y.speech, 'Deniz Aksoy için kayıtlı baş çevresi ölçümü yok Hocam.')
    const boy = await yazi(s, 'Boyu kaç?', { oturum: acik() })
    assert.match(boy.speech, /^Deniz Aksoy — son boy 124 cm \(\d{2}\.\d{2}\.\d{4}\)\.$/)
  })

  it('tek bilgi ("Kilosu kaç?") tarihli ölçüm rotasında, değerlendirme ("Büyümesi nasıl?") kanıt yolunda kalır', async () => {
    assert.equal((await yazi(s, 'Kilosu kaç?', { oturum: acik() })).rota, 'kayit')
    assert.equal((await yazi(s, 'Büyümesi nasıl gidiyor?', { oturum: acik() })).rota, 'model')
  })
})

describe('muayene özetleri — birkaç ya da tüm muayeneler', () => {
  it('son üç muayene: üç tarihli blok (şikayet, tanı, plan), yazı ve ses aynı ekran; ses özetleri okur', async () => {
    const y = await yazi(s, 'Son üç muayenesini özetle', { oturum: acik() })
    assert.equal(y.rota, 'kayit')
    assert.equal((y.speech.match(/^\*\*\d\. \d{2}\.\d{2}\.\d{4}\*\*$/gm) || []).length, 3)
    assert.match(y.speech, /\*\*Deniz Aksoy — son 3 muayene\*\* \(toplam 14 onaylı muayene\)/)
    for (const tani of ['Astım atağı', 'Streptokokal farenjit', 'Akut sinüzit']) assert.ok(y.speech.includes(`- Tanı: ${tani}`), tani)
    assert.ok(!y.speech.includes('Akut nazofarenjit'), 'seçilmeyen muayene özetlenmez')
    const oturum = acik()
    const v = await fishTur(s, 'Son üç muayenesini özetle', { oturum })
    assert.equal(sonAsistanMesaji(oturum), y.speech)
    assert.match(v.soz, /^Deniz Aksoy, son 3 muayene\. .* muayenesi\. Şikayet: /)
    assert.ok(v.soz.includes('Tanı: Akut sinüzit'))
    assert.equal(ortam.modelIstekleri.length, 0)
  })

  it('tüm muayeneler: 14 blok eskiden yeniye; ses yalnız yönlendirir, "bana anlat" tamamını okur', async () => {
    const oturum = acik()
    const v = await fishTur(s, 'Bütün muayenelerini tek tek özetle', { oturum })
    const ekran = sonAsistanMesaji(oturum)
    assert.equal((ekran.match(/^\*\*\d+\. \d{2}\.\d{2}\.\d{4}\*\*$/gm) || []).length, 14)
    assert.ok(ekran.indexOf('Akut nazofarenjit') < ekran.indexOf('Akut sinüzit'))
    assert.match(v.soz, /^Deniz Aksoy'un 14 muayenesinin özetini ekrana getirdim Hocam; .* Sesli dinlemek isterseniz "bana anlat" deyin\.$/)
    assert.ok(sozCumleleri(v.soz).length <= SOZ_BEAT_SINIRI)
    const oku = await fishTur(s, 'Bana anlat', { oturum })
    assert.equal(sonRota(), 'oku')
    assert.ok(oku.soz.includes('Akut nazofarenjit') && oku.soz.includes('Akut sinüzit'))
    assert.equal(ortam.modelIstekleri.length, 0)
  })

  it('tek adlı muayene ("son muayenesini özetle") eski yolunda kalır', async () => {
    const y = await yazi(s, 'Son muayenesini özetle', { oturum: acik() })
    assert.equal(y.rota, 'model')
  })
})

describe('izolasyon ve hasta yokken', () => {
  it('başka doktor aynı cümleyle bu hastanın kaydını göremez; hasta belli değilken tablo kurulmaz', async () => {
    const digerOturum = ortam.db.ekle('asistan_sessions', { doctor_id: s.diger.id, persona_id: 'aysekaya', messages: [], active_context: {} }).id as string
    const d = await yazi(s, `${D} aşı karnesini tablo olarak göster`, { oturum: digerOturum, token: s.diger.token })
    assert.equal(d.rota, 'model')
    assert.ok(!d.speech.includes('|') && !/Hepatit|KKK|18 kayıt/.test(d.speech))
    const yok = await yazi(s, 'Aşı karnesini tablo olarak göster')
    assert.equal(yok.rota, 'model')
    // A patient id of this doctor planted in the other doctor's session context is not used either.
    const sahte = ortam.db.ekle('asistan_sessions', { doctor_id: s.diger.id, persona_id: 'aysekaya', messages: [], active_context: { currentPatientId: hasta, patientName: D, odakKaynak: 'soz' } }).id as string
    const z = await yazi(s, 'Aşılarını göster', { oturum: sahte, token: s.diger.token })
    assert.ok(!z.speech.includes('|') && !/18 kayıt/.test(z.speech), z.speech)
  })
})
