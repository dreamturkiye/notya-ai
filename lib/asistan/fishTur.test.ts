/**
 * NOTYA-AYSE-GERI-00 / -02 — route-level tests of /api/asistan/fish-tur, the route Ayşe's voice actually uses.
 *
 * Until now the single-brain suite (tekBeyin.test.ts) drove only the ElevenLabs Custom-LLM route, which Ayşe left
 * on 2026-09-29; no test ran a turn through the Fish route (audit §4.6). Here the real handler runs with the
 * transcript given as text (`mesaj`), so Fish ASR / TTS are not called and everything after the transcript is the
 * production path.
 *
 * S2 (NOTYA-AYSE-GERI-02): spoken Evet / Hayır on a pending card, withdrawal of the superseded draft and
 * continuation of a cut answer — all through this route.
 */
import { ortam, sahneHazirla, sahneKur, hastaEkle, oturumAc, oturumBaglami, fishTur, yazi, sonRota, sonAsistanMesaji, encrypt, type Sahne } from './tests/ayseSahne'
import { describe, it, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { gercekciHastaEkle, GERCEKCI_HASTA_ADI } from './tests/gercekciHasta'

let s: Sahne
let hasta: string
const AD = 'Umutcan Türkoğlu'

before(async () => { await sahneHazirla() })
beforeEach(() => {
  s = sahneKur()
  hasta = hastaEkle(s.doktor.id, AD, { dogum: '2019-04-10', cinsiyet: 'male' })
})

const taslaklar = () => ortam.db.tablo('eylem_onerileri').filter((r) => r.durum === 'taslak')
const hastaNotlari = (id: string): Record<string, unknown> => {
  const r = ortam.db.tablo('patients').find((x) => x.id === id)!
  return JSON.parse(require('../security/encryption').decrypt(String(r.notes_encrypted))) as Record<string, unknown>
}
const alerjiKarti = (alerji: string) => ({
  metin: JSON.stringify({ speech: 'Kartı hazırladım Hocam.' }),
  araclar: [{ name: 'alerji_ekle', input: { alerji, alan_kaynaklari: { alerji: { kaynak: 'doktor_soyledi' } } } }],
})

describe('fish-tur — düz sesli tur uçtan uca', () => {
  it('model turu: stt → soz → soz_bit → bit; tek model isteği; cevap ortak oturuma sesli tur olarak yazılır', async () => {
    ortam.yanit = { metin: JSON.stringify({ speech: 'Akut otitte ilk seçenek amoksisilindir Hocam.' }) }
    const t = await fishTur(s, 'Akut otitte ilk seçenek nedir?')
    assert.equal(t.status, 200)
    assert.equal(t.stt, 'Akut otitte ilk seçenek nedir?')
    assert.equal(t.soz, 'Akut otitte ilk seçenek amoksisilindir Hocam.')
    assert.deepEqual([t.sira[0], t.sira[t.sira.length - 2], t.sira[t.sira.length - 1]], ['stt', 'soz_bit', 'bit'])
    assert.equal(ortam.modelIstekleri.length, 1)
    assert.equal(sonRota(), 'model')
    assert.equal(sonAsistanMesaji(s.oturum), 'Akut otitte ilk seçenek amoksisilindir Hocam.')
    const kayit = ortam.db.tablo('asistan_sessions').find((x) => x.id === s.oturum)!
    assert.deepEqual((kayit.messages as { kanal?: string }[]).map((m) => m.kanal), ['ses', 'ses'])
  })

  it('modelsiz tur (takvim): model çağrılmaz, cevap yine konuşulur', async () => {
    const t = await fishTur(s, 'Bugün randevum var mı?')
    assert.equal(t.status, 200)
    assert.equal(sonRota(), 'takvim')
    assert.equal(ortam.modelIstekleri.length, 0)
    assert.ok(t.soz.length > 0, 'takvim cevabı söylenmeli')
    assert.equal(t.sira[t.sira.length - 1], 'bit')
  })

  it('açık hastayla dosya sorusu: hasta adı sözde geçer, başka doktorun oturumu 404', async () => {
    const oturum = oturumAc(s, { id: hasta, ad: AD })
    const t = await fishTur(s, 'Alerjisi var mı?', { oturum })
    assert.equal(sonRota(), 'hizli-kart')
    assert.match(t.soz, /Umutcan Türkoğlu/)
    const yabanci = await fishTur(s, 'Alerjisi var mı?', { oturum, token: s.diger.token })
    assert.equal(yabanci.status, 404)
  })

  it('NOTYA-AYSE-GERI-01: dosya kelimesi geçen cümle sesli turda da sayım şablonu almaz — modele gider', async () => {
    for (const soz of ['Akut otit tedavisini anlat', 'Bronşiolit yönetimini anlat', 'Bir randevu yapmak istiyorum bir hasta için yardımcı olur musun?', 'Ali Yılmaz için randevu oluştur']) {
      ortam.modelIstekleri.length = 0
      ortam.yanit = { metin: JSON.stringify({ speech: 'Hangi hasta için Hocam?' }) }
      const t = await fishTur(s, soz, { oturum: oturumAc(s) })
      assert.equal(sonRota(), 'model', soz)
      assert.equal(ortam.modelIstekleri.length, 1, soz)
      assert.ok(!/Filtre:|\d+ hasta\./.test(t.soz), `${soz} → ${t.soz}`)
      // No chart this turn: the model is told so and told not to build a count sentence.
      const sistem = JSON.stringify(ortam.modelIstekleri[0].govde.system)
      assert.ok(/BU TURDA AÇIK HASTA DOSYASI YOK/.test(sistem), soz)
      assert.ok(/sayım istenmedi/.test(sistem), soz)
    }
  })

  it('kimlik doğrulaması yoksa 401; ASR gürültüsü tur sayılmaz (model yok, atlandi)', async () => {
    const y = await fishTur(s, 'Merhaba', { token: 'gecersiz' })
    assert.equal(y.status, 401)
    const g = await fishTur(s, '...')
    assert.deepEqual(g.sira, ['atlandi', 'bit'])
    assert.equal(ortam.modelIstekleri.length, 0)
  })
})

describe('NOTYA-AYSE-GERI-02 — sesli onay Fish rotasında (denetim §4.6, PR 3)', () => {
  it('kart sesle hazırlanır ve okunur; "Evet" model çağırmadan, dokunuşun omurgasından kaydeder', async () => {
    const oturum = oturumAc(s, { id: hasta, ad: AD })
    ortam.yanit = alerjiKarti('Penisilin')
    const hazir = await fishTur(s, 'Penisilin alerjisini dosyaya gir', { oturum })
    assert.match(hazir.soz, /Umutcan Türkoğlu için Alerji ekle hazırladım/)
    assert.match(hazir.soz, /Henüz dosyaya yazılmadı\. Onaylıyor musunuz\?/)
    assert.equal(taslaklar().length, 1)
    assert.equal(hastaNotlari(hasta).alerjiler, undefined, 'kart kayıt değildir — onaydan önce dosyaya hiçbir şey yazılmaz')
    assert.deepEqual(oturumBaglami(oturum).bekleyenOneriler, [taslaklar()[0].id])

    const modelOnce = ortam.modelIstekleri.length
    const onay = await fishTur(s, 'Evet', { oturum })
    assert.equal(ortam.modelIstekleri.length, modelOnce, '"Evet" bir model turu değildir')
    assert.match(onay.soz, /^Kaydedildi Hocam — Alerji ekle\.$/)
    assert.deepEqual(onay.sira, ['stt', 'soz', 'soz_bit', 'bit'])
    assert.equal(hastaNotlari(hasta).alerjiler, 'Penisilin')
    assert.equal(ortam.db.tablo('eylem_onerileri')[0].durum, 'onaylandi')
    assert.equal(ortam.db.tablo('eylem_kayitlari').length, 1, 'denetim satırı yazılır: hazırlayan Ayşe, onaylayan hekim')
    assert.deepEqual(oturumBaglami(oturum).bekleyenOneriler, [])
    assert.equal(sonAsistanMesaji(oturum), 'Kaydedildi Hocam — Alerji ekle.')

    // With nothing pending, "Evet" is ordinary conversation again — nothing is written.
    ortam.yanit = { metin: JSON.stringify({ speech: 'Buyurun Hocam.' }) }
    await fishTur(s, 'Evet', { oturum })
    assert.equal(ortam.modelIstekleri.length, modelOnce + 1)
    assert.equal(ortam.db.tablo('eylem_kayitlari').length, 1)
  })

  it('"Onaylıyorum" da onaydır; belirsiz cümle ("evet ama saat değişsin") onay değildir, modele gider', async () => {
    const oturum = oturumAc(s, { id: hasta, ad: AD })
    ortam.yanit = alerjiKarti('Fıstık')
    await fishTur(s, 'Fıstık alerjisini dosyaya gir', { oturum })
    const once = ortam.modelIstekleri.length
    ortam.yanit = { metin: JSON.stringify({ speech: 'Neyi değiştireyim Hocam?' }) }
    await fishTur(s, 'Evet ama önce bir bakayım', { oturum })
    assert.equal(ortam.modelIstekleri.length, once + 1)
    assert.equal(taslaklar().length, 1, 'belirsiz cümle kartı onaylamaz')
    await fishTur(s, 'Onaylıyorum', { oturum })
    assert.equal(hastaNotlari(hasta).alerjiler, 'Fıstık')
  })

  it('"Hayır": bekleyen kart geri çekilir, dosyaya hiçbir şey yazılmaz, model çağrılmaz', async () => {
    const oturum = oturumAc(s, { id: hasta, ad: AD })
    ortam.yanit = alerjiKarti('Penisilin')
    await fishTur(s, 'Penisilin alerjisini dosyaya gir', { oturum })
    const once = ortam.modelIstekleri.length
    const h = await fishTur(s, 'Hayır', { oturum })
    assert.match(h.soz, /vazgeçtim — dosyaya hiçbir şey yazılmadı/)
    assert.equal(ortam.modelIstekleri.length, once)
    assert.equal(taslaklar().length, 0)
    assert.equal(ortam.db.tablo('eylem_onerileri')[0].durum, 'vazgecildi')
    assert.equal(hastaNotlari(hasta).alerjiler, undefined)
    assert.equal(ortam.db.tablo('eylem_kayitlari').length, 0)
  })

  it('ciddi ilaç uyarısı taşıyan kart sesle onaylanamaz: kart taslak kalır, ilaç yazılmaz', async () => {
    const alerjik = hastaEkle(s.doktor.id, 'Rüzgar Kara', { dogum: '2018-02-02', notlar: { alerjiler: 'Penisilin' } })
    const oturum = oturumAc(s, { id: alerjik, ad: 'Rüzgar Kara' })
    ortam.yanit = {
      metin: JSON.stringify({ speech: 'Kartı hazırladım Hocam.' }),
      araclar: [{ name: 'ilac_ekle', input: { ilac_adi: 'Largopen', doz: '250 mg', kullanim_sikli: '2x1', alan_kaynaklari: { ilac_adi: { kaynak: 'doktor_soyledi' }, doz: { kaynak: 'doktor_soyledi' }, kullanim_sikli: { kaynak: 'doktor_soyledi' } } } }],
    }
    await fishTur(s, 'Largopen 250 mg 2x1 ilaçlarına ekle, kaydet', { oturum })
    assert.equal(taslaklar().length, 1)
    const e = await fishTur(s, 'Evet', { oturum })
    assert.match(e.soz, /Ciddi bir ilaç uyarısı var — bunu sesle onaylayamam/)
    assert.equal(taslaklar().length, 1, 'kart ekrandaki ikinci dokunuşu bekler')
    assert.equal(ortam.db.tablo('hasta_ilaclar').length, 0)
  })

  // NOTYA-AYSE-GUVENLIK-01 — the action audit's two sentences (2026-10-02, no. 10 and 15) on the audit's own
  // synthetic chart: the forced card must SAY the conflict, in both channels, and a plain "Evet" must not pass it.
  it('denetim cümlesi 10: alerjisi yalnız ilk kayıt formunda duran hastada Amoksisilin kartı çatışmayı söyler; "Evet" kaydetmez', async () => {
    const deniz = gercekciHastaEkle(ortam.db, encrypt, s.doktor.id)
    const ilacSayisi = () => ortam.db.tablo('hasta_ilaclar').filter((r) => r.patient_id === deniz).length
    const once = ilacSayisi()
    const amoksisilin = {
      metin: '',
      araclar: [{ name: 'ilac_ekle', input: { ilac_adi: 'Amoksisilin', doz: '250 mg', kullanim_sikli: 'günde iki kez', alan_kaynaklari: { ilac_adi: { kaynak: 'doktor_soyledi' }, doz: { kaynak: 'doktor_soyledi' }, kullanim_sikli: { kaynak: 'doktor_soyledi' } } } }],
    }
    const oturum = oturumAc(s, { id: deniz, ad: GERCEKCI_HASTA_ADI })
    ortam.yanit = amoksisilin
    const ses = await fishTur(s, 'Amoksisilin 250 mg günde iki kez ilaçlarına ekle', { oturum })
    assert.match(ses.soz, /Deniz Aksoy için İlaç ekle hazırladım/)
    assert.match(ses.soz, /Dikkat Hocam: Alerji kaydı — Dosyada "Penisilin \(ürtiker, 3 yaşında amoksisilin sonrası\)" alerjisi kayıtlı/)
    assert.match(ses.soz, /tek “Evet” yetmez; ekrandaki kartta “Uyarıyı gördüm, kaydet” ile onaylayın\.$/)
    assert.ok(!/Onaylıyor musunuz\?/.test(ses.soz), ses.soz)
    const kart = taslaklar()[0]
    assert.ok((kart.uyari_detay as { tur: string; siddet: string }[]).some((u) => u.tur === 'alerji' && u.siddet === 'ciddi'), 'kartın kendisi uyarıyı taşır')

    const e = await fishTur(s, 'Evet', { oturum })
    assert.match(e.soz, /Ciddi bir ilaç uyarısı var — bunu sesle onaylayamam/)
    assert.equal(ilacSayisi(), once, 'düz "Evet" alerji çatışmasını geçirmez')
    assert.equal(taslaklar().length, 1)

    // Written channel, same sentence: the answer on screen states the conflict too.
    const yaziOturumu = oturumAc(s, { id: deniz, ad: GERCEKCI_HASTA_ADI })
    ortam.yanit = amoksisilin
    const y = await yazi(s, 'Amoksisilin 250 mg günde iki kez ilaçlarına ekle', { oturum: yaziOturumu })
    assert.match(y.speech, /Dikkat Hocam: Alerji kaydı — Dosyada "Penisilin/)
    assert.ok(!/Onaylıyor musunuz\?/.test(y.speech), y.speech)
    // The model wrote its own sentence and never mentioned the allergy: the server adds the warning anyway.
    ortam.yanit = { ...amoksisilin, metin: JSON.stringify({ speech: 'Amoksisilin kartını hazırladım Hocam.' }) }
    const y2 = await yazi(s, 'Amoksisilin 250 mg günde iki kez ilaçlarına ekle', { oturum: oturumAc(s, { id: deniz, ad: GERCEKCI_HASTA_ADI }) })
    assert.match(y2.speech, /Dikkat Hocam: Alerji kaydı — Dosyada "Penisilin/)
    assert.match(y2.speech, /“Uyarıyı gördüm, kaydet” ile onaylayın\.$/)
    assert.equal(ilacSayisi(), once)
  })

  it('denetim cümlesi 15: 7 yaşında Singulair 10 mg kartı doz çatışmasını söyler; "Evet" dozu değiştirmez', async () => {
    const deniz = gercekciHastaEkle(ortam.db, encrypt, s.doktor.id)
    const singulair = () => ortam.db.tablo('hasta_ilaclar').find((r) => r.patient_id === deniz && r.ilac_adi === 'Singulair')!
    const oturum = oturumAc(s, { id: deniz, ad: GERCEKCI_HASTA_ADI })
    ortam.yanit = { metin: '', araclar: [{ name: 'ilac_doz_degistir', input: { ilac_adi: 'Singulair', yeni_doz: '10 mg', alan_kaynaklari: { ilac_adi: { kaynak: 'doktor_soyledi' }, yeni_doz: { kaynak: 'doktor_soyledi' } } } }] }
    const t = await fishTur(s, 'Singulair dozunu 10 miligrama çıkar', { oturum })
    assert.match(t.soz, /Dikkat Hocam: Pediatrik doz aşımı — Yazılan günlük doz \(10 mg\), kaynakta bu yaş grubu için verilen dozun \(5 mg\/gün\) ÜZERİNDE/)
    assert.ok(!/Onaylıyor musunuz\?/.test(t.soz), t.soz)
    const e = await fishTur(s, 'Evet', { oturum })
    assert.match(e.soz, /Ciddi bir ilaç uyarısı var/)
    assert.equal(singulair().doz, '5 mg')
  })

  it('zorunlu alanı boş kart sesle onaylanamaz', async () => {
    const oturum = oturumAc(s, { id: hasta, ad: AD })
    ortam.yanit = { metin: JSON.stringify({ speech: 'Kartı hazırladım.' }), araclar: [{ name: 'asi_kaydi_ekle', input: { asi_adi: 'KKK', alan_kaynaklari: { asi_adi: { kaynak: 'doktor_soyledi' } } } }] }
    const k = await fishTur(s, 'KKK aşısını dosyaya gir', { oturum })
    assert.match(k.soz, /Uygulama tarihi boş/)
    const e = await fishTur(s, 'Evet', { oturum })
    assert.match(e.soz, /Şu alanlar boş: Uygulama tarihi/)
    assert.equal(ortam.db.tablo('asilar').length, 0)
  })

  it('başka doktor aynı oturum kimliğiyle "Evet" diyemez (404); kendi oturumunda başkasının kartını onaylayamaz', async () => {
    const oturum = oturumAc(s, { id: hasta, ad: AD })
    ortam.yanit = alerjiKarti('Penisilin')
    await fishTur(s, 'Penisilin alerjisini dosyaya gir', { oturum })
    const kartId = taslaklar()[0].id
    const y = await fishTur(s, 'Evet', { oturum, token: s.diger.token })
    assert.equal(y.status, 404)
    // The other doctor's own session, with the foreign card id planted in its context: not his card → not committed.
    const digerOturum = ortam.db.ekle('asistan_sessions', { doctor_id: s.diger.id, persona_id: 'aysekaya', messages: [], active_context: { bekleyenOneriler: [kartId] } }).id as string
    ortam.yanit = { metin: JSON.stringify({ speech: 'Buyurun Hocam.' }) }
    await fishTur(s, 'Evet', { oturum: digerOturum, token: s.diger.token })
    assert.equal(taslaklar().length, 1)
    assert.equal(hastaNotlari(hasta).alerjiler, undefined)
  })

  it('takvim sorusu bekleyen kart varken de takvimdir — onay sayılmaz', async () => {
    const oturum = oturumAc(s, { id: hasta, ad: AD })
    ortam.yanit = alerjiKarti('Penisilin')
    await fishTur(s, 'Penisilin alerjisini dosyaya gir', { oturum })
    await fishTur(s, 'Bugün randevum var mı?', { oturum })
    assert.equal(sonRota(), 'takvim')
    assert.equal(taslaklar().length, 1)
  })
})

describe('NOTYA-AYSE-GERI-02 — aynı kart sesle yeniden hazırlanınca eski taslak geri çekilir (PR 3)', () => {
  it('aynı hasta + aynı eylem: tek güncel taslak kalır, "Evet" onu kaydeder', async () => {
    const oturum = oturumAc(s, { id: hasta, ad: AD })
    ortam.yanit = alerjiKarti('Penisilin')
    await fishTur(s, 'Penisilin alerjisini dosyaya gir', { oturum })
    ortam.yanit = alerjiKarti('Amoksisilin')
    await fishTur(s, 'Yok, amoksisilin alerjisi olarak kaydet', { oturum })
    assert.equal(taslaklar().length, 1, 'eski taslak geri çekildi')
    assert.equal(taslaklar()[0].veri.alerji, 'Amoksisilin')
    assert.equal(ortam.db.tablo('eylem_onerileri').filter((r) => r.durum === 'vazgecildi').length, 1)
    await fishTur(s, 'Evet', { oturum })
    assert.equal(hastaNotlari(hasta).alerjiler, 'Amoksisilin')
  })

  it('farklı eylemin kartı geri çekilmez', async () => {
    const oturum = oturumAc(s, { id: hasta, ad: AD })
    ortam.yanit = alerjiKarti('Penisilin')
    await fishTur(s, 'Penisilin alerjisini dosyaya gir', { oturum })
    ortam.yanit = { metin: JSON.stringify({ speech: 'Kartı hazırladım.' }), araclar: [{ name: 'kronik_hastalik_ekle', input: { hastalik: 'Astım', alan_kaynaklari: { hastalik: { kaynak: 'doktor_soyledi' } } } }] }
    await fishTur(s, 'Astımı kronik hastalıklarına kaydet', { oturum })
    assert.equal(taslaklar().length, 2)
  })
})

describe('NOTYA-AYSE-GERI-02 — kesilen sesli cevabın devamı (NOTYA-SES-DEVAM-01, PR 8)', () => {
  const YEDI = 'Bir. İki. Üç. Dört. Beş. Altı. Yedi.'

  it('yedi cümlelik cevap beşte sessizce kesilir, kalan saklanır; "devam et" kalan ikiyi model çağırmadan okur', async () => {
    ortam.yanit = { metin: JSON.stringify({ speech: YEDI }) }
    const t = await fishTur(s, 'Akut otitte ilk seçenek nedir?')
    assert.equal(t.soz, 'Bir. İki. Üç. Dört. Beş.')
    assert.ok(!/Devamı ekranınızda/.test(t.soz), 'devamı gelecek — "Devamı ekranınızda" denmez')
    assert.equal(oturumBaglami(s.oturum).sesDevam?.kalan, 'Altı. Yedi.')
    assert.equal(sonAsistanMesaji(s.oturum), YEDI, 'ekran cevabı tamdır')

    const once = ortam.modelIstekleri.length
    const mesajSayisi = (ortam.db.tablo('asistan_sessions').find((x) => x.id === s.oturum)!.messages as unknown[]).length
    const d = await fishTur(s, 'devam et')
    assert.equal(d.soz, 'Altı. Yedi.')
    assert.equal(ortam.modelIstekleri.length, once, '"devam et" bir model turu değildir')
    assert.equal(oturumBaglami(s.oturum).sesDevam, undefined, 'kalan bir kez okunur')
    assert.equal((ortam.db.tablo('asistan_sessions').find((x) => x.id === s.oturum)!.messages as unknown[]).length, mesajSayisi, 'devam yeni baloncuk açmaz')

    // Nothing left: a second "devam et" is an ordinary turn.
    ortam.yanit = { metin: JSON.stringify({ speech: 'Neye devam edeyim Hocam?' }) }
    await fishTur(s, 'devam et')
    assert.equal(ortam.modelIstekleri.length, once + 1)
  })

  it('sayfa kalanı kendisi okuduysa (devamOkundu) sunucudaki kalan alınır — "devam et" aynı cümleleri tekrar okumaz', async () => {
    ortam.yanit = { metin: JSON.stringify({ speech: YEDI }) }
    await fishTur(s, 'Akut otitte ilk seçenek nedir?')
    assert.ok(oturumBaglami(s.oturum).sesDevam)
    const r = await fishTur(s, '', { govde: { devamOkundu: true } })
    assert.equal(r.status, 200)
    assert.equal(oturumBaglami(s.oturum).sesDevam, undefined)
    // Another doctor cannot clear it: the session is doctor-scoped.
    ortam.yanit = { metin: JSON.stringify({ speech: YEDI }) }
    await fishTur(s, 'Bronşiolitte ilk basamak nedir?')
    const y = await fishTur(s, '', { govde: { devamOkundu: true }, token: s.diger.token })
    assert.equal(y.status, 404)
    assert.ok(oturumBaglami(s.oturum).sesDevam)
  })

  it('yeni gerçek tur (soru ya da sesli karar) önceki kalanı düşürür', async () => {
    ortam.yanit = { metin: JSON.stringify({ speech: YEDI }) }
    await fishTur(s, 'Akut otitte ilk seçenek nedir?')
    ortam.yanit = { metin: JSON.stringify({ speech: 'Kısa cevap.' }) }
    await fishTur(s, 'Peki bronşiolitte?')
    assert.equal(oturumBaglami(s.oturum).sesDevam, undefined)
  })

  it('beş cümle ve altı: kesilme yok, kalan saklanmaz', async () => {
    ortam.yanit = { metin: JSON.stringify({ speech: 'Bir. İki. Üç.' }) }
    const t = await fishTur(s, 'Akut otitte ilk seçenek nedir?')
    assert.equal(t.soz, 'Bir. İki. Üç.')
    assert.equal(oturumBaglami(s.oturum).sesDevam, undefined)
  })

  it('kesilen cevapta kart da varsa onay sorusu son sözdür: arkasına kalan kuyruklanmaz, "Evet" kartı kaydeder', async () => {
    const oturum = oturumAc(s, { id: hasta, ad: AD })
    ortam.yanit = { ...alerjiKarti('Penisilin'), metin: JSON.stringify({ speech: YEDI }) }
    const t = await fishTur(s, 'Penisilin alerjisini dosyaya gir', { oturum })
    assert.match(t.soz, /^Bir\. İki\. Üç\. Dört\. Beş\. Umutcan Türkoğlu için Alerji ekle hazırladım.*Onaylıyor musunuz\?$/)
    assert.equal(oturumBaglami(oturum).sesDevam, undefined)
    await fishTur(s, 'Evet', { oturum })
    assert.equal(hastaNotlari(hasta).alerjiler, 'Penisilin')
  })
})

describe('NOTYA-AYSE-GERI-06 — yarım söz cevaplanmaz (NOTYA-SES-YARIM-01)', () => {
  it('"Ayşe lütfen bana." askıda bir istektir: stt → bekle → bit; model yok, oturuma hiçbir şey yazılmaz', async () => {
    for (const soz of ['Ayşe lütfen bana.', 'Lütfen', 'Ayşe Hocam bana bir']) {
      const t = await fishTur(s, soz, { oturum: oturumAc(s) })
      assert.deepEqual(t.sira, ['stt', 'bekle', 'bit'], soz)
      assert.equal(t.olaylar[1].neden, 'askida', soz)
      assert.equal(t.soz, '')
    }
    assert.equal(ortam.modelIstekleri.length, 0)
    assert.equal(sonRota(), null, 'beyin çağrılmadı')
    assert.ok(ortam.db.tablo('asistan_sessions').every((o) => (o.messages as unknown[]).length === 0))
  })

  it('"… bana Umutcan" [duraklama]: ad doktorun bir hastasının ad parçasıysa beklenir; soyadı gelince tek cümle cevaplanır', async () => {
    const yarim = await fishTur(s, 'Ayşe lütfen bana Umutcan')
    assert.deepEqual(yarim.sira, ['stt', 'bekle', 'bit'])
    assert.equal(yarim.olaylar[1].neden, 'ad')
    assert.equal(ortam.modelIstekleri.length, 0)
    // The browser merges the next clip; the server then hears ONE utterance.
    const tam = await fishTur(s, 'Ayşe lütfen bana Umutcan Türkoğlu’nun alerjisi var mı söyle')
    assert.ok(!tam.sira.includes('bekle'))
    assert.equal(sonRota(), 'hizli-kart')
    assert.match(tam.soz, /Umutcan Türkoğlu/)
  })

  it('ad değilse beklenmez: istekten sonraki tek kelime bu doktorun hastası değil (başka doktorun hastası da değil)', async () => {
    hastaEkle(s.diger.id, 'Kerem Sönmez', { dogum: '2019-01-01' })
    for (const soz of ['Lütfen devam', 'Bana kerem', 'Bana yardım']) {
      ortam.yanit = { metin: JSON.stringify({ speech: 'Buyurun Hocam.' }) }
      const t = await fishTur(s, soz, { oturum: oturumAc(s) })
      assert.ok(!t.sira.includes('bekle'), soz)
    }
  })

  it('tam cümle hiç bekletilmez', async () => {
    ortam.yanit = { metin: JSON.stringify({ speech: 'Buyurun Hocam.' }) }
    for (const soz of ['Umutcan Türkoğlu dosyasını aç', 'Bugün randevum var mı?', 'Bana Umutcan’ı aç', 'Evet']) {
      const t = await fishTur(s, soz, { oturum: oturumAc(s) })
      assert.ok(!t.sira.includes('bekle'), soz)
    }
  })
})

describe('NOTYA-AYSE-GERI-06 — sesli turda dosya ayrıntısı (PR 7)', () => {
  const kur = (): { id: string; oturum: string } => {
    const id = gercekciHastaEkle(ortam.db, encrypt, s.doktor.id)
    return { id, oturum: oturumAc(s, { id, ad: GERCEKCI_HASTA_ADI }) }
  }
  const sistem = (i: number) => JSON.stringify(ortam.modelIstekleri[i].govde.system)
  /** The rule line that follows the FULL chart (the short one says "yukarıdaki özete" and "SESLİ ÖZETTİR"). */
  const TAM_DOSYA = 'YALNIZCA yukarıdaki dosyaya ve HIZLI KART'

  it('liste / geçmiş isteği sesli turda TAM dosyayla gider: eski vizitler model isteğinde', async () => {
    const { oturum } = kur()
    ortam.yanit = { metin: JSON.stringify({ speech: 'Reçeteler ekranda Hocam.' }) }
    await fishTur(s, 'Reçete geçmişini göster', { oturum })
    assert.equal(ortam.modelIstekleri.length, 1)
    assert.ok(sistem(0).includes(TAM_DOSYA), 'tam dosya ve tam dosyanın kuralı')
    assert.ok(!sistem(0).includes('SESLİ ÖZETTİR'))
  })

  it('kısa özette cevap yoksa model işaret yazar, sunucu aynı turu tam dosyayla yeniden sorar; işaret söylenmez, gösterilmez', async () => {
    const { oturum } = kur()
    ortam.yanit = (istek) => (JSON.stringify(istek.system).includes('SESLİ ÖZETTİR')
      ? { metin: JSON.stringify({ speech: '[TAM-DOSYA]' }) }
      : { metin: JSON.stringify({ speech: 'Deniz Aksoy — astım tanısı üçüncü vizitte kondu.' }) })
    const t = await fishTur(s, 'Astım tanısını kim koymuş', { oturum })
    assert.equal(ortam.modelIstekleri.length, 2, 'kısa özet + tam dosya')
    assert.ok(sistem(0).includes('SESLİ ÖZETTİR') && !sistem(0).includes(TAM_DOSYA))
    assert.ok(sistem(1).includes(TAM_DOSYA) && !sistem(1).includes('SESLİ ÖZETTİR'))
    assert.ok(sistem(1).length > sistem(0).length, 'ikinci istek daha geniş dosyayı taşır')
    assert.equal(t.soz, 'Deniz Aksoy — astım tanısı üçüncü vizitte kondu.')
    assert.ok(!t.olaylar.some((e) => JSON.stringify(e).includes('TAM-DOSYA')), 'işaret hiçbir olayda yok')
    assert.equal(sonAsistanMesaji(oturum), 'Deniz Aksoy — astım tanısı üçüncü vizitte kondu.')
  })

  it('tam dosyada da yoksa tek cümleyle söylenir (ikinci kez sorulmaz)', async () => {
    const { oturum } = kur()
    ortam.yanit = { metin: JSON.stringify({ speech: '[TAM-DOSYA]' }) }
    const t = await fishTur(s, 'Babasının mesleği ne', { oturum })
    assert.equal(ortam.modelIstekleri.length, 2)
    assert.equal(t.soz, 'Deniz Aksoy dosyasında bu bilgi yok Hocam.')
  })

  it('yazılı kanal her zaman tam dosyadır: yeniden sorma yok', async () => {
    const { oturum } = kur()
    ortam.yanit = { metin: JSON.stringify({ speech: 'Astım tanısı üçüncü vizitte.' }) }
    await yazi(s, 'Astım tanısını kim koymuş', { oturum })
    assert.equal(ortam.modelIstekleri.length, 1)
    assert.ok(sistem(0).includes(TAM_DOSYA))
  })
})
