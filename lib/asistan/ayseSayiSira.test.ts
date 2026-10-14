/**
 * NOTYA-AYSE-SAYI-SIRA-01 (Kaan live, voice, persona aysekaya, pediatri, 2026-10-11 01:07–01:08 UTC).
 *
 * The doctor has exactly ONE active patient. The stored conversation:
 *   2. "Ben de iyiyim. Bugün bir randevumuz var mı hocam?"          → "10 Ekim 2026 Cumartesi takviminde randevu yok."
 *   4. "Tabii, tabii. Hocam, kaç tane hastamız var şu anda bizim?"  → "Kayıtlarda 0 hasta."
 * and every doctor line carried the same `zaman` as the reply to it.
 *
 * Fault 1 — "tabii" and "bizim" were not stop words of the patient search, so the count required both words in the
 * chart and found nobody; the answer did not say that any filter was applied.
 * Fault 2 (server half) — the doctor's line and the reply were stamped with one instant, at write time.
 *
 * The real /api/asistan/chat and /api/asistan/fish-tur handlers run against the in-memory database; a model request
 * is counted, so "no model" is checked, not assumed. Synthetic QA data only.
 */
import { ortam, sahneHazirla, sahneKur, hastaEkle, fishTur, yazi, sonRota, encrypt, type Sahne } from './tests/ayseSahne'
import { describe, it, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { sorguyuAyikla } from '@/lib/doktor/hastaAramaFiltre'
import { kohortSorusuMu } from './aktifHasta'
import { aramaCevabiGuvenilirMi } from './ikiBeyinBirde'

const HASTA = 'Deneme Hasta'
const YABANCILAR = ['Yabancı Birinci', 'Yabancı İkinci', 'Yabancı Üçüncü']
const TZ = 'America/New_York'
const TUR_2 = 'Ben de iyiyim. Bugün bir randevumuz var mı hocam?'
const TUR_4 = 'Tabii, tabii. Hocam, kaç tane hastamız var şu anda bizim?'
/** The same question with other words of conversation. None of them states a filter. */
const DUZ_SAYIM = [
  'kaç hastam var',
  'Kaç tane hastamız var şu anda bizim?',
  'toplam kaç hasta kayıtlı',
  'hasta sayımız kaç',
  'Hocam şu anda hasta sayımız nedir?',
  'Tabii hocam, bizim toplam kaç hastamız var?',
  'Peki, bizde kaç hasta kayıtlı şu anda?',
  'Yani şu an elimizde kaç hasta var hocam?',
  'Evet, tamam. Kaç tane hastamız oldu toplamda?',
  'Kaç kişi kayıtlı bizde?',
  'Hasta sayımızı söyler misin?',
  'Sistemde kaç hastam görünüyor?',
  'kaç kayıtlı hastam var',
  'Tabii, tabii. Toplam kaç adet hastamız var?',
]

let s: Sahne
let hastaId = ''
/** Five years and about two months old on the day of the run. */
const bugun = new Date()
const dogum = new Date(Date.UTC(bugun.getUTCFullYear() - 5, bugun.getUTCMonth() - 2, 1)).toISOString().slice(0, 10)

before(async () => { await sahneHazirla() })
beforeEach(() => {
  s = sahneKur()
  // The live account: one active patient, created 2026-08-14. Another doctor's three patients must never be counted.
  hastaId = hastaEkle(s.doktor.id, HASTA, { dogum, notlar: { il: 'İstanbul' } })
  for (const ad of YABANCILAR) hastaEkle(s.diger.id, ad, { dogum: '2020-01-01', notlar: { il: 'İstanbul' } })
})

type Tur = { cevap: string; rota: string | null; model: number }
async function sor(yuzey: 'yazi' | 'ses', soz: string, o: { token?: string; oturum?: string } = {}): Promise<Tur> {
  const once = ortam.modelIstekleri.length
  const cevap = yuzey === 'yazi' ? (await yazi(s, soz, { saatDilimi: TZ, ...o })).speech : (await fishTur(s, soz, { saatDilimi: TZ, ...o })).soz
  return { cevap, rota: sonRota(), model: ortam.modelIstekleri.length - once }
}
const mesajlar = () => (ortam.db.tablo('asistan_sessions').find((x) => x.id === s.oturum)!.messages || []) as { role: string; content: string; kanal?: string; zaman?: string }[]

describe('NOTYA-AYSE-SAYI-SIRA-01 — "kaç hastamız var" bir hastası olan hekime 0 demez', () => {
  it('ayrıştırıcı: 4. turun cümlesinde arama terimi kalmaz; cümle açık bir sayım sorusudur', () => {
    const q = sorguyuAyikla(TUR_4)
    assert.deepEqual([q.terimler, q.sozFiltre, q.ozet, q.sayim, q.olcum, q.pencere, q.yas], [[], '', '', true, 'hasta', null, null])
    for (const soz of [TUR_4, ...DUZ_SAYIM]) {
      const a = sorguyuAyikla(soz)
      assert.deepEqual([a.terimler, a.sayim, a.pencere, a.yas, a.alanlar.length], [[], true, null, null, 0], soz)
      assert.equal(kohortSorusuMu(soz), true, soz)
      assert.equal(aramaCevabiGuvenilirMi({ mesaj: soz, aramaCevabi: 'Kayıtlarda 1 hasta.', cozumTur: 'yok' }), true, soz)
    }
  })

  for (const yuzey of ['yazi', 'ses'] as const) {
    it(`${yuzey}: 4. turun cümlesi → hekimin gerçek hasta sayısı, modelsiz`, async () => {
      const t = await sor(yuzey, TUR_4)
      assert.equal(t.cevap, `Kayıtlarda 1 hasta: ${HASTA}.`)
      assert.deepEqual([t.rota, t.model], ['arama', 0])
    })

    it(`${yuzey}: dolgu sözcüklü ${DUZ_SAYIM.length} söyleyişin hepsi aynı sayıyı verir; filtre adı geçmez`, async () => {
      for (const soz of DUZ_SAYIM) {
        s = sahneKur()
        hastaEkle(s.doktor.id, HASTA, { dogum })
        for (const ad of YABANCILAR) hastaEkle(s.diger.id, ad)
        const t = await sor(yuzey, soz)
        assert.equal(t.cevap, `Kayıtlarda 1 hasta: ${HASTA}.`, soz)
        assert.deepEqual([t.rota, t.model], ['arama', 0], soz)
      }
    })

    it(`${yuzey}: söylenen filtre uygulanır ve cevapta adıyla geçer (yaş, şehir)`, async () => {
      const bes = await sor(yuzey, 'Tabii hocam, bizim 5 yaşında kaç hastamız var şu anda?')
      assert.match(bes.cevap, /^Kayıtlarda 1 hasta: Deneme Hasta\. Filtre: 5 yaş\.$/)
      const iki = await sor(yuzey, '2 yaşında kaç hastam var')
      assert.match(iki.cevap, /^Kayıtlarda 0 hasta\. Filtre: 2 yaş\.$/)
      const ist = await sor(yuzey, `Peki İstanbul'da oturan kaç hastamız var?`)
      assert.match(ist.cevap, /^Kayıtlarda 1 hasta\b/)
      assert.match(ist.cevap, /Filtre: Şehir\b.*aranan söz: İstanbul/)
      assert.match(ist.cevap, /Deneme Hasta/)
      const ank = await sor(yuzey, `Ankara'da oturan kaç hastam var`)
      assert.match(ank.cevap, /^Kayıtlarda 0 hasta\. Filtre: Şehir\b.*aranan söz: Ankara\./)
      for (const t of [bes, iki, ist, ank]) assert.deepEqual([t.rota, t.model], ['arama', 0], t.cevap)
    })

    it(`${yuzey}: hekimin kendi sözü sayımı daralttıysa cevap o sözü söyler ve kayıtlı toplamı da verir — yalın "0 hasta" yok`, async () => {
      // A diagnosis word nobody's chart contains: the filter is the doctor's, and it is named.
      const astim = await sor(yuzey, 'astımlı kaç hastam var')
      assert.match(astim.cevap, /^Kayıtlarda 0 hasta\. Filtre: aranan söz: astımlı\. Kayıtlı toplam 1 hastanız var\.$/)
      // A word of conversation the stop list has never seen: still not a bare zero.
      const yahu = await sor(yuzey, 'kaç hastamız var yahu')
      assert.match(yahu.cevap, /^Kayıtlarda 0 hasta\. Filtre: aranan söz: yahu\. Kayıtlı toplam 1 hastanız var\.$/)
      for (const t of [astim, yahu]) assert.doesNotMatch(t.cevap, /^Kayıtlarda 0 hasta\.$/)
    })
  }

  it('sayım yalnız hekimin kendi aktif hastaları üzerindedir (HASTA-IZOLASYON): öbür hekimin üç hastası ve pasif kayıt sayılmaz', async () => {
    ortam.db.ekle('patients', { doctor_id: s.doktor.id, is_active: false, name_encrypted: encrypt(JSON.stringify({ ad: 'Pasif Kayıt' })), dob_encrypted: null, gender_encrypted: null, phone_encrypted: null, email_encrypted: null, notes_encrypted: encrypt('{}') })
    const benim = await sor('yazi', TUR_4)
    assert.equal(benim.cevap, `Kayıtlarda 1 hasta: ${HASTA}.`)
    for (const ad of [...YABANCILAR, 'Pasif Kayıt']) assert.ok(!benim.cevap.includes(ad), ad)
    const digerOturum = ortam.db.ekle('asistan_sessions', { doctor_id: s.diger.id, persona_id: 'aysekaya', messages: [], active_context: { specialty: 'pediatri' } }).id as string
    const onun = await sor('yazi', TUR_4, { token: s.diger.token, oturum: digerOturum })
    assert.match(onun.cevap, /^Kayıtlarda 3 hasta: /)
    for (const ad of YABANCILAR) assert.ok(onun.cevap.includes(ad), ad)
    assert.ok(!onun.cevap.includes(HASTA))
  })
})

describe('NOTYA-AYSE-SAYI-SIRA-01 — 2. tur: randevusu olmayan gün için takvim cevabı doğrudur', () => {
  for (const yuzey of ['yazi', 'ses'] as const) {
    it(`${yuzey}: "${TUR_2}" → o gün randevu yok, modelsiz, hekimin saat diliminde`, async () => {
      const t = await sor(yuzey, TUR_2)
      assert.match(t.cevap, /takvimi(?:ni)?zde randevu yok|takviminde randevu yok/)
      assert.deepEqual([t.rota, t.model], ['takvim', 0])
      // The day named is the doctor's own day (New York), not the server's.
      const gun = Number(new Date().toLocaleDateString('en-CA', { timeZone: TZ }).slice(8, 10))
      assert.match(t.cevap, new RegExp(`\\b${gun} `))
    })
  }
  it('o gün randevu varsa "randevu yok" denmez; hasta adıyla okunur', async () => {
    const gunIso = new Date().toLocaleDateString('en-CA', { timeZone: 'UTC' })
    ortam.db.ekle('randevular', { doktor_id: s.doktor.id, patient_id: hastaId, baslangic: `${gunIso}T12:00:00Z`, bitis: `${gunIso}T12:30:00Z`, durum: 'planlandi', tur: 'kontrol', notlar: null })
    const cevap = (await yazi(s, TUR_2, { saatDilimi: 'UTC' })).speech
    assert.doesNotMatch(cevap, /randevu yok/)
    assert.match(cevap, /Deneme Hasta/)
  })
})

describe('NOTYA-AYSE-SAYI-SIRA-01 — saklanan sesli turda doktorun cümlesi cevaptan önce ve kendi zamanıyla durur', () => {
  it('modelsiz tur: sıra doktor → Ayşe; doktorun zamanı cevabın zamanından kesin olarak önce (canlı kayıtta ikisi aynı andı)', async () => {
    await fishTur(s, TUR_4, { saatDilimi: TZ })
    const m = mesajlar()
    assert.deepEqual(m.map((x) => [x.role, x.kanal]), [['user', 'ses'], ['assistant', 'ses']])
    assert.equal(m[0].content, TUR_4)
    assert.ok(m[0].zaman! < m[1].zaman!, `${m[0].zaman} < ${m[1].zaman}`)
  })

  it('model turu: doktorun zamanı cümlenin geldiği andır — model cevap vermeden öncesi; cevabın zamanı sonrası', async () => {
    let modelAni = ''
    ortam.yanit = () => {
      if (!modelAni) {
        // The model takes a moment; on the old code the doctor line was stamped only after it had answered.
        const t = Date.now()
        while (Date.now() < t + 5) { /* a few milliseconds of "thinking" */ }
        modelAni = new Date().toISOString()
      }
      return { metin: JSON.stringify({ speech: 'Ben buradayım Hocam; ne varsa birlikte hallederiz.' }) }
    }
    await fishTur(s, 'Aaa, iyiymiş. Yani, bugün seninle takılacağız, ha?', { saatDilimi: TZ })
    const m = mesajlar()
    assert.deepEqual(m.map((x) => x.role), ['user', 'assistant'])
    assert.ok(modelAni, 'the turn reached the model')
    assert.ok(m[0].zaman! < modelAni, `doctor line ${m[0].zaman} is before the model answered (${modelAni})`)
    assert.ok(m[1].zaman! >= modelAni, `reply ${m[1].zaman} is after the model answered (${modelAni})`)
  })

  it('canlı konuşmanın dört turu: kayıt doktor/Ayşe sırasıyla dizilir; zamanlar hiçbir çiftte eşit değil ve geriye gitmez', async () => {
    for (const soz of ['Merhaba hocam. Bugün iyi misiniz?', TUR_2, 'Aaa, iyiymiş. Yani, bugün seninle takılacağız, ha?', TUR_4]) await fishTur(s, soz, { saatDilimi: TZ })
    const m = mesajlar()
    assert.deepEqual(m.map((x) => x.role), ['user', 'assistant', 'user', 'assistant', 'user', 'assistant', 'user', 'assistant'])
    for (let i = 0; i < m.length; i += 2) assert.ok(m[i].zaman! < m[i + 1].zaman!, `tur ${i / 2 + 1}: ${m[i].zaman} < ${m[i + 1].zaman}`)
    for (let i = 1; i < m.length; i++) assert.ok(m[i - 1].zaman! <= m[i].zaman!, `${i}: ${m[i - 1].zaman} <= ${m[i].zaman}`)
    // Sorting the record by its own times gives back the stored order — nothing depends on a tie.
    const sirali = m.map((x, i) => ({ x, i })).sort((a, b) => (a.x.zaman! < b.x.zaman! ? -1 : a.x.zaman! > b.x.zaman! ? 1 : 0)).map((k) => k.i)
    assert.deepEqual(sirali, m.map((_, i) => i))
  })
})
