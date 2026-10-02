/**
 * NOTYA-FORM-KART-01 — form answers on the patient card, and Ayşe's "belgelerde var ama dosyada kayıtlı değil" offer.
 *
 * Found on a test chart: the patient page showed "Alerjiler: Bilinen alerjisi yok" while Ayşe offered a bulk card for
 * allergy information "not on file". The offer (core/eylemler/bosluk.ts, Danış panel) asked `alerjiListe`, which
 * drops the explicit negative, and scanned the dossier's own card / form labels for the word "alerji".
 *
 * 1. The condition, pure: what counts as a recorded allergy statement; what the document scan reads.
 * 2. The real /api/doktor/konsult handler on the fake database: card has it, form has it, only documents have it,
 *    nothing anywhere.
 * 3. The form → card transfer at submission (lib/intake/hastaKaydinaAktar.ts): what is written, fill-only, scoping.
 *
 * Synthetic QA data only.
 */
import { ortam, sahneHazirla, sahneKur, hastaEkle, panel, sistemde, sonModelIstegi, encrypt, type Sahne } from './tests/ayseSahne'
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { bosluklariBul, belgeVeNotMetni } from '@/core/eylemler/bosluk'
import { alerjiBeyaniKayitliMi, formAlerjiBeyani, notAlanlariCoz } from '@/lib/doktor/hastaKayitAlanlari'

before(async () => { await sahneHazirla() })

describe('kayıtlı alerji beyanı — koşul', () => {
  it('formun alerji cevabı: var / yok / boş', () => {
    assert.deepEqual(formAlerjiBeyani({ alerjiVarMi: 'Bilinen alerjisi yok', alerjiAciklama: '' }), { durum: 'yok', metin: '' })
    assert.deepEqual(formAlerjiBeyani({ alerjiVarMi: 'Hayır' }), { durum: 'yok', metin: '' })
    assert.deepEqual(formAlerjiBeyani({ alerjiVarMi: 'Bilinen alerjisi var', alerjiAciklama: 'Penisilin' }), { durum: 'var', metin: 'Penisilin' })
    assert.deepEqual(formAlerjiBeyani({ alerjiVarMi: 'Evet', alerjiAciklama: 'Yumurta' }), { durum: 'var', metin: 'Yumurta' })
    assert.deepEqual(formAlerjiBeyani({ alerjiVarMi: 'Bilinen alerjisi var', alerjiAciklama: '' }), { durum: 'var', metin: '' })
    assert.deepEqual(formAlerjiBeyani({ alerji: 'Yok' }), { durum: 'yok', metin: '' })
    assert.deepEqual(formAlerjiBeyani({ alerji: 'Penisilin' }), { durum: 'var', metin: 'Penisilin' })
    // A negative radio wins over the free-text box.
    assert.deepEqual(formAlerjiBeyani({ alerjiVarMi: 'Bilinen alerjisi yok', alerjiAciklama: 'Penisilin' }), { durum: 'yok', metin: '' })
    for (const bos of [null, undefined, {}, { alerjiVarMi: '', alerjiAciklama: '  ' }, { kanGrubu: 'A Rh+' }]) assert.equal(formAlerjiBeyani(bos).durum, 'bos')
  })

  it('kartta ya da formda beyan varsa kayıtlıdır — açık olumsuz dahil', () => {
    assert.equal(alerjiBeyaniKayitliMi({ alerjiler: 'Bilinen alerjisi yok' }, null), true)
    assert.equal(alerjiBeyaniKayitliMi({ alerjiler: 'Penisilin' }, null), true)
    assert.equal(alerjiBeyaniKayitliMi({}, { alerjiVarMi: 'Bilinen alerjisi yok' }), true)
    assert.equal(alerjiBeyaniKayitliMi({}, { alerjiVarMi: 'Bilinen alerjisi var', alerjiAciklama: 'Penisilin' }), true)
    assert.equal(alerjiBeyaniKayitliMi({}, null), false)
    assert.equal(alerjiBeyaniKayitliMi({ alerjiler: '  ' }, { kanGrubu: 'A Rh+' }), false)
  })

  const DOSYA = (belge: string) => [
    '## HIZLI KART (yalnız bu dosya — uydurma yasak)', '- Yaş: 5 yaş', '- Alerji: kayıt yok', '',
    '## HASTA KİMLİK ÖZETİ', '- Cinsiyet: Erkek', '',
    '## EN SON HASTA FORMU — 20 Eylül 2026 (ÖZGEÇMİŞ — hasta beyanı)', '- aileOykusu: Babada polen alerjisi', '(Form tarihi: 20 Eylül 2026)', '',
    '## VİZİT GEÇMİŞİ — toplam 1 vizit', belge,
  ].join('\n')

  it('alerji taraması dosyanın kendi kart / form etiketlerini belge saymaz', () => {
    assert.ok(!/alerji/i.test(belgeVeNotMetni(DOSYA('S (Subjektif): Öksürük.'))))
    assert.deepEqual(bosluklariBul(DOSYA('S (Subjektif): Öksürük.'), { asi: 1, ilac: 1, alerjiVar: false, olcumVar: true }), [])
    assert.deepEqual(bosluklariBul(DOSYA('S (Subjektif): Penisilin alerjisi öyküsü var.'), { asi: 1, ilac: 1, alerjiVar: false, olcumVar: true }), ['alerji'])
    assert.deepEqual(bosluklariBul(DOSYA('S (Subjektif): Penisilin alerjisi öyküsü var.'), { asi: 1, ilac: 1, alerjiVar: true, olcumVar: true }), [])
  })
})

describe('Danış paneli — "alerji bilgileri belgelerde var ama dosyada kayıtlı değil" teklifi', () => {
  /** The offer block names allergy among the gaps. */
  const ALERJI_TEKLIFI = /belgelerinde [^.]*alerji[^.]* bilgisi geçiyor/
  const BELGEDE_ALERJI = 'Annesi penisilin alerjisi öyküsü olduğunu söyledi.'

  function hasta(s: Sahne, o: { kart?: Record<string, unknown>; form?: Record<string, unknown>; not: string }): string {
    const id = hastaEkle(s.doktor.id, 'QA Hasta Kart', { dogum: '2021-03-05', cinsiyet: 'male', notlar: o.kart || {} })
    if (o.form) ortam.db.ekle('hasta_intake_formlari', { doktor_id: s.doktor.id, patient_id: id, durum: 'dolduruldu', created_at: '2026-09-20T09:00:00.000Z', form_data_encrypted: encrypt(JSON.stringify(o.form)) })
    const seans = ortam.db.ekle('sessions', { patient_id: id, doctor_id: s.doktor.id, created_at: '2026-09-21T09:00:00.000Z', status: 'completed', specialty: 'pediatri', session_type: 'muayene', archived_at: null }).id
    ortam.db.ekle('notes', { session_id: seans, doctor_id: s.doktor.id, patient_id: id, created_at: '2026-09-21T09:00:00.000Z', approved_at: '2026-09-21T09:00:00.000Z', content_subjektif: o.not, content_ilaclar: [], icd10_codes: [], vitaller: null })
    return id
  }
  async function sor(s: Sahne, id: string) {
    const c = await panel(s, id, [{ rol: 'doktor', icerik: 'Bu hastayı kısaca özetler misin?' }])
    assert.equal(c.status, 200, c.hata || '')
    assert.ok(sonModelIstegi(), 'model çağrılmadı')
    // The harness really offers the tools — without them the route never builds the offer.
    assert.ok((sonModelIstegi()!.govde.tools || []).length > 0, 'araç sunulmadı')
  }

  it('kartta açık olumsuz ("Bilinen alerjisi yok") varsa teklif yok', async () => {
    const s = sahneKur()
    await sor(s, hasta(s, { kart: { alerjiler: 'Bilinen alerjisi yok' }, not: BELGEDE_ALERJI }))
    assert.equal(sistemde(ALERJI_TEKLIFI), false)
  })

  it('kartta alerji kayıtlıysa teklif yok', async () => {
    const s = sahneKur()
    await sor(s, hasta(s, { kart: { alerjiler: 'Penisilin' }, not: BELGEDE_ALERJI }))
    assert.equal(sistemde(ALERJI_TEKLIFI), false)
  })

  it('kart boş, en son form "Bilinen alerjisi yok" diyorsa teklif yok', async () => {
    const s = sahneKur()
    await sor(s, hasta(s, { form: { alerjiVarMi: 'Bilinen alerjisi yok', alerjiAciklama: '' }, not: BELGEDE_ALERJI }))
    assert.equal(sistemde(ALERJI_TEKLIFI), false)
  })

  it('kart boş, formda alerji yazılıysa teklif yok', async () => {
    const s = sahneKur()
    await sor(s, hasta(s, { form: { alerjiVarMi: 'Bilinen alerjisi var', alerjiAciklama: 'Penisilin' }, not: BELGEDE_ALERJI }))
    assert.equal(sistemde(ALERJI_TEKLIFI), false)
  })

  it('alerji yalnız notta / belgede geçiyorsa (kartta ve formda yok) teklif sürer', async () => {
    const s = sahneKur()
    await sor(s, hasta(s, { form: { kanGrubu: 'A Rh+' }, not: BELGEDE_ALERJI }))
    assert.equal(sistemde(ALERJI_TEKLIFI), true)
    assert.equal(sistemde(/toplu kart hazırlayayım/), true)
  })

  it('hiçbir yerde alerji bilgisi yoksa teklif yok', async () => {
    const s = sahneKur()
    await sor(s, hasta(s, { form: { kanGrubu: 'A Rh+' }, not: 'İki gündür öksürük. Ateş yok.' }))
    assert.equal(sistemde(ALERJI_TEKLIFI), false)
  })

  it('başka doktorun bu hastaya iliştirdiği form kayıt sayılmaz', async () => {
    const s = sahneKur()
    const id = hasta(s, { not: BELGEDE_ALERJI })
    ortam.db.ekle('hasta_intake_formlari', { doktor_id: s.diger.id, patient_id: id, durum: 'dolduruldu', created_at: '2026-09-22T09:00:00.000Z', form_data_encrypted: encrypt(JSON.stringify({ alerjiVarMi: 'Bilinen alerjisi yok' })) })
    await sor(s, id)
    assert.equal(sistemde(ALERJI_TEKLIFI), true)
  })
})

describe('form → hasta kartı aktarımı (gönderim anında, yalnız boş alan)', () => {
  let aktar: typeof import('@/lib/intake/hastaKaydinaAktar').intakeYanitlariniHastayaAktar
  before(async () => { aktar = (await import('@/lib/intake/hastaKaydinaAktar')).intakeYanitlariniHastayaAktar })

  const kart = (id: string) => notAlanlariCoz(ortam.db.tablo('patients').find((p) => p.id === id)!.notes_encrypted as string)

  it('kan grubu, kronik hastalık, alerji karta yazılır', async () => {
    const s = sahneKur()
    const id = hastaEkle(s.doktor.id, 'QA Hasta Aktar')
    const yazilan = await aktar(ortam.db.istemci() as never, s.doktor.id, id, { kanGrubu: 'A Rh+', kronikHastaliklar: ['Diyabet', 'Yok'], alerjiVarMi: 'Bilinen alerjisi var', alerjiAciklama: 'Penisilin' })
    assert.deepEqual([...yazilan].sort(), ['alerjiler', 'kanGrubu', 'kronikHastaliklar'])
    assert.equal(kart(id).kanGrubu, 'A Rh+')
    assert.deepEqual(kart(id).kronikHastaliklar, ['Diyabet'])
    assert.equal(kart(id).alerjiler, 'Penisilin')
  })

  it('"Bilinen alerjisi yok" karta açık olumsuz olarak yazılır', async () => {
    const s = sahneKur()
    const id = hastaEkle(s.doktor.id, 'QA Hasta Aktar')
    await aktar(ortam.db.istemci() as never, s.doktor.id, id, { alerjiVarMi: 'Bilinen alerjisi yok' })
    assert.equal(kart(id).alerjiler, 'Bilinen alerjisi yok')
  })

  it('"Evet" + açıklama karta alerji olarak yazılır — "Bilinen alerjisi yok" olarak değil', async () => {
    const s = sahneKur()
    const id = hastaEkle(s.doktor.id, 'QA Hasta Aktar')
    await aktar(ortam.db.istemci() as never, s.doktor.id, id, { alerjiVarMi: 'Evet', alerjiAciklama: 'Yumurta' })
    assert.equal(kart(id).alerjiler, 'Yumurta')
    const eski = hastaEkle(s.doktor.id, 'QA Hasta Eski Form')
    await aktar(ortam.db.istemci() as never, s.doktor.id, eski, { alerji: 'Penisilin' })
    assert.equal(kart(eski).alerjiler, 'Penisilin')
  })

  it('kartta dolu alan ezilmez (form yalnız boşluğu doldurur)', async () => {
    const s = sahneKur()
    const id = hastaEkle(s.doktor.id, 'QA Hasta Aktar', { notlar: { alerjiler: 'Bilinen alerjisi yok', kanGrubu: '0 Rh+' } })
    const yazilan = await aktar(ortam.db.istemci() as never, s.doktor.id, id, { kanGrubu: 'A Rh+', alerjiVarMi: 'Bilinen alerjisi var', alerjiAciklama: 'Penisilin' })
    assert.deepEqual(yazilan, [])
    assert.equal(kart(id).alerjiler, 'Bilinen alerjisi yok')
    assert.equal(kart(id).kanGrubu, '0 Rh+')
  })

  it('formun doktoru hastanın doktoru değilse karta yazılmaz', async () => {
    const s = sahneKur()
    const id = hastaEkle(s.doktor.id, 'QA Hasta Aktar')
    assert.deepEqual(await aktar(ortam.db.istemci() as never, s.diger.id, id, { kanGrubu: 'A Rh+', alerjiVarMi: 'Bilinen alerjisi var', alerjiAciklama: 'GIZLI-B-ALERJI' }), [])
    assert.deepEqual(kart(id), {})
  })
})
