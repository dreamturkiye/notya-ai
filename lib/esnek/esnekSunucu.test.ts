/**
 * ESNEK-MUAYENE-B — server services against the fake database (lib/security/testing/sahteSupabase.ts): shadow mode end to end,
 * the overnight learning loop (activation, regression demotion, never-learned, one-tap undo, never re-learned), the autonomy
 * ladder after approval (idempotent, staff never promotes), batch approval rules, the fark notu draft, and CROSS-DOCTOR
 * ISOLATION (doctor A never reads, changes or learns from doctor B). Synthetic QA data only.
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { SahteVeritabani } from '@/lib/security/testing/sahteSupabase'

process.env.ENCRYPTION_MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'qa-sentetik-esnek-anahtari'

type Sb = never
let encrypt: (s: string) => string
let golge: typeof import('./golge')
let gece: typeof import('./gece')
let onay: typeof import('./onaySonrasi')
let oz: typeof import('./ozerklikServisi')
let fark: typeof import('./fark')
let profil: typeof import('./profil')
let ESNEK_TR: typeof import('@/core/esnek/metinTr').ESNEK_TR

before(async () => {
  ;({ encrypt } = await import('@/lib/security/encryption'))
  golge = await import('./golge'); gece = await import('./gece'); onay = await import('./onaySonrasi'); oz = await import('./ozerklikServisi'); fark = await import('./fark'); profil = await import('./profil')
  ;({ ESNEK_TR } = await import('@/core/esnek/metinTr'))
})

const dun = (g = 1) => new Date(Date.now() - g * 86400000).toISOString()

function hekim(db: SahteVeritabani, harf: string) {
  const id = randomUUID()
  db.ekle('users', { id, full_name: `QA Hekim ${harf}`, specialty: 'kulak-burun-bogaz' })
  const hasta = db.ekle('patients', { doctor_id: id, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad: `Gizem${harf} Sentetik` })) }).id as string
  const hasta2 = db.ekle('patients', { doctor_id: id, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad: `Deniz${harf} Sentetik` })) }).id as string
  return { id, hasta, hasta2, harf }
}
function onayliNot(db: SahteVeritabani, h: { id: string; hasta: string }, alanlar: Record<string, string>, g = 3) {
  const s = db.ekle('sessions', { doctor_id: h.id, patient_id: h.hasta, archived_at: null, created_at: dun(g) }).id
  return db.ekle('notes', { session_id: s, doctor_id: h.id, approved_at: dun(g), approved_by: h.id, created_at: dun(g), ...alanlar }).id as string
}
function golgeSatiri(db: SahteVeritabani, h: { id: string }, patient: string, notya: string, sekreter: string) {
  const k = db.ekle('muayene_kaynaklari', { doctor_id: h.id, patient_id: patient, session_id: null, tur: 'sekreter_yukleme', durum: 'iptal', metin: notya, isleme_anahtari: randomUUID().replace(/-/g, '') })
  return db.ekle('golge_karsilastirmalari', { doctor_id: h.id, patient_id: patient, kaynak_id: k.id, sekreter_metni: sekreter, sekreter_kaynagi: 'yazdi', notya_taslak: { objektif: notya }, durum: 'karsilastirildi', ogrenildi: false, ayni_icerik: false, skor: 0.5, gun: new Date().toISOString().slice(0, 10) })
}

describe('B1 — shadow mode on the server', () => {
  it('a shadow source has no session (no phantom visit); a foreign patient is 404; idempotent per page set', async () => {
    const db = new SahteVeritabani(); const A = hekim(db, 'A'); const B = hekim(db, 'B')
    const aktor = { userId: A.id, rol: 'sekreter' as const }
    assert.deepEqual(await golge.golgeKaynagiOlustur(db.istemci() as Sb, { doktorId: A.id, patientId: B.hasta, kanal: 'kamera', isleme: 'a'.repeat(32), aktor }), { hata: 'Hasta bulunamadı.', durum: 404 })
    const r = await golge.golgeKaynagiOlustur(db.istemci() as Sb, { doktorId: A.id, patientId: A.hasta, kanal: 'kamera', isleme: 'b'.repeat(32), aktor })
    assert.ok('kaynak' in r && r.kaynak.session_id === null && r.yeni)
    const r2 = await golge.golgeKaynagiOlustur(db.istemci() as Sb, { doktorId: A.id, patientId: A.hasta, kanal: 'kamera', isleme: 'b'.repeat(32), aktor })
    assert.ok('kaynak' in r2 && !r2.yeni)
    assert.equal(db.tablo('sessions').length, 0)
  })
  it('the secretary\'s note is stored, the source parked, Notya\'s draft compared; the offer comes at ≥ 90% (15+ notes)', async () => {
    const db = new SahteVeritabani(); const A = hekim(db, 'A')
    db.ekle('esnek_muayene_ayarlari', { doctor_id: A.id, golge_modu: true, golge_hedef: 0.9, golge_teklif: 'yok', hekim_duzeltmeleri: {} })
    const sb = db.istemci() as Sb
    let teklif = false
    for (let i = 0; i < 16; i++) {
      const k = await golge.golgeKaynagiOlustur(sb, { doktorId: A.id, patientId: A.hasta, kanal: 'kamera', isleme: `${i}`.padStart(32, 'c'), aktor: { userId: A.id, rol: 'sekreter' } })
      assert.ok('kaynak' in k)
      db.tablo('muayene_kaynaklari').find((x) => x.id === k.kaynak.id)!.metin = 'Septum orta hatta. Tonsil hipertrofik.'
      const kay = await golge.golgeKaydet(sb, { doktorId: A.id, kaynakId: k.kaynak.id, aktor: { userId: A.id, rol: 'sekreter' }, kaynagi: 'yazdi', metin: 'Septum orta hatta. Tonsil hipertrofik.', sureMs: 300000 },
        { bekle: true, uret: async () => ({ objektif: 'Septum orta hatta. Tonsil hipertrofik.' }) })
      assert.ok('id' in kay)
      assert.equal(db.tablo('muayene_kaynaklari').find((x) => x.id === k.kaynak.id)!.durum, 'iptal', 'parked: never part of a visit or a list')
      const d = await golge.golgeDurumu(sb, A.id)
      teklif = d.teklif
      if (i < 14) assert.equal(teklif, false, `no offer with ${i + 1} notes`)
    }
    assert.equal(teklif, true)
    const d = await golge.golgeDurumu(sb, A.id)
    assert.deepEqual(d.gunluk, { toplam: 16, ayni: 16 })
    // accepting: from tomorrow the secretary only uploads, the doctor approves
    const r = await golge.golgeIslem(sb, A.id, A.id, 'teklif_evet')
    assert.ok('ok' in r && r.ayar.sekreterYazmasinGun && r.ayar.golgeTeklif === 'kabul')
    const ayar = db.tablo('esnek_muayene_ayarlari')[0]
    assert.equal(ayar.el_notu_hazirlayan, 'sekreter'); assert.equal(ayar.hekim_onayi_gerekli, true)
  })
  it('ISOLATION: A cannot attach a note to B\'s source, nor use B\'s note as "the secretary\'s note"', async () => {
    const db = new SahteVeritabani(); const A = hekim(db, 'A'); const B = hekim(db, 'B')
    const kB = db.ekle('muayene_kaynaklari', { doctor_id: B.id, patient_id: B.hasta, session_id: null, tur: 'sekreter_yukleme', durum: 'okundu', metin: 'x', isleme_anahtari: 'd'.repeat(32) })
    const once = JSON.stringify(db.tablo('muayene_kaynaklari'))
    assert.deepEqual(await golge.golgeKaydet(db.istemci() as Sb, { doktorId: A.id, kaynakId: kB.id, aktor: { userId: A.id, rol: 'doktor' }, kaynagi: 'yapistir', metin: 'Sentetik not metni uzun' }), { hata: 'Kaynak bulunamadı.', durum: 404 })
    assert.equal(JSON.stringify(db.tablo('muayene_kaynaklari')), once)
    const kA = db.ekle('muayene_kaynaklari', { doctor_id: A.id, patient_id: A.hasta, session_id: null, tur: 'sekreter_yukleme', durum: 'okundu', metin: 'x', isleme_anahtari: 'e'.repeat(32) })
    const notB = onayliNot(db, B, { content_objektif: 'GIZLI-B bulgu' })
    assert.deepEqual(await golge.golgeKaydet(db.istemci() as Sb, { doktorId: A.id, kaynakId: kA.id, aktor: { userId: A.id, rol: 'doktor' }, kaynagi: 'not', noteId: notB }), { hata: 'Not bulunamadı.', durum: 404 })
    assert.equal(db.tablo('golge_karsilastirmalari').length, 0)
  })
})

describe('B2 — overnight learning loop', () => {
  it('learns the abbreviation and the plan style after two notes, tested against A\'s notes only; never a side', async () => {
    const db = new SahteVeritabani(); const A = hekim(db, 'A'); const B = hekim(db, 'B')
    // A's past approved notes agree with a numbered plan; B's (another doctor) would contradict it — must not count
    onayliNot(db, A, { content_plan: '1. Kontrol\n2. Gargara', content_objektif: 'Orta kulak alanı ödemli' })
    onayliNot(db, B, { content_plan: '- Kontrol\n- Gargara' })
    onayliNot(db, B, { content_plan: '- Kontrol\n- İlaç' })
    const sek = 'Muayene: orta kulak alanı ödemli\nTanı: otit\nPlan:\n1. Kontrol\n2. Gargara'
    golgeSatiri(db, A, A.hasta, 'OKA ödemli', sek)
    golgeSatiri(db, A, A.hasta2, 'OKA ödemli', sek)
    golgeSatiri(db, A, A.hasta, 'SL ağrı', 'sol ağrı')
    golgeSatiri(db, A, A.hasta2, 'SL ağrı', 'sol ağrı')
    const sb = db.istemci() as Sb
    const r = await gece.geceTuru(sb, A.id)
    assert.ok(r.aktif >= 2, JSON.stringify(r))
    const soz = db.tablo('hekim_el_sozlugu').filter((x) => x.doctor_id === A.id)
    assert.ok(soz.some((x) => x.kisaltma === 'OKA' && x.anlam === 'orta kulak alanı' && x.kaynak === 'gece'))
    assert.ok(!soz.some((x) => /sol/i.test(String(x.anlam))), 'a side is never learned')
    assert.ok(db.tablo('hekim_el_sozlugu').every((x) => x.doctor_id === A.id), 'nothing written for B')
    const kural = db.tablo('doktor_hafiza').find((x) => x.doctor_id === A.id && x.anahtar === 'gece-plan-numarali')
    assert.ok(kural && kural.durum === 'uygulanir' && kural.kaynak === 'duzeltme')
    assert.ok(db.tablo('golge_karsilastirmalari').every((x) => x.ogrenildi === true))
    // weekly digest: at most 3, one-tap undo deletes exactly the row written, and it is never learned again
    const hafta = await gece.haftalikOgrenilenler(sb, A.id)
    assert.ok(hafta.length >= 2 && hafta.length <= 3)
    const oka = hafta.find((x) => x.oneri.tur === 'sozluk')!
    assert.equal(await gece.ogrenileniGeriAl(sb, A.id, oka.id), true)
    assert.ok(!db.tablo('hekim_el_sozlugu').some((x) => x.kisaltma === 'OKA'))
    golgeSatiri(db, A, A.hasta, 'OKA ödemli', sek)
    golgeSatiri(db, A, A.hasta2, 'OKA ödemli', sek)
    await gece.geceTuru(sb, A.id)
    assert.ok(!db.tablo('hekim_el_sozlugu').some((x) => x.kisaltma === 'OKA'), 'a reverted item is never re-learned')
  })
  it('a format candidate contradicted by A\'s own past approved note is NOT activated', async () => {
    const db = new SahteVeritabani(); const A = hekim(db, 'A')
    onayliNot(db, A, { content_plan: '- Kontrol\n- Gargara' })
    const sek = 'Plan:\n1. Kontrol\n2. Gargara'
    golgeSatiri(db, A, A.hasta, 'Kontrol', sek); golgeSatiri(db, A, A.hasta2, 'Kontrol', sek)
    await gece.geceTuru(db.istemci() as Sb, A.id)
    assert.ok(!db.tablo('doktor_hafiza').some((x) => x.anahtar === 'gece-plan-numarali'))
    assert.ok(db.tablo('esnek_ogrenme_adaylari').some((x) => x.anahtar === 'bicim:plan_liste:numarali' && x.durum === 'kirdi'))
  })
  it('a rule the existing correction learning promoted is sent back to "aday" when it breaks a past approved note', async () => {
    const db = new SahteVeritabani(); const A = hekim(db, 'A')
    const n1 = onayliNot(db, A, { content_objektif: 'kızarık zar' })
    onayliNot(db, A, { content_objektif: 'zar hiperemik' })
    db.ekle('doktor_hafiza', { doctor_id: A.id, kategori: 'uslup', anahtar: 'terim-hiperemik-kizarik', deger: '"hiperemik" yerine "kızarık" yaz', kaynak: 'duzeltme', durum: 'uygulanir', aktif: true, kesin: true, kanit_sayisi: 2, kanit_not_idler: [n1], updated_at: new Date().toISOString() })
    const r = await gece.geceTuru(db.istemci() as Sb, A.id)
    assert.equal(r.geriDonen, 1)
    const k = db.tablo('doktor_hafiza').find((x) => x.anahtar === 'terim-hiperemik-kizarik')!
    assert.equal(k.durum, 'aday'); assert.equal(k.kesin, false)
  })
})

describe('B3 — ladder after approval, batch approval', () => {
  const son = { content_subjektif: 'Boğaz ağrısı', content_objektif: 'Septum orta hatta', content_plan: 'Kontrol', content_ilaclar: [] }
  it('idempotent per note; a correction drops one step; a staff finalization never promotes', async () => {
    const db = new SahteVeritabani(); const A = hekim(db, 'A'); const sb = db.istemci() as Sb
    for (let i = 0; i < 6; i++) await onay.esnekOnaySonrasi(sb, { doktorId: A.id, noteId: randomUUID(), patientId: A.hasta, hekim: true, loglar: [], son, aiDegerlendirme: null, receteOnerisi: null })
    const plan = () => db.tablo('alan_ozerklik').find((x) => x.doctor_id === A.id && x.alan === 'plan')!
    assert.equal(plan().basamak, 1); assert.equal(plan().seri, 6)
    const ayni = randomUUID()
    await onay.esnekOnaySonrasi(sb, { doktorId: A.id, noteId: ayni, patientId: A.hasta, hekim: true, loglar: [], son, aiDegerlendirme: null, receteOnerisi: null })
    await onay.esnekOnaySonrasi(sb, { doktorId: A.id, noteId: ayni, patientId: A.hasta, hekim: true, loglar: [], son, aiDegerlendirme: null, receteOnerisi: null })
    assert.equal(plan().seri, 7, 're-approval of the same note never counts twice')
    await onay.esnekOnaySonrasi(sb, { doktorId: A.id, noteId: randomUUID(), patientId: A.hasta, hekim: false, loglar: [], son, aiDegerlendirme: null, receteOnerisi: null })
    assert.equal(plan().seri, 7, 'a secretary\'s finalization never promotes')
    await onay.esnekOnaySonrasi(sb, { doktorId: A.id, noteId: randomUUID(), patientId: A.hasta, hekim: false, loglar: [{ alan: 'plan' }], son, aiDegerlendirme: null, receteOnerisi: null })
    assert.equal(plan().basamak, 0); assert.equal(plan().seri, 0)
  })
  it('suggestion feedback only on the doctor\'s approval', async () => {
    const db = new SahteVeritabani(); const A = hekim(db, 'A'); const sb = db.istemci() as Sb
    await onay.esnekOnaySonrasi(sb, { doktorId: A.id, noteId: randomUUID(), patientId: A.hasta, hekim: false, loglar: [], son, aiDegerlendirme: '- Boyun USG istenebilir', receteOnerisi: null })
    assert.equal(db.tablo('esnek_olaylar').filter((x) => x.tur === 'oneri').length, 0)
    await onay.esnekOnaySonrasi(sb, { doktorId: A.id, noteId: randomUUID(), patientId: A.hasta, hekim: true, loglar: [], son, aiDegerlendirme: '- Boyun USG istenebilir', receteOnerisi: null })
    assert.deepEqual(db.tablo('esnek_olaylar').filter((x) => x.tur === 'oneri').map((x) => [x.anahtar, (x.deger as { kabul: boolean }).kabul]), [['tetkik', false]])
  })
  it('batch: refused unless B3 is on, the note opened and every protected item seen; never another doctor\'s note', async () => {
    const db = new SahteVeritabani(); const A = hekim(db, 'A'); const B = hekim(db, 'B'); const sb = db.istemci() as Sb
    for (const alan of ['subjektif', 'objektif', 'plan']) db.ekle('alan_ozerklik', { doctor_id: A.id, alan, basamak: 3, seri: 45, hekim_tavani: 3 })
    const s = db.ekle('sessions', { doctor_id: A.id, patient_id: A.hasta, archived_at: null }).id
    const n = db.ekle('notes', { session_id: s, doctor_id: A.id, approved_at: null, created_at: new Date().toISOString(), content_subjektif: 'Boğaz ağrısı.', content_objektif: 'Sağ tonsil hipertrofik.', content_plan: 'Kontrol.' }).id as string
    const sB = db.ekle('sessions', { doctor_id: B.id, patient_id: B.hasta, archived_at: null }).id
    const nB = db.ekle('notes', { session_id: sB, doctor_id: B.id, approved_at: null, created_at: new Date().toISOString(), content_plan: 'GIZLI-B' }).id as string
    assert.deepEqual(await oz.topluOnayla(sb, A.id, A.id, [n]), { hata: 'Toplu onay açık değil.', durum: 403 })
    db.ekle('esnek_muayene_ayarlari', { doctor_id: A.id, toplu_onay_izni: true, hekim_duzeltmeleri: {} })
    let liste = await oz.topluListe(sb, A.id)
    assert.equal(liste.notlar.length, 1); assert.equal(liste.notlar[0].hazir, false)
    assert.ok(liste.notlar[0].onaylanacak.some((x) => /Sağ/.test(x.metin)), 'the side sentence must be acknowledged')
    assert.deepEqual(await oz.topluOnayla(sb, A.id, A.id, [n, nB]), { onaylanan: [], reddedilen: [n, nB] })
    assert.equal(await oz.notOlayi(sb, A.id, A.id, nB, 'acildi'), false, 'B\'s note cannot even be marked')
    assert.equal(await oz.notOlayi(sb, A.id, A.id, n, 'acildi'), true)
    assert.equal(await oz.notOlayi(sb, A.id, A.id, n, 'gordum', 'uydurma'), false, 'only listed protected items can be acknowledged')
    for (const x of liste.notlar[0].onaylanacak) assert.equal(await oz.notOlayi(sb, A.id, A.id, n, 'gordum', x.anahtar), true)
    liste = await oz.topluListe(sb, A.id)
    assert.equal(liste.notlar[0].hazir, true)
    assert.equal(await oz.notDurumu(sb, A.id, nB), null)
    assert.equal(db.tablo('notes').find((x) => x.id === nB)!.approved_at, null)
  })
})

describe('B4 — fark notu draft', () => {
  it('previous note of THIS doctor\'s patient only; foreign patient 404; draft with provenance and highlight', async () => {
    const db = new SahteVeritabani(); const A = hekim(db, 'A'); const B = hekim(db, 'B'); const sb = db.istemci() as Sb
    onayliNot(db, A, { content_objektif: 'Sağ submandibular bezde 6 mm taş.', content_degerlendirme: 'Sialolitiazis.', content_subjektif: 'Ağrı.', content_plan: '1. Antibiyotik' })
    onayliNot(db, B, { content_objektif: 'GIZLI-B taş' })
    assert.equal(('hata' in (await fark.farkOnizle(sb, A.id, B.hasta, 'taş ↓', ESNEK_TR))), true)
    const on = await fark.farkOnizle(sb, A.id, A.hasta, 'taş ↓, ağrı Ø, sialendoskopi 12.12', ESNEK_TR)
    assert.ok(!('hata' in on))
    assert.match(on.metin.objektif, /Değişen:\n• taş: azalmış/)
    assert.ok(!JSON.stringify(on).includes('GIZLI-B'))
    const k = await fark.farkKaydet(sb, { doktorId: A.id, aktor: { userId: A.id, rol: 'doktor' }, M: ESNEK_TR, patientId: A.hasta, metin: 'taş ↓, ağrı Ø, sialendoskopi 12.12' })
    assert.ok('noteId' in k)
    const n = db.tablo('notes').find((x) => x.id === k.noteId)!
    assert.equal(n.approved_at ?? null, null)
    assert.ok((n.kaynak_izleri as Record<string, unknown>).objektif)
    assert.match(String(n.content_plan), /sialendoskopi 12\.12/)
    assert.ok(!/Antibiyotik/.test(String(n.content_plan)))
  })
})

describe('B6 — profile actions never cross doctors', () => {
  it('A cannot edit / delete B\'s lexicon row', async () => {
    const db = new SahteVeritabani(); const A = hekim(db, 'A'); const B = hekim(db, 'B'); const sb = db.istemci() as Sb
    const r = db.ekle('hekim_el_sozlugu', { doctor_id: B.id, kisaltma: 'KZ', kisaltma_anahtar: 'kz', anlam: 'GIZLI-B', kaynak: 'elle', sayac: 1 })
    await profil.profilIslem(sb, A.id, A.id, { islem: 'sozluk_sil', id: r.id })
    await profil.profilIslem(sb, A.id, A.id, { islem: 'sozluk_duzelt', id: r.id, anlam: 'x' })
    assert.equal(db.tablo('hekim_el_sozlugu').find((x) => x.id === r.id)!.anlam, 'GIZLI-B')
    const p = await profil.profilYukle(sb, A.id)
    assert.ok(!JSON.stringify(p).includes('GIZLI-B'))
  })
  it('the doctor\'s correction of his working style wins over the learned one', async () => {
    const db = new SahteVeritabani(); const A = hekim(db, 'A'); const sb = db.istemci() as Sb
    assert.equal(await profil.profilIslem(sb, A.id, A.id, { islem: 'calisma', sekil: 'kagit' }), true)
    const p = await profil.profilYukle(sb, A.id)
    assert.equal(p.calisma.sekil, 'kagit')
    const ana = await profil.anaSayfaYukle(sb, A.id)
    assert.equal(ana.karar.elNotuOnce, true); assert.equal(ana.karar.mikrofonOner, false)
  })
})
