/**
 * NOTYA-DANIS-OLCUM — "12 aylık muayenesine geldiğinde kaç kiloydu", end to end (Dr. Gökhan, live, 2026-10-02).
 *
 * Real handlers over synthetic in-memory patients (lib/asistan/tests/olcumHastasi.ts): the Danış panel
 * (/api/doktor/konsult), Ayşe chat (/api/asistan/chat) and Ayşe voice (/api/asistan/fish-tur). The fake model
 * answers the way the live one did — "not written, about 9,35 kg from the iron dose" — so a green test means the
 * recorded value reached the doctor in spite of the model, and a missing value was never replaced by an estimate.
 */
import { ortam, sahneHazirla, sahneKur, oturumAc, yazi, fishTur, sonRota, sonAsistanMesaji, sistemde, encrypt, type Sahne } from './tests/ayseSahne'
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { olcumDosyasi, eriskinOlcumDosyasi, olcumHastasiEkle, OLCUM_COCUK_ADI as AD, OLCUM_ERISKIN_ADI as ERISKIN, KILO_12AY, TARIH_12AY, TAHMIN_KILO, type OlcumVaryanti } from './tests/olcumHastasi'

const SORU = 'bu hasta 12 aylık muayenesine geldiğinde kaç kiloydu'
/** What the live model said. */
const CANLI_CEVAP = 'Hocam, 12 aylık muayenede kilo doğrudan yazılmamış. Demir dozu 1 mg/kg/gün ve günde 9,35 mg olduğuna göre yaklaşık 9,35 kg olmalı.'

let danisRota: { POST: (r: any) => Promise<Response> }
let Istek: typeof import('next/server').NextRequest

before(async () => {
  await sahneHazirla()
  Istek = (await import('next/server')).NextRequest
  danisRota = await import('../../app/api/doktor/konsult/route')
})

function cocukSahnesi(v: OlcumVaryanti): { s: Sahne; hasta: string } {
  const s = sahneKur()
  return { s, hasta: olcumHastasiEkle(ortam.db, encrypt, s.doktor.id, olcumDosyasi(v)) }
}
function eriskinSahnesi(brans: string): { s: Sahne; hasta: string } {
  const s = sahneKur(brans)
  return { s, hasta: olcumHastasiEkle(ortam.db, encrypt, s.doktor.id, eriskinOlcumDosyasi(brans), brans) }
}

/** One turn of the Danış panel through the real /api/doktor/konsult handler. */
async function danis(token: string, patientId: string, soru: string): Promise<{ status: number; cevap: string }> {
  const y = await danisRota.POST(new Istek('http://localhost/api/doktor/konsult', {
    method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ patientId, mesajlar: [{ rol: 'doktor', icerik: soru }] }),
  } as ConstructorParameters<typeof Istek>[1]))
  const j = await y.json()
  return { status: y.status, cevap: String(j.cevap || '') }
}

describe('Ayşe\'ye Danış — 12 aylık muayenenin kilosu', () => {
  for (const [v, kaynak] of [['a', /yaşamsal bulgu alanı/], ['b', /cihaz ölçümü/], ['c', /not(unun)? metni/]] as const) {
    it(`(${v}) kayıtlı değer cevapta: değer, birim, tarih, kaynak — model tahmin etse bile`, async () => {
      const { s, hasta } = cocukSahnesi(v)
      ortam.yanit = { metin: CANLI_CEVAP }
      const y = await danis(s.doktor.token, hasta, SORU)
      assert.equal(y.status, 200)
      assert.ok(y.cevap.includes(`kilo ${KILO_12AY}`), y.cevap)
      assert.ok(y.cevap.includes(TARIH_12AY), y.cevap)
      assert.match(y.cevap, kaynak)
      assert.ok(!y.cevap.includes(TAHMIN_KILO), 'doz cümlesinden türetilen kilo cevapta yok')
      assert.ok(!y.cevap.includes(AD), 'Danış hasta adını üretmez')
      assert.ok(sistemde(/KAYITLI: kilo 9,8 kg — 15\.05\.2025/), 'kanıt modele gitti')
    })
  }

  it('(a) modelin doğru cevabı aynen kalır', async () => {
    const { s, hasta } = cocukSahnesi('a')
    const iyi = 'Hocam, 12 aylık muayenede (15.05.2025) kilosu 9,8 kg; yaşamsal bulgu alanında kayıtlı.'
    ortam.yanit = { metin: iyi }
    assert.equal((await danis(s.doktor.token, hasta, SORU)).cevap, iyi)
  })

  it('(d) kayıt yok: "kayıtlı kilo ölçümü yok" — tahmin kayıtlı değer gibi sunulmaz', async () => {
    const { s, hasta } = cocukSahnesi('d')
    ortam.yanit = { metin: 'Hocam o muayenede kilosu 9,35 kg idi.' }
    const y = await danis(s.doktor.token, hasta, SORU)
    assert.match(y.cevap, /12 aylık muayene \(15\.05\.2025\): kayıtlı kilo ölçümü yok/)
    assert.ok(!y.cevap.includes(TAHMIN_KILO))
    assert.ok(sistemde(/KAYIT YOK: bu muayene için kilo ölçümü bulunamadı/))
  })

  it('dosya metni her muayenenin kendi ölçümünü taşır (kök neden: vitaller dosyada yoktu)', async () => {
    const { s, hasta } = cocukSahnesi('a')
    await danis(s.doktor.token, hasta, 'Bu hastayı özetler misin?')
    assert.ok(sistemde(/Vizit 3 — 15 Mayıs 2025[^#]*Ölçümler \(yaşamsal bulgu alanı\): [^#]*Kilo: 9,8 kg/))
    assert.ok(!sistemde(/VİZİT ÖLÇÜMÜ KANITI/), 'ölçüm sorusu olmayan turda kanıt bloğu yok')
  })

  it('HASTA-IZOLASYON: başka hekim bu hastanın ölçümünü soramaz (404, model çağrılmaz)', async () => {
    const { s, hasta } = cocukSahnesi('a')
    const y = await danis(s.diger.token, hasta, SORU)
    assert.equal(y.status, 404)
    assert.equal(ortam.modelIstekleri.length, 0)
  })
})

/** A Danış conversation: the panel is stateless, the browser sends every turn. */
async function danisSohbet(token: string, patientId: string, mesajlar: { rol: 'doktor' | 'asistan'; icerik: string }[]): Promise<string> {
  const y = await danisRota.POST(new Istek('http://localhost/api/doktor/konsult', {
    method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ patientId, mesajlar }),
  } as ConstructorParameters<typeof Istek>[1]))
  assert.equal(y.status, 200)
  return String((await y.json()).cevap || '')
}

describe('NOTYA-KORPUS-KALAN-01 — Danış: takip sorusu, seri tablosu, büyüme sorusunda son kayıtlı değerler', () => {
  it('(L-DANIS-BOYU) "peki boyu?" bir önceki sorunun muayenesinin boyudur — model son boyu söylese bile', async () => {
    const { s, hasta } = cocukSahnesi('a')
    ortam.yanit = { metin: 'Hocam, boyu kayıtlı değil.' }
    const c = await danisSohbet(s.doktor.token, hasta, [
      { rol: 'doktor', icerik: SORU }, { rol: 'asistan', icerik: `Kayıt — 12 aylık muayene (${TARIH_12AY}): kilo ${KILO_12AY}.` }, { rol: 'doktor', icerik: 'peki boyu?' },
    ])
    assert.match(c, /^Kayıt — 12 aylık muayene \(15\.05\.2025\): boy 75 cm\. Kaynak: muayene notunun yaşamsal bulgu alanı\./)
    assert.ok(sistemde(/KAYITLI: boy 75 cm — 15\.05\.2025/), 'kanıt modele gitti')
    // With no exam named before it, the same sentence is not a visit question: no evidence block, the model answers.
    ortam.yanit = { metin: 'Hocam, son boy 75 cm (15.05.2025).' }
    assert.equal(await danisSohbet(s.doktor.token, hasta, [{ rol: 'doktor', icerik: 'peki boyu?' }]), 'Hocam, son boy 75 cm (15.05.2025).')
    assert.ok(!sistemde(/VİZİT ÖLÇÜMÜ KANITI/))
  })

  it('(L-DANIS-SERI-2) "bütün muayenelerinde kilosu": model değerleri madde madde yazsa da ekranda kayıt tablosu', async () => {
    const { s, hasta } = cocukSahnesi('a')
    ortam.yanit = { metin: 'Hocam, kayıtlı kilo ölçümleri:\n- 15.11.2024: 7,9 kg\n- 15.02.2025: 9,1 kg\n- 15.05.2025: 9,8 kg\n- 25.09.2025: 10,6 kg' }
    const y = await danis(s.doktor.token, hasta, 'bütün muayenelerinde kilosu')
    const satirlar = y.cevap.split('\n').filter((x) => /^\| \d{2}\./.test(x)).map((x) => x.split('|').slice(1, 3).map((h) => h.trim()))
    assert.deepEqual(satirlar, [['15.11.2024', '7,9 kg'], ['15.02.2025', '9,1 kg'], ['15.05.2025', '9,8 kg'], ['25.09.2025', '10,6 kg']])
    assert.ok(!y.cevap.includes(AD), 'Danış hasta adını üretmez')
  })

  it('(I-03) "Büyümesi nasıl gidiyor?": son kayıtlı kilo / boy / baş çevresi cevapta — model yuvarlasa ya da hiç yazmasa da', async () => {
    const { s, hasta } = cocukSahnesi('a')
    const yuvarlak = 'Hocam, ölçümler artış gösteriyor: 12 aylıkken 9,8 kg ve 76 cm; son kontrolde 10,6 kg.'
    ortam.yanit = { metin: yuvarlak }
    const y = await danis(s.doktor.token, hasta, 'Büyümesi nasıl gidiyor?')
    // A canonical file question: the server opens the answer with the patient's name (I-01); the model never gets it.
    assert.equal(y.cevap, `${AD} — kayıtlı son ölçümler: kilo 10,6 kg (25.09.2025); boy 75 cm (15.05.2025); baş çevresi 46 cm (15.05.2025).\n\n${yuvarlak}`)
    assert.ok(sistemde(/SON KAYITLI ÖLÇÜMLER \(kayıttan, deterministik\) ===[^=]*- boy 75 cm — 15\.05\.2025/), 'kanıt modele gitti')
    // The model's own answer stays untouched when it carries the recorded values.
    const dogru = 'Hocam, son kilo 10,6 kg (25.09.2025), son boy 75 cm ve baş çevresi 46 cm (15.05.2025). Artış düzenli.'
    ortam.yanit = { metin: dogru }
    assert.equal((await danis(s.doktor.token, hasta, 'Büyümesi nasıl gidiyor?')).cevap, `${AD} — ${dogru}`)
    // Not a growth question: nothing is added.
    ortam.yanit = { metin: 'Hocam, hasta sağlam çocuk izleminde.' }
    assert.equal((await danis(s.doktor.token, hasta, 'Bu hastayı özetler misin?')).cevap.includes('son ölçümler'), false)
  })

  it('(I-03) BRANS-ALAN-SIZMASI: erişkin branşta kayıt cümlesi baş çevresi taşımaz', async () => {
    const { s, hasta } = eriskinSahnesi('kardiyoloji')
    ortam.yanit = { metin: 'Hocam, kilo vermiş.' }
    const y = await danis(s.doktor.token, hasta, 'Kilosu nasıl gidiyor, büyüme eğrisi var mı?')
    assert.equal(y.cevap, `${ERISKIN} — kayıtlı son ölçümler: kilo 79,5 kg (15.06.2026); boy 162 cm (15.06.2026).\n\nHocam, kilo vermiş.`)
    assert.doesNotMatch(y.cevap, /baş çevresi/i)
    assert.ok(sistemde(/SON KAYITLI ÖLÇÜMLER \(kayıttan, deterministik\) ===[^=]*- kilo 79,5 kg/), 'kanıt modele gitti')
    assert.ok(!sistemde(/SON KAYITLI ÖLÇÜMLER \(kayıttan, deterministik\) ===[^=]*baş çevresi/), 'kanıt da baş çevresi taşımaz')
  })
})

describe('NOTYA-KORPUS-KALAN-01 — sohbet ve ses: son kayıtlı değer, aynı muayenenin takibi, son ölçümler, anne boyu', () => {
  it('(T-042, T-044) "boyu?" / "baş çevresi?": son muayene akut ve yalnız kilo taşıyorsa bir önceki kayıtlı değer', async () => {
    const { s, hasta } = cocukSahnesi('a')
    const oturum = oturumAc(s, { id: hasta, ad: AD })
    assert.equal((await yazi(s, `${AD} kaç kilo?`, { oturum })).rota, 'hizli-kart')
    const boy = await yazi(s, 'boyu?', { oturum })
    assert.deepEqual([boy.rota, boy.speech], ['kayit', `${AD} — son boy 75 cm (15.05.2025).`])
    const bas = await yazi(s, 'baş çevresi?', { oturum })
    assert.deepEqual([bas.rota, bas.speech], ['kayit', `${AD} — son baş çevresi 46 cm (15.05.2025).`])
    assert.equal(ortam.modelIstekleri.length, 0)
  })

  it('(L-DANIS-BOYU) "peki boyu?" 12 aylık muayenenin kilosundan sonra o muayenenin boyudur (yazı ve ses)', async () => {
    const { s, hasta } = cocukSahnesi('a')
    const oturum = oturumAc(s, { id: hasta, ad: AD })
    await yazi(s, SORU, { oturum })
    const y = await yazi(s, 'peki boyu?', { oturum })
    assert.equal(y.rota, 'kayit')
    assert.ok(y.speech.startsWith(`${AD} — 12 aylık muayene (${TARIH_12AY}): boy 75 cm.`), y.speech)
    // The chain continues on the same exam; a question that names no exam and follows none asks the latest value.
    assert.match((await yazi(s, 'baş çevresi?', { oturum })).speech, /12 aylık muayene \(15\.05\.2025\): baş çevresi 46 cm\./)
    const ses = oturumAc(s, { id: hasta, ad: AD })
    await fishTur(s, SORU, { oturum: ses })
    const v = await fishTur(s, 'peki boyu?', { oturum: ses })
    assert.equal(sonRota(), 'kayit')
    assert.match(v.soz, /12 aylık muayene \(15\.05\.2025\): boy 75 cm/)
    assert.equal(ortam.modelIstekleri.length, 0)
  })

  it('(Y-021) "Son ölçümleri neler?": son muayenenin kayıtlı bütün ölçümleri (ateş dahil) — antropometri tablosu değil', async () => {
    const { s, hasta } = cocukSahnesi('a')
    const y = await yazi(s, 'Son ölçümleri neler?', { oturum: oturumAc(s, { id: hasta, ad: AD }) })
    assert.deepEqual([y.rota, y.speech], ['kayit', `${AD} — son muayene (25.09.2025): kilo 10,6 kg; ateş 38,4 °C. Kaynak: muayene notunun yaşamsal bulgu alanı.`])
    assert.equal(ortam.modelIstekleri.length, 0)
  })

  it('(Y-023) "annesinin boyu kaç": Hasta Bilgi Formu alanı, modelsiz; formda yoksa hastanın boyu verilmez', async () => {
    const { s, hasta } = cocukSahnesi('a')
    const oturum = oturumAc(s, { id: hasta, ad: AD })
    const yok = await yazi(s, 'bu hastanın annesinin boyu kaç', { oturum })
    assert.deepEqual([yok.rota, yok.speech], ['kayit', `${AD} — anne boyu Hasta Bilgi Formu’nda kayıtlı değil Hocam.`])
    ortam.db.ekle('hasta_intake_formlari', { patient_id: hasta, doktor_id: s.doktor.id, created_at: '2024-11-01T09:00:00Z', form_data_encrypted: encrypt(JSON.stringify({ anneBoyu: '168', babaBoyu: '176' })) })
    const y = await yazi(s, 'bu hastanın annesinin boyu kaç', { oturum: oturumAc(s, { id: hasta, ad: AD }) })
    assert.deepEqual([y.rota, y.speech], ['kayit', `${AD} — anne boyu 168 cm (Hasta Bilgi Formu).`])
    assert.equal(ortam.modelIstekleri.length, 0)
  })
})

describe('Ayşe sohbet ve ses — aynı kanıt, modelsiz', () => {
  for (const v of ['a', 'b', 'c'] as const) {
    it(`(${v}) yazı: kayıtlı kilo, tarih ve kaynak; "son ölçüm" değil`, async () => {
      const { s, hasta } = cocukSahnesi(v)
      const y = await yazi(s, SORU, { oturum: oturumAc(s, { id: hasta, ad: AD }) })
      assert.equal(y.rota, 'kayit')
      assert.ok(y.speech.startsWith(`${AD} — 12 aylık muayene (${TARIH_12AY}): kilo ${KILO_12AY}.`), y.speech)
      assert.match(y.speech, /Kaynak: /)
      assert.doesNotMatch(y.speech, /10,6/)
      assert.equal(ortam.modelIstekleri.length, 0)
    })
  }

  it('(d) yazı: kayıt yok cümlesi, uydurma değer yok', async () => {
    const { s, hasta } = cocukSahnesi('d')
    const y = await yazi(s, SORU, { oturum: oturumAc(s, { id: hasta, ad: AD }) })
    assert.match(y.speech, /kayıtlı kilo ölçümü yok/)
    assert.ok(!y.speech.includes(TAHMIN_KILO) && !y.speech.includes(KILO_12AY))
    assert.equal(ortam.modelIstekleri.length, 0)
  })

  it('ses: aynı cümle söylenir, ekrana aynı metin yazılır', async () => {
    const { s, hasta } = cocukSahnesi('a')
    const yaziCevabi = await yazi(s, SORU, { oturum: oturumAc(s, { id: hasta, ad: AD }) })
    const oturum = oturumAc(s, { id: hasta, ad: AD })
    const v = await fishTur(s, SORU, { oturum })
    assert.equal(sonRota(), 'kayit')
    assert.match(v.soz, /12 aylık muayene/)
    assert.match(v.soz, /9,8/)
    assert.equal(sonAsistanMesaji(oturum), yaziCevabi.speech)
    assert.equal(ortam.modelIstekleri.length, 0)
  })

  it('değerlendirme sorusu modele gider — o muayenenin kilosu kanıtta', async () => {
    const { s, hasta } = cocukSahnesi('a')
    const y = await yazi(s, '12 aylık muayenesinde kilosu normal miydi?', { oturum: oturumAc(s, { id: hasta, ad: AD }) })
    assert.equal(y.rota, 'model')
    assert.ok(sistemde(/KAYITLI: kilo 9,8 kg — 15\.05\.2025/))
  })

  it('ölçüme dayanan başka soru modele gider (hızlı kartın "son ölçüm"ü değil), kanıt yanında', async () => {
    const { s, hasta } = cocukSahnesi('a')
    const y = await yazi(s, '12 aylık muayenede kilosuna göre hangi mama önerilmişti?', { oturum: oturumAc(s, { id: hasta, ad: AD }) })
    assert.equal(y.rota, 'model')
    assert.ok(sistemde(/KAYITLI: kilo 9,8 kg — 15\.05\.2025/))
  })

  it('"kilo gelişimi": tarih ve değer sırayla (gelişim taraması cevabı değil)', async () => {
    const { s, hasta } = cocukSahnesi('c')
    const y = await yazi(s, 'kilo gelişimi', { oturum: oturumAc(s, { id: hasta, ad: AD }) })
    assert.equal(y.rota, 'kayit')
    const satirlar = y.speech.split('\n').filter((x) => /^\| \d{2}\./.test(x)).map((x) => x.split('|').slice(1, 3).map((h) => h.trim()))
    assert.deepEqual(satirlar, [['15.11.2024', '7,9 kg'], ['15.02.2025', '9,1 kg'], ['15.05.2025', '9,8 kg'], ['25.09.2025', '10,6 kg']])
  })

  it('"bütün muayenelerinde kilosu": not metnindeki kilo da tabloda', async () => {
    const { s, hasta } = cocukSahnesi('c')
    const y = await yazi(s, 'bütün muayenelerinde kilosu', { oturum: oturumAc(s, { id: hasta, ad: AD }) })
    assert.equal(y.rota, 'kayit')
    assert.match(y.speech, /\| 15\.05\.2025 \| 9,8 \(not metni\) \|/)
  })
})

describe('erişkin ve Klinik — aynı kanıt, pediatrik varsayım yok', () => {
  const PEDIATRIK = /baş çevresi|persentil|sağlam çocuk|veli/i

  it('kardiyoloji, Danış: "son muayenede tansiyonu" → kayıtlı tansiyon, tarih, kaynak', async () => {
    const { s, hasta } = eriskinSahnesi('kardiyoloji')
    ortam.yanit = { metin: 'Hocam, tansiyon değeri dosyada görünmüyor.' }
    const y = await danis(s.doktor.token, hasta, 'son muayenede tansiyonu kaçtı')
    assert.match(y.cevap, /son muayene \(15\.06\.2026\): tansiyon 128\/82 mmHg\./)
    assert.match(y.cevap, /Kaynak: muayene notunun yaşamsal bulgu alanı/)
    assert.doesNotMatch(y.cevap, PEDIATRIK)
  })

  it('kardiyoloji, sohbet: tansiyon seyri — not metnindeki değer kaynağıyla', async () => {
    const { s, hasta } = eriskinSahnesi('kardiyoloji')
    const y = await yazi(s, 'tansiyon seyri', { oturum: oturumAc(s, { id: hasta, ad: ERISKIN }) })
    assert.equal(y.rota, 'kayit')
    const satirlar = y.speech.split('\n').filter((x) => /^\| \d{2}\./.test(x)).map((x) => x.split('|').slice(1, 4).map((h) => h.trim()))
    assert.deepEqual(satirlar, [['03.11.2025', '158/96 mmHg', 'muayene alanı'], ['10.02.2026', '142/88 mmHg', 'not metni'], ['15.06.2026', '128/82 mmHg', 'muayene alanı']])
    assert.doesNotMatch(y.speech, PEDIATRIK)
    assert.equal(ortam.modelIstekleri.length, 0)
  })

  it('kardiyoloji, sohbet: VKİ kayıtlı kilo ve boydan hesaplanır ve öyle söylenir', async () => {
    const { s, hasta } = eriskinSahnesi('kardiyoloji')
    const y = await yazi(s, 'son muayenede VKİ kaçtı', { oturum: oturumAc(s, { id: hasta, ad: ERISKIN }) })
    assert.match(y.speech, /son muayene \(15\.06\.2026\): VKİ 30,3 kg\/m²\./)
    assert.match(y.speech, /kayıtlı kilo \(79,5 kg\) ve boydan \(162 cm\) hesaplandı/)
  })

  it('Klinik (diyetisyen), Danış: "ilk muayenede kaç kiloydu" ve seri', async () => {
    const { s, hasta } = eriskinSahnesi('diyetisyen')
    ortam.yanit = { metin: 'Kilo bilgisi yok.' }
    const ilk = await danis(s.doktor.token, hasta, 'ilk muayenede kaç kiloydu')
    assert.match(ilk.cevap, /ilk muayene \(03\.11\.2025\): kilo 84 kg\./)
    ortam.yanit = { metin: 'Kilo bilgisi yok.' }
    const seri = await danis(s.doktor.token, hasta, 'bütün muayenelerinde kilosu')
    for (const d of ['03.11.2025', '84 kg', '10.02.2026', '82 kg', '15.06.2026', '79,5 kg']) assert.ok(seri.cevap.includes(d), `${d} yok: ${seri.cevap}`)
    assert.doesNotMatch(seri.cevap, PEDIATRIK)
  })

  it('Klinik (diyetisyen), ses: son muayenenin kilosu', async () => {
    const { s, hasta } = eriskinSahnesi('diyetisyen')
    const v = await fishTur(s, 'son muayenede kaç kiloydu', { oturum: oturumAc(s, { id: hasta, ad: ERISKIN }) })
    assert.match(v.soz, /79,5/)
    assert.equal(ortam.modelIstekleri.length, 0)
  })
})
