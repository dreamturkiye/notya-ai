/**
 * NOTYA-ILAC-SONLANDIR-01 (Kaan / Dr. Gökhan, 2026-09-25) — onaylanan not bir ilacı kesiyorsa İlaçlar
 * listesinde sonlandırılır. Türkçe ifadeler, olumsuzluk, koşul, marka/etken madde, aynı notta yeniden
 * yazılan ilaç, başka hastanın ilacı, Geri al.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { SahteVeritabani } from '../security/testing/sahteSupabase'
import {
  adKelimeleri, cumleSiniflandir, durdurmaOnKontrol, gerekceyiKaldir, ilacHukmu, notunKestigiIlaclariCikar,
  oneriGecerliMi, sonlandirmaGerekcesi, sonlandirmaMesaji, SONLANDIRMA_ONEKI,
} from './ilacSonlandirMetin'
import { ilacSonlandirmaGeriAl, modelYanitiniCoz, notMetniDerle, nottanIlacSonlandir, SONLANDIRMA_SISTEM } from './ilacSonlandir'
import { ILAC_UYUM_ISTEK } from './receteAktarim'

const KLACID = adKelimeleri('Klacid süspansiyon')
const CALPOL = adKelimeleri('Calpol şurup')

describe('Türkçe kesme ifadeleri → sonlandır', () => {
  const vakalar: [string, string[]][] = [
    ['Klacid süspansiyon ve Calpol şurubu keselim.', KLACID],
    ['Klacid süspansiyon ve Calpol şurubu keselim.', CALPOL],
    ['Klacid kesildi.', KLACID],
    ["Klacid'i iptal edildi.", KLACID],
    ['Klacid tedavisini sonlandırıyoruz.', KLACID],
    ['Klacid artık vermiyoruz.', KLACID],
    ["Calpol'ü vermeyelim.", CALPOL],
    ['Klacid bıraksın.', KLACID],
    ['Klacid kullanmasın.', KLACID],
    ['Klacid devam etmesin.', KLACID],
    ['Klacid yerine Augmentin başlandı.', KLACID],
    ['Klacid, Calpol ve Ventolin kesildi.', KLACID],
    ['KLACİD SÜSPANSİYON KESİLDİ', KLACID],
    ['Klacid 2.5 ml kesildi.', KLACID],
  ]
  for (const [metin, k] of vakalar) it(`"${metin}" → dur (${k.join(',')})`, () => assert.equal(ilacHukmu(metin, k), 'dur'))
})

describe('olumsuzluk ve devam → dokunma', () => {
  const vakalar: [string, string[]][] = [
    ["Klacid'i kesmeyelim.", KLACID],
    ['Klacid devam etsin.', KLACID],
    ['Klacid değiştirmeyelim.', KLACID],
    ['Klacid kesilmesin.', KLACID],
    ["Klacid kesildi, Calpol'e devam.", CALPOL],
    ['Klacid yerine Augmentin başlandı.', adKelimeleri('Augmentin')],
    ['Klacid kesilebilir.', KLACID],
  ]
  for (const [metin, k] of vakalar) it(`"${metin}" → dur değil`, () => assert.notEqual(ilacHukmu(metin, k), 'dur'))
  it('aynı cümlede kesme + devam → belirsiz', () => assert.equal(cumleSiniflandir('Klacid keselim veya devam edelim'), 'belirsiz'))
  it('cümle sınırı aşılmaz: "Calpol 3x1. Klacid kesildi." Calpol\'ü kesmez', () => assert.equal(ilacHukmu('Calpol 3x1. Klacid kesildi.', CALPOL), null))
})

describe('koşul / erteleme → otomatik kesme yok', () => {
  for (const metin of ['Ateş düşerse Calpol keselim.', 'Calpol 3 gün sonra keselim.', 'Gerekirse Calpol kesilsin.', 'Kontrolde Calpol keselim.', 'Ateş yoksa Calpol kesilsin.'])
    it(`"${metin}" → kosullu`, () => assert.equal(ilacHukmu(metin, CALPOL), 'kosullu'))
})

describe('ön kontrol (modele gitmeden)', () => {
  const aktif = [{ ilac_adi: 'Klacid süspansiyon', etken_madde: 'Klaritromisin' }]
  it('kesme fiili + kayıtlı ad → evet', () => assert.equal(durdurmaOnKontrol('Plan:\nKlacid keselim.', aktif), true))
  it('kesme fiili yok → hayır (model çağrılmaz)', () => assert.equal(durdurmaOnKontrol('Klacid 2x1 devam, kontrol 1 hafta sonra.', aktif), false))
  it('kesme fiili var ama ilaç adı yok → hayır', () => assert.equal(durdurmaOnKontrol('Şekerli gıdalar kesilsin.', aktif), false))
  it('yalnız koşullu kesme → hayır', () => assert.equal(durdurmaOnKontrol('Ateş düşerse Klacid keselim.', aktif), false))
  it('marka kayıtlı değil ama bilinen marka (Calpol ↔ Parasetamol) → evet', () =>
    assert.equal(durdurmaOnKontrol('Calpol şurubu keselim.', [{ ilac_adi: 'Parasetamol', etken_madde: null }], (t) => t === 'calpol'), true))
  it('aktif ilaç yoksa → hayır', () => assert.equal(durdurmaOnKontrol('Klacid keselim.', []), false))
})

describe('model önerisinin doğrulanması', () => {
  const not = 'Plan:\nKlacid süspansiyon ve Calpol şurubu keselim. Ventolin devam etsin.'
  it('alıntı notta + ad alıntıda + hüküm dur → geçerli', () =>
    assert.equal(oneriGecerliMi({ notAdi: 'Klacid süspansiyon', alinti: 'Klacid süspansiyon ve Calpol şurubu keselim' }, { ilac_adi: 'Klacid', etken_madde: null }, not), true))
  it('marka/etken: notta Calpol, satırda Parasetamol → geçerli', () =>
    assert.equal(oneriGecerliMi({ notAdi: 'Calpol', alinti: 'Calpol şurubu keselim' }, { ilac_adi: 'Parasetamol', etken_madde: null }, not), true))
  it('uydurma alıntı → geçersiz', () =>
    assert.equal(oneriGecerliMi({ notAdi: 'Ventolin', alinti: 'Ventolin kesildi' }, { ilac_adi: 'Ventolin', etken_madde: null }, not), false))
  it('devam eden ilaç için alıntı → geçersiz', () =>
    assert.equal(oneriGecerliMi({ notAdi: 'Ventolin', alinti: 'Ventolin devam etsin' }, { ilac_adi: 'Ventolin', etken_madde: null }, not), false))
  it('JSON çözümü: kod bloğu, bozuk, eksik alan', () => {
    assert.deepEqual(modelYanitiniCoz('```json\n{"sonlandir":[{"id":"a","notAdi":"Klacid","alinti":"Klacid kesildi"}]}\n```'), [{ id: 'a', notAdi: 'Klacid', alinti: 'Klacid kesildi' }])
    assert.deepEqual(modelYanitiniCoz('bilmiyorum'), [])
    assert.deepEqual(modelYanitiniCoz('{"sonlandir":[{"id":"a"}]}'), [])
  })
})

describe('metinler', () => {
  it('bildirim: "Klacid süspansiyon ve Calpol şurup ilaç listesinden sonlandırıldı."', () => {
    assert.equal(sonlandirmaMesaji(['Klacid süspansiyon', 'Calpol şurup']), 'Klacid süspansiyon ve Calpol şurup ilaç listesinden sonlandırıldı.')
    assert.equal(sonlandirmaMesaji(['A', 'B', 'C']), 'A, B ve C ilaç listesinden sonlandırıldı.')
    assert.equal(sonlandirmaMesaji([]), '')
  })
  it('gerekçe ve Geri al gidiş-dönüş', () => {
    const g = sonlandirmaGerekcesi('Klacid "süspansiyon" keselim', 'Süre: 7 gün')
    assert.equal(g, `${SONLANDIRMA_ONEKI}: “Klacid 'süspansiyon' keselim” · Süre: 7 gün`)
    assert.equal(gerekceyiKaldir(g), 'Süre: 7 gün')
    assert.equal(gerekceyiKaldir(sonlandirmaGerekcesi('Klacid keselim', null)), '')
    assert.equal(gerekceyiKaldir('Hekimin kendi notu'), null)
  })
  it('modele kimlik verisi gitmez: not metni yalnız klinik bölümler', () => {
    const m = notMetniDerle({ content_plan: 'Klacid keselim.', content_subjektif: 'Öksürük' })
    assert.ok(m.includes('Plan:\nKlacid keselim.') && m.includes('Subjektif:\nÖksürük'))
    assert.ok(SONLANDIRMA_SISTEM.includes('Emin değilsen KESME'))
  })
})

describe('İlaç uyum kartı notun kestiği ilacı geri eklemez', () => {
  it('Plan\'ın kestiği ilaç öneriden düşer, yenisi kalır', () => {
    const plan = '1. TEDAVİ: Klacid süspansiyon keselim. Augmentin ES 2x5 ml 10 gün başlandı.'
    const oneri = [{ ad: 'Klacid süspansiyon' }, { ad: 'Augmentin ES' }]
    assert.deepEqual(notunKestigiIlaclariCikar(oneri, plan).map((x) => x.ad), ['Augmentin ES'])
  })
  it('koşullu kesme öneride kalır', () =>
    assert.equal(notunKestigiIlaclariCikar([{ ad: 'Calpol' }], 'Ateş düşerse Calpol keselim.').length, 1))
  it('Ayşe isteği de kesilen ilacı listeye koymamasını söyler', () => assert.ok(ILAC_UYUM_ISTEK.includes('kesilen')))
})

// ─── Veritabanı akışı (sahte Supabase + sahte model) ─────────────────────────────────────────────
function sahne() {
  const db = new SahteVeritabani()
  const d = randomUUID(), d2 = randomUUID(), p = randomUUID(), p2 = randomUUID(), noteId = randomUUID()
  const eskiSeans = db.ekle('sessions', { doctor_id: d, patient_id: p, archived_at: null }).id
  const eskiNot = db.ekle('notes', { doctor_id: d, session_id: eskiSeans }).id
  const arsivSeans = db.ekle('sessions', { doctor_id: d, patient_id: p, archived_at: new Date().toISOString() }).id
  const arsivNot = db.ekle('notes', { doctor_id: d, session_id: arsivSeans }).id
  const satir = (o: Record<string, unknown>) => db.ekle('hasta_ilaclar', { doctor_id: d, patient_id: p, aktif: true, onay_durumu: 'onayli', bitis_tarihi: null, notlar: null, etken_madde: null, kaynak_note_id: eskiNot, ...o }).id
  const klacid = satir({ ilac_adi: 'Klacid süspansiyon', etken_madde: 'Klaritromisin', notlar: 'Süre: 7 gün' })
  const parasetamol = satir({ ilac_adi: 'Parasetamol', kaynak_note_id: null })
  const ventolin = satir({ ilac_adi: 'Ventolin nebül' })
  const baskaHasta = satir({ ilac_adi: 'Klacid süspansiyon', patient_id: p2 })
  const baskaHekim = satir({ ilac_adi: 'Klacid süspansiyon', doctor_id: d2 })
  const arsivde = satir({ ilac_adi: 'Klacid süspansiyon', kaynak_note_id: arsivNot })
  return { db, sb: db.istemci() as never, d, d2, p, p2, noteId, klacid, parasetamol, ventolin, baskaHasta, baskaHekim, arsivde }
}

/** Sahte model: verilen yanıtı döndürür, kaç kez çağrıldığını ve ne gönderildiğini tutar. */
function model(yanit: unknown) {
  const giden: string[] = []
  return {
    giden,
    istemci: { messages: { create: async (g: never) => { giden.push(JSON.stringify(g)); return { content: [{ type: 'text', text: typeof yanit === 'string' ? yanit : JSON.stringify(yanit) }] } } } },
  }
}

const satirBul = (db: SahteVeritabani, id: string) => db.tablo('hasta_ilaclar').find((x) => x.id === id)!

describe('nottanIlacSonlandir (onayda)', () => {
  it('Klacid + Calpol (Parasetamol satırı) sonlanır; Ventolin ve başka hasta/hekim satırları dokunulmaz', async () => {
    const s = sahne()
    const m = model({ sonlandir: [
      { id: s.klacid, notAdi: 'Klacid süspansiyon', alinti: 'Klacid süspansiyon ve Calpol şurubu keselim' },
      { id: s.parasetamol, notAdi: 'Calpol', alinti: 'Calpol şurubu keselim' },
      { id: s.baskaHasta, notAdi: 'Klacid süspansiyon', alinti: 'Klacid süspansiyon ve Calpol şurubu keselim' },
      { id: s.baskaHekim, notAdi: 'Klacid süspansiyon', alinti: 'Klacid süspansiyon ve Calpol şurubu keselim' },
      { id: s.arsivde, notAdi: 'Klacid süspansiyon', alinti: 'Klacid süspansiyon ve Calpol şurubu keselim' },
      { id: s.ventolin, notAdi: 'Ventolin', alinti: 'Ventolin devam etsin' },
    ] })
    const r = await nottanIlacSonlandir(s.sb, {
      noteId: s.noteId, doctorId: s.d, patientId: s.p, istemci: m.istemci, markaMi: (t) => t === 'calpol',
      not: { content_plan: 'Klacid süspansiyon ve Calpol şurubu keselim. Ventolin devam etsin.', content_ilaclar: [] },
    })
    assert.equal(r.hata, null)
    assert.deepEqual(r.sonlandirilan.map((x) => x.id).sort(), [s.klacid, s.parasetamol].sort())
    assert.equal(r.mesaj, 'Klacid süspansiyon ve Parasetamol ilaç listesinden sonlandırıldı.')
    const k = satirBul(s.db, s.klacid)
    assert.equal(k.aktif, false)
    assert.match(String(k.bitis_tarihi), /^\d{4}-\d{2}-\d{2}$/)
    assert.equal(k.notlar, `${SONLANDIRMA_ONEKI}: “Klacid süspansiyon ve Calpol şurubu keselim” · Süre: 7 gün`)
    assert.equal(satirBul(s.db, s.ventolin).aktif, true)
    assert.equal(satirBul(s.db, s.baskaHasta).aktif, true, 'başka hastanın ilacı')
    assert.equal(satirBul(s.db, s.baskaHekim).aktif, true, 'başka hekimin ilacı')
    assert.equal(satirBul(s.db, s.arsivde).aktif, true, 'arşivlenmiş muayenenin (listede görünmeyen) ilacı')
    // Modele yalnız bu hekimin bu hastadaki ilaçları gitti.
    assert.equal(m.giden.length, 1)
    assert.ok(!m.giden[0].includes(s.baskaHasta) && !m.giden[0].includes(s.baskaHekim))
    assert.ok(m.giden[0].includes('"temperature":0'))
    // Denetim: onaylayan hekim, not, alıntı, önceki hal.
    const den = s.db.tablo('ilac_sonlandirmalari')
    assert.equal(den.length, 2)
    const kd = den.find((x) => x.ilac_id === s.klacid)!
    assert.equal(kd.doctor_id, s.d)
    assert.equal(kd.note_id, s.noteId)
    assert.deepEqual(kd.onceki, { aktif: true, bitis_tarihi: null, notlar: 'Süre: 7 gün' })
  })

  it('kesme fiili yoksa model hiç çağrılmaz', async () => {
    const s = sahne()
    const m = model({ sonlandir: [{ id: s.klacid, notAdi: 'Klacid', alinti: 'Klacid 2x1' }] })
    const r = await nottanIlacSonlandir(s.sb, { noteId: s.noteId, doctorId: s.d, patientId: s.p, istemci: m.istemci, markaMi: () => false, not: { content_plan: 'Klacid 2x1 devam.' } })
    assert.equal(m.giden.length, 0)
    assert.deepEqual(r.sonlandirilan, [])
    assert.equal(satirBul(s.db, s.klacid).aktif, true)
  })

  it('olumsuzluk ve koşul: model yanlışlıkla "kes" dese bile satır aktif kalır', async () => {
    const s = sahne()
    const not = "Ventolin nebül kesildi. Klacid'i kesmeyelim. Ateş düşerse Calpol keselim. Klacid 3 gün sonra keselim."
    const m = model({ sonlandir: [
      { id: s.ventolin, notAdi: 'Ventolin nebül', alinti: 'Ventolin nebül kesildi' },
      { id: s.klacid, notAdi: 'Klacid', alinti: "Klacid'i kesmeyelim" },
      { id: s.parasetamol, notAdi: 'Calpol', alinti: 'Ateş düşerse Calpol keselim' },
      { id: s.klacid, notAdi: 'Klacid', alinti: 'Klacid 3 gün sonra keselim' },
    ] })
    const r = await nottanIlacSonlandir(s.sb, { noteId: s.noteId, doctorId: s.d, patientId: s.p, istemci: m.istemci, markaMi: (t) => t === 'calpol', not: { content_plan: not } })
    assert.equal(m.giden.length, 1, 'ön kontrol Ventolin için modele gitmeli')
    assert.deepEqual(r.sonlandirilan.map((x) => x.id), [s.ventolin])
    for (const id of [s.klacid, s.parasetamol]) assert.equal(satirBul(s.db, id).aktif, true)
  })

  it('aynı notun İlaçlar listesinde yeniden yazılan ilaç asla kesilmez (ad ya da etken madde)', async () => {
    const s = sahne()
    const m = model({ sonlandir: [
      { id: s.klacid, notAdi: 'Klacid', alinti: 'Klacid kesildi' },
      { id: s.parasetamol, notAdi: 'Calpol', alinti: 'Calpol kesildi' },
    ] })
    const r = await nottanIlacSonlandir(s.sb, {
      noteId: s.noteId, doctorId: s.d, patientId: s.p, istemci: m.istemci, markaMi: (t) => t === 'calpol',
      not: {
        content_plan: 'Klacid kesildi, Calpol kesildi.',
        content_ilaclar: [{ ad: 'Klacid süspansiyon 250 mg', doz: '5 ml', kullanim: '2x1', sure: '7 gün' }, { ad: 'Calpol', doz: '5 ml', kullanim: '3x1', sure: '' }],
        recete_onerisi: [{ ticariOrnek: 'Calpol 120 mg/5 ml', etkenMadde: 'Parasetamol' }],
      },
    })
    assert.deepEqual(r.sonlandirilan, [])
    assert.equal(satirBul(s.db, s.klacid).aktif, true)
    assert.equal(satirBul(s.db, s.parasetamol).aktif, true)
  })

  it('başka markayla yeniden yazılan ilaç kesilmez (Parasetamol satırı, notta "Calpol kesildi, yerine Parol")', async () => {
    const s = sahne()
    const m = model({ sonlandir: [{ id: s.parasetamol, notAdi: 'Calpol', alinti: 'Calpol kesildi' }] })
    const r = await nottanIlacSonlandir(s.sb, {
      noteId: s.noteId, doctorId: s.d, patientId: s.p, istemci: m.istemci, markaMi: (t) => t === 'calpol',
      etkenBul: (ad) => (/^parol/i.test(ad) ? ['Parasetamol'] : []),
      not: { content_plan: 'Calpol kesildi, yerine Parol 5 ml başlandı.', content_ilaclar: [{ ad: 'Parol', doz: '5 ml', kullanim: '3x1', sure: '' }] },
    })
    assert.deepEqual(r.sonlandirilan, [])
    assert.equal(satirBul(s.db, s.parasetamol).aktif, true)
  })

  it('kombinasyon başka ilaçtır: "Amoksisilin yerine Augmentin" amoksisilin satırını sonlandırır', async () => {
    const s = sahne()
    const amok = s.db.ekle('hasta_ilaclar', { doctor_id: s.d, patient_id: s.p, ilac_adi: 'Amoksisilin', etken_madde: null, aktif: true, kaynak_note_id: null, notlar: null, bitis_tarihi: null }).id
    const m = model({ sonlandir: [{ id: amok, notAdi: 'Amoksisilin', alinti: 'Amoksisilin yerine Augmentin ES başlandı' }] })
    const r = await nottanIlacSonlandir(s.sb, {
      noteId: s.noteId, doctorId: s.d, patientId: s.p, istemci: m.istemci, markaMi: () => false,
      etkenBul: (ad) => (/^augmentin/i.test(ad) ? ['Amoksisilin/klavulanik asit'] : []),
      not: { content_plan: 'Amoksisilin yerine Augmentin ES başlandı.', content_ilaclar: [{ ad: 'Augmentin ES', doz: '5 ml', kullanim: '2x1', sure: '10 gün' }] },
    })
    assert.deepEqual(r.sonlandirilan.map((x) => x.id), [amok])
  })

  it('bu notun kendi yazdığı satır aday değildir', async () => {
    const s = sahne()
    satirBul(s.db, s.klacid).kaynak_note_id = s.noteId
    const m = model({ sonlandir: [{ id: s.klacid, notAdi: 'Klacid', alinti: 'Klacid kesildi' }] })
    const r = await nottanIlacSonlandir(s.sb, { noteId: s.noteId, doctorId: s.d, patientId: s.p, istemci: m.istemci, markaMi: () => false, not: { content_plan: 'Klacid kesildi.' } })
    assert.deepEqual(r.sonlandirilan, [])
    assert.equal(satirBul(s.db, s.klacid).aktif, true)
  })

  it('model hatası onayı bloklamaz: hata döner, hiçbir satır değişmez', async () => {
    const s = sahne()
    const istemci = { messages: { create: async () => { throw new Error('529 overloaded') } } }
    const r = await nottanIlacSonlandir(s.sb, { noteId: s.noteId, doctorId: s.d, patientId: s.p, istemci, markaMi: () => false, not: { content_plan: 'Klacid kesildi.' } })
    assert.ok(r.hata && r.hata.includes('529'))
    assert.equal(satirBul(s.db, s.klacid).aktif, true)
  })

  it('başka hastanın ilaç kimliğini döndüren model hiçbir şey değiştiremez', async () => {
    const s = sahne()
    const m = model({ sonlandir: [{ id: s.baskaHasta, notAdi: 'Klacid', alinti: 'Klacid kesildi' }] })
    const r = await nottanIlacSonlandir(s.sb, { noteId: s.noteId, doctorId: s.d, patientId: s.p, istemci: m.istemci, markaMi: () => false, not: { content_plan: 'Klacid kesildi.' } })
    assert.deepEqual(r.sonlandirilan, [])
    assert.equal(satirBul(s.db, s.baskaHasta).aktif, true)
    assert.equal(satirBul(s.db, s.klacid).aktif, true)
  })
})

describe('Geri al', () => {
  async function kesilmis() {
    const s = sahne()
    const m = model({ sonlandir: [{ id: s.klacid, notAdi: 'Klacid', alinti: 'Klacid kesildi' }] })
    const not = { content_plan: 'Klacid kesildi.' }
    await nottanIlacSonlandir(s.sb, { noteId: s.noteId, doctorId: s.d, patientId: s.p, istemci: m.istemci, markaMi: () => false, not })
    assert.equal(satirBul(s.db, s.klacid).aktif, false)
    return { ...s, m, not }
  }

  it('tam olarak o satırı eski haline döndürür ve loglar', async () => {
    const s = await kesilmis()
    const r = await ilacSonlandirmaGeriAl(s.sb, { noteId: s.noteId, doctorId: s.d, patientId: s.p, ilacIds: [s.klacid, s.ventolin] })
    assert.deepEqual(r, { geriAlinan: [s.klacid], hata: null })
    const k = satirBul(s.db, s.klacid)
    assert.equal(k.aktif, true)
    assert.equal(k.bitis_tarihi, null)
    assert.equal(k.notlar, 'Süre: 7 gün')
    const den = s.db.tablo('ilac_sonlandirmalari')[0]
    assert.ok(den.geri_alindi_at)
    assert.equal(den.geri_alan, s.d)
  })

  it('geri alınan satır aynı notun yeniden onayında tekrar kesilmez', async () => {
    const s = await kesilmis()
    await ilacSonlandirmaGeriAl(s.sb, { noteId: s.noteId, doctorId: s.d, patientId: s.p, ilacIds: [s.klacid] })
    const r = await nottanIlacSonlandir(s.sb, { noteId: s.noteId, doctorId: s.d, patientId: s.p, istemci: s.m.istemci, markaMi: () => false, not: s.not })
    assert.deepEqual(r.sonlandirilan, [])
    assert.equal(satirBul(s.db, s.klacid).aktif, true)
  })

  it('denetim tablosu yoksa (migration uygulanmadı) gerekçe öneki kaldırılarak geri alınır', async () => {
    const s = await kesilmis()
    s.db.tablolar.delete('ilac_sonlandirmalari')
    const r = await ilacSonlandirmaGeriAl(s.sb, { noteId: s.noteId, doctorId: s.d, patientId: s.p, ilacIds: [s.klacid] })
    assert.deepEqual(r.geriAlinan, [s.klacid])
    assert.equal(satirBul(s.db, s.klacid).notlar, 'Süre: 7 gün')
    assert.equal(satirBul(s.db, s.klacid).aktif, true)
  })

  it('hekimin elle sonlandırdığı satır ve başka hekimin satırı geri alınmaz', async () => {
    const s = sahne()
    const elle = s.db.ekle('hasta_ilaclar', { doctor_id: s.d, patient_id: s.p, ilac_adi: 'Majezik', aktif: false, notlar: 'Kür bitti' }).id
    satirBul(s.db, s.baskaHekim).aktif = false
    satirBul(s.db, s.baskaHekim).notlar = sonlandirmaGerekcesi('Klacid kesildi', null)
    const r = await ilacSonlandirmaGeriAl(s.sb, { noteId: s.noteId, doctorId: s.d, patientId: s.p, ilacIds: [elle, s.baskaHekim] })
    assert.deepEqual(r.geriAlinan, [])
    assert.equal(satirBul(s.db, elle).aktif, false)
    assert.equal(satirBul(s.db, s.baskaHekim).aktif, false)
  })
})
