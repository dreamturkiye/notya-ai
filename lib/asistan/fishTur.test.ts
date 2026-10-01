/**
 * NOTYA-AYSE-GERI-00 — route-level tests of /api/asistan/fish-tur, the route Ayşe's voice actually uses.
 *
 * Until now the single-brain suite (tekBeyin.test.ts) drove only the ElevenLabs Custom-LLM route, which Ayşe left
 * on 2026-09-29; no test ran a turn through the Fish route (audit §4.6). Here the real handler runs with the
 * transcript given as text (`mesaj`), so Fish ASR / TTS are not called and everything after the transcript is the
 * production path.
 */
import { ortam, sahneHazirla, sahneKur, hastaEkle, oturumAc, fishTur, sonRota, sonAsistanMesaji, type Sahne } from './tests/ayseSahne'
import { describe, it, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

let s: Sahne
let hasta: string
const AD = 'Umutcan Türkoğlu'

before(async () => { await sahneHazirla() })
beforeEach(() => {
  s = sahneKur()
  hasta = hastaEkle(s.doktor.id, AD, { dogum: '2019-04-10', cinsiyet: 'male' })
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

  it('kimlik doğrulaması yoksa 401; ASR gürültüsü tur sayılmaz (model yok, atlandi)', async () => {
    const y = await fishTur(s, 'Merhaba', { token: 'gecersiz' })
    assert.equal(y.status, 401)
    const g = await fishTur(s, '...')
    assert.deepEqual(g.sira, ['atlandi', 'bit'])
    assert.equal(ortam.modelIstekleri.length, 0)
  })
})

/**
 * KNOWN FAILURES on the Fish route (audit §4.6) — pinned to today's behaviour. S2 replaces each of these with the
 * restored behaviour: spoken Evet / Hayır on a pending card, withdrawal of the superseded draft, continuation.
 */
describe('fish-tur — bilinen hatalar (S2 düzeltir)', () => {
  const kartHazirla = async (oturum: string) => {
    ortam.yanit = {
      metin: JSON.stringify({ speech: 'Kartı hazırladım Hocam.' }),
      araclar: [{ name: 'alerji_ekle', input: { alerji: 'Penisilin', alan_kaynaklari: { alerji: { kaynak: 'doktor_soyledi' } } } }],
    }
    const t = await fishTur(s, 'Penisilin alerjisini dosyaya gir', { oturum })
    assert.equal(ortam.db.tablo('eylem_onerileri').filter((r) => r.durum === 'taslak').length, 1, 'taslak kart hazırlanmalı')
    return t
  }

  it('BİLİNEN HATA: sesli "Evet" bekleyen kartı onaylamaz — model turuna gider, taslak taslak kalır', async () => {
    const oturum = oturumAc(s, { id: hasta, ad: AD })
    await kartHazirla(oturum)
    const once = ortam.modelIstekleri.length
    ortam.yanit = { metin: JSON.stringify({ speech: 'Tamam Hocam.' }) }
    await fishTur(s, 'Evet', { oturum })
    assert.equal(ortam.modelIstekleri.length, once + 1, 'bugün: Evet bir model turu')
    assert.equal(ortam.db.tablo('eylem_onerileri')[0].durum, 'taslak', 'bugün: kart onaylanmadı')
    assert.equal(ortam.db.tablo('eylem_kayitlari').length, 0)
  })

  it('BİLİNEN HATA: aynı kart sesle yeniden hazırlanınca eski taslak geri çekilmez — iki taslak bekler', async () => {
    const oturum = oturumAc(s, { id: hasta, ad: AD })
    await kartHazirla(oturum)
    ortam.yanit = {
      metin: JSON.stringify({ speech: 'Kartı güncelledim Hocam.' }),
      araclar: [{ name: 'alerji_ekle', input: { alerji: 'Amoksisilin', alan_kaynaklari: { alerji: { kaynak: 'doktor_soyledi' } } } }],
    }
    await fishTur(s, 'Yok, amoksisilin alerjisi olarak kaydet', { oturum })
    assert.equal(ortam.db.tablo('eylem_onerileri').filter((r) => r.durum === 'taslak').length, 2, 'bugün: iki taslak')
  })

  it('BİLİNEN HATA: kesilen sesli cevabın kalanı saklanmaz — "devam et" bir model turudur', async () => {
    ortam.yanit = { metin: JSON.stringify({ speech: 'Bir. İki. Üç. Dört. Beş. Altı. Yedi.' }) }
    const t = await fishTur(s, 'Akut otitte ilk seçenek nedir?')
    assert.match(t.soz, /Devamı ekranınızda/)
    const baglam = ortam.db.tablo('asistan_sessions').find((x) => x.id === s.oturum)!.active_context as Record<string, unknown>
    assert.equal(baglam.sesDevam, undefined, 'bugün: kalan saklanmıyor')
    const once = ortam.modelIstekleri.length
    await fishTur(s, 'devam et')
    assert.equal(ortam.modelIstekleri.length, once + 1, 'bugün: devam et bir model turu')
  })
})
