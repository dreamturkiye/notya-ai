/**
 * NOTYA-AYSE-ARAC-PARITE-01 — the read tools of the single brain and their server-side round trip.
 *
 * Real handlers (/api/asistan/chat, /api/asistan/fish-tur, /api/asistan/ses-ekran) over the in-memory scene. The fake
 * model behaves like a model that has tools: it calls one, reads the tool result the server sends back, and answers.
 * A green test therefore means the tool was offered, executed for the authenticated doctor by the existing
 * functions, and its result reached the model — and that the write tools behave exactly as before.
 */
import { ortam, sahneHazirla, sahneKur, hastaEkle, oturumAc, yazi, fishTur, sonRota, sonModelIstegi, sunulanAraclar, zorlananArac, aracSonuclari, aracCagiranModel, sonAsistanMesaji, sistemde, encrypt, type Sahne } from './tests/ayseSahne'
import { describe, it, before, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { gercekciHastaEkle, GERCEKCI_HASTA_ADI as D } from './tests/gercekciHasta'
import { OKUMA_ARACLARI, OKUMA_AYARI, OKUMA_TUR_TAVANI, okumaAraciCalistir, okumaAraciMi } from './okumaAraclari'

let sesEkran: { GET: (r: any) => Promise<Response> }
let Istek: typeof import('next/server').NextRequest

before(async () => {
  await sahneHazirla()
  Istek = (await import('next/server')).NextRequest
  sesEkran = await import('../../app/api/asistan/ses-ekran/route')
})
afterEach(() => { delete process.env.AYSE_OKUMA_ARACI_KAPALI; OKUMA_AYARI.zamanAsimiMs = 8_000 })

/** A doctor with the realistic chart open in the session. */
function acikDosya(): { s: Sahne; hasta: string; oturum: string } {
  const s = sahneKur()
  const hasta = gercekciHastaEkle(ortam.db, encrypt, s.doktor.id)
  return { s, hasta, oturum: oturumAc(s, { id: hasta, ad: D }) }
}
async function ekran(s: Sahne, oturum: string): Promise<{ metin: string }[]> {
  const y = await sesEkran.GET(new Istek(`http://localhost/api/asistan/ses-ekran?oturum=${oturum}`, { headers: { authorization: `Bearer ${s.doktor.token}` } } as ConstructorParameters<typeof Istek>[1]))
  return (await y.json()).turlar
}

/** A sentence no router answers with a chart open (routing table: "[acik] En çok hangi şikayetle geldi" → model). */
const ROUTERSIZ = 'En çok hangi şikayetle geldi'

describe('okuma araçları — tanım, eski ses ajanındaki kayıtla aynı', () => {
  const kayit = readFileSync(new URL('../../scripts/_el-tool-kur.mts', import.meta.url), 'utf8')

  it('aynı adlar: hasta_bul ve randevu_takvim', () => {
    assert.deepEqual(OKUMA_ARACLARI.map((a) => a.name), ['hasta_bul', 'randevu_takvim'])
    for (const a of OKUMA_ARACLARI) assert.ok(kayit.includes(`'${a.name}'`), a.name)
    assert.ok(okumaAraciMi('hasta_bul') && okumaAraciMi('randevu_takvim') && !okumaAraciMi('alerji_ekle'))
  })

  it('aynı şema: zorunlu alanlar, alan adları ve açıklamalar kayıt betiğindeki metinle birebir', () => {
    const sema = Object.fromEntries(OKUMA_ARACLARI.map((a) => [a.name, a.input_schema as { required: string[]; properties: Record<string, { type: string; description: string }> }]))
    assert.deepEqual(sema.hasta_bul.required, ['isim'])
    assert.deepEqual(Object.keys(sema.hasta_bul.properties), ['isim'])
    assert.deepEqual(sema.randevu_takvim.required, ['tarih'])
    assert.deepEqual(Object.keys(sema.randevu_takvim.properties), ['tarih', 'saat', 'sure_dk'])
    // The script writes the same Turkish text (its quoting differs: \' inside single-quoted strings).
    const duz = (x: string) => x.replace(/\\'/g, "'")
    for (const a of OKUMA_ARACLARI) {
      assert.ok(duz(kayit).includes(a.description), `${a.name} açıklaması betikle aynı değil`)
      for (const [alan, p] of Object.entries((a.input_schema as { properties: Record<string, { type: string; description: string }> }).properties)) {
        assert.equal(p.type, 'string', `${a.name}.${alan}`)
        assert.ok(duz(kayit).includes(p.description), `${a.name}.${alan} açıklaması betikle aynı değil`)
      }
    }
  })
})

describe('sunucu tarafı araç turu — yazı ve ses, dosya açık', () => {
  it('yazı: model hasta_bul çağırır, sonuç modele döner, cevap sonucu taşır', async () => {
    const { s, oturum } = acikDosya()
    ortam.yanit = aracCagiranModel({ name: 'hasta_bul', input: { isim: `${D} alerjisi ne` } }, (r) => `Araçtan: ${r[0]}`)
    const y = await yazi(s, ROUTERSIZ, { oturum })
    assert.equal(y.rota, 'model')
    assert.equal(ortam.modelIstekleri.length, 2, 'bir araç turu = iki model çağrısı')
    const [ilk, ikinci] = ortam.modelIstekleri
    for (const a of ['hasta_bul', 'randevu_takvim', 'alerji_ekle']) assert.ok(sunulanAraclar(ilk).includes(a), `${a} sunulmadı`)
    assert.equal(zorlananArac(ilk), null, 'okuma turu zorlanmaz')
    assert.deepEqual(sunulanAraclar(ikinci), sunulanAraclar(ilk), 'ikinci çağrıda araç listesi aynı')
    const sonuclar = aracSonuclari(ikinci)
    assert.equal(sonuclar.length, 1)
    assert.match(sonuclar[0], /^Deniz Aksoy\. Dosyada alerji: .*Penisilin/)
    const mesajlar = ikinci.govde.messages as { role: string; content: any }[]
    assert.equal(mesajlar.at(-2)!.role, 'assistant')
    assert.equal(mesajlar.at(-2)!.content[0].type, 'tool_use')
    assert.equal(mesajlar.at(-1)!.content[0].tool_use_id, mesajlar.at(-2)!.content[0].id)
    assert.match(y.speech, /Penisilin/)
    assert.equal(ortam.okumaTurlari.length, 1)
    assert.deepEqual(ortam.okumaTurlari[0].araclar, ['hasta_bul'])
    assert.ok(ortam.okumaTurlari[0].ekMs >= ortam.okumaTurlari[0].aracMs)
  })

  it('ses: aynı tur, cevap söylenir ve ekrana aynı metin yazılır', async () => {
    const { s, oturum } = acikDosya()
    ortam.yanit = aracCagiranModel({ name: 'hasta_bul', input: { isim: `${D} alerjisi ne` } }, (r) => `Araçtan: ${r[0]}`)
    const v = await fishTur(s, ROUTERSIZ, { oturum })
    assert.equal(sonRota(), 'model')
    assert.equal(ortam.modelIstekleri.length, 2)
    assert.ok(ortam.modelIstekleri.every((m) => m.stream), 'ses akışla çağırır')
    assert.match(v.soz, /Penisilin/)
    assert.match(sonAsistanMesaji(oturum), /Penisilin/)
  })

  it('randevu_takvim: o günün listesi ve boş aralıklar modele döner', async () => {
    const { s, oturum } = acikDosya()
    ortam.db.ekle('randevular', { doktor_id: s.doktor.id, patient_id: null, hasta_adi_serbest: 'QA Takvim Hastası', baslangic: '2026-11-04T07:00:00Z', bitis: '2026-11-04T07:20:00Z', durum: 'planlandi', tur: 'kontrol' })
    ortam.yanit = aracCagiranModel({ name: 'randevu_takvim', input: { tarih: '2026-11-04' } }, (r) => r[0])
    const y = await yazi(s, ROUTERSIZ, { oturum, saatDilimi: 'Europe/Istanbul' })
    const sonuc = aracSonuclari(sonModelIstegi())[0]
    assert.match(sonuc, /takviminde 1 randevu: 10:00–10:20 QA Takvim Hastası \(kontrol\)/)
    assert.match(sonuc, /boş saatler \(çalışma saatleri 09:00–18:00\): 09:00–10:00, 10:20–18:00/)
    assert.match(y.speech, /QA Takvim Hastası/)
  })

  it('randevu_takvim saat ile: o saatin dolu olduğu söylenir', async () => {
    const { s, oturum } = acikDosya()
    ortam.db.ekle('randevular', { doktor_id: s.doktor.id, patient_id: null, hasta_adi_serbest: 'QA Takvim Hastası', baslangic: '2026-11-04T07:00:00Z', bitis: '2026-11-04T07:20:00Z', durum: 'planlandi', tur: 'kontrol' })
    ortam.yanit = aracCagiranModel({ name: 'randevu_takvim', input: { tarih: '2026-11-04', saat: '10:00', sure_dk: '20' } }, (r) => r[0])
    await yazi(s, ROUTERSIZ, { oturum, saatDilimi: 'Europe/Istanbul' })
    assert.match(aracSonuclari(sonModelIstegi())[0], /İstediğiniz 10:00 DOLU — QA Takvim Hastası/)
  })

  it(`en fazla ${OKUMA_TUR_TAVANI} araç turu: model hep araç isterse bulunan sonuç cevap olur`, async () => {
    const { s, oturum } = acikDosya()
    ortam.yanit = () => ({ metin: '', araclar: [{ name: 'hasta_bul', input: { isim: `${D} alerjisi ne` } }] })
    const y = await yazi(s, ROUTERSIZ, { oturum })
    assert.equal(ortam.modelIstekleri.length, 1 + OKUMA_TUR_TAVANI)
    assert.equal(ortam.okumaTurlari.length, OKUMA_TUR_TAVANI)
    assert.match(y.speech, /Dosyada alerji: .*Penisilin/)
    assert.doesNotMatch(y.speech, /cevap üretemedim/)
  })

  it('araç sonrası model düşerse hekim bulunan sonucu yine alır', async () => {
    const { s, oturum } = acikDosya()
    ortam.yanit = (istek) => {
      if (aracSonuclari({ stream: false, govde: istek }).length) throw new Error('sentetik model hatası')
      return { metin: '', araclar: [{ name: 'hasta_bul', input: { isim: `${D} alerjisi ne` } }] }
    }
    const y = await yazi(s, ROUTERSIZ, { oturum })
    assert.match(y.speech, /Dosyada alerji: .*Penisilin/)
  })
})

describe('yönlendiriciler hızlı yol, kapı bekçisi değil — dosya açık değilken de okuma araçları sunulur', () => {
  /** No router lists this phrasing (routing table: "[yok] Geçen ay en yoğun günüm hangisiydi?" → model). */
  const SORU = 'Geçen ay en yoğun günüm hangisiydi?'

  it('hastasız, komut olmayan tur: yalnız okuma araçları; istem araçları adıyla söyler', async () => {
    const s = sahneKur()
    hastaEkle(s.doktor.id, 'Umutcan Türkoğlu', { dogum: '2019-04-10' })
    await yazi(s, SORU)
    const istek = sonModelIstegi()
    assert.deepEqual(sunulanAraclar(istek), ['hasta_bul', 'randevu_takvim'])
    assert.equal(zorlananArac(istek), null)
    assert.ok(sistemde(/\[OKUMA ARAÇLARI — bu turda sana verildi: hasta_bul, randevu_takvim\]/))
    assert.ok(sistemde(/Tam cümleyi isim olarak gönder/), 'istemdeki kural yeniden doğru')
    assert.ok(sistemde(/BU TURDA AÇIK HASTA DOSYASI YOK/))
    assert.ok(!sistemde(/DOSYAYA KAYIT HAZIRLAMA \(Notya eylem katmanı\)/), 'yazma aracı yokken eylem paragrafı yok')
  })

  it('hastasız tur: model hasta_bul ile hastayı adından bulur, hasta oturumun açık hastası olur', async () => {
    const s = sahneKur()
    gercekciHastaEkle(ortam.db, encrypt, s.doktor.id)
    ortam.yanit = aracCagiranModel({ name: 'hasta_bul', input: { isim: `${D} alerjisi ne` } }, (r) => r[0])
    // The name as a speech recogniser may write it: the resolver finds nobody, the model asks with the right spelling.
    const y = await yazi(s, 'Denis Aksoj’un alerjisi neydi?')
    assert.equal(y.rota, 'model')
    assert.match(y.speech, /Deniz Aksoy\. Dosyada alerji: .*Penisilin/)
    assert.equal(y.aktifHasta, D)
  })

  it('selam / teşekkür turunda araç yok', async () => {
    const s = sahneKur()
    await yazi(s, 'Teşekkürler')
    assert.deepEqual(sunulanAraclar(sonModelIstegi()), [])
    assert.ok(!sistemde(/OKUMA ARAÇLARI/))
  })

  it('hızlı yol aynen: yönlendiricinin cevapladığı soru modele gitmez', async () => {
    const s = sahneKur()
    hastaEkle(s.doktor.id, 'Umutcan Türkoğlu', { dogum: '2019-04-10' })
    const y = await yazi(s, 'Kaç hastam var?')
    assert.equal(y.rota, 'arama')
    assert.equal(ortam.modelIstekleri.length, 0)
  })
})

describe('kimlik: değer modele gitmez, ekrana gider', () => {
  /** A phrasing the identity router does not list. */
  const SORU = 'Ebeveynleri kim bu çocuğun?'

  it('yazı: model hasta_bul ile sorar, tur orada biter; adlar ekranda, model isteğinde yok', async () => {
    const { s, oturum } = acikDosya()
    ortam.yanit = aracCagiranModel({ name: 'hasta_bul', input: { isim: 'annesinin ve babasının adı ne' } }, () => 'kullanılmaz')
    const y = await yazi(s, SORU, { oturum })
    assert.equal(y.rota, 'kimlik')
    assert.equal(ortam.modelIstekleri.length, 1, 'kimlik sonucu modele geri gönderilmez')
    assert.match(y.speech, /QA-Anne-Selin/)
    assert.match(y.speech, /QA-Baba-Murat/)
    assert.ok(!JSON.stringify(ortam.modelIstekleri).includes('QA-Anne-Selin'))
    assert.ok(!sonAsistanMesaji(oturum).includes('QA-Anne-Selin'), 'saklanan geçmiş değersiz')
    assert.equal(ortam.okumaTurlari[0].kimlik, true)
  })

  it('ses: değer söylenmez; ekran yoklaması değeri aracın sorusundan yeniden kurar', async () => {
    const { s, oturum } = acikDosya()
    ortam.yanit = aracCagiranModel({ name: 'hasta_bul', input: { isim: 'annesinin ve babasının adı ne' } }, () => 'kullanılmaz')
    const v = await fishTur(s, SORU, { oturum })
    assert.equal(sonRota(), 'kimlik')
    assert.match(v.soz, /istediğiniz bilgiyi ekranınıza yazdım Hocam/)
    assert.ok(!v.soz.includes('QA-Anne-Selin'))
    const turlar = await ekran(s, oturum)
    assert.match(turlar.at(-1)!.metin, /QA-Anne-Selin/)
    assert.match(turlar.at(-1)!.metin, /QA-Baba-Murat/)
  })
})

describe('yazma araçları (S3) aynen', () => {
  it('komut turu: okuma aracı sunulmaz, araç zorlanır, tek model çağrısı', async () => {
    const { s, oturum } = acikDosya()
    ortam.yanit = { metin: '', araclar: [{ name: 'alerji_ekle', input: { alerjen: 'Penisilin', alan_kaynaklari: { alerjen: { kaynak: 'doktor_soyledi' } } } }] }
    const y = await yazi(s, 'Penisilin alerjisini ekle', { oturum })
    const istek = sonModelIstegi()
    assert.deepEqual(sunulanAraclar(istek), ['alerji_ekle'])
    assert.equal(zorlananArac(istek), 'alerji_ekle')
    assert.equal(ortam.modelIstekleri.length, 1)
    assert.equal(y.eylemOnerileri.length, 1)
    assert.equal(ortam.okumaTurlari.length, 0)
  })

  it('komut olmayan turda modelin yazma çağrısı: kart hazırlanır, araç turu yok', async () => {
    const { s, oturum } = acikDosya()
    ortam.yanit = { metin: '', araclar: [{ name: 'dosya_notu_ekle', input: { metin: 'Annesi sigarayı bıraktı', alan_kaynaklari: { metin: { kaynak: 'doktor_soyledi' } } } }] }
    const y = await yazi(s, ROUTERSIZ, { oturum })
    assert.equal(ortam.modelIstekleri.length, 1)
    assert.deepEqual(y.eylemOnerileri.map((o) => o.eylem_anahtar), ['dosya_notu_ekle'])
  })

  it('aynı cevapta okuma + yazma çağrısı: kart yolu eskisi gibi, araç turu yok', async () => {
    const { s, oturum } = acikDosya()
    ortam.yanit = { metin: '', araclar: [
      { name: 'hasta_bul', input: { isim: `${D} alerjisi ne` } },
      { name: 'dosya_notu_ekle', input: { metin: 'Annesi sigarayı bıraktı', alan_kaynaklari: { metin: { kaynak: 'doktor_soyledi' } } } },
    ] }
    const y = await yazi(s, ROUTERSIZ, { oturum })
    assert.equal(ortam.modelIstekleri.length, 1)
    assert.deepEqual(y.eylemOnerileri.map((o) => o.eylem_anahtar), ['dosya_notu_ekle'])
    assert.equal(ortam.db.tablo('hasta_notlari')?.length ?? 0, 0, 'hiçbir şey yazılmadı')
  })

  it('AYSE_OKUMA_ARACI_KAPALI=1: okuma aracı sunulmaz, yazma araçları durur', async () => {
    const { s, oturum } = acikDosya()
    process.env.AYSE_OKUMA_ARACI_KAPALI = '1'
    await yazi(s, ROUTERSIZ, { oturum })
    const sunulan = sunulanAraclar(sonModelIstegi())
    assert.ok(!sunulan.includes('hasta_bul') && !sunulan.includes('randevu_takvim'))
    assert.ok(sunulan.includes('alerji_ekle'))
  })
})

describe('okumaAraciCalistir — sınırlar', () => {
  it('bilinmeyen araç adı çalışmaz', async () => {
    const s = sahneKur()
    const r = await okumaAraciCalistir('hasta_sil', {}, { supabase: ortam.db.istemci() as never, doktorId: s.doktor.id, saatDilimi: 'Europe/Istanbul', aktifHasta: null })
    assert.equal(r.hata, true)
  })

  it('zaman aşımı: yanıt vermeyen veritabanı turu tutmaz', async () => {
    const s = sahneKur()
    hastaEkle(s.doktor.id, 'Umutcan Türkoğlu')
    const asili: any = new Proxy(function () {}, { get: (_t, p) => (p === 'then' ? () => {} : asili), apply: () => asili })
    OKUMA_AYARI.zamanAsimiMs = 30
    const t0 = Date.now()
    const r = await okumaAraciCalistir('hasta_bul', { isim: 'Umutcan Türkoğlu alerjisi ne' }, { supabase: asili, doktorId: s.doktor.id, saatDilimi: 'Europe/Istanbul', aktifHasta: null })
    assert.equal(r.hata, true)
    assert.match(r.sonuc, /Dosyaya şu an ulaşamadım/)
    assert.ok(Date.now() - t0 < 2_000)
  })

  it('hata metni modele gitmez', async () => {
    const s = sahneKur()
    const bozuk = { from: () => { throw new Error('GIZLI-ic-hata') } } as never
    const r = await okumaAraciCalistir('randevu_takvim', { tarih: '2026-11-04' }, { supabase: bozuk, doktorId: s.doktor.id, saatDilimi: 'Europe/Istanbul', aktifHasta: null })
    assert.equal(r.hata, true)
    assert.ok(!r.sonuc.includes('GIZLI'))
  })

  it('boş cümle: ad sorulur, arama yapılmaz', async () => {
    const s = sahneKur()
    const r = await okumaAraciCalistir('hasta_bul', { isim: '  ' }, { supabase: ortam.db.istemci() as never, doktorId: s.doktor.id, saatDilimi: 'Europe/Istanbul', aktifHasta: null })
    assert.match(r.sonuc, /Hasta adını anlayamadım/)
  })
})
