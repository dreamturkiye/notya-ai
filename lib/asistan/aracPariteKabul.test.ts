/**
 * NOTYA-AYSE-ARAC-PARITE-04 — acceptance: a router gap is no longer a dead end.
 *
 * Real routes (/api/asistan/chat, /api/asistan/fish-tur, /api/asistan/ses-ekran) over the in-memory scene, chat and
 * voice, chart open and closed. The read routers are STUBBED (audit switch NOTYA_HIZLI_YOL_KAPALI=1: every one of
 * them steps aside, as if the doctor's phrasing had matched none), so the only way to the answer is the model and
 * its read tools. The fake model does what the prompt rule says: it calls the tool with the doctor's whole sentence
 * (or the day, for the calendar) and reads the result back. The expected facts are the ones the routers give for the
 * same sentence on the same data — checked in the last block with the switch off.
 *
 * The other doctor of the scene has louder data of every kind (six prescriptions of another antibiotic, five
 * vaccines, an appointment today, a patient with recorded parents). None of it may reach the answer, a tool result
 * or a model request.
 */
import { ortam, sahneHazirla, oturumAc, yazi, fishTur, sonRota, sonAsistanMesaji, sunulanAraclar, aracSonuclari, aracCagiranModel, type Sahne } from './tests/ayseSahne'
import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { OKUMA_SORULARI, OKUMA_TZ as TZ, butunCumle, okumaOturumu, okumaSahnesiKur } from './tests/okumaSorulari'
import { PRATIK, YABANCI } from './tests/pratikSahne'

let sesEkran: { GET: (r: any) => Promise<Response> }
let Istek: typeof import('next/server').NextRequest

before(async () => {
  await sahneHazirla()
  Istek = (await import('next/server')).NextRequest
  sesEkran = await import('../../app/api/asistan/ses-ekran/route')
})

async function ekranMetni(s: Sahne, oturum: string): Promise<string> {
  const y = await sesEkran.GET(new Istek(`http://localhost/api/asistan/ses-ekran?oturum=${oturum}`, { headers: { authorization: `Bearer ${s.doktor.token}` } } as ConstructorParameters<typeof Istek>[1]))
  return String(((await y.json()).turlar as { metin: string }[]).at(-1)?.metin || '')
}

/** Nothing of the other doctor's practice anywhere: answer, stored turn, tool results, model requests. */
function sizintiYok(metinler: string[]): void {
  const hepsi = [...metinler, JSON.stringify(ortam.modelIstekleri)].join('\n')
  for (const iz of [YABANCI.antibiyotik, 'GIZLI', YABANCI.hasta, 'Rotavirüs']) assert.ok(!hepsi.includes(iz), `SIZINTI: başka hekimin verisi (${iz})`)
}

describe('yönlendiriciler devre dışı: model okuma araçlarıyla doğru cevaba ulaşır', () => {
  before(() => { process.env.NOTYA_HIZLI_YOL_KAPALI = '1' })
  after(() => { delete process.env.NOTYA_HIZLI_YOL_KAPALI })

  for (const soru of OKUMA_SORULARI) {
    for (const durum of ['acik', 'yok'] as const) {
      const soz = soru[durum]

      it(`yazı, dosya ${durum === 'acik' ? 'açık' : 'kapalı'} — ${soru.ad}`, async () => {
        const k = okumaSahnesiKur()
        const oturum = okumaOturumu(k, soru, durum)
        ortam.yanit = aracCagiranModel(soru.arac(soz, k), (r) => `Hocam, ${r.join(' ')}`)
        const y = await yazi(k.s, soz, { oturum, saatDilimi: TZ })
        assert.ok(ortam.modelIstekleri.length >= 1, 'yönlendirici cevaplamadı, tur modele gitti')
        assert.ok(sunulanAraclar(ortam.modelIstekleri[0]).includes('hasta_bul') && sunulanAraclar(ortam.modelIstekleri[0]).includes('randevu_takvim'), 'okuma araçları sunuldu')
        assert.equal(ortam.okumaTurlari.length, 1, 'bir araç turu')
        assert.equal(y.rota, soru.kimlik ? 'kimlik' : 'model')
        for (const d of soru.dogru) assert.match(y.speech, d)
        if (soru.kimlik) {
          assert.equal(ortam.modelIstekleri.length, 1, 'kimlik değeri modele dönmez')
          assert.ok(!JSON.stringify(ortam.modelIstekleri).includes(PRATIK.annesi))
        } else {
          for (const d of soru.dogru) assert.match(aracSonuclari(ortam.modelIstekleri[1]).join('\n'), d, 'doğru bilgi araç sonucunda')
        }
        sizintiYok([y.speech, sonAsistanMesaji(oturum)])
      })

      it(`ses, dosya ${durum === 'acik' ? 'açık' : 'kapalı'} — ${soru.ad}`, async () => {
        const k = okumaSahnesiKur()
        const oturum = okumaOturumu(k, soru, durum)
        ortam.yanit = aracCagiranModel(soru.arac(soz, k), (r) => `Hocam, ${r.join(' ')}`)
        const v = await fishTur(k.s, soz, { oturum, saatDilimi: TZ })
        assert.equal(v.status, 200)
        assert.equal(v.hata, null)
        assert.equal(ortam.okumaTurlari.length, 1, 'bir araç turu')
        assert.equal(sonRota(), soru.kimlik ? 'kimlik' : 'model')
        const ekran = soru.kimlik ? await ekranMetni(k.s, oturum) : sonAsistanMesaji(oturum)
        for (const d of soru.dogru) assert.match(ekran, d, 'ekrandaki cevap')
        if (soru.kimlik) {
          assert.match(v.soz, /istediğiniz bilgiyi ekranınıza yazdım Hocam/)
          assert.ok(!v.soz.includes(PRATIK.annesi) && !sonAsistanMesaji(oturum).includes(PRATIK.annesi), 'kimlik değeri söylenmez, saklanmaz')
        } else {
          for (const d of soru.sozde || soru.dogru) assert.match(v.soz, d, 'söylenen cevap')
        }
        sizintiYok([v.soz, ekran, sonAsistanMesaji(oturum)])
      })
    }
  }
})

describe('başka hekimin hastası araçla da bulunamaz', () => {
  before(() => { process.env.NOTYA_HIZLI_YOL_KAPALI = '1' })
  after(() => { delete process.env.NOTYA_HIZLI_YOL_KAPALI })

  for (const kanal of ['yazi', 'ses'] as const) {
    for (const durum of ['acik', 'yok'] as const) {
      it(`${kanal}, dosya ${durum === 'acik' ? 'açık' : 'kapalı'}: yabancı hastanın adıyla sorulan alerji ve anne adı`, async () => {
        for (const soz of [`${YABANCI.hasta}’nun alerjisi ne?`, `${YABANCI.hasta}’nun annesinin adı ne?`]) {
          const k = okumaSahnesiKur()
          const oturum = durum === 'acik' ? oturumAc(k.s, { id: k.elif, ad: PRATIK.kimlikHastasi }) : oturumAc(k.s)
          ortam.yanit = aracCagiranModel(butunCumle(soz), (r) => `Hocam, ${r.join(' ')}`)
          const cevap = kanal === 'yazi' ? (await yazi(k.s, soz, { oturum, saatDilimi: TZ })).speech : (await fishTur(k.s, soz, { oturum, saatDilimi: TZ })).soz
          const hepsi = [cevap, sonAsistanMesaji(oturum), kanal === 'ses' ? await ekranMetni(k.s, oturum) : '', JSON.stringify(ortam.modelIstekleri)].join('\n')
          for (const iz of [YABANCI.alerji, YABANCI.annesi, YABANCI.babasi, k.yabanci]) assert.ok(!hepsi.includes(iz), `SIZINTI (${soz}): ${iz}`)
          // Not the open chart either: the person named was not found, so nobody's data is given.
          assert.ok(!hepsi.includes(PRATIK.annesi), 'açık dosyanın kimliği yabancı adın yerine verilmedi')
          assert.doesNotMatch(cevap, /Dosyada alerji/)
        }
      })
    }
  }

  it('araç doğrudan: yabancı hastanın tam adı "bulunamadı" ile aynı sonucu verir (varlığı da sızmaz)', async () => {
    const { okumaAraciCalistir } = await import('./okumaAraclari')
    const k = okumaSahnesiKur()
    const b = { supabase: ortam.db.istemci() as never, doktorId: k.s.doktor.id, saatDilimi: TZ, aktifHasta: null }
    const yabanci = await okumaAraciCalistir('hasta_bul', { isim: `${YABANCI.hasta} alerjisi ne` }, b)
    const olmayan = await okumaAraciCalistir('hasta_bul', { isim: 'Bartu Hiçyokoğlu alerjisi ne' }, b)
    assert.equal(yabanci.sonuc.replace(YABANCI.hasta, 'X'), olmayan.sonuc.replace('Bartu Hiçyokoğlu', 'X'))
    assert.equal(yabanci.hasta ?? null, null)
    // The same call as the owner finds the chart — the tool works, it is the scope that differs.
    const sahibi = await okumaAraciCalistir('hasta_bul', { isim: `${YABANCI.hasta} alerjisi ne` }, { ...b, doktorId: k.s.diger.id })
    assert.equal(sahibi.hasta?.id, k.yabanci)
    const takvim = await okumaAraciCalistir('randevu_takvim', { tarih: k.bugun }, b)
    assert.ok(takvim.sonuc.includes(PRATIK.randevuHastasi) && !takvim.sonuc.includes(YABANCI.randevuHastasi))
  })
})

describe('hızlı yol yerinde: aynı cümleleri yönlendiriciler modelsiz, aynı bilgiyle cevaplar', () => {
  beforeEach(() => { delete process.env.NOTYA_HIZLI_YOL_KAPALI })

  for (const soru of OKUMA_SORULARI) {
    for (const durum of ['acik', 'yok'] as const) {
      it(`dosya ${durum === 'acik' ? 'açık' : 'kapalı'} — ${soru.ad}`, async () => {
        const k = okumaSahnesiKur()
        const y = await yazi(k.s, soru[durum], { oturum: okumaOturumu(k, soru, durum), saatDilimi: TZ })
        assert.notEqual(y.rota, 'model')
        assert.equal(ortam.modelIstekleri.length, 0, 'model çağrılmadı')
        for (const d of soru.yonlendirici || soru.dogru) assert.match(y.speech, d)
      })
    }
  }
})
