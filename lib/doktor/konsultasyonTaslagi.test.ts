/**
 * AYSE-KONSULTASYON-01 — Ayşe'nin istem / yanıt taslakları, saf kurallar (sentetik veri):
 *   • model kademesi: istem 'klinik-analiz', yanıt 'goruntu-inceleme' — ikisi de GÜÇLÜ, HIZLI'ya düşmez
 *   • önbellek: sabit system prompt cache_control alır, hasta dosyası system'e girmez
 *   • bağlam: BÜTÜN vizitler okunur, AĞIRLIK SON MUAYENEDE (son tam, öncekiler tek satır, ham metin yok)
 *   • çıktı: selamlama/imza sunucudan; ham JSON / kesilmiş / DOSYA_YETERSIZ düşer (F3); uydurma doz yer tutucu olur
 *   • hata yolu: her hata "Taslak oluşturulamadı, elle yazabilirsiniz" — form kullanılabilir kalır
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { GOREV_POLITIKASI, gucluModel, hizliModel, modelSec } from '../ai/modeller'
import { istekGovdesi } from '../ai/cagir'
import {
  DOZ_YER_TUTUCU,
  DOSYA_YETERSIZ,
  ISTEM_TASLAK_GOREVI,
  ISTEM_TASLAK_SISTEMI,
  RAPOR_OKUNAMADI,
  TASLAK_OLUSTURULAMADI,
  TASLAK_SINIRLARI,
  YANIT_TASLAK_GOREVI,
  YANIT_TASLAK_SISTEMI,
  istemBaglamiDerle,
  istemGovdesiTemizle,
  istemMektubu,
  istemTaslagiMumkunMu,
  taslakHataMesaji,
  taslakUygulanir,
  yanitTaslagiTemizle,
  type IstemKaynagi,
  type VizitKaydi,
} from './konsultasyonTaslagi'
import { KONSULTASYON_SINIRLARI, istemOzu } from './konsultasyon'
import { taslakIste } from './konsultasyonIstemci'

const v = (o: Partial<VizitKaydi>): VizitKaydi => ({ tarih: '2026-01-01', onayli: true, ...o })
const kaynak = (o: Partial<IstemKaynagi> = {}): IstemKaynagi => ({
  yas: '5 yaş', cinsiyet: 'Erkek', cocuk: true, hedefBrans: 'Kulak Burun Boğaz Hastalıkları', surekliIlaclar: [], ozgecmis: [],
  vizitler: [
    v({ tarih: '2025-11-02', tani: 'Akut otitis media (sağ)', degerlendirme: `Sağ kulak zarı hiperemik. ${'ESKI-UZUN-METIN '.repeat(40)}`, plan: 'ESKI-PLAN-GITMEMELI', ilaclar: ['Amoksisilin'] }),
    v({ tarih: '2026-03-10', tani: 'Akut bronşiolit', degerlendirme: 'Hışıltı, destek tedavi.' }),
    v({ tarih: '2026-09-12', onayli: false, yakinma: 'Üç gündür sağ kulak ağrısı ve ateş', objektif: 'Sağ kulak zarı bombeli ve kızarık.', vitaller: 'ates: 38.4', degerlendirme: 'Akut otitis media düşünüldü.', plan: 'Antibiyotik başlandı, 10 gün sonra kontrol.', ilaclar: ['Amoksisilin-klavulanat 400 mg/5 mL 2x5 mL'] }),
  ],
  ...o,
})

describe('AYSE-KONSULTASYON-01 — model kademesi (GÜÇLÜ, HIZLI\'ya düşmez)', () => {
  it("istem taslağı 'klinik-analiz' → GÜÇLÜ; yanıt taslağı 'goruntu-inceleme' → GÜÇLÜ", () => {
    assert.equal(ISTEM_TASLAK_GOREVI, 'klinik-analiz')
    assert.equal(YANIT_TASLAK_GOREVI, 'goruntu-inceleme')
    for (const g of [ISTEM_TASLAK_GOREVI, YANIT_TASLAK_GOREVI]) {
      assert.equal(GOREV_POLITIKASI[g].kademe, 'guclu', g)
      const s = modelSec(g)
      assert.equal(s.model, gucluModel(), g)
      assert.notEqual(s.model, hizliModel(), `${g} HIZLI modele düştü`)
    }
  })
  it('istek gövdesi: GÜÇLÜ model; sabit system prompt önbellekli ve hasta verisi içermez; dosya user mesajında', () => {
    const baglam = istemBaglamiDerle(kaynak())
    const g = istekGovdesi({ gorev: ISTEM_TASLAK_GOREVI, system: [{ metin: ISTEM_TASLAK_SISTEMI, onbellek: true }], messages: [{ role: 'user', content: baglam }] })
    assert.equal(g.model, gucluModel())
    const sys = g.system as Array<{ text: string; cache_control?: unknown }>
    assert.equal(sys.length, 1)
    assert.deepEqual(sys[0].cache_control, { type: 'ephemeral' })
    assert.equal(sys[0].text, ISTEM_TASLAK_SISTEMI, 'sabit kısım her çağrıda aynı (önbellek tutar)')
    assert.ok(!sys[0].text.includes('Üç gündür sağ kulak ağrısı'), 'hasta dosyası sabit bloğa karışmaz')
    assert.ok(String((g.messages as Array<{ content: string }>)[0].content).includes('Üç gündür sağ kulak ağrısı'))
  })
  it('yanıt taslağı: görsel/PDF blokla bile GÜÇLÜ (cagir.ts emniyeti) ve sabit prompt önbellekli', () => {
    const g = istekGovdesi({ gorev: YANIT_TASLAK_GOREVI, system: [{ metin: YANIT_TASLAK_SISTEMI, onbellek: true }], messages: [{ role: 'user', content: [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: 'eA==' } }] }] })
    assert.equal(g.model, gucluModel())
    assert.deepEqual((g.system as Array<{ cache_control?: unknown }>)[0].cache_control, { type: 'ephemeral' })
  })
  it('sabit prompt: Dr. Gökhan biçimi, kısaltmasız, yalnız dosya, doz/tanı uydurma yasağı, DOSYA_YETERSIZ kaçış yolu', () => {
    for (const p of ['konsültasyonunuzu rica ederim', 'KISALTMASIZ', 'YALNIZ dosya özetindeki bilgiyi', 'AĞIRLIK SON MUAYENEDE', 'Doz yalnız dosyada yazılıysa', 'Tanıyı kesinleştirme', 'T.C. kimlik', DOSYA_YETERSIZ, 'Selamlama']) {
      assert.ok(ISTEM_TASLAK_SISTEMI.includes(p), p)
    }
    for (const p of ['YALNIZ raporda yazanı', 'Doz YAZMA', RAPOR_OKUNAMADI, 'tanını']) assert.ok(YANIT_TASLAK_SISTEMI.includes(p), p)
  })
})

describe('AYSE-KONSULTASYON-01 — bağlam: bütün vizitler, ağırlık son muayenede', () => {
  const b = istemBaglamiDerle(kaynak({ hekimNotu: 'işitme kaybı şüphesi', surekliIlaclar: ['Montelukast 4 mg 1x1'], ozgecmis: ['alerjiler: penisilin yok', 'kronikHastaliklar: astım'] }))
  it('son muayene TAM: yakınma, bulgu, vital, değerlendirme, plan, ilaç (dozu dosyada yazıldığı gibi); onaysız not işaretli', () => {
    const son = b.slice(b.indexOf('## SON MUAYENE'), b.indexOf('## ÖNCEKİ'))
    for (const p of ['12.09.2026', 'taslak not', 'Üç gündür sağ kulak ağrısı', 'bombeli', 'ates: 38.4', 'Akut otitis media düşünüldü', '10 gün sonra kontrol', 'Amoksisilin-klavulanat 400 mg/5 mL']) assert.ok(son.includes(p), p)
  })
  it('önceki vizitler tek satır: tarih + tanı + kısa değerlendirme; planları ve ham uzun metin GİTMEZ; en yeni önce', () => {
    const onceki = b.slice(b.indexOf('## ÖNCEKİ'))
    assert.ok(onceki.includes('02.11.2025: Tanı: Akut otitis media (sağ)'))
    assert.ok(!b.includes('ESKI-PLAN-GITMEMELI'), 'önceki vizitin planı bağlama girdi')
    const satir = onceki.split('\n').find((x) => x.includes('02.11.2025'))!
    assert.ok(satir.length < 400, `önceki vizit satırı şişti (${satir.length})`)
    assert.ok(onceki.indexOf('10.03.2026') < onceki.indexOf('02.11.2025'), 'en yeni önce')
  })
  it('çok eski vizitler yalnız sayı olarak (bağlam şişmez); boş seanslar son muayene sayılmaz', () => {
    const cok = Array.from({ length: 20 }, (_, i) => v({ tarih: `2025-01-${String(i + 1).padStart(2, '0')}`, tani: `Tanı ${i}` }))
    const k = kaynak({ vizitler: [...cok, v({ tarih: '2026-09-12', degerlendirme: 'Son muayene değerlendirmesi.' }), v({ tarih: '2026-09-13' })] })
    const s = istemBaglamiDerle(k)
    assert.match(s, /\(8 daha eski vizit — özetlenmedi\)/)
    assert.equal((s.match(/^- \d{2}\.\d{2}\.\d{4}: /gm) || []).length, TASLAK_SINIRLARI.oncekiVizit)
    assert.ok(s.includes('Tarih: 12.09.2026'), 'boş 13.09 seansı son muayene sayılmadı')
  })
  it('sürekli ilaç, özgeçmiş, istenen branş ve hekimin notu bağlamda; kimlik alanı yok', () => {
    for (const p of ['Montelukast 4 mg', 'penisilin yok', 'astım', 'İstenen branş: Kulak Burun Boğaz Hastalıkları', 'Hekimin notu (konsültasyonun nedeni): işitme kaybı şüphesi', 'aile / hasta']) assert.ok(b.includes(p), p)
    assert.ok(!/T\.C\.|telefon|adres/i.test(b))
  })
  it('erişkinde beyan "hasta" — aile dili yok (VELI-YASAL-ONAM yaşa bağlı)', () => {
    const s = istemBaglamiDerle(kaynak({ cocuk: false, yas: '45 yaş', ozgecmis: ['kronikHastaliklar: hipertansiyon'] }))
    assert.ok(s.includes('(ilk kayıt formu — hasta beyanı)'))
    assert.ok(!s.includes('18 yaş altı'))
  })
  it('son muayenede klinik içerik yoksa taslak mümkün değil (model çağrılmaz)', () => {
    assert.equal(istemTaslagiMumkunMu({ vizitler: [] }), false)
    assert.equal(istemTaslagiMumkunMu({ vizitler: [v({ ilaclar: ['x'] })] }), false)
    assert.equal(istemTaslagiMumkunMu({ vizitler: [v({ yakinma: 'Öksürük' })] }), true)
  })
})

describe('AYSE-KONSULTASYON-01 — çıktı temizliği (F3 ham-JSON koruması, doz kilidi)', () => {
  const baglam = istemBaglamiDerle(kaynak())
  const GOVDE = 'Beş yaşındaki erkek hastamız üç gündür sağ kulak ağrısı ve ateş ile başvurdu.\n\nAkut otitis media düşünülerek antibiyotik başlandı.\n\nİşitme açısından değerlendirilmesi ve gerekli görmeniz halinde ileri tetkik ve tedavi önerileriniz açısından Kulak Burun Boğaz Hastalıkları konsültasyonunuzu rica ederim.'
  it('model selamlama/imza eklese de atılır (sunucu ekler); markdown temizlenir', () => {
    const t = istemGovdesiTemizle(`\`\`\`\nSayın Meslektaşım,\n\n**${GOVDE}**\n\nSaygılarımla,\nDr. Uydurma Ad\n\`\`\``, baglam)
    assert.ok(t.ok)
    if (!t.ok) return
    assert.ok(t.metin.startsWith('Beş yaşındaki'))
    assert.ok(!t.metin.includes('Saygılarımla') && !t.metin.includes('Uydurma'), 'modelin imzası atıldı')
    assert.ok(!t.metin.includes('**'))
  })
  it('F3: ham JSON, kesilmiş çıktı, boş ve DOSYA_YETERSIZ hekime gösterilmez', () => {
    assert.deepEqual(istemGovdesiTemizle('{"speech":"Sentetik yanıt","action":null}', baglam), { ok: false, neden: 'ham_json' })
    assert.deepEqual(istemGovdesiTemizle('```json\n{"govde": "x"}\n```', baglam), { ok: false, neden: 'ham_json' })
    assert.deepEqual(istemGovdesiTemizle(GOVDE, baglam, true), { ok: false, neden: 'kesildi' })
    assert.deepEqual(istemGovdesiTemizle('   ', baglam), { ok: false, neden: 'bos' })
    assert.deepEqual(istemGovdesiTemizle(DOSYA_YETERSIZ, baglam), { ok: false, neden: 'yetersiz' })
  })
  it('KOD DOZ KİLİDİ: dosyada geçen doz kalır, dosyada olmayan doz yer tutucu olur', () => {
    const t = istemGovdesiTemizle(`${GOVDE}\n\nAmoksisilin-klavulanat 400 mg/5 mL başlandı; ayrıca parasetamol 250 mg verildi.`, baglam)
    assert.ok(t.ok)
    if (!t.ok) return
    assert.ok(t.metin.includes('400 mg/5 mL'), 'dosyadaki doz korunur')
    assert.ok(!t.metin.includes('250 mg') && t.metin.includes(DOZ_YER_TUTUCU), 'uydurma doz kaldırılır')
    assert.deepEqual(t.dozlar, ['250 mg'])
  })
  it('mektup: "Sayın Meslektaşım," + gövde + "Saygılarımla," + hekim adı + uzmanlık; istem tavanını aşmaz; özü talep paragrafı', () => {
    const m = istemMektubu(GOVDE, 'Dr. QA Hekim', 'Çocuk Sağlığı ve Hastalıkları')
    assert.ok(m.startsWith('Sayın Meslektaşım,\n\nBeş yaşındaki'))
    assert.ok(m.endsWith('Saygılarımla,\nDr. QA Hekim\nÇocuk Sağlığı ve Hastalıkları'))
    assert.ok(istemMektubu('uzun '.repeat(2000), 'Dr. QA', '').length <= KONSULTASYON_SINIRLARI.klinikSoru)
    assert.match(istemOzu(m), /^İşitme açısından değerlendirilmesi .* konsültasyonunuzu rica ederim\.$/)
    assert.equal(istemOzu('İşitme kaybı var mı?'), 'İşitme kaybı var mı?', 'mektup olmayan istem aynen')
  })
  it('yanıt taslağı: tek paragraf, RAPOR_OKUNAMADI / JSON düşer, her sayılı doz yer tutucu olur, tavan 1000', () => {
    const t = yanitTaslagiTemizle('- İşitme kaybı saptanmadı;\n- odyometri ve timpanometri normal. Amoksisilin 50 mg/kg/gün önerildi.')
    assert.ok(t.ok)
    if (!t.ok) return
    assert.ok(!t.metin.includes('\n') && !t.metin.startsWith('-'))
    assert.ok(t.metin.startsWith('İşitme kaybı saptanmadı;'))
    assert.ok(!t.metin.includes('50 mg/kg') && t.metin.includes(DOZ_YER_TUTUCU))
    assert.deepEqual(yanitTaslagiTemizle(RAPOR_OKUNAMADI), { ok: false, neden: 'yetersiz' })
    assert.deepEqual(yanitTaslagiTemizle('{"ozet":"x"}'), { ok: false, neden: 'ham_json' })
    const u = yanitTaslagiTemizle('Olağan. '.repeat(300))
    assert.ok(u.ok && u.metin.length <= KONSULTASYON_SINIRLARI.yanitOzeti)
  })
})

describe('AYSE-KONSULTASYON-01 — hata yolu: form kullanılabilir kalır, hekimin yazdığı ezilmez', () => {
  it('ağ hatası, sunucu hatası ve boş yanıt → "Taslak oluşturulamadı, elle yazabilirsiniz"', async () => {
    assert.equal(TASLAK_OLUSTURULAMADI, 'Taslak oluşturulamadı, elle yazabilirsiniz.')
    const ag = await taslakIste({ islem: 'istem_taslagi' }, async () => { throw new Error('ağ yok') })
    assert.deepEqual(ag, { ok: false, mesaj: TASLAK_OLUSTURULAMADI })
    const sunucu = await taslakIste({}, async () => ({ ok: false, j: { error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' } }))
    assert.deepEqual(sunucu, { ok: false, mesaj: TASLAK_OLUSTURULAMADI }, 'ham sunucu hatası hekime gösterilmez')
    const dosyaBos = await taslakIste({}, async () => ({ ok: false, j: { ok: false, neden: 'dosya_bos', error: taslakHataMesaji('dosya_bos') } }))
    assert.deepEqual(dosyaBos, { ok: false, mesaj: taslakHataMesaji('dosya_bos'), neden: 'dosya_bos' })
    const bos = await taslakIste({}, async () => ({ ok: true, j: { ok: true, taslak: '   ' } }))
    assert.deepEqual(bos, { ok: false, mesaj: TASLAK_OLUSTURULAMADI })
    const yumusak = await taslakIste({}, async () => ({ ok: false, j: { ok: false, neden: 'deid_gerekli', error: TASLAK_OLUSTURULAMADI } }))
    assert.deepEqual(yumusak, { ok: false, mesaj: TASLAK_OLUSTURULAMADI, neden: 'deid_gerekli' })
    const iyi = await taslakIste({}, async () => ({ ok: true, j: { ok: true, taslak: 'Sayın Meslektaşım,', kaynak: { vizitSayisi: 2 } } }))
    assert.equal(iyi.ok, true)
  })
  it('her hata mesajı hekimi elle yazmaya yönlendirir', () => {
    for (const n of ['bos', 'ham_json', 'kesildi', 'yetersiz', 'ai', 'kota', 'dosya_bos', 'belge_turu', 'belge_buyuk'] as const) {
      assert.match(taslakHataMesaji(n), /elle yazabilirsiniz/i, n)
      assert.match(taslakHataMesaji(n, 'yanit'), /elle yazabilirsiniz/i, n)
    }
  })
  it('taslak yalnız boş ya da dokunulmamış son taslağın yerine uygulanır — hekimin metninin üstüne yazılmaz', () => {
    assert.equal(taslakUygulanir('', null), true)
    assert.equal(taslakUygulanir('  ', 'x'), true)
    assert.equal(taslakUygulanir('Ayşe taslağı', 'Ayşe taslağı'), true, 'branş değişti, hekim dokunmadı → yenilenir')
    assert.equal(taslakUygulanir('Ayşe taslağı + hekimin eki', 'Ayşe taslağı'), false)
    assert.equal(taslakUygulanir('Hekimin kendi metni', null), false)
  })
})
