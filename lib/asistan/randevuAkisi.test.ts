/**
 * NOTYA-RANDEVU-AYSE-01 — Ayşe books, moves and cancels appointments (Kaan, 2026-10-01).
 *
 * 1. Pure: intent ("randevu" + an action verb, never a calendar question), spoken day / time in the doctor's timezone.
 * 2. Real routes (fake Supabase + fake model that must NOT be called): /api/asistan/chat (text) and
 *    /api/asistan/fish-tur (voice, Fish). Create / move / cancel happy paths, one question at a time, ambiguous and
 *    unknown patient, write only after the confirmation, cross-doctor isolation, the exact live sentence never
 *    answered with the count template, and the scope gate still refusing the weather.
 *
 * Synthetic QA data only.
 */
import { describe, it, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SahteVeritabani } from '../security/testing/sahteSupabase'
import { adIndeksParcalari, tokenOzeti } from '../doktor/hastaAramaIndeksi'
import { bugunTz, isoGunKaydir, yerelAnI } from '../randevu/tarihCozumle'
import { kisaTarihEtiketi } from '../randevu/gunlukOzet'
import { randevuNiyetiBul, randevuSaatiBul, randevuTarihiBul, soylenenAd } from './randevuAkisi'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-randevu-akisi-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ANTHROPIC_API_KEY = 'sahte'
delete process.env.FISH_API_KEY

let db = new SahteVeritabani()

function sahteCreateClient(_url?: string, _key?: string, opts?: { global?: { headers?: Record<string, string> } }) {
  const c = () => db.istemci(opts)
  return {
    from: (t: string) => c().from(t),
    auth: { getUser: (j?: string) => c().auth.getUser(j) },
    storage: { from: (k: string) => c().storage.from(k) },
    rpc: (ad: string, a: Record<string, string>) => c().rpc(ad, a),
  }
}
{
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any>
  const kok = dirname(pkgYolu)
  const girdiler = [pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module]
  for (const g of new Set(girdiler.filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: sahteCreateClient } })
  }
}

/** Fake model: every request is recorded. The appointment dialogue must never reach it. */
const modelIstekleri: string[] = []
class SahteAnthropic {
  messages = {
    create: async (istek: Record<string, unknown>) => {
      modelIstekleri.push(JSON.stringify(istek))
      return { model: 'sahte', content: [{ type: 'text', text: JSON.stringify({ speech: 'Sentetik model yanıtı.' }) }], stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 } }
    },
  }
}
{
  const kok = dirname(require.resolve('@anthropic-ai/sdk'))
  const pkg = JSON.parse(readFileSync(join(kok, 'package.json'), 'utf8')) as Record<string, any>
  const girdiler = [pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.require, pkg.exports?.['.']?.import?.default, pkg.exports?.['.']?.default, pkg.main, pkg.module]
  for (const g of new Set(girdiler.filter((x) => typeof x === 'string').map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { defaultExport: SahteAnthropic })
  }
}
mock.module(pathToFileURL(join(__dirname, '../doktor/hizLimiti.ts')).href, { namedExports: { aiKotaKullan: async () => ({ izin: true }), KOTA_MESAJI: 'kota', KOVA_LIMITLERI: {} } })
globalThis.fetch = (async (g: unknown) => { throw new Error(`randevu akışı testi ağ erişimi yapamaz: ${String(g)}`) }) as typeof fetch

let encrypt: (s: string) => string
let NextRequestSinifi: typeof import('next/server').NextRequest
let R: Record<string, any>
let C: typeof import('../doktor/hastaCozumleyici')
let KR: typeof import('./kapsamRed')
let E: typeof import('../../core/eylemler/temelEylemler')

const TZ = 'Europe/Istanbul'
const SAYIM_SABLONU = /\d+ hasta\.|Filtre:/
const yarin = (tz = TZ) => isoGunKaydir(bugunTz(tz), 1)

type Hekim = { id: string; token: string; oturum: string }
type Sahne = { a: Hekim; b: Hekim; umutcan: string; ruzgar1: string; ruzgar2: string; beste: string; ilknur: string; zerrin: string; yabanci: string }

function sahne(): Sahne {
  db = new SahteVeritabani()
  modelIstekleri.length = 0
  const hekim = (ad: string): Hekim => {
    const id = randomUUID()
    const token = `qa-${id}`
    db.kullanicilar.set(token, { id })
    db.ekle('users', { id, full_name: ad, specialty: 'pediatri' })
    const oturum = String(db.ekle('asistan_sessions', { doctor_id: id, persona_id: 'aysekaya', messages: [], active_context: { specialty: 'pediatri' } }).id)
    return { id, token, oturum }
  }
  const hasta = (doktorId: string, ad: string, dogum: string): string => {
    const id = String(db.ekle('patients', { doctor_id: doktorId, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad })), dob_encrypted: encrypt(dogum) }).id)
    for (const parca of adIndeksParcalari(ad)) db.ekle('patient_search_tokens', { patient_id: id, doctor_id: doktorId, token_hash: tokenOzeti(parca) })
    return id
  }
  const a = hekim('QA Hekim A')
  const b = hekim('QA Hekim B')
  return {
    a, b,
    umutcan: hasta(a.id, 'Umutcan Türkoğlu', '2019-04-10'),
    ruzgar1: hasta(a.id, 'Rüzgar Kara', '2018-01-05'),
    ruzgar2: hasta(a.id, 'Rüzgar Yıldız', '2020-07-21'),
    beste: hasta(a.id, 'Beste Aydın', '2021-02-02'),
    ilknur: hasta(a.id, 'İlknur Demir', '2016-06-06'),
    zerrin: hasta(a.id, 'Zerrin Demir', '2015-05-05'),
    yabanci: hasta(b.id, 'Zeynep Gizli', '2017-03-03'),
  }
}

async function yazi(h: Hekim, message: string, saatDilimi = TZ) {
  const y = await R.chat.POST(new NextRequestSinifi('http://localhost/api/asistan/chat', {
    method: 'POST', headers: { authorization: `Bearer ${h.token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ message, specialty: 'pediatri', asistanSessionId: h.oturum, saatDilimi }),
  } as ConstructorParameters<typeof NextRequestSinifi>[1]))
  const j = await y.json()
  assert.equal(y.status, 200, JSON.stringify(j))
  return j.data as { speech: string; eylemOnerileri: { id: string; eylem_anahtar: string; veri: Record<string, unknown> }[]; eylemHastasi: { ad: string } | null }
}

/** One spoken turn through the real Fish route (text in place of the clip — ASR is not under test). */
async function ses(h: Hekim, mesaj: string, saatDilimi = TZ): Promise<string> {
  const y: Response = await R.fishTur.POST(new NextRequestSinifi('http://localhost/api/asistan/fish-tur', {
    method: 'POST', headers: { authorization: `Bearer ${h.token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ mesaj, asistanSessionId: h.oturum, specialty: 'pediatri', personaId: 'aysekaya', saatDilimi }),
  } as ConstructorParameters<typeof NextRequestSinifi>[1]))
  assert.equal(y.status, 200)
  const soz: string[] = []
  for (const satir of (await y.text()).split('\n')) {
    if (!satir.startsWith('data: ')) continue
    const o = JSON.parse(satir.slice(6)) as { t: string; m?: string }
    if (o.t === 'soz' && o.m) soz.push(o.m)
    assert.notEqual(o.t, 'hata', o.m)
  }
  return soz.join('').trim()
}

const taslaklar = (s: Sahne) => db.tablo('eylem_onerileri').filter((o) => o.doctor_id === s.a.id && o.durum === 'taslak')
function randevuEkle(doktorId: string, patientId: string, tarih: string, saat: string, sureDk = 20) {
  const baslangic = yerelAnI(tarih, saat, TZ)
  return db.ekle('randevular', { doktor_id: doktorId, patient_id: patientId, baslangic, bitis: new Date(new Date(baslangic).getTime() + sureDk * 60000).toISOString(), tur: 'kontrol', durum: 'planlandi', hatirlatma_gonderildi: true })
}

before(async () => {
  ;({ encrypt } = await import('../security/encryption'))
  NextRequestSinifi = (await import('next/server')).NextRequest
  C = await import('../doktor/hastaCozumleyici')
  KR = await import('./kapsamRed')
  E = await import('../../core/eylemler/temelEylemler')
  R = {
    chat: await import('../../app/api/asistan/chat/route'),
    fishTur: await import('../../app/api/asistan/fish-tur/route'),
  }
})

describe('randevu niyeti — eylem fiili şart; takvim sorusu niyet değildir', () => {
  it('oluştur / taşı / iptal', () => {
    const beklenen: [string, ReturnType<typeof randevuNiyetiBul>][] = [
      ['Bir randevu yapmak istiyorum bir hasta için yardımcı olur musun?', 'olustur'],
      ['Bir randevu yapmak istiyorum bir hasta icin yardimci olur musun?', 'olustur'],
      ['Umutcan Türkoğlu için yarın saat 14:30 randevu oluştur', 'olustur'],
      ['Umutcan’a cuma günü randevu verelim', 'olustur'],
      ['Yarın 10’a randevu yazar mısın', 'olustur'],
      ['Umutcan için randevu alabilir miyiz', 'olustur'],
      ['Umutcan Türkoğlu randevusunu cuma 15:00’e al', 'tasi'],
      ['Umutcan’ın randevusunu erteleyelim', 'tasi'],
      ['Randevunun saatini değiştir', 'tasi'],
      ['Umutcan Türkoğlu’nun randevusunu iptal et', 'iptal'],
      ['Yarınki randevuyu iptal edelim', 'iptal'],
      ['Umutcan’ın randevusunu sil', 'iptal'],
    ]
    for (const [cumle, niyet] of beklenen) assert.equal(randevuNiyetiBul(cumle), niyet, cumle)
  })
  it('takvim sorusu, geçmiş zaman ve olumsuz buyruk niyet değildir', () => {
    for (const cumle of [
      'Yarın randevum var mı?', 'Bugün kaç randevu var', 'Randevuları listele', 'Bu hafta randevularım neler',
      'Umutcan’ın randevusu ne zaman', 'Dün kimler randevu aldı', 'İptal edilen randevular hangileri',
      'Randevuyu iptal etme', 'Randevu bilgisi ver', 'Yarın saat 15:00 boş mu', 'Bugün hava nasıl?',
      // the verb acts on something else, or on many appointments at once
      'Randevu ekranını aç', 'Umutcan’ın randevusuna not ekle', 'Randevu hatırlatma mesajı yaz', 'Yarınki randevuları iptal et',
      // "randevu" is only the setting of another sentence, or a question about someone else / the past
      'Hastalarım online randevu alabiliyor mu?', 'Randevu takvimini aç', 'Randevusu olan hastaya reçete yaz',
      'Randevusu yarın olan Ali Yılmaz için ilaç yaz', 'Yarınki randevu için hazırlık gerek mi?', 'Ali Yılmaz randevu alacak mıydı?',
      'Randevudan önce kan alır mıyız', 'Randevu saatlerini 20 dakika yap', 'Ali Yılmaz randevusuna geldi mi, tahlilini aç',
    ]) assert.equal(randevuNiyetiBul(cumle), null, cumle)
  })
})

describe('gün ve saat — doktorun saat diliminde, konuşulduğu gibi', () => {
  it('saat: rakam, söz, ek, buçuk; 1–7 öğleden sonradır', () => {
    const beklenen: [string, boolean, string | null][] = [
      ['yarın saat 14:30', false, '14:30'], ['14.30 olsun', false, '14:30'], ['saat 3’te', false, '15:00'], ['sabah saat 9’da', false, '09:00'],
      ['randevusunu 15:00’e al', false, '15:00'], ['saat üç buçukta', false, '15:30'], ['cuma günü üçe alalım', false, '15:00'], ['saat 10', false, '10:00'],
      ['akşam 8’de', false, '20:00'], ['saat 14 30', false, '14:30'], ['on bire', false, '11:00'], ['üç', true, '15:00'], ['15', true, '15:00'],
      ['saat on dörtte', false, '14:00'], ['on beş buçukta', false, '15:30'], ['saat on', false, '10:00'], ['on altı', true, '16:00'],
      ['saat on dört otuzda', false, '14:30'], ['saat dörde', false, '16:00'], ['gece 11’de', false, '23:00'], ['sabahleyin 7’de', false, '07:00'],
      ['cumaya saat 10’a alalım', false, '10:00'], ['üçe çeyrek var', false, null],
      // not a time: a date, a pronoun, a bare number outside the "Saat kaçta?" answer
      ['3 Ekim', false, null], ['03.10.2026', false, null], ['ona randevu ver', false, null], ['15', false, null], ['yarın', true, null],
    ]
    for (const [cumle, ciplak, saat] of beklenen) assert.equal(randevuSaatiBul(cumle, ciplak), saat, cumle)
  })
  it('gün: doktorun saat diliminde “yarın”; gg.aa.yyyy', () => {
    // 2026-10-01 22:30 UTC = 2 Ekim 01:30 İstanbul, 1 Ekim 18:30 New York
    const simdi = new Date('2026-10-01T22:30:00Z')
    assert.equal(randevuTarihiBul('yarın saat 3’te', 'Europe/Istanbul', simdi), '2026-10-03')
    assert.equal(randevuTarihiBul('yarın saat 3’te', 'America/New_York', simdi), '2026-10-02')
    assert.equal(randevuTarihiBul('05.11.2026 günü', 'Europe/Istanbul', simdi), '2026-11-05')
    assert.equal(randevuTarihiBul('saat 3’te', 'Europe/Istanbul', simdi), null)
    // case-suffixed day words — the natural answers to "Hangi güne alalım?" (2 Ekim 2026 is a Friday in İstanbul)
    assert.equal(randevuTarihiBul('yarına alalım', 'Europe/Istanbul', simdi), '2026-10-03')
    assert.equal(randevuTarihiBul('pazartesiye', 'Europe/Istanbul', simdi), '2026-10-05')
    assert.equal(randevuTarihiBul('gelecek hafta salıya', 'Europe/Istanbul', simdi), '2026-10-06')
    assert.equal(randevuTarihiBul('15 Ekim’de', 'Europe/Istanbul', simdi), '2026-10-15')
    assert.equal(randevuTarihiBul('5 Ocak', 'Europe/Istanbul', simdi), '2027-01-05', 'yılsız gün-ay geçmişte olamaz')
    assert.equal(randevuTarihiBul('32.13.2026', 'Europe/Istanbul', simdi), null)
    assert.equal(yerelAnI('2026-10-03', '14:30', 'Europe/Istanbul'), '2026-10-03T11:30:00.000Z')
    assert.equal(yerelAnI('2026-10-03', '14:30', 'America/New_York'), '2026-10-03T18:30:00.000Z')
  })
  it('söylenen ad: yalnız baş harfi büyük en az iki kelime; cümle başı ve takvim sözcükleri ad değildir', () => {
    assert.equal(soylenenAd('Zeynep Kara için yarın 10:00 randevu oluştur'), 'Zeynep Kara')
    assert.equal(soylenenAd('Yarın Zeynep Kara’ya randevu ver'), 'Zeynep Kara')
    assert.equal(soylenenAd('Bir randevu yapmak istiyorum bir hasta için yardımcı olur musun?'), null)
    assert.equal(soylenenAd('Randevu oluştur Cuma günü'), null)
  })
})

describe('canlı cümle — sayım şablonu ASLA', () => {
  for (const cumle of ['Bir randevu yapmak istiyorum bir hasta için yardımcı olur musun?', 'Bir randevu yapmak istiyorum bir hasta icin yardimci olur musun?']) {
    it(`yazı + ses: "${cumle}" → hangi hasta sorusu, model yok, kart yok`, async () => {
      const s = sahne()
      const y = await yazi(s.a, cumle)
      assert.doesNotMatch(y.speech, SAYIM_SABLONU)
      assert.equal(y.speech, 'Hangi hasta için Hocam?')
      // said again while the question is pending (and on the other channel): asked again, never a search or a calendar read
      const v = await ses(s.a, cumle)
      assert.doesNotMatch(v, SAYIM_SABLONU)
      assert.equal(v, 'Hangi hasta için Hocam?')
      assert.equal(modelIstekleri.length, 0, 'randevu isteği model turu değildir')
      assert.equal(taslaklar(s).length, 0)
      assert.equal(db.tablo('randevular').length, 0)
    })
  }
})

describe('oluştur — tek tek sorar, okur, onaydan sonra yazar (ses, Fish)', () => {
  it('hasta → gün → saat → okuma → "Evet" → randevu takvimde', async () => {
    const s = sahne()
    assert.equal(await ses(s.a, 'Bir randevu yapmak istiyorum bir hasta için yardımcı olur musun?'), 'Hangi hasta için Hocam?')
    assert.equal(await ses(s.a, 'Umutcan Türkoğlu'), 'Hangi gün Hocam?')
    assert.equal(await ses(s.a, 'Yarın'), 'Saat kaçta Hocam?')
    const okuma = await ses(s.a, 'Saat 14:30')
    assert.equal(okuma, `Umutcan Türkoğlu için ${kisaTarihEtiketi(yarin())} saat 14:30 randevusu oluşturuyorum, onaylıyor musunuz?`)

    const [taslak] = taslaklar(s)
    assert.ok(taslak, 'taslak kart hazırlanmalı')
    assert.equal(taslak.eylem_anahtar, 'kontrol_randevusu_olustur')
    assert.equal(taslak.hasta_id, s.umutcan)
    assert.equal(taslak.yuzey, 'ses')
    assert.deepEqual(taslak.veri, { tarih: yarin(), saat: '14:30' })
    assert.deepEqual(taslak.eksik_alanlar, [])
    assert.equal(db.tablo('randevular').length, 0, 'onaydan önce takvime hiçbir şey yazılmaz')
    const oturum = db.tablo('asistan_sessions').find((o) => o.id === s.a.oturum)!
    assert.deepEqual(oturum.active_context.bekleyenOneriler, [taslak.id])
    assert.deepEqual(oturum.messages.at(-1).kartlar, [taslak.id], 'kart sesli turun ekranına taşınır (ses-ekran)')
    assert.equal(oturum.messages.at(-1).hastaId, s.umutcan)

    assert.equal(await ses(s.a, 'Evet'), 'Randevu oluşturuldu Hocam.')
    const [r] = db.tablo('randevular')
    assert.equal(db.tablo('randevular').length, 1)
    assert.equal(r.doktor_id, s.a.id)
    assert.equal(r.patient_id, s.umutcan)
    assert.equal(r.baslangic, yerelAnI(yarin(), '14:30', TZ))
    assert.equal(db.tablo('asistan_sessions').find((o) => o.id === s.a.oturum)!.active_context.randevuAkisi, null)
    assert.equal(modelIstekleri.length, 0, 'bütün akış modelsizdir')
  })

  it('tek cümlede hasta + gün + saat → kart; takvim okuması değil', async () => {
    const s = sahne()
    const okuma = await ses(s.a, 'Umutcan Türkoğlu için yarın saat 3’te randevu oluştur')
    assert.match(okuma, /^Umutcan Türkoğlu için .* saat 15:00 randevusu oluşturuyorum, onaylıyor musunuz\?$/)
    assert.doesNotMatch(okuma, /takvim/)
    assert.equal(taslaklar(s).length, 1)
    assert.equal(db.tablo('randevular').length, 0)
  })

  it('saat eksikse tek kısa soru sorar; kart hazırlanmaz', async () => {
    const s = sahne()
    assert.equal(await ses(s.a, 'Umutcan Türkoğlu için yarın randevu oluştur'), 'Saat kaçta Hocam?')
    assert.equal(taslaklar(s).length, 0)
    assert.match(await ses(s.a, 'Üç buçuk'), /saat 15:30 randevusu oluşturuyorum, onaylıyor musunuz\?$/)
    assert.equal(taslaklar(s).length, 1)
  })

  it('"Hayır": kart geri çekilir, takvime yazılmaz', async () => {
    const s = sahne()
    await ses(s.a, 'Umutcan Türkoğlu için yarın saat 14:30 randevu oluştur')
    assert.match(await ses(s.a, 'Hayır'), /vazgeçtim/)
    assert.equal(db.tablo('randevular').length, 0)
    assert.equal(taslaklar(s).length, 0)
    // no pending card → "Evet" is an ordinary sentence and writes nothing
    await ses(s.a, 'Evet')
    assert.equal(db.tablo('randevular').length, 0)
  })

  it('soru beklerken "vazgeç" akışı bitirir; başka bir soru akıştan çıkar ve kendi cevabını alır', async () => {
    const s = sahne()
    randevuEkle(s.a.id, s.ruzgar1, yarin(), '09:00')
    await ses(s.a, 'Umutcan Türkoğlu için randevu oluştur')
    assert.equal(await ses(s.a, 'Vazgeçtim'), 'Tamam Hocam, vazgeçtim.')
    assert.equal(await ses(s.a, 'Umutcan Türkoğlu için randevu oluştur'), 'Hangi gün Hocam?')
    // a calendar question while "Hangi gün?" is pending is answered from the calendar, and the dialogue is dropped
    assert.match(await ses(s.a, 'Yarın randevum var mı?'), /1 randevu var Hocam: 09:00 Rüzgar Kara/)
    assert.equal(db.tablo('asistan_sessions').find((o) => o.id === s.a.oturum)!.active_context.randevuAkisi, undefined)
    assert.equal(taslaklar(s).length, 0)
    assert.equal(modelIstekleri.length, 0)
  })

  it('dolu saat: söyler ve başka saat ister; kart hazırlanmaz', async () => {
    const s = sahne()
    randevuEkle(s.a.id, s.ruzgar1, yarin(), '14:30')
    assert.equal(await ses(s.a, 'Umutcan Türkoğlu için yarın saat 14:30 randevu oluştur'), `${kisaTarihEtiketi(yarin())} saat 14:30 dolu Hocam; başka bir saat söyler misiniz?`)
    assert.equal(taslaklar(s).length, 0)
    assert.match(await ses(s.a, 'Saat 16:00'), /saat 16:00 randevusu oluşturuyorum/)
  })

  it('doktorun saat dilimi: New York’ta "yarın 14:30" o yerel saattir; kart ve takvim Türkiye saatini gösterir', async () => {
    const s = sahne()
    const tz = 'America/New_York'
    const okuma = await ses(s.a, 'Umutcan Türkoğlu için yarın saat 14:30 randevu oluştur', tz)
    const an = yerelAnI(yarin(tz), '14:30', tz)
    assert.match(okuma, new RegExp(`${kisaTarihEtiketi(yarin(tz))} saat 14:30 \\(Türkiye saatiyle \\d\\d:30\\)`))
    assert.equal(await ses(s.a, 'Evet', tz), 'Randevu oluşturuldu Hocam.')
    assert.equal(db.tablo('randevular')[0].baslangic, an)
  })
})

describe('yazılı kanal — onay karttaki dokunuştur', () => {
  it('kart cevapla birlikte döner; yazılan "evet" kayıt yapmaz', async () => {
    const s = sahne()
    const y = await yazi(s.a, 'Umutcan Türkoğlu için yarın saat 14:30 randevu oluştur')
    assert.match(y.speech, /onaylıyor musunuz\? Onay için karttaki Kaydet’e dokunun\.$/)
    assert.equal(y.eylemOnerileri.length, 1)
    assert.equal(y.eylemOnerileri[0].eylem_anahtar, 'kontrol_randevusu_olustur')
    assert.equal(y.eylemHastasi?.ad, 'Umutcan Türkoğlu')
    const e = await yazi(s.a, 'evet')
    assert.match(e.speech, /Kaydet’e dokunun/)
    assert.equal(db.tablo('randevular').length, 0, 'yazılı "evet" bir onay değildir')
    assert.equal(modelIstekleri.length, 0)
  })
})

describe('saat değiştir ve iptal — mevcut randevu, onaydan sonra', () => {
  it('taşı: okur, "Evet"ten önce değişmez; sonra yeni saate alınır, durum aynı kalır', async () => {
    const s = sahne()
    const r = randevuEkle(s.a.id, s.umutcan, yarin(), '10:00', 30)
    const okuma = await ses(s.a, 'Umutcan Türkoğlu randevusunu yarın 15:00’e al')
    assert.equal(okuma, `Umutcan Türkoğlu randevusunu ${kisaTarihEtiketi(yarin())} 10:00 yerine ${kisaTarihEtiketi(yarin())} saat 15:00 yapıyorum, onaylıyor musunuz?`)
    assert.equal(taslaklar(s)[0].eylem_anahtar, 'randevu_tasi')
    assert.equal(taslaklar(s)[0].veri.randevu_id, r.id)
    assert.equal(db.tablo('randevular')[0].baslangic, yerelAnI(yarin(), '10:00', TZ), 'onaydan önce takvim değişmez')

    assert.equal(await ses(s.a, 'Evet'), 'Randevu yeni saatine alındı Hocam.')
    const sonra = db.tablo('randevular')[0]
    assert.equal(db.tablo('randevular').length, 1)
    assert.equal(sonra.baslangic, yerelAnI(yarin(), '15:00', TZ))
    assert.equal(sonra.bitis, yerelAnI(yarin(), '15:30', TZ), 'süre korunur')
    assert.equal(sonra.durum, 'planlandi')
    assert.equal(sonra.hatirlatma_gonderildi, false, 'yeni saat için hatırlatma yeniden gider')
    assert.equal(modelIstekleri.length, 0)
  })

  it('taşı: yeni zaman söylenmediyse sorar; yalnız saat söylenirse gün aynı kalır', async () => {
    const s = sahne()
    randevuEkle(s.a.id, s.umutcan, yarin(), '10:00')
    assert.equal(await ses(s.a, 'Umutcan Türkoğlu’nun randevusunu erteleyelim'), 'Hangi güne ve saate alalım Hocam?')
    assert.match(await ses(s.a, 'Saat 16:00'), new RegExp(`yerine ${kisaTarihEtiketi(yarin())} saat 16:00 yapıyorum`))
  })

  it('iptal: okur, "Evet"ten sonra iptal olur; kayıt silinmez', async () => {
    const s = sahne()
    randevuEkle(s.a.id, s.umutcan, yarin(), '10:00')
    assert.equal(await ses(s.a, 'Umutcan Türkoğlu’nun randevusunu iptal et'), `Umutcan Türkoğlu için ${kisaTarihEtiketi(yarin())} saat 10:00 randevusunu iptal ediyorum, onaylıyor musunuz?`)
    assert.equal(db.tablo('randevular')[0].durum, 'planlandi', 'onaydan önce iptal olmaz')
    assert.equal(await ses(s.a, 'Evet'), 'Randevu iptal edildi Hocam.')
    assert.equal(db.tablo('randevular').length, 1, 'iptal silme değildir')
    assert.equal(db.tablo('randevular')[0].durum, 'iptal')
  })

  it('birden çok randevu: hangisi diye sorar; ileri tarihli randevu yoksa söyler', async () => {
    const s = sahne()
    assert.equal(await ses(s.a, 'Umutcan Türkoğlu’nun randevusunu iptal et'), 'Umutcan Türkoğlu için ileri tarihli bir randevu bulamadım Hocam.')
    randevuEkle(s.a.id, s.umutcan, yarin(), '10:00')
    const ikinci = randevuEkle(s.a.id, s.umutcan, isoGunKaydir(yarin(), 7), '11:00')
    assert.match(await ses(s.a, 'Umutcan Türkoğlu’nun randevusunu iptal et'), /^Hangisi Hocam: 1\. .* 10:00, 2\. .* 11:00\?$/)
    assert.equal(taslaklar(s).length, 0)
    assert.match(await ses(s.a, 'İkincisi'), /saat 11:00 randevusunu iptal ediyorum/)
    assert.equal(taslaklar(s)[0].veri.randevu_id, ikinci.id)
  })
})

describe('hasta adı — birden çok eşleşme sorulur, bilinmeyen ad söylenir', () => {
  it('iki "Rüzgar": hangisi diye sorar; seçimden sonra doğru hastanın kartı', async () => {
    const s = sahne()
    // candidate order follows the stable id sort of the resolver, so either order is valid
    assert.match(await ses(s.a, 'Rüzgar için yarın saat 10:00 randevu oluştur'), /^Bu isimle 2 hasta var Hocam: Rüzgar (Kara|Yıldız), Rüzgar (Kara|Yıldız)\. Hangisi\?$/)
    assert.equal(taslaklar(s).length, 0, 'belirsiz hastada kart hazırlanmaz')
    assert.match(await ses(s.a, 'Rüzgar Yıldız'), /^Rüzgar Yıldız için .* saat 10:00 randevusu oluşturuyorum/)
    assert.equal(taslaklar(s)[0].hasta_id, s.ruzgar2)
  })

  it('bilinmeyen ad: bulamadığını söyler; kart yok, sayım şablonu yok', async () => {
    const s = sahne()
    const v = await ses(s.a, 'Mehmet Bilinmez için yarın saat 10:00 randevu oluştur')
    assert.equal(v, '“Mehmet Bilinmez” adında bir hasta kayıtlarınızda bulamadım Hocam; adını ve soyadını tam söyler misiniz?')
    assert.doesNotMatch(v, SAYIM_SABLONU)
    assert.equal(taslaklar(s).length, 0)
    // the corrected name continues the same request — day and time are not asked again
    assert.match(await ses(s.a, 'Umutcan Türkoğlu'), /^Umutcan Türkoğlu için .* saat 10:00 randevusu oluşturuyorum/)
  })
})

describe('yanlış hasta / yanlış saat korumaları', () => {
  it('aynı istek başka bir hastayla yeniden söylenirse kart YENİ hastaya hazırlanır', async () => {
    const s = sahne()
    assert.equal(await ses(s.a, 'Umutcan Türkoğlu için randevu oluştur'), 'Hangi gün Hocam?')
    assert.match(await ses(s.a, 'Yok, Rüzgar Kara için yarın saat 3’te randevu oluştur'), /^Rüzgar Kara için .* saat 15:00 randevusu oluşturuyorum/)
    assert.equal(taslaklar(s).length, 1)
    assert.equal(taslaklar(s)[0].hasta_id, s.ruzgar1)
  })

  it('"İlknur" bir addır, "ilk" değil; "Beste" bir addır, "beşte" değil', async () => {
    const s = sahne()
    assert.match(await ses(s.a, 'Demir için yarın saat 10:00 randevu oluştur'), /^Bu isimle 2 hasta var Hocam/)
    assert.match(await ses(s.a, 'İlknur Demir'), /^İlknur Demir için /)
    assert.equal(taslaklar(s)[0].hasta_id, s.ilknur)
    const t = sahne()
    assert.equal(await ses(t.a, 'Beste Aydın için yarın randevu oluştur'), 'Saat kaçta Hocam?')
    assert.equal(await ses(t.a, 'Beşte'), `Beste Aydın için ${kisaTarihEtiketi(yarin())} saat 17:00 randevusu oluşturuyorum, onaylıyor musunuz?`)
  })

  it('düzeltme dolu saate denk gelirse eski kart artık bekleyen değildir: "Tamam" eski saati yazmaz', async () => {
    const s = sahne()
    randevuEkle(s.a.id, s.ruzgar1, yarin(), '16:00')
    await ses(s.a, 'Umutcan Türkoğlu için yarın saat 14:30 randevu oluştur')
    assert.match(await ses(s.a, 'Saat 16:00 olsun'), /16:00 dolu Hocam/)
    assert.deepEqual(db.tablo('asistan_sessions').find((o) => o.id === s.a.oturum)!.active_context.bekleyenOneriler, [])
    await ses(s.a, 'Tamam')
    assert.equal(db.tablo('randevular').length, 1, 'yalnız önceden var olan randevu')
    assert.equal(db.tablo('randevular')[0].patient_id, s.ruzgar1)
  })

  it('iptal: adı geçen günde randevu yoksa başka günün randevusunu iptale hazırlamaz, sorar', async () => {
    const s = sahne()
    const r = randevuEkle(s.a.id, s.umutcan, isoGunKaydir(yarin(), 7), '11:00')
    const v = await ses(s.a, 'Umutcan Türkoğlu’nun yarınki randevusunu iptal et')
    assert.match(v, new RegExp(`^Umutcan Türkoğlu için ${kisaTarihEtiketi(yarin())} günü randevu bulamadım Hocam\\. Hangisi Hocam: 1\\. .* 11:00\\?$`))
    assert.equal(taslaklar(s).length, 0)
    assert.match(await ses(s.a, 'Evet'), /saat 11:00 randevusunu iptal ediyorum, onaylıyor musunuz\?$/)
    assert.equal(taslaklar(s)[0].veri.randevu_id, r.id)
    assert.equal(db.tablo('randevular')[0].durum, 'planlandi')
  })

  it('taşı: cümlede iki gün varsa yeni günü tahmin etmez, sorar', async () => {
    const s = sahne()
    randevuEkle(s.a.id, s.umutcan, isoGunKaydir(yarin(), 3), '10:00')
    assert.equal(await ses(s.a, 'Umutcan Türkoğlu’nun pazartesi randevusunu cuma 10’a al'), 'Hangi güne ve saate alalım Hocam?')
    assert.equal(taslaklar(s).length, 0)
  })

  it('kart beklerken sorulan takvim sorusu kartı değiştirmez; dokunuşla kapanan kartın akışı sonraki cümleyi yakalamaz', async () => {
    const s = sahne()
    await ses(s.a, 'Umutcan Türkoğlu için yarın saat 14:30 randevu oluştur')
    const kart = taslaklar(s)[0]
    assert.match(await ses(s.a, 'Yarın kaç hastam var?'), /takvim/)
    assert.deepEqual(taslaklar(s).map((t) => t.id), [kart.id], 'kart yeniden hazırlanmadı')

    const t = sahne()
    await ses(t.a, 'Umutcan Türkoğlu için yarın saat 14:30 randevu oluştur')
    taslaklar(t)[0].durum = 'onaylandi' // the doctor tapped Kaydet on the card
    await ses(t.a, 'Cuma saat 5’te toplantım var')
    assert.equal(db.tablo('eylem_onerileri').filter((o) => o.durum === 'taslak').length, 0, 'kapanmış akış yeni kart üretmez')
  })

  it('soru beklerken başka bir iş istenirse akış onu yutmaz', async () => {
    const s = sahne()
    assert.equal(await ses(s.a, 'Umutcan Türkoğlu için randevu oluştur'), 'Hangi gün Hocam?')
    const v = await ses(s.a, 'Rüzgar Kara’nın dosyasını aç')
    assert.match(v, /Rüzgar Kara dosyası açık/)
    assert.equal(taslaklar(s).length, 0)
  })
})

describe('HASTA-IZOLASYON-01 — başka doktorun hastası ve randevusu yoktur', () => {
  it('B, A’nın hastasını adıyla bulamaz; A’nın randevusuna dokunamaz', async () => {
    const s = sahne()
    const r = randevuEkle(s.a.id, s.umutcan, yarin(), '10:00')
    for (const cumle of ['Umutcan Türkoğlu için yarın saat 14:30 randevu oluştur', 'Umutcan Türkoğlu’nun randevusunu iptal et', 'Umutcan Türkoğlu randevusunu yarın 15:00’e al']) {
      const v = await ses(s.b, cumle)
      assert.match(v, /bulamadım/, cumle)
      assert.doesNotMatch(v, /10:00/, 'A’nın randevu saati B’ye söylenmez')
    }
    assert.equal(db.tablo('eylem_onerileri').length, 0)
    assert.deepEqual({ ...db.tablo('randevular')[0] }, { ...r }, 'A’nın randevusu değişmedi')
    assert.equal(db.tablo('randevular').length, 1)
  })

  it('oturum bağlamına sızmış yabancı hasta kimliği kart üretmez', async () => {
    const s = sahne()
    const oturum = db.tablo('asistan_sessions').find((o) => o.id === s.b.oturum)!
    oturum.active_context = { specialty: 'pediatri', randevuAkisi: { tur: 'olustur', hastaId: s.umutcan, hastaAd: 'Umutcan Türkoğlu', tarih: null, saat: null, bekleyen: 'tarih', deneme: 0, zaman: new Date().toISOString() } }
    const v = await ses(s.b, 'Yarın saat 14:30')
    assert.match(v, /bulamadım/)
    assert.equal(db.tablo('eylem_onerileri').length, 0)
    assert.equal(db.tablo('randevular').length, 0)
  })

  it('eylem omurgası: yabancı randevu kimliği "Randevu bulunamadı"', async () => {
    const s = sahne()
    const r = randevuEkle(s.a.id, s.umutcan, yarin(), '10:00')
    const sb = db.istemci() as never
    const ctxB = { supabase: sb, doktorId: s.b.id, hasta: { id: s.yabanci, ad: 'Zeynep Gizli', dogumTarihi: '2017-03-03', yasAy: 100, cinsiyet: null }, brans: 'pediatri' as const, oneriId: '', bugunTRT: bugunTz(TZ) }
    await assert.rejects(E.RANDEVU_IPTAL.calistir(ctxB, { randevu_id: r.id }), /Randevu bulunamadı/)
    await assert.rejects(E.RANDEVU_TASI.calistir(ctxB, { randevu_id: r.id, tarih: yarin(), saat: '16:00' }), /Randevu bulunamadı/)
    // right doctor, wrong patient: the row is reached through the patient too
    const ctxA = { ...ctxB, doktorId: s.a.id, hasta: { ...ctxB.hasta, id: s.ruzgar1 } }
    await assert.rejects(E.RANDEVU_IPTAL.calistir(ctxA, { randevu_id: r.id }), /Randevu bulunamadı/)
    assert.equal(db.tablo('randevular')[0].durum, 'planlandi')
    assert.equal(db.tablo('randevular')[0].baslangic, r.baslangic)
  })
})

describe('çevre — kapsam kapısı, takvim okuması ve sayım şablonu', () => {
  it('kapsam kapısı hâlâ hava durumunu reddeder — bekleyen randevu sorusu varken de', async () => {
    const s = sahne()
    assert.equal(await ses(s.a, 'Bugün hava nasıl olacak?'), KR.KAPSAM_RED)
    await ses(s.a, 'Bir randevu yapmak istiyorum bir hasta için yardımcı olur musun?')
    assert.equal((await yazi(s.a, 'Yarın hava nasıl olacak?')).speech, KR.KAPSAM_RED)
    assert.equal(modelIstekleri.length, 0)
    assert.equal(taslaklar(s).length, 0)
  })

  it('takvim sorusu takvimden okunur (liste / boş saat) — randevu akışı araya girmez', async () => {
    const s = sahne()
    randevuEkle(s.a.id, s.umutcan, yarin(), '10:00')
    const liste = await ses(s.a, 'Yarın randevum var mı?')
    assert.match(liste, /1 randevu var Hocam: 10:00 Umutcan Türkoğlu/)
    assert.match(await ses(s.a, 'Yarın saat 15:00 boş mu?'), /15:00 boş/)
    assert.equal(taslaklar(s).length, 0)
    assert.equal(modelIstekleri.length, 0)
  })

  it('sayım şablonu yalnız gerçek hasta sorusuna verilir; alan sözcüğü taşıyan cümle netleştirme istemiyle modele gider', async () => {
    const s = sahne()
    const belirsiz = await C.hastaninSozunuCoz(db.istemci() as never, s.a.id, 'Randevu konusunda yardım eder misin?')
    assert.deepEqual(belirsiz, { tur: 'yok', niyetBelirsiz: true })
    assert.equal(C.cozumKonus(belirsiz), null, 'sayım cümlesi kurulmaz')
    const sorgu = await C.hastaninSozunuCoz(db.istemci() as never, s.a.id, 'Randevusu olan hastalarım kimler?')
    assert.match(String((sorgu as { sayiMetin?: string }).sayiMetin), /0 hasta\. Filtre:/, 'gerçek hasta sorusunun cevabı değişmedi')

    const y = await yazi(s.a, 'Randevu konusunda yardım eder misin?')
    assert.doesNotMatch(y.speech, SAYIM_SABLONU)
    assert.equal(modelIstekleri.length, 1)
    assert.match(modelIstekleri[0], /BU MESAJ BİR HASTA ARAMASI DEĞİL/)
  })
})
