/**
 * NOTYA-FORM-BIRLESTIR-01 — the patient's intake forms are merged from the newest to the oldest.
 *
 * 1. The pure merge (formlariBirlestir): which form a key is read from.
 * 2. The dossier (hastaDosyaPaketiniDerle on the fake Supabase): section title, dated carry-over lines, hidden identity
 *    fields, per-doctor scoping.
 *
 * Synthetic QA data only.
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { SahteVeritabani } from '../security/testing/sahteSupabase'
import { formlariBirlestir, yanitDoluMu } from './formBirlestir'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-form-anahtari'

const YENI = '2026-09-20T09:00:00.000Z'
const ORTA = '2026-06-01T09:00:00.000Z'
const ESKI = '2026-02-10T09:00:00.000Z'

describe('formlariBirlestir — hangi anahtar hangi formdan', () => {
  it('cevap sayılan / sayılmayan değerler', () => {
    for (const v of ['Yok', 'Hayır', 'Bilinen alerjisi yok', 0, false, ['Yok']]) assert.equal(yanitDoluMu(v), true, JSON.stringify(v))
    for (const v of [undefined, null, '', '   ', [], ['', ' ']]) assert.equal(yanitDoluMu(v), false, JSON.stringify(v))
  })

  it('form yoksa null', () => {
    assert.equal(formlariBirlestir([]), null)
  })

  it('tek form: yanıtlar aynen, eski formdan gelen yok', () => {
    const b = formlariBirlestir([{ yanitlar: { kanGrubu: 'A Rh+', alerji: 'Yok', bos: '' }, tarih: YENI }])!
    assert.deepEqual(b.yanitlar, { kanGrubu: 'A Rh+', alerji: 'Yok' })
    assert.deepEqual(b.eskiFormdan, {})
    assert.equal(b.tarih, YENI)
    assert.equal(b.formSayisi, 1)
  })

  it('yeni kısmi form eski tam formun cevaplarını silmez; eski değer kendi form tarihini taşır', () => {
    const b = formlariBirlestir([
      { yanitlar: { basvuruNedeni: 'Kontrol', kanGrubu: '', kronikHastaliklar: [], dogumKilosuPed: '   ' }, tarih: YENI },
      { yanitlar: { basvuruNedeni: 'Ateş', kanGrubu: 'A Rh+', kronikHastaliklar: ['Astım / KOAH'], dogumKilosuPed: '3200 g' }, tarih: ESKI },
    ])!
    assert.deepEqual(b.yanitlar, { basvuruNedeni: 'Kontrol', kanGrubu: 'A Rh+', kronikHastaliklar: ['Astım / KOAH'], dogumKilosuPed: '3200 g' })
    assert.deepEqual(b.eskiFormdan, { kanGrubu: ESKI, kronikHastaliklar: ESKI, dogumKilosuPed: ESKI })
    assert.equal(b.tarih, YENI)
  })

  it('yeni formdaki "Yok" / "Hayır" bir cevaptır — eski "Penisilin"i yener', () => {
    const b = formlariBirlestir([
      { yanitlar: { alerji: 'Yok', kullaniyorMu: 'Hayır' }, tarih: YENI },
      { yanitlar: { alerji: 'Penisilin', kullaniyorMu: 'Evet' }, tarih: ESKI },
    ])!
    assert.deepEqual(b.yanitlar, { alerji: 'Yok', kullaniyorMu: 'Hayır' })
    assert.deepEqual(b.eskiFormdan, {})
  })

  it('açıklama alanı sorusunu izler: yeni "Bilinen alerjisi yok" eski açıklamayla eşleşmez', () => {
    const b = formlariBirlestir([
      { yanitlar: { alerjiVarMi: 'Bilinen alerjisi yok', alerjiAciklama: '', kullaniyorMu: 'Hayır' }, tarih: YENI },
      { yanitlar: { alerjiVarMi: 'Bilinen alerjisi var', alerjiAciklama: 'Penisilin', kullaniyorMu: 'Evet', kullanilanIlaclar: 'QA-ilaç 5 mg' }, tarih: ESKI },
    ])!
    assert.deepEqual(b.yanitlar, { alerjiVarMi: 'Bilinen alerjisi yok', kullaniyorMu: 'Hayır' })
  })

  it('yeni form soruyu hiç cevaplamadıysa soru ve açıklama birlikte eski formdan gelir', () => {
    const b = formlariBirlestir([
      { yanitlar: { basvuruNedeni: 'Kontrol' }, tarih: YENI },
      { yanitlar: { alerjiVarMi: 'Bilinen alerjisi var', alerjiAciklama: 'Penisilin' }, tarih: ESKI },
    ])!
    assert.equal(b.yanitlar.alerjiVarMi, 'Bilinen alerjisi var')
    assert.equal(b.yanitlar.alerjiAciklama, 'Penisilin')
    assert.deepEqual(b.eskiFormdan, { alerjiVarMi: ESKI, alerjiAciklama: ESKI })
  })

  it('üç form: her anahtar onu cevaplayan en yeni formdan', () => {
    const b = formlariBirlestir([
      { yanitlar: { a: 'yeni-a' }, tarih: YENI },
      { yanitlar: { a: 'orta-a', b: 'orta-b' }, tarih: ORTA },
      { yanitlar: { a: 'eski-a', b: 'eski-b', c: 'eski-c' }, tarih: ESKI },
    ])!
    assert.deepEqual(b.yanitlar, { a: 'yeni-a', b: 'orta-b', c: 'eski-c' })
    assert.deepEqual(b.eskiFormdan, { b: ORTA, c: ESKI })
    assert.equal(b.formSayisi, 3)
  })

  it('veli / hasta beyanı en yeni formundur — eski formun veliYakinligi taşınmaz', () => {
    const b = formlariBirlestir([
      { yanitlar: { basvuruNedeni: 'Kontrol' }, tarih: YENI },
      { yanitlar: { veliYakinligi: 'Anne', kanGrubu: '0 Rh+' }, tarih: ESKI },
    ])!
    assert.equal('veliYakinligi' in b.yanitlar, false)
    assert.equal(b.yanitlar.kanGrubu, '0 Rh+')
    const yeniVeli = formlariBirlestir([{ yanitlar: { veliYakinligi: 'Baba' }, tarih: YENI }, { yanitlar: { veliYakinligi: 'Anne' }, tarih: ESKI }])!
    assert.equal(yeniVeli.yanitlar.veliYakinligi, 'Baba')
  })
})

describe('hasta dosyası — EN SON HASTA FORMU bölümü', () => {
  let encrypt: (s: string) => string
  let derle: typeof import('../doktor/hastaDosyaDerleyici').hastaDosyaPaketiniDerle
  let cozFormlar: typeof import('./formBirlestir').sifreliFormlariCoz

  before(async () => {
    ;({ encrypt } = await import('../security/encryption'))
    derle = (await import('../doktor/hastaDosyaDerleyici')).hastaDosyaPaketiniDerle
    cozFormlar = (await import('./formBirlestir')).sifreliFormlariCoz
  })

  function sahne(brans = 'pediatri') {
    const db = new SahteVeritabani()
    const doktor = randomUUID()
    const diger = randomUUID()
    db.ekle('users', { id: doktor, specialty: brans })
    db.ekle('users', { id: diger, specialty: brans })
    const hasta = db.ekle('patients', { doctor_id: doktor, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad: 'QA Hasta Form' })), dob_encrypted: encrypt('2021-03-05') }).id as string
    const form = (yanitlar: Record<string, unknown> | string, created_at: string, doktorId = doktor) =>
      db.ekle('hasta_intake_formlari', { doktor_id: doktorId, patient_id: hasta, durum: 'dolduruldu', created_at, form_data_encrypted: typeof yanitlar === 'string' ? yanitlar : encrypt(JSON.stringify(yanitlar)) })
    return { db, doktor, diger, hasta, form }
  }
  /** The form section of the dossier: from its heading to the next heading. */
  function formBolumu(metin: string): string {
    const bas = metin.indexOf('## EN SON HASTA FORMU')
    assert.ok(bas >= 0, 'EN SON HASTA FORMU bölümü yok')
    const son = metin.indexOf('\n## ', bas + 3)
    return metin.slice(bas, son < 0 ? undefined : son)
  }

  it('eski tam form + yeni kısmi form: eski cevaplar kalır ve form tarihini taşır; başlık en yeni formun tarihi', async () => {
    const s = sahne()
    s.form({ alerjiVarMi: 'Bilinen alerjisi var', alerjiAciklama: 'Penisilin', kronikHastaliklar: 'Astım', kanGrubu: 'A Rh+', dogumKilosuPed: '3200 g', basvuruNedeni: 'Ateş' }, ESKI)
    s.form({ basvuruNedeni: 'Kontrol', kanGrubu: '', kronikHastaliklar: '  ', alerjiAciklama: '' }, YENI)
    const p = (await derle(s.db.istemci() as never, s.doktor, s.hasta))!
    const bolum = formBolumu(p.metin)
    assert.match(bolum, /^## EN SON HASTA FORMU — 20 Eylül 2026 \(ÖZGEÇMİŞ — hasta beyanı\)/)
    assert.ok(!p.metin.includes('İLK KAYIT FORMU'))
    assert.ok(bolum.includes('- basvuruNedeni: Kontrol\n'), bolum)
    assert.ok(!bolum.includes('Ateş'))
    for (const satir of ['- alerjiVarMi: Bilinen alerjisi var (önceki form: 10 Şubat 2026)', '- alerjiAciklama: Penisilin (önceki form: 10 Şubat 2026)', '- kronikHastaliklar: Astım (önceki form: 10 Şubat 2026)', '- kanGrubu: A Rh+ (önceki form: 10 Şubat 2026)', '- dogumKilosuPed: 3200 g (önceki form: 10 Şubat 2026)']) {
      assert.ok(bolum.includes(satir), `${satir}\n---\n${bolum}`)
    }
    assert.ok(bolum.includes('(Form tarihi: 20 Eylül 2026)'))
    // The quick card reads the same merged answers.
    assert.equal(p.kart.alerji, 'Penisilin')
    assert.equal(p.kart.kronik, 'Astım')
    assert.equal(p.kart.kanGrubu, 'A Rh+')
  })

  it('yeni form "Yok" diyorsa eski "Penisilin" dosyaya girmez', async () => {
    const s = sahne()
    s.form({ alerji: 'Penisilin' }, ESKI)
    s.form({ alerji: 'Yok' }, YENI)
    const p = (await derle(s.db.istemci() as never, s.doktor, s.hasta))!
    assert.ok(formBolumu(p.metin).includes('- alerji: Yok\n'))
    assert.ok(!p.metin.includes('Penisilin'))
    assert.equal(p.kart.alerji, 'Yok')

    const r = sahne()
    r.form({ alerjiVarMi: 'Bilinen alerjisi var', alerjiAciklama: 'Penisilin' }, ESKI)
    r.form({ alerjiVarMi: 'Bilinen alerjisi yok', alerjiAciklama: '' }, YENI)
    const q = (await derle(r.db.istemci() as never, r.doktor, r.hasta))!
    assert.ok(formBolumu(q.metin).includes('- alerjiVarMi: Bilinen alerjisi yok\n'))
    assert.ok(!q.metin.includes('Penisilin'))
  })

  it('üç form: her satır kendi formunun tarihiyle', async () => {
    const s = sahne()
    s.form({ kanGrubu: 'B Rh+', dogumKilosuPed: '3100 g', gebelikHaftasiPed: '39' }, ESKI)
    s.form({ kanGrubu: 'B Rh-', dogumKilosuPed: '3150 g' }, ORTA)
    s.form({ kanGrubu: '0 Rh+' }, YENI)
    const bolum = formBolumu((await derle(s.db.istemci() as never, s.doktor, s.hasta))!.metin)
    assert.ok(bolum.includes('- kanGrubu: 0 Rh+\n'), bolum)
    assert.ok(bolum.includes('- dogumKilosuPed: 3150 g (önceki form: 1 Haziran 2026)'), bolum)
    assert.ok(bolum.includes('- gebelikHaftasiPed: 39 (önceki form: 10 Şubat 2026)'), bolum)
    assert.ok(!/B Rh|3100/.test(bolum))
  })

  it('okunamayan eski form atlanır; diğerleri birleşir', async () => {
    const s = sahne()
    s.form({ gebelikHaftasiPed: '38' }, ESKI)
    s.form('bozuk-sifreli-veri', ORTA)
    s.form({ kanGrubu: 'AB Rh+' }, YENI)
    const satirlar = s.db.tablo('hasta_intake_formlari').slice().reverse() as { form_data_encrypted: string; created_at: string }[]
    assert.equal(cozFormlar(satirlar).okunamayan, 1)
    const bolum = formBolumu((await derle(s.db.istemci() as never, s.doktor, s.hasta))!.metin)
    assert.ok(bolum.includes('- kanGrubu: AB Rh+\n'))
    assert.ok(bolum.includes('- gebelikHaftasiPed: 38 (önceki form: 10 Şubat 2026)'))
    assert.ok(!bolum.includes('çözülemedi'))
  })

  it('tek form: başlık dışında çıktı eskisiyle aynı — satırlar, form tarihi, "önceki form" yok', async () => {
    const s = sahne()
    s.form({ veliYakinligi: 'Anne', kanGrubu: 'A Rh+', kronikHastaliklar: ['Diyabet', 'Hipertansiyon'], alerjiVarMi: 'Bilinen alerjisi yok', alerjiAciklama: '', kvkkOnay: 'Kabul ediyorum' }, YENI)
    const bolum = formBolumu((await derle(s.db.istemci() as never, s.doktor, s.hasta))!.metin)
    assert.equal(bolum, [
      '## EN SON HASTA FORMU — 20 Eylül 2026 (ÖZGEÇMİŞ — veli beyanı)',
      '- veliYakinligi: Anne',
      '- kanGrubu: A Rh+',
      '- kronikHastaliklar: Diyabet, Hipertansiyon',
      '- alerjiVarMi: Bilinen alerjisi yok',
      '- kvkkOnay: Kabul ediyorum',
      '(Form tarihi: 20 Eylül 2026)',
      '',
    ].join('\n'))
  })

  it('form yok / yalnız gönderilmiş boş link / yalnız okunamayan form', async () => {
    const s = sahne()
    assert.ok(formBolumu((await derle(s.db.istemci() as never, s.doktor, s.hasta))!.metin).includes('- Hasta formu henüz doldurulmamış.'))
    s.db.ekle('hasta_intake_formlari', { doktor_id: s.doktor, patient_id: s.hasta, durum: 'gonderildi', created_at: YENI, form_data_encrypted: null })
    const bos = formBolumu((await derle(s.db.istemci() as never, s.doktor, s.hasta))!.metin)
    assert.match(bos, /^## EN SON HASTA FORMU \(ÖZGEÇMİŞ — hasta beyanı\)/)
    assert.ok(bos.includes('- Hasta formu henüz doldurulmamış.'))
    s.form('bozuk-sifreli-veri', ORTA)
    assert.ok(formBolumu((await derle(s.db.istemci() as never, s.doktor, s.hasta))!.metin).includes('- Form kayıtlı ancak çözülemedi.'))
  })

  it('doldurulmamış yeni link eski doldurulmuş formu gizlemez', async () => {
    const s = sahne()
    s.form({ kanGrubu: 'A Rh-' }, ESKI)
    s.db.ekle('hasta_intake_formlari', { doktor_id: s.doktor, patient_id: s.hasta, durum: 'gonderildi', created_at: YENI, form_data_encrypted: null })
    const bolum = formBolumu((await derle(s.db.istemci() as never, s.doktor, s.hasta))!.metin)
    assert.match(bolum, /^## EN SON HASTA FORMU — 10 Şubat 2026 /)
    assert.ok(bolum.includes('- kanGrubu: A Rh-\n'))
  })

  it('veli beyanı en yeni formdan; kimlik / iletişim / sigorta / veli alanları eski formdan da modele gitmez', async () => {
    const s = sahne()
    s.form({ veliYakinligi: 'Anne', veliAd: 'QA-Veli-Ad', veliTelefon: '0500 000 00 01', anneAdi: 'QA-Anne-Adi', babaAdi: 'QA-Baba-Adi', dogumYeri: 'QA-Dogum-Yeri', tcKimlik: '10000000146', adres: 'QA-Adres-Satiri', il: 'QA-Il', policeNo: 'QA-POLICE-9', kurumAdi: 'QA-Kurum', acilKisiAdi: 'QA-Acil-Kisi', kanGrubu: 'A Rh+' }, ESKI)
    s.form({ basvuruNedeni: 'Kontrol' }, YENI)
    const p = (await derle(s.db.istemci() as never, s.doktor, s.hasta))!
    const bolum = formBolumu(p.metin)
    assert.match(bolum, /\(ÖZGEÇMİŞ — hasta beyanı\)/)
    assert.ok(!/veliYakinligi/.test(bolum))
    assert.ok(bolum.includes('- kanGrubu: A Rh+ (önceki form: 10 Şubat 2026)'))
    for (const gizli of ['QA-Veli-Ad', '0500 000 00 01', 'QA-Anne-Adi', 'QA-Baba-Adi', 'QA-Dogum-Yeri', '10000000146', 'QA-Adres-Satiri', 'QA-Il', 'QA-POLICE-9', 'QA-Kurum', 'QA-Acil-Kisi']) {
      assert.ok(!p.metin.includes(gizli), `${gizli} modele gitti`)
    }
  })

  it('başka doktorun bu hasta kimliğine iliştirdiği form birleşmez', async () => {
    const s = sahne()
    s.form({ kanGrubu: 'A Rh+' }, YENI)
    s.form({ alerjiAciklama: 'GIZLI-B-ALERJI', alerjiVarMi: 'Bilinen alerjisi var' }, ESKI, s.diger)
    const p = (await derle(s.db.istemci() as never, s.doktor, s.hasta))!
    assert.ok(!p.metin.includes('GIZLI-B-ALERJI'))
    assert.equal(await derle(s.db.istemci() as never, s.diger, s.hasta), null)
  })

  it('en fazla beş form okunur', async () => {
    const s = sahne()
    s.form({ altinci: 'okunmaz' }, '2025-01-01T09:00:00.000Z')
    for (const ay of ['02', '03', '04', '05', '06']) s.form({ [`ay${ay}`]: 'var' }, `2026-${ay}-15T09:00:00.000Z`)
    const bolum = formBolumu((await derle(s.db.istemci() as never, s.doktor, s.hasta))!.metin)
    assert.ok(bolum.includes('- ay02: var (önceki form: 15 Şubat 2026)'))
    assert.ok(!bolum.includes('altinci'))
  })
})
