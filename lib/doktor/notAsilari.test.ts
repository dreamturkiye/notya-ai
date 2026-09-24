/**
 * NOTYA-ASI-NOT-01 — vaccines given in a muayene reach the aşı kartı on note approval.
 *
 *   golden: "Hepatit B 2. doz aşısı bugün uygulandı; 2. ay kontrolünde DaBT-İPA-Hib 1. doz planlandı"
 *           → ONLY Hepatit B dose 2, dated the visit date
 *   approve / re-approve (unchanged, row deleted), voice-Ayşe duplicate, dose conflict, archive / unarchive,
 *   checklist "Aşı durumu". In-memory Supabase (lib/security/testing/sahteSupabase.ts), synthetic data only.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { SahteVeritabani } from '../security/testing/sahteSupabase'
import { arsivsizAsilar } from './arsiv'
import {
  dozlariTamamla,
  notAsilariniTemizle,
  notAsisiKartDurumu,
  sonrakiDozNo,
  uygulananAsiParcalari,
  uygulananAsilariSuz,
} from './notAsilari'
import { muayeneAsilariniHazirla, nottanAsiAktar, sonrakiDozTarihi, ziyaretGunu } from './notAsiAktarim'
import { cekListeDogrula, cekNotMetni, muayeneCekListesi } from './muayeneCekListesi'

const ALTIN = 'Hepatit B 2. doz aşısı bugün uygulandı; 2. ay kontrolünde DaBT-İPA-Hib 1. doz planlandı'

describe('NOTYA-ASI-NOT-01 — only vaccines given in THIS visit', () => {
  it('golden: model lists both, backstop keeps only Hepatit B dose 2', () => {
    const model = notAsilariniTemizle([{ asi_adi: 'Hep B', doz_no: 2 }, { asi_adi: 'DaBT-İPA-Hib', doz_no: 1 }])
    const sonuc = uygulananAsilariSuz(model, ALTIN)
    assert.deepEqual(sonuc.map((a) => [a.asi_adi, a.doz_no]), [['Hepatit B', 2]])
  })

  it('golden through generation: dated the visit day (backdated visit keeps its own date), no invented fields', async () => {
    const db = new SahteVeritabani()
    const sb = db.istemci() as never
    const liste = await muayeneAsilariniHazirla(sb, {
      doktorId: randomUUID(), patientId: randomUUID(), transcript: ALTIN,
      ham: [{ asi_adi: 'Hepatit B', doz_no: 2, lot_no: 'AB123', uygulama_yeri: 'sol uyluk', uygulama_tarihi: '2020-01-01' }, { asi_adi: 'DaBT-İPA-Hib', doz_no: 1 }],
      ziyaretIso: '2026-08-10T09:30:00Z',
    })
    assert.deepEqual(liste, [{ asi_adi: 'Hepatit B', doz_no: 2, uygulama_tarihi: '2026-08-10' }], 'lot / site not spoken → dropped; model date ignored')
  })

  it('planned / recommended / given-before / not-given / disease mentions never count', () => {
    const yok = [
      'Bir sonraki kontrolde KKK aşısı yapılacak.',
      'Suçiçeği aşısı önerildi.',
      'Hepatit B 1. doz doğumda yapılmış.',
      'Daha önce KPA 2 doz yapıldı.',
      'Aile hekiminde BCG yapıldı.',
      'Grip aşısı yapılmadı, ailesi istemedi.',
      'Grip benzeri yakınma ile başvurdu, ateş için parasetamol verildi.',
      '2. ay kontrolünde DaBT-İPA-Hib 1. doz planlandı.',
    ]
    for (const m of yok) assert.deepEqual(uygulananAsiParcalari(m), [], m)
  })

  it('given forms: verb-final fragments share the verb, mixed clause keeps only the given one', () => {
    const s = (m: string) => uygulananAsiParcalari(m).map((p) => [p.seri, p.doz])
    assert.deepEqual(s('Hepatit B ve KPA aşıları uygulandı.'), [['hepb', null], ['kpa', null]])
    assert.deepEqual(s('Bugün KKK 1. doz vuruldu, suçiçeği bir sonraki kontrolde yapılacak.'), [['kkk', 1]])
    assert.deepEqual(s('Hepatit B yapılmış, bugün KPA ikinci doz yapıldı'), [['kpa', 2]])
    assert.deepEqual(s('Grip aşısı verildi'), [['grip', null]])
  })

  it('a dose the transcript does not state is dropped by the backstop (it will be computed)', () => {
    const r = uygulananAsilariSuz(notAsilariniTemizle([{ asi_adi: 'Hepatit B', doz_no: 3 }]), 'Hepatit B aşısı bugün yapıldı.')
    assert.deepEqual(r.map((a) => a.doz_no), [null])
  })

  it('dose not spoken → next in series from the card, flagged doz_hesaplandi', async () => {
    const db = new SahteVeritabani()
    const d = randomUUID(), p = randomUUID()
    db.ekle('asilar', { doktor_id: d, patient_id: p, asi_adi: 'Hepatit B', doz_no: 1, uygulama_tarihi: '2026-07-01', kaynak: 'kayit', kaynak_note_id: null })
    const liste = await muayeneAsilariniHazirla(db.istemci() as never, { doktorId: d, patientId: p, transcript: 'Hepatit B aşısı bugün yapıldı.', ham: [{ asi_adi: 'Hepatit B' }], ziyaretIso: '2026-08-10T09:00:00Z' })
    assert.deepEqual(liste, [{ asi_adi: 'Hepatit B', doz_no: 2, uygulama_tarihi: '2026-08-10', doz_hesaplandi: true }])
    assert.equal(sonrakiDozNo('Hep B', [{ asi_adi: 'Hepatit B', doz_no: null, uygulama_tarihi: null }, { asi_adi: 'Hepatit B', doz_no: null, uygulama_tarihi: null }]), 3)
    assert.deepEqual(dozlariTamamla([{ asi_adi: 'KKK', doz_no: 1, uygulama_tarihi: null }], []), [{ asi_adi: 'KKK', doz_no: 1, uygulama_tarihi: null }], 'a stated dose is left alone')
  })

  it('card match rules: duplicate / conflict / new', () => {
    const a = { asi_adi: 'Hepatit B', doz_no: 2, uygulama_tarihi: '2026-09-23' }
    assert.equal(notAsisiKartDurumu(a, [{ asi_adi: 'Hep B', doz_no: null, uygulama_tarihi: '2026-09-23' }]).tur, 'kartta_var')
    const c1 = notAsisiKartDurumu(a, [{ asi_adi: 'Hepatit B', doz_no: 2, uygulama_tarihi: '2026-07-01' }])
    assert.equal(c1.tur, 'catisma')
    assert.equal(c1.tur === 'catisma' && c1.mesaj, 'Bu hastada Hepatit B 2. doz zaten kayıtlı (01.07.2026)')
    assert.equal(notAsisiKartDurumu(a, [{ asi_adi: 'Hepatit B', doz_no: 1, uygulama_tarihi: '2026-09-23' }]).tur, 'catisma')
    assert.equal(notAsisiKartDurumu(a, [{ asi_adi: 'Hepatit B', doz_no: 1, uygulama_tarihi: '2026-07-01' }, { asi_adi: 'KKK', doz_no: 2, uygulama_tarihi: '2026-09-23' }]).tur, 'yeni')
  })

  it('sonraki_doz_tarihi comes from the national schedule engine for a child', () => {
    const t = sonrakiDozTarihi('2026-05-01', { asi_adi: 'Hepatit B', doz_no: 2, uygulama_tarihi: '2026-06-01' }, [{ asi_adi: 'Hepatit B', doz_no: 1, uygulama_tarihi: '2026-05-01' }])
    assert.ok(t && t > '2026-06-01', String(t))
    assert.equal(sonrakiDozTarihi(null, { asi_adi: 'Hepatit B', doz_no: 2, uygulama_tarihi: '2026-06-01' }, []), null, 'no birth date → not guessed')
    assert.equal(sonrakiDozTarihi('2026-05-01', { asi_adi: 'Kuduz', doz_no: 1, uygulama_tarihi: '2026-06-01' }, []), null, 'off-schedule → not guessed')
  })
})

describe('NOTYA-ASI-NOT-01 — approval sync (nottanAsiAktar)', () => {
  function kur() {
    const db = new SahteVeritabani()
    const d = randomUUID(), p = randomUUID()
    const seans = db.ekle('sessions', { doctor_id: d, patient_id: p, archived_at: null })
    const not = db.ekle('notes', { session_id: seans.id, doctor_id: d, created_at: '2026-09-23T08:00:00Z' })
    const sb = db.istemci() as never
    const aktar = (asilar: unknown) => nottanAsiAktar(sb, { noteId: not.id, doctorId: d, patientId: p, asilar, notTarihi: '2026-09-23T08:00:00Z', dogumIso: '2026-07-20' })
    const satirlar = () => db.tablo('asilar').filter((x) => x.patient_id === p)
    return { db, sb, d, p, seans, not, aktar, satirlar }
  }
  const HEPB2 = [{ asi_adi: 'Hepatit B', doz_no: 2, uygulama_tarihi: '2026-09-23' }]

  it('first approval writes the row: kayit, hekim onaylı, pediatrik, kaynak_note_id, next dose date', async () => {
    const { aktar, satirlar, not, d, p } = kur()
    const r = await aktar(HEPB2)
    assert.equal(r.hata, null)
    assert.equal(r.yazilan, 1)
    const [s] = satirlar()
    assert.equal(s.asi_adi, 'Hepatit B')
    assert.equal(s.doz_no, 2)
    assert.equal(s.uygulama_tarihi, '2026-09-23')
    assert.equal(s.kaynak, 'kayit')
    assert.equal(s.kategori, 'pediatrik')
    assert.equal(s.kaynak_note_id, not.id)
    assert.equal(s.doktor_id, d)
    assert.equal(s.patient_id, p)
    assert.ok(s.hekim_onay_at)
    assert.ok(String(s.sonraki_doz_tarihi) > '2026-09-23', String(s.sonraki_doz_tarihi))
  })

  it('re-approve unchanged → no duplicate; re-approve with the row deleted → row removed', async () => {
    const { aktar, satirlar } = kur()
    await aktar(HEPB2)
    const r2 = await aktar(HEPB2)
    assert.deepEqual([r2.yazilan, r2.guncellenen, r2.silinen], [0, 1, 0])
    assert.equal(satirlar().length, 1)
    const r3 = await aktar([])
    assert.equal(r3.silinen, 1)
    assert.equal(satirlar().length, 0)
  })

  it('re-approve with an edited dose updates the same row', async () => {
    const { aktar, satirlar } = kur()
    await aktar(HEPB2)
    const id = satirlar()[0].id
    await aktar([{ ...HEPB2[0], doz_no: 3 }])
    assert.equal(satirlar().length, 1)
    assert.equal(satirlar()[0].id, id)
    assert.equal(satirlar()[0].doz_no, 3)
  })

  it('identical row already written by voice Ayşe → no second row; that row is never touched', async () => {
    const { db, aktar, satirlar, d, p } = kur()
    const ses = db.ekle('asilar', { doktor_id: d, patient_id: p, asi_adi: 'Hepatit B', doz_no: 2, uygulama_tarihi: '2026-09-23', kaynak: 'kayit', kaynak_note_id: null, notlar: 'sesli' })
    const once = JSON.stringify(ses)
    const r = await aktar(HEPB2)
    assert.equal(r.yazilan, 0)
    assert.deepEqual(r.karttaVar, [{ asi_adi: 'Hepatit B', doz_no: 2 }])
    assert.equal(satirlar().length, 1)
    assert.equal(JSON.stringify(satirlar()[0]), once)
  })

  it('conflicting dose on the card → warning, not written; written once the doctor fixes the dose', async () => {
    const { db, aktar, satirlar, d, p } = kur()
    db.ekle('asilar', { doktor_id: d, patient_id: p, asi_adi: 'Hepatit B', doz_no: 2, uygulama_tarihi: '2026-08-20', kaynak: 'beyan', kaynak_note_id: null })
    const r = await aktar(HEPB2)
    assert.equal(r.yazilan, 0)
    assert.deepEqual(r.catisma.map((c) => c.mesaj), ['Bu hastada Hepatit B 2. doz zaten kayıtlı (20.08.2026)'])
    assert.equal(satirlar().length, 1)
    const r2 = await aktar([{ ...HEPB2[0], doz_no: 3 }])
    assert.equal(r2.yazilan, 1)
    assert.equal(satirlar().length, 2)
  })

  it('archived note → its vaccine is hidden on every read; unarchive → back (rows untouched)', async () => {
    const { db, sb, aktar, d, p, seans } = kur()
    db.ekle('asilar', { doktor_id: d, patient_id: p, asi_adi: 'KKK', doz_no: 1, uygulama_tarihi: '2025-01-01', kaynak: 'kayit', kaynak_note_id: null })
    await aktar(HEPB2)
    const gorunen = async () => (((await arsivsizAsilar(sb, 'asi_adi').eq('doktor_id', d).eq('patient_id', p)).data || []) as { asi_adi: string }[]).map((x) => x.asi_adi).sort()
    assert.deepEqual(await gorunen(), ['Hepatit B', 'KKK'])
    const once = JSON.stringify(db.tablo('asilar'))
    db.tablo('sessions').find((s) => s.id === seans.id)!.archived_at = '2026-09-23T12:00:00Z'
    assert.deepEqual(await gorunen(), ['KKK'])
    const { count } = await arsivsizAsilar(sb, 'id', { count: 'exact', head: true }).eq('doktor_id', d).eq('patient_id', p)
    assert.equal(count, 1)
    assert.equal(JSON.stringify(db.tablo('asilar')), once)
    db.tablo('sessions').find((s) => s.id === seans.id)!.archived_at = null
    assert.deepEqual(await gorunen(), ['Hepatit B', 'KKK'])
  })

  it('a row hidden by an archived duplicate note is re-claimed, not doubled', async () => {
    const { db, aktar, satirlar, d, p } = kur()
    const eskiSeans = db.ekle('sessions', { doctor_id: d, patient_id: p, archived_at: '2026-09-23T10:00:00Z' })
    const eskiNot = db.ekle('notes', { session_id: eskiSeans.id, doctor_id: d })
    db.ekle('asilar', { doktor_id: d, patient_id: p, asi_adi: 'Hepatit B', doz_no: 2, uygulama_tarihi: '2026-09-23', kaynak: 'kayit', kaynak_note_id: eskiNot.id })
    const r = await aktar(HEPB2)
    assert.equal(r.yazilan, 0)
    assert.equal(r.guncellenen, 1)
    assert.equal(satirlar().length, 1)
  })
})

describe('NOTYA-ASI-NOT-01 — checklist "Aşı durumu"', () => {
  it('a vaccine entered in this note satisfies the item', () => {
    const maddeler = muayeneCekListesi({ seansBransi: 'pediatri', hastaDogumIso: '2026-07-20', referansIso: '2026-09-23T08:00:00Z' })
    assert.ok(maddeler.some((m) => m.id === 'asi'))
    const durum = (asilar: unknown) => cekListeDogrula(maddeler, { soap: cekNotMetni({ subjektif: 'Şikayet: sağlam çocuk kontrolü', asilar }) }).find((s) => s.id === 'asi')!.durum
    assert.equal(durum([]), 'eksik')
    assert.equal(durum(HEPB), 'dosyada')
  })
  const HEPB = [{ asi_adi: 'Hepatit B', doz_no: 2, uygulama_tarihi: '2026-09-23' }]
})

describe('ziyaretGunu', () => {
  it('Europe/Istanbul calendar day', () => {
    assert.equal(ziyaretGunu('2026-09-22T22:30:00Z'), '2026-09-23')
  })
})
