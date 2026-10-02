/**
 * NOTYA-AYSE-OZET-01 — the summary of one named visit, end to end (Dr. Gökhan, live, 2026-10-02).
 *
 * Asked by voice: "… 12 aylık sağlam çocuk muayenesinin özetini verir misin?". Ayşe answered in writing only and
 * thinly (complaint, assessment, plan): no vaccines, no weight / height / head circumference, nothing spoken.
 *
 * Real handlers (/api/asistan/chat, /api/asistan/fish-tur) over the synthetic corpus panel
 * (lib/asistan/tests/gokhanKorpusHastalari.ts): the paediatric chart with well-child visits at 6, 12, 15, 18 and 24
 * months, and the adult chart. The fake model answers the way the live one did, so a green test means the eight
 * parts and the recorded values reached the doctor in spite of the model, on screen and in the spoken turn.
 */
import { ortam, sahneHazirla, sahneKur, oturumAc, oturumBaglami, yazi, fishTur, sonRota, sonAsistanMesaji, sistemde, encrypt, type Sahne } from './tests/ayseSahne'
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { KORPUS_ADLARI, YABANCI_HASTALAR, korpusPaneliKur, type KorpusPaneli } from './tests/gokhanKorpusHastalari'
import { KORPUS_BEBEK, korpusBebek, korpusEriskin } from './dosyaSorgu/denetim/fikstur'
import { hastaKur, olaylariKur, trGun } from '../doktor/dosyaOlaylari'
import { vizitOzetiSec, vizitOzetSozCumleleri } from './dosyaSorgu/vizitOzeti'
import { OZET_ANLATIM_SINIRI } from './konusma'
import { bugunTz } from '../randevu/tarihCozumle'

const AD = KORPUS_ADLARI.bebek
const ERISKIN = KORPUS_ADLARI.eriskin
const AYLAR = [6, 12, 15, 18, 24] as const
/** The live sentence, about the synthetic chart. */
const soru = (ay: number) => `${AD}'nun ${ay} aylık sağlam çocuk muayenesinin özetini verir misin?`
/** What the doctor got: complaint, assessment, plan. */
const INCE_CEVAP = `${AD} — sağlam çocuk muayenesi.\n\n**Dayanak:**\n- Şikayet: rutin sağlam çocuk kontrolü\n- Değerlendirme: sağlam çocuk\n- Plan: kontrol önerildi`
const BASLIKLAR = ['Muayene', 'Şikayet', 'Muayene bulgusu', 'Laboratuvar', 'Aşı', 'Büyüme ve gelişme', 'Tedavi', 'Plan']
const tr = (n: number) => String(n).replace('.', ',')
const bugun = bugunTz('Europe/Istanbul')
const sirali = (metin: string, basliklar: string[]) => { const k = basliklar.map((b) => metin.indexOf(`**${b}:**`)); return k.every((x, i) => x >= 0 && (i === 0 || x > k[i - 1])) }

/** The same chart through the pure layer: what the record holds for the visit. */
const kayit = (() => {
  const ham = korpusBebek(bugun)
  const olaylar = olaylariKur(ham, bugun), hasta = hastaKur({ ...ham, brans: 'pediatri' }, bugun)
  return { ham, ozet: (ay: number) => vizitOzetiSec(soru(ay), olaylar, hasta)!.ozet! }
})()

before(async () => { await sahneHazirla() })

function sahne(brans = 'pediatri'): { s: Sahne; p: KorpusPaneli } {
  const s = sahneKur(brans)
  return { s, p: korpusPaneliKur(ortam.db, encrypt, s.doktor.id, s.diger.id, bugun) }
}
const ince = () => { ortam.yanit = { metin: JSON.stringify({ speech: INCE_CEVAP }) } }

describe('yazılı sohbet — adı geçen muayenenin özeti sekiz bölümdür', () => {
  for (const ay of AYLAR) {
    it(`${ay} aylık sağlam çocuk muayenesi: sekiz bölüm sırasıyla, kayıtlı değerler, eksik bölüm söylenmiş — model ince cevap verse de`, async () => {
      const { s } = sahne()
      ince()
      const y = await yazi(s, soru(ay))
      assert.equal(y.rota, 'model')
      assert.equal(y.aktifHasta, AD)
      // The model was given the eight-part evidence and the visit-summary format.
      assert.ok(sistemde(/MUAYENE ÖZETİ KANITI/) && sistemde(/BİÇİM \(muayene özeti/) && sistemde(/Tek muayenenin özeti\. Bölümler ve sıraları SABİT/), 'kanıt ve kural modele gitti')
      assert.ok(!sistemde(/Anlık \(snapshot\) özet/), 'dosyanın genel özeti şablonu bu turda yok')
      const c = y.speech
      assert.ok(c.startsWith(`${AD} — `), c.slice(0, 80))
      assert.ok(sirali(c, BASLIKLAR), `sekiz başlık sırasıyla\n${c}`)
      const o = kayit.ozet(ay), v = KORPUS_BEBEK.saglamCocuk[ay]
      assert.ok(c.includes(trGun(o.tarih)), 'muayene tarihi')
      // The age is the calendar age on the visit date (the fixture's dates follow today: a birth on the 30th puts the
      // "6 aylık" visit on 28 February, one day short of six months — the record says so, it is not rounded).
      assert.ok(o.yas && [`${ay} aylık`, `${ay - 1} aylık`, '2 yaş'].includes(o.yas), String(o.yas))
      assert.ok(c.includes(`muayene tarihinde ${o.yas}`), 'muayene tarihindeki yaş')
      for (const d of [`kilo ${tr(v.kilo)} kg`, `boy ${tr(v.boy)} cm`, `baş çevresi ${tr(v.bas)} cm`]) assert.ok(c.includes(d), `${d}\n${c}`)
      // Vaccines: the same-day rows by name, or stated as not given.
      const asilar = kayit.ham.asilar!.filter((a) => a.uygulama_tarihi === o.tarih)
      if (asilar.length) for (const a of asilar) assert.ok(c.includes(`${a.asi_adi} ${a.doz_no}. doz`), `${a.asi_adi}\n${c}`)
      else assert.match(c, /\*\*Aşı:\*\* Aşı yapılmamış/)
      // Growth: the engine's line, or said plainly that there is none.
      if (v.yer === 'metin') assert.match(c, /persentil hesaplanmadı/)
      else assert.match(c, new RegExp(`Büyüme motoru: Kilo ${tr(v.kilo)} kg \\(p\\d+, z .+?\\); Boy ${tr(v.boy)} cm \\(p\\d+`))
      if (ay === 24) assert.match(c, /Hemoglobin 11,9 g\/dL — referans içinde \(11–14\); önceki 10,4 g\/dL/)
      else assert.match(c, /\*\*Laboratuvar:\*\* Laboratuvar istenmemiş/)
      assert.match(c, /\*\*Tedavi:\*\* Reçete yazılmamış/)
      assert.match(c, /\*\*Plan:\*\* .*sonra kontrol/)
      assert.doesNotMatch(c, /otitis media|Augmentin|Dayanak/i, 'başka muayene ve ince cevap yok')
      assert.equal(sonAsistanMesaji(s.oturum), c, 'oturuma yazılan cevap aynı')
    })
  }

  it('kurala uyan model cevabı aynen kalır (başlıklar sırasıyla, kayıtlı değerler, kayıt dışı değer yok)', async () => {
    const { s } = sahne()
    const o = kayit.ozet(12)
    const uygun = [
      `${AD} 12 aylık sağlam çocuk muayenesine ${trGun(o.tarih)} tarihinde gelmiş.`,
      '**Muayene:** 12 aylık, rutin sağlam çocuk kontrolü.', '**Şikayet:** Şikayet yok; birkaç adım atıyor.', '**Muayene bulgusu:** Özellikli bulgu yok.',
      '**Laboratuvar:** Laboratuvar istenmemiş.', '**Aşı:** KPA 3. doz, KKK 1. doz ve Suçiçeği 1. doz yapılmış.',
      '**Büyüme ve gelişme:** Kilo 9,8 kg, boy 76 cm, baş çevresi 46,4 cm; persentil kayması yok, gelişim yaşına uygun.',
      '**Tedavi:** Reçete yazılmamış; demir profilaksisi kesilmiş.', '**Plan:** 3 ay sonra kontrol.',
    ].join('\n\n')
    ortam.yanit = { metin: JSON.stringify({ speech: uygun }) }
    assert.equal((await yazi(s, soru(12))).speech, uygun)
  })

  it('kayıt dışı değer taşıyan cevap (başka muayenenin kilosu) kayıttaki özetle değiştirilir', async () => {
    const { s } = sahne()
    ortam.yanit = { metin: JSON.stringify({ speech: BASLIKLAR.map((b) => `**${b}:** kilo 9,8 kg, boy 76 cm, baş çevresi 46,4 cm; güncel kilo 12,8 kg.`).join('\n\n') }) }
    const c = (await yazi(s, soru(12))).speech
    assert.ok(!c.includes('12,8') && c.includes('kilo 9,8 kg') && sirali(c, BASLIKLAR), c)
  })

  it('dosyada olmayan muayene: açık "bulamadım" kanıtı; başka muayene özetlenmez, cevap değiştirilmez', async () => {
    const { s } = sahne()
    ortam.yanit = { metin: JSON.stringify({ speech: `${AD} — dosyada 30 aylık muayene kaydı bulamadım Hocam.` }) }
    const y = await yazi(s, `${AD}'nun 30 aylık sağlam çocuk muayenesinin özetini verir misin?`)
    assert.equal(y.speech, `${AD} — dosyada 30 aylık muayene kaydı bulamadım Hocam.`)
    assert.ok(sistemde(/eşleşen onaylı vizit kaydı bulamadım/) && !sistemde(/MUAYENE ÖZETİ KANITI/))
  })

  it('muayene adı geçmeyen özet sorusu dosyanın genel özetidir (davranış değişmedi)', async () => {
    const { s, p } = sahne()
    const oturum = oturumAc(s, { id: p.idler.bebek, ad: AD })
    ortam.yanit = { metin: JSON.stringify({ speech: INCE_CEVAP }) }
    const y = await yazi(s, 'Bu hastayı bana kısaca özetler misin?', { oturum })
    assert.equal(y.speech, INCE_CEVAP)
    assert.ok(sistemde(/Anlık \(snapshot\) özet/) && !sistemde(/MUAYENE ÖZETİ KANITI/))
  })
})

describe('sesli tur — hekim özeti DUYAR', () => {
  it('12 aylık muayene: kayıttan yoğun anlatım söylenir (aşılar, kilo, boy, baş çevresi dahil); "Dayanak. N madde, ekranınızda." yok; ayrıntı ekranda', async () => {
    const { s } = sahne()
    ince()
    const t = await fishTur(s, soru(12))
    assert.equal(t.status, 200)
    assert.equal(t.hata, null)
    assert.equal(sonRota(), 'model')
    const beklenen = vizitOzetSozCumleleri(kayit.ozet(12), AD)
    assert.equal(beklenen.length, 7, 'yedi kısa cümle')
    assert.equal(t.soz, beklenen.join(' '))
    for (const d of ['12 aylık', 'Aşı yapılmış: KPA 3. doz, KKK 1. doz ve Suçiçeği 1. doz', 'kilo 9,8 kg', 'Boy 76 cm', 'Baş çevresi 46,4 cm', 'persentil kayması yok', 'Laboratuvar istenmemiş', 'Reçete yazılmamış', '3 ay sonra kontrol']) assert.ok(t.soz.includes(d), `${d}\n${t.soz}`)
    assert.doesNotMatch(t.soz, /madde, ekranınızda|Dayanak|Devamı ekranınızda/)
    assert.ok(!t.soz.includes('kontrol önerildi'), 'modelin ince cevabı söylenmez')
    // The screen holds the eight parts (the model's thin answer was replaced by the record's summary).
    const ekran = sonAsistanMesaji(s.oturum)
    assert.ok(sirali(ekran, BASLIKLAR) && ekran.includes('z −') && ekran.includes('KKK (Kızamık-Kızamıkçık-Kabakulak) 1. doz'), ekran)
    assert.equal(oturumBaglami(s.oturum).sesDevam, undefined, 'anlatım sınırın içinde: kalan yok')
    assert.equal(ortam.modelIstekleri.length, 1, 'ekran cevabı için tek model isteği')
  })

  for (const ay of AYLAR) {
    it(`${ay} aylık muayene: söylenen anlatım kayıttakiyle aynı, sınır (${OZET_ANLATIM_SINIRI} cümle) içinde; eksik bölüm söylenir`, async () => {
      const { s } = sahne()
      ince()
      const t = await fishTur(s, soru(ay))
      const cumleler = vizitOzetSozCumleleri(kayit.ozet(ay), AD)
      assert.equal(t.soz, cumleler.slice(0, OZET_ANLATIM_SINIRI).join(' '))
      const v = KORPUS_BEBEK.saglamCocuk[ay]
      assert.ok(t.soz.toLocaleLowerCase('tr-TR').includes(`kilo ${tr(v.kilo)} kg`) && t.soz.includes(`${tr(v.boy)} cm`) && t.soz.includes(`${tr(v.bas)} cm`), t.soz)
      assert.match(t.soz, ay === 15 || ay === 24 ? /Aşı yapılmamış/ : /Aşı yapılmış: /)
      assert.match(t.soz, ay === 24 ? /Laboratuvar: 4 sonuç var; referans dışı değer yok/ : /Laboratuvar istenmemiş/)
      if (ay === 15) assert.match(t.soz, /persentil hesaplanmadı/)
    })
  }

  it('anlatım sınırdan uzunsa (24. ay: büyüme motorunun kayma cümlesi) kalan devam mekanizmasına gider; "devam et" modelsiz okur', async () => {
    const { s } = sahne()
    ince()
    const cumleler = vizitOzetSozCumleleri(kayit.ozet(24), AD)
    assert.equal(cumleler.length, 8)
    assert.match(cumleler[6], /^Büyüme eğrisinde persentil kayması var, VKİ persentili \d+ iken \d+ olmuş/)
    const t = await fishTur(s, soru(24))
    assert.equal(t.soz, cumleler.slice(0, 7).join(' '))
    assert.doesNotMatch(t.soz, /Devamı ekranınızda/)
    assert.equal(oturumBaglami(s.oturum).sesDevam?.kalan, cumleler[7])
    const once = ortam.modelIstekleri.length
    const d = await fishTur(s, 'devam et')
    assert.equal(d.soz, cumleler[7])
    assert.match(d.soz, /Reçete yazılmamış; plan: Hepatit A 2\. doz planlandı.*6 ay sonra kontrol/)
    assert.equal(ortam.modelIstekleri.length, once, '"devam et" model turu değildir')
    assert.equal(oturumBaglami(s.oturum).sesDevam, undefined)
  })

  it('"… özetleyerek anlatır mısın?" önceki cevabı yeniden okumaz: o muayenenin özetidir (NOTYA-SES-OKU-01 ile çakışma)', async () => {
    const { s, p } = sahne()
    const oturum = oturumAc(s, { id: p.idler.bebek, ad: AD })
    ortam.yanit = { metin: JSON.stringify({ speech: 'Önceki turun cevabı Hocam.' }) }
    await fishTur(s, 'Akut otitte ilk seçenek nedir?', { oturum })
    ince()
    const t = await fishTur(s, `${AD}'nun 15 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın?`, { oturum })
    assert.equal(sonRota(), 'model')
    assert.ok(!t.soz.includes('Önceki turun cevabı') && t.soz.includes('kilo 10,6 kg') && t.soz.includes('15 aylık'), t.soz)
    // The read-aloud request itself still works.
    const o = await fishTur(s, 'Devamını ekranda görüyorum ama sen bana anlat', { oturum })
    assert.equal(sonRota(), 'oku')
    assert.match(o.soz, /Laboratuvar/)
  })
})

describe('erişkin hasta ve hasta izolasyonu', () => {
  it('erişkin (dahiliye): aynı bölümler, aşı ve büyüme yok; branşın kendi ölçümleri; yazıda ve seste', async () => {
    const { s, p } = sahne('dahiliye')
    const oturum = oturumAc(s, { id: p.idler.eriskin, ad: ERISKIN }, 'dahiliye')
    ince()
    const y = await yazi(s, 'Son muayenesinin özetini verir misin?', { oturum, brans: 'dahiliye' })
    assert.equal(y.aktifHasta, ERISKIN)
    const c = y.speech
    assert.ok(sirali(c, ['Muayene', 'Şikayet', 'Muayene bulgusu', 'Laboratuvar', 'Ölçümler', 'Tedavi', 'Plan']), c)
    const son = korpusEriskin(bugun).vizitler[3]
    assert.ok(c.includes(trGun(son.tarih)) && c.includes('kilo 75,5 kg') && c.includes('tansiyon 132/84 mmHg') && c.includes('nabız 76/dk'), c)
    assert.match(c, /HbA1c 7,1 % — laboratuvar referansının üstünde \(4–6\); önceki 7,8 %/)
    assert.doesNotMatch(c, /\*\*Aşı|Büyüme|persentil|baş çevresi|aşı yapıl/i, 'pediatriye özgü bölüm erişkine sızmaz')
    assert.ok(!sistemde(/aşı yapılmamış|Büyüme motoru|baş çevresi/), 'erişkin kuralında aşı ve büyüme anılmaz')
    ince()
    const t = await fishTur(s, 'Son muayenesinin özetini verir misin?', { oturum, brans: 'dahiliye' })
    assert.ok(t.soz.startsWith(`${ERISKIN}, `) && t.soz.includes('tansiyon 132/84 mmHg') && t.soz.includes('referans dışı HbA1c 7,1'), t.soz)
    assert.doesNotMatch(t.soz, /persentil|[Aa]şı|Büyüme|madde, ekranınızda/)
  })

  it('başka hekimin hastası: özet yok, kanıt modele gitmez, hiçbir değer cevapta değil — iki yönde', async () => {
    const { s } = sahne()
    const digerOturum = ortam.db.ekle('asistan_sessions', { doctor_id: s.diger.id, persona_id: 'aysekaya', messages: [], active_context: { specialty: 'pediatri' } }).id as string
    ince()
    // B asks about A's patient, by chat and by voice.
    const y = await yazi(s, soru(12), { token: s.diger.token, oturum: digerOturum })
    assert.notEqual(y.aktifHasta, AD)
    for (const d of ['9,8', '46,4', 'KKK', trGun(kayit.ozet(12).tarih)]) assert.ok(!y.speech.includes(d), `${d}\n${y.speech}`)
    assert.ok(!JSON.stringify(ortam.modelIstekleri).includes('MUAYENE ÖZETİ KANITI'), 'kanıt hiçbir model isteğinde yok')
    const t = await fishTur(s, soru(12), { token: s.diger.token, oturum: digerOturum })
    for (const d of ['9,8', '46,4', 'KKK']) assert.ok(!t.soz.includes(d) && !sonAsistanMesaji(digerOturum).includes(d), d)
    assert.equal(oturumBaglami(digerOturum).currentPatientId, undefined)
    // A asks about B's patient.
    const z = await yazi(s, `${YABANCI_HASTALAR[1]}'un son muayenesinin özetini verir misin?`)
    assert.equal(z.aktifHasta ?? null, null)
    assert.ok(!JSON.stringify(ortam.modelIstekleri).includes('MUAYENE ÖZETİ KANITI'))
  })
})
