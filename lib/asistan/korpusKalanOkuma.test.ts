/**
 * NOTYA-KORPUS-KALAN-01, cluster D — reads. Real handlers (/api/asistan/chat, /api/asistan/fish-tur,
 * /api/doktor/konsult) over the in-memory scene with the corpus panel; the model is the recording fake, scripted to
 * do what the live one did. A green test means the SERVER did the right thing whatever the model wrote.
 *
 *   G-28, Y-063     "MCV ve MCHC değerlerini oku", "Son SOAP notunu oku" on voice: a question about the chart, not
 *                   "read me what is on screen" — the read-aloud route used to re-read the previous answer.
 *   L-ODAK-HITAP-1  "Ayşe, aşı karnesini gösterir misin?": the doctor addresses the assistant; the model turned the
 *                   address into a patient in its tool call and the chart of the patient called Ayşe answered.
 *   I-01 (panel)    "Bu hastayı bana kısaca özetler misin?": the answer names the patient; the model never gets the name.
 *
 * The corpus entries themselves run in korpusKalan.test.ts. Causes and commits: docs/korpus-kalan-fix.md.
 */
import { ortam, sahneHazirla, sahneKur, oturumAc, yazi, fishTur, panel, sonRota, sonModelIstegi, aracCagiranModel, aracSonuclari, sonAsistanMesaji, encrypt, type Sahne } from './tests/ayseSahne'
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { KORPUS_ADLARI, korpusPaneliKur, type KorpusHasta } from './tests/gokhanKorpusHastalari'
import { bugunTz } from '../randevu/tarihCozumle'

const TZ = 'Europe/Istanbul'
const BEBEK = KORPUS_ADLARI.bebek
const AYSE = KORPUS_ADLARI.ayse

before(async () => { await sahneHazirla() })

function sahne(): { s: Sahne; idler: Record<KorpusHasta, string> } {
  const s = sahneKur()
  return { s, idler: korpusPaneliKur(ortam.db, encrypt, s.doktor.id, s.diger.id, bugunTz(TZ)).idler }
}
const model = (metin: string) => ({ metin: JSON.stringify({ speech: metin }) })

describe('G-28, Y-063 — "… oku": dosyadaki bir şeyi okutmak ekrandaki cevabı okutmak değildir (ses)', () => {
  const ONCEKI = 'Emircan Karaoğlu’nun WBC değeri 9,1 ×10³/µL’ydi.'

  for (const [id, soz, cevap] of [
    ['G-28', 'MCV ve MCHC değerlerini oku', 'Emircan Karaoğlu’nun MCV değeri 75 fL; MCHC kaydı dosyada yok.'],
    ['Y-063', 'Son SOAP notunu oku', 'Emircan Karaoğlu’nun son notu: sağ akut otitis media kontrolü, iyileşmiş.'],
  ] as const) {
    it(`${id}: "${soz}" → model, dosyayla; önceki cevap yeniden okunmaz`, async () => {
      const { s, idler } = sahne()
      const oturum = oturumAc(s, { id: idler.bebek, ad: BEBEK })
      ortam.yanit = model(ONCEKI)
      await fishTur(s, 'WBC kaç', { oturum, saatDilimi: TZ })
      ortam.yanit = model(cevap)
      const once = ortam.modelIstekleri.length
      const v = await fishTur(s, soz, { oturum, saatDilimi: TZ })
      assert.equal(sonRota(), 'model')
      assert.equal(ortam.modelIstekleri.length, once + 1, 'model çağrıldı')
      assert.match(JSON.stringify(sonModelIstegi()?.govde.system), /AKTİF HASTA DOSYASI: Emircan Karaoğlu/)
      assert.ok(v.soz.includes(cevap.slice(0, 40)), v.soz)
      assert.ok(!v.soz.includes('WBC'), 'önceki cevap okunmadı')
      assert.notEqual(sonAsistanMesaji(oturum), 'Ekrandaki cevabı sesli okudum Hocam.')
    })
  }

  it('NOTYA-SES-OKU-01 aynen: "Devamını ekranda görüyorum ama sen bana anlat" ekrandaki cevabı modelsiz okur', async () => {
    const { s, idler } = sahne()
    const oturum = oturumAc(s, { id: idler.bebek, ad: BEBEK })
    ortam.yanit = model(ONCEKI)
    await fishTur(s, 'WBC kaç', { oturum, saatDilimi: TZ })
    const once = ortam.modelIstekleri.length
    for (const soz of ['Devamını ekranda görüyorum ama sen bana anlat', 'oku', 'Hepsini oku Ayşe']) {
      const v = await fishTur(s, soz, { oturum, saatDilimi: TZ })
      assert.equal(sonRota(), 'oku', soz)
      assert.match(v.soz, /WBC değeri 9,1/, soz)
    }
    assert.equal(ortam.modelIstekleri.length, once, 'model çağrılmadı')
  })
})

describe('L-ODAK-HITAP-1 — hitaptaki "Ayşe" modelin araç çağrısında hasta olamaz', () => {
  const HITAP = 'Ayşe, aşı karnesini gösterir misin?'
  /** What the live model did: the address became a patient reference in the tool text. */
  const CAGRILAR = [
    { name: 'hasta_bul', input: { isim: 'Ayşe’nin aşı karnesi' } },
    { name: 'hasta_bul', input: { isim: 'Ayşe aşı karnesi' } },
    { name: 'hasta_bul', input: { isim: 'Ayşe' } },
    { name: 'muayeneleri_oku', input: { hasta_adi: 'Ayşe' } },
    { name: 'eksikler', input: { hasta_adi: 'Ayşe' } },
  ]

  for (const cagri of CAGRILAR) {
    it(`${cagri.name}(${JSON.stringify(cagri.input)}) → hasta çözülmez, Ayşe Bozkurt'un dosyası açılmaz (yazı ve ses)`, async () => {
      for (const kanal of ['yazi', 'ses'] as const) {
        const { s } = sahne()
        const oturum = oturumAc(s)
        ortam.yanit = aracCagiranModel(cagri, (r) => `Hocam, ${r.join(' ')}`)
        const cevap = kanal === 'yazi' ? (await yazi(s, HITAP, { oturum, saatDilimi: TZ })).speech : (await fishTur(s, HITAP, { oturum, saatDilimi: TZ })).soz
        assert.equal(sonRota(), 'model', kanal)
        const sonuc = aracSonuclari(sonModelIstegi()).join(' ')
        assert.ok(!sonuc.includes(AYSE) && !cevap.includes(AYSE), `${kanal}: ${sonuc} / ${cevap}`)
        assert.ok(!/kayıtlı aşı yok|aşı kaydı yok/i.test(sonuc), `${kanal}: boş karne cevabı — ${sonuc}`)
        const baglam = ortam.db.tablo('asistan_sessions').find((x) => x.id === oturum)?.active_context as { currentPatientId?: string } | undefined
        assert.ok(!baglam?.currentPatientId, `${kanal}: oturuma hasta bağlanmadı`)
      }
    })
  }

  it('hekim hastayı gerçekten anarsa çözülür: "Ayşe’nin aşı karnesini göster", "Ayşe Bozkurt …" (NOTYA-AYSE-GERI-01 aynen)', async () => {
    for (const soz of ['Ayşe’nin aşı karnesini göster', 'Ayşe Bozkurt aşı karnesini göster', 'Ayşe, Ayşe Bozkurt’un aşı karnesini gösterir misin?']) {
      const { s } = sahne()
      const y = await yazi(s, soz, { oturum: oturumAc(s), saatDilimi: TZ })
      assert.equal(y.aktifHasta, AYSE, soz)
    }
  })

  it('açık dosya varken hitap: soru açık dosyanındır, Ayşe Bozkurt\'un değil', async () => {
    const { s, idler } = sahne()
    const oturum = oturumAc(s, { id: idler.bebek, ad: BEBEK })
    const y = await yazi(s, HITAP, { oturum, saatDilimi: TZ })
    assert.equal(y.rota, 'kayit')
    assert.equal(y.aktifHasta, BEBEK)
    assert.match(y.speech, /Hepatit B/)
    assert.ok(!y.speech.includes(AYSE))
  })

  it('komut: "Ayşe, fıstık alerjisini ekle" — hasta_adi "Ayşe" kart hazırlamaz, hangi hasta diye sorulur; cevap olarak söylenen "Ayşe Bozkurt" hastadır', async () => {
    const { s } = sahne()
    const oturum = oturumAc(s)
    ortam.yanit = { metin: '', araclar: [{ name: 'alerji_ekle', input: { hasta_adi: 'Ayşe', alerjen: 'Fıstık', alan_kaynaklari: { alerjen: { kaynak: 'doktor_soyledi' } } } }] }
    const y = await yazi(s, 'Ayşe, fıstık alerjisini ekle', { oturum, saatDilimi: TZ })
    assert.equal(y.eylemOnerileri.length, 0, 'kart yok')
    assert.match(y.speech, /Hangi hasta için Hocam\?/)
    assert.equal(y.aktifHasta, null)
    ortam.yanit = { metin: '', araclar: [{ name: 'alerji_ekle', input: { hasta_adi: 'Ayşe Bozkurt', alerjen: 'Fıstık', alan_kaynaklari: { alerjen: { kaynak: 'doktor_soyledi' } } } }] }
    const devam = await yazi(s, 'Ayşe Bozkurt', { oturum, saatDilimi: TZ })
    assert.deepEqual(devam.eylemOnerileri.map((o) => o.eylem_anahtar), ['alerji_ekle'])
    assert.equal(devam.eylemHastasi?.ad, AYSE)
  })
})

describe('I-01 (Danış paneli) — özet hastayı adıyla anar; ad modele gitmez', () => {
  const OZET = 'Hocam, hasta 30 Ağustos 2024 doğumlu erkek çocuk; dosyada 15 vizit kaydı var. Demir eksikliği anemisi ve sağ akut otitis media öyküsü var.'

  it('"Bu hastayı bana kısaca özetler misin?" → cevap hastanın adıyla başlar; model isteğinde ad yok', async () => {
    const { s, idler } = sahne()
    ortam.yanit = { metin: OZET }
    const y = await panel(s, idler.bebek, [{ rol: 'doktor', icerik: 'Bu hastayı bana kısaca özetler misin?' }])
    assert.equal(y.cevap, `${BEBEK} — ${OZET}`)
    assert.ok(!JSON.stringify(sonModelIstegi()?.govde).includes('Emircan'), 'ad modele gitmedi')
  })

  it('sonraki turda tarayıcının geri gönderdiği cevaptaki ad modele gitmez; ölçüm cevabı ("Kayıt — …") ve serbest soru adsız kalır', async () => {
    const { s, idler } = sahne()
    ortam.yanit = { metin: 'Hocam, son muayenede sağ akut otitis media kontrolü yapılmış; iyileşmiş.' }
    const gecmis = [
      { rol: 'doktor' as const, icerik: 'Bu hastayı bana kısaca özetler misin?' },
      { rol: 'asistan' as const, icerik: `${BEBEK} — ${OZET}` },
      { rol: 'doktor' as const, icerik: 'Son muayeneden bu yana neler değişmiş?' },
    ]
    const y = await panel(s, idler.bebek, gecmis)
    assert.ok(y.cevap.startsWith(`${BEBEK} — Hocam, son muayenede`), y.cevap)
    const govde = JSON.stringify(sonModelIstegi()?.govde)
    assert.ok(!govde.includes('Emircan'), 'geçmişteki ad ayıklandı')
    assert.ok(govde.includes('dosyada 15 vizit kaydı var'), 'geçmişteki cevabın kendisi duruyor')
    // Not a canonical file question: the answer is the model's, unchanged.
    ortam.yanit = { metin: 'Hocam, akut otitte ilk seçenek amoksisilindir.' }
    assert.equal((await panel(s, idler.bebek, [{ rol: 'doktor', icerik: 'Otitte ilk seçenek ne?' }])).cevap, 'Hocam, akut otitte ilk seçenek amoksisilindir.')
    // A measurement answer keeps its "Kayıt — …" form.
    ortam.yanit = { metin: 'Bilmiyorum.' }
    const olcum = (await panel(s, idler.bebek, [{ rol: 'doktor', icerik: 'bu hasta 12 aylık muayenesine geldiğinde kaç kiloydu' }])).cevap
    assert.ok(olcum.startsWith('Kayıt — 12 aylık muayene') && !olcum.includes('Emircan'), olcum)
  })

  it('HASTA-IZOLASYON: başka hekim bu hastayı soramaz — ad da, cevap da dönmez', async () => {
    const { s, idler } = sahne()
    ortam.yanit = { metin: OZET }
    const y = await panel(s, idler.bebek, [{ rol: 'doktor', icerik: 'Bu hastayı bana kısaca özetler misin?' }], { token: s.diger.token })
    assert.equal(y.status, 404)
    assert.equal(y.cevap, '')
    assert.equal(ortam.modelIstekleri.length, 0)
  })
})
