/**
 * NOTYA-GELEN-BELGELER — unit tests: format routing (HEIC / audio / Word / Excel with mocked converters), patient
 * matching, duplicate handling, classification mapping, staff gating, filing and the 30-day clean-up.
 * Synthetic data only (QA names) — never a real patient.
 *
 *   npx tsx --experimental-test-module-mocks --test lib/gelenBelgeler/gelenBelgeler.test.ts   (part of npm test)
 */
import { describe, it, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import * as XLSX from 'xlsx'
import { SahteVeritabani } from '../security/testing/sahteSupabase'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-gelen-belge-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'

let db = new SahteVeritabani()
// No network: the reader inside the routes gets an error from "Anthropic" and falls back to an unread item.
globalThis.fetch = (async (u: unknown) => { throw new Error(`gelen-belgeler testi ağ erişimi yapamaz: ${String(u)}`) }) as typeof fetch
// Route handlers create their own service-role client — hand them the in-memory database (ESM + CJS entries).
{
  const sahte = (_u?: string, _k?: string, opts?: { global?: { headers?: Record<string, string> } }) => {
    const c = () => db.istemci(opts)
    return {
      from: (t: string) => c().from(t),
      auth: { getUser: (j?: string) => c().auth.getUser(j) },
      storage: { from: (k: string) => c().storage.from(k) },
      rpc: (ad: string, a: Record<string, string>) => c().rpc(ad, a),
    }
  }
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any>
  const kok = dirname(pkgYolu)
  const girdiler = [pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module]
  for (const g of new Set(girdiler.filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: sahte } })
  }
}

type M = typeof import('./bicim') & typeof import('./eslesme') & typeof import('./okuma') & typeof import('./donustur') & typeof import('./yetki') & typeof import('./sunucu')
let m: M
let encrypt: (s: string) => string
let NextRequestSinifi: typeof import('next/server').NextRequest

before(async () => {
  m = { ...(await import('./bicim')), ...(await import('./eslesme')), ...(await import('./okuma')), ...(await import('./donustur')), ...(await import('./yetki')), ...(await import('./sunucu')) } as M
  encrypt = (await import('../security/encryption')).encrypt
  NextRequestSinifi = (await import('next/server')).NextRequest
})

// ─── Format routing ───────────────────────────────────────────────────────────────────────────────
describe('bicimBelirle — which kind of file', () => {
  it('WhatsApp voice note (.opus, octet-stream) → sound stored as audio/ogg', () => {
    assert.deepEqual(m.bicimBelirle('PTT-20260925-WA0003.opus', 'application/octet-stream'), { bicim: 'ses', mime: 'audio/ogg' })
    assert.deepEqual(m.bicimBelirle('ses.ogg', 'audio/ogg; codecs=opus'), { bicim: 'ses', mime: 'audio/ogg' })
  })
  it('iPhone photo without a MIME type → HEIC', () => {
    assert.equal(m.bicimBelirle('IMG_2041.HEIC', '')?.bicim, 'heic')
    assert.equal(m.bicimBelirle('x', 'image/heif')?.bicim, 'heic')
  })
  it('m4a / mp3 / wav / in-app recordings are sound', () => {
    for (const [ad, mime] of [['a.m4a', ''], ['a.mp3', 'audio/mpeg'], ['a.wav', 'audio/x-wav'], ['sesli-not.webm', 'audio/webm'], ['sesli-not', 'video/mp4']]) {
      assert.equal(m.bicimBelirle(ad, mime)?.bicim, 'ses', `${ad} ${mime}`)
    }
  })
  it('documents: PDF, Word, Excel, CSV, text', () => {
    assert.equal(m.bicimBelirle('sonuc.pdf', 'application/pdf')?.bicim, 'pdf')
    assert.equal(m.bicimBelirle('rapor.docx', '')?.bicim, 'word')
    assert.equal(m.bicimBelirle('tablo.xlsx', 'application/octet-stream')?.bicim, 'excel')
    assert.equal(m.bicimBelirle('tablo.csv', 'text/csv')?.bicim, 'excel')
    assert.equal(m.bicimBelirle('not.txt', 'text/plain')?.bicim, 'metin')
  })
  it('refuses videos, archives and programs', () => {
    assert.equal(m.bicimBelirle('film.mp4', 'video/mp4'), null)
    assert.equal(m.bicimBelirle('arsiv.zip', 'application/zip'), null)
    assert.equal(m.bicimBelirle('kur.exe', ''), null)
  })
  it('pasted text: a table yes, a stray word or a link no', () => {
    assert.equal(m.yapistirmaMetniUygunMu('Hemoglobin 9,1 g/dL (12-16)\nLökosit 7,2'), true)
    assert.equal(m.yapistirmaMetniUygunMu('merhaba'), false)
    assert.equal(m.yapistirmaMetniUygunMu('https://ornek.test/sonuc/12345678'), false)
  })
})

describe('hazirla — HEIC / audio / Word / Excel routing (converters mocked)', () => {
  const sahteJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9])
  const cagrilar: string[] = []
  const d = () => ({
    heicJpeg: async (b: Buffer) => { cagrilar.push(`heic:${b.length}`); return sahteJpeg },
    yaziyaDok: async (_b: Buffer, mime: string, ad: string) => { cagrilar.push(`ses:${mime}:${ad}`); return 'Hocam merhaba, ilacı günde iki kez mi alacağım?' },
  })

  it('HEIC is converted to JPEG on the server — stored and read as JPEG', async () => {
    cagrilar.length = 0
    const h = await m.hazirla({ ad: 'IMG_2041.HEIC', mime: 'image/heic', bytes: Buffer.from('sentetik-heic') }, d())
    assert.deepEqual(cagrilar, ['heic:13'])
    assert.equal(h.mime, 'image/jpeg')
    assert.equal(h.ad, 'IMG_2041.jpg')
    assert.equal(h.bicim, 'gorsel')
    assert.deepEqual(h.bytes, sahteJpeg)
    assert.equal(h.okuma?.tip, 'gorsel')
  })
  it('a HEIC that cannot be decoded gives a plain sentence', async () => {
    await assert.rejects(m.hazirla({ ad: 'a.heic', mime: '', bytes: Buffer.from('x') }, { ...d(), heicJpeg: async () => { throw new Error('libheif') } }), /iPhone fotoğrafı açılamadı/)
  })
  it('sound is kept as it came and transcribed; the transcript is what Notya reads', async () => {
    cagrilar.length = 0
    const ses = Buffer.from('sentetik-opus')
    const h = await m.hazirla({ ad: 'PTT-WA0003.opus', mime: 'application/octet-stream', bytes: ses }, d())
    assert.deepEqual(cagrilar, ['ses:audio/ogg:PTT-WA0003.opus'])
    assert.equal(h.bicim, 'ses')
    assert.equal(h.mime, 'audio/ogg')
    assert.deepEqual(h.bytes, ses, 'the audio itself is kept')
    assert.deepEqual(h.okuma, { tip: 'metin', metin: 'Hocam merhaba, ilacı günde iki kez mi alacağım?', sesMi: true })
  })
  it('sound that could not be transcribed still arrives, unread', async () => {
    const h = await m.hazirla({ ad: 'a.m4a', mime: 'audio/mp4', bytes: Buffer.from('x') }, { ...d(), yaziyaDok: async () => null })
    assert.equal(h.okuma, null)
    assert.equal(h.metin, null)
  })
  it('PDF and JPEG call no converter; JPEG metadata is stripped only from what the model sees', async () => {
    cagrilar.length = 0
    const exif = Buffer.from([0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00])
    const dqt = Buffer.from([0xff, 0xdb, 0x00, 0x04, 0x01, 0x02])
    const sos = Buffer.from([0xff, 0xda, 0x00, 0x04, 0x00, 0x00, 0x11, 0x22, 0xff, 0xd9])
    const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8]), exif, dqt, sos])
    const g = await m.hazirla({ ad: 'ekg.jpg', mime: 'image/jpeg', bytes: jpeg }, d())
    assert.deepEqual(g.bytes, jpeg, 'stored photo keeps its orientation data')
    const okunan = Buffer.from(g.okuma && g.okuma.tip === 'gorsel' ? g.okuma.base64 : '', 'base64')
    assert.deepEqual(okunan, Buffer.concat([Buffer.from([0xff, 0xd8]), dqt, sos]))
    const p = await m.hazirla({ ad: 'lab.pdf', mime: 'application/pdf', bytes: Buffer.from('%PDF-1.4') }, d())
    assert.equal(p.okuma?.tip, 'pdf')
    assert.deepEqual(cagrilar, [])
  })
  it('Word (.docx) text and Excel sheets become readable text', async () => {
    const cfb = XLSX.CFB.utils.cfb_new()
    XLSX.CFB.utils.cfb_add(cfb, 'word/document.xml', Buffer.from('<w:document><w:body><w:p><w:r><w:t>KBB Konsültasyon Yanıtı</w:t></w:r></w:p><w:p><w:r><w:t>İşitme normal &amp; timpanogram tip A</w:t></w:r></w:p></w:body></w:document>'))
    const docx = XLSX.CFB.write(cfb, { type: 'buffer', fileType: 'zip' }) as Buffer
    const w = await m.hazirla({ ad: 'yanit.docx', mime: '', bytes: Buffer.from(docx) }, d())
    assert.equal(w.bicim, 'word')
    assert.match(w.metin || '', /KBB Konsültasyon Yanıtı\nİşitme normal & timpanogram tip A/)

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Test', 'Sonuç', 'Birim'], ['Hemoglobin', '9.1', 'g/dL']]), 'Hemogram')
    const xlsx = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
    const e = await m.hazirla({ ad: 'lab.xlsx', mime: 'application/octet-stream', bytes: xlsx }, d())
    assert.equal(e.bicim, 'excel')
    assert.match(e.metin || '', /Hemoglobin,9.1,g\/dL/)
  })
  it('an unsupported file is refused with a plain sentence', async () => {
    await assert.rejects(m.hazirla({ ad: 'film.mov', mime: 'video/quicktime', bytes: Buffer.from('x') }, d()), /Bu dosya türü eklenemiyor/)
  })
})

describe('sesiYaziyaDok — same provider as muayene recording (ElevenLabs Scribe, Turkish)', () => {
  it('posts scribe_v1 + tr to ElevenLabs and returns the text', async () => {
    process.env.ELEVENLABS_API_KEY = 'sahte-eleven'
    let govde: FormData | null = null, adres = ''
    const f = (async (u: unknown, o?: RequestInit) => { adres = String(u); govde = o?.body as FormData; return new Response(JSON.stringify({ text: ' Sentetik transkript ' }), { status: 200 }) }) as typeof fetch
    const metin = await m.sesiYaziyaDok(Buffer.from('x'), 'audio/ogg', 'a.opus', f)
    assert.equal(metin, 'Sentetik transkript')
    assert.equal(adres, 'https://api.elevenlabs.io/v1/speech-to-text')
    assert.equal(govde!.get('model_id'), 'scribe_v1')
    assert.equal(govde!.get('language_code'), 'tr')
  })
  it('a provider error → null (the item still arrives)', async () => {
    const f = (async () => new Response('{}', { status: 500 })) as unknown as typeof fetch
    assert.equal(await m.sesiYaziyaDok(Buffer.from('x'), 'audio/ogg', 'a.opus', f), null)
  })
})

// ─── Classification mapping ───────────────────────────────────────────────────────────────────────
describe('turEsle — onto the shared belge catalogue only', () => {
  const vakalar: [string, string][] = [
    ['Lab Sonucu', 'Lab Sonucu'], ['Hemogram', 'Lab Sonucu'], ['biyokimya paneli', 'Lab Sonucu'], ['TSH tiroid', 'Lab Sonucu'],
    ['Akciğer grafisi', 'Röntgen'], ['X-ray', 'Röntgen'], ['EKG', 'EKG'], ['12 derivasyon elektrokardiyogram', 'EKG'],
    ['Beyin MR raporu', 'Görüntüleme Raporu'], ['Batın USG', 'Görüntüleme Raporu'], ['KBB konsültasyon yanıtı', 'Konsültasyon raporu'],
    ['Epikriz', 'Epikriz'], ['e-Reçete', 'Reçete'], ['Sevk belgesi', 'Sevk'], ['Patoloji raporu', 'Diğer'], ['fatura', 'Diğer'], ['', 'Diğer'],
  ]
  for (const [ham, beklenen] of vakalar) it(`"${ham}" → ${beklenen}`, () => assert.equal(m.turEsle(ham), beklenen))
  it('never a branch-only type (brans-alan-sizmasi): Yenidoğan Taburculuk Epikrizi → Epikriz', () => {
    assert.equal(m.turEsle('Yenidoğan Taburculuk Epikrizi'), 'Epikriz')
  })
  it('an unread spreadsheet defaults to Lab Sonucu, an unread voice note to Diğer', () => {
    assert.equal(m.turEsle('', 'excel'), 'Lab Sonucu')
    assert.equal(m.bosOkuma('ses', null).belgeTuru, 'Diğer')
  })
  it('okumaCoz tolerates prose around the JSON and keeps only a full 11-digit TC', () => {
    const o = m.okumaCoz('Tamam:\n{"belge_turu":"Hemogram","ozet":"Hemogram — Hb düşük","hasta_ad_soyad":"QA Hasta Deneme","hasta_dogum_tarihi":"01.03.2019","tc_kimlik":"100 000 001 46","tc_son_haneler":null,"belge_tarihi":"2026-09-24","konsultasyon_yaniti":false}', 'pdf', null)
    assert.equal(o.belgeTuru, 'Lab Sonucu')
    assert.equal(o.ozet, 'Hemogram — Hb düşük')
    assert.equal(o.kimlik.dogum, '2019-03-01')
    assert.equal(o.kimlik.tc, '10000000146')
    assert.equal(o.okundu, true)
    const bos = m.okumaCoz('okuyamadım', 'gorsel', null)
    assert.equal(bos.okundu, false)
    assert.equal(bos.ozet, 'Fotoğraf')
  })
})

// ─── Patient matching ─────────────────────────────────────────────────────────────────────────────
describe('hastaOner — this doctor’s patients, plain certainty', () => {
  const tcH = (tc: string) => [createHash('sha256').update(tc).digest('hex')]
  const aday = (id: string, ad: string, dogum: string | null, o: Partial<{ tcHash: string; telefon: string; eposta: string }> = {}) => ({ id, ad, dogum, tcHash: o.tcHash ?? null, telefon: o.telefon ?? null, eposta: o.eposta ?? null })
  const bos = { ad: null, dogum: null, tc: null, tcSon: null }

  it('name + birth date → Eminim', () => {
    const r = m.hastaOner({ kimlik: { ...bos, ad: 'QA Çiğdem Yılmaz', dogum: '2019-03-01' }, adaylar: [aday('1', 'QA Çiğdem Yılmaz', '2019-03-01'), aday('2', 'QA Mehmet Kaya', '1980-01-01')], tcHashleri: tcH })
    assert.equal(r[0].patient_id, '1')
    assert.equal(r[0].kesinlik, 'eminim')
    assert.equal(r.length, 1)
  })
  it('Turkish letters folded, one OCR slip tolerated: "CIGDEM YILMEZ" finds "Çiğdem Yılmaz"', () => {
    const r = m.hastaOner({ kimlik: { ...bos, ad: 'Hasta Adı: CIGDEM YILMEZ' }, adaylar: [aday('1', 'Çiğdem Yılmaz', null)], tcHashleri: tcH })
    assert.equal(r[0]?.patient_id, '1')
    assert.equal(r[0].kesinlik, 'kontrol', 'name alone is never Eminim')
  })
  it('full TC matching the stored hash → Eminim even without a name', () => {
    const r = m.hastaOner({ kimlik: { ...bos, tc: '10000000146' }, adaylar: [aday('1', 'QA Biri', null, { tcHash: tcH('10000000146')[0] }), aday('2', 'QA Diğeri', null)], tcHashleri: tcH })
    assert.deepEqual(r.map((x) => [x.patient_id, x.kesinlik]), [['1', 'eminim']])
  })
  it('an invalid TC checksum adds nothing', () => {
    const r = m.hastaOner({ kimlik: { ...bos, tc: '12345678901' }, adaylar: [aday('1', 'QA Biri', null, { tcHash: tcH('12345678901')[0] })], tcHashleri: tcH })
    assert.deepEqual(r, [])
  })
  it('same name, different birth date → not suggested', () => {
    const r = m.hastaOner({ kimlik: { ...bos, ad: 'QA Ali Demir', dogum: '2015-05-05' }, adaylar: [aday('1', 'QA Ali Demir', '1970-02-02')], tcHashleri: tcH })
    assert.deepEqual(r, [])
  })
  it('two patients with the same name and no birth date → both, both "Kontrol edin"', () => {
    const r = m.hastaOner({ kimlik: { ...bos, ad: 'QA Ayşe Kara' }, adaylar: [aday('1', 'QA Ayşe Kara', '2000-01-01'), aday('2', 'QA Ayşe Kara', '1990-01-01')], tcHashleri: tcH })
    assert.equal(r.length, 2)
    assert.ok(r.every((x) => x.kesinlik === 'kontrol'))
  })
  it('sender phone (WhatsApp) + name → Eminim; at most three suggestions', () => {
    const r = m.hastaOner({ kimlik: { ...bos, ad: 'QA Deniz Ak' }, gonderen: { telefon: '+90 555 000 00 01' }, adaylar: [aday('1', 'QA Deniz Ak', null, { telefon: '05550000001' })], tcHashleri: tcH })
    assert.equal(r[0].kesinlik, 'eminim')
    const cok = m.hastaOner({ kimlik: { ...bos, ad: 'Yılmaz' }, adaylar: ['1', '2', '3', '4', '5'].map((i) => aday(i, `QA${i} Yılmaz`, null)), tcHashleri: tcH })
    assert.ok(cok.length <= 3)
  })
})

// ─── Staff gating ─────────────────────────────────────────────────────────────────────────────────
describe('gelenBelgeErisimi — doctor-only by default, secretary only with the switch', () => {
  it('pure rule', () => {
    assert.equal(m.gelenBelgeErisimi('doktor', false), true)
    assert.equal(m.gelenBelgeErisimi('sekreter', false), false)
    assert.equal(m.gelenBelgeErisimi('sekreter', null), false)
    assert.equal(m.gelenBelgeErisimi('sekreter', true), true)
  })
})

// ─── Server flow on the in-memory database ────────────────────────────────────────────────────────
function sahne() {
  db = new SahteVeritabani()
  const hekim = (h: string) => {
    const id = randomUUID(), token = `qa-gelen-${h}`
    db.kullanicilar.set(token, { id })
    db.ekle('users', { id, full_name: `QA Hekim ${h}`, specialty: h === 'A' ? 'kardiyoloji' : 'pediatri', gelen_belge_sekreter: false })
    const hasta = db.ekle('patients', { doctor_id: id, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad: 'QA Ortak İsim' })), dob_encrypted: encrypt('2019-03-01'), tc_kimlik_hash: null }).id
    return { id, token, hasta }
  }
  const A = hekim('A'), B = hekim('B')
  const sekreterToken = 'qa-gelen-sekreter'
  const sekreterId = randomUUID()
  db.kullanicilar.set(sekreterToken, { id: sekreterId })
  db.ekle('personel', { id: randomUUID(), user_id: sekreterId, doktor_id: A.id, aktif: true })
  return { A, B, sekreterToken }
}
const okuyucu = (kimlik: { ad?: string; dogum?: string }) => async () => ({
  ozet: 'Hemogram — Hb düşük', belgeTuru: 'Lab Sonucu', metin: null, okundu: true, belgeTarihi: null, konsultasyonYaniti: false,
  kimlik: { ad: kimlik.ad ?? null, dogum: kimlik.dogum ?? null, tc: null, tcSon: null },
})
const pdf = (icerik = 'sentetik-lab') => ({ ad: 'lab.pdf', mime: 'application/pdf', bytes: Buffer.from(`%PDF-1.4 ${icerik}`) })

describe('gelenBelgeEkle / dosyala / sil / temizle', () => {
  it('stores privately under the doctor, suggests only the doctor’s own same-named patient, shows a duplicate once', async () => {
    const { A, B } = sahne()
    const sb = db.istemci() as never
    const s1 = await m.gelenBelgeEkle({ supabase: sb, doktorId: A.id, kaynak: 'surukle', dosya: pdf(), bagimlilik: { okuyucu: okuyucu({ ad: 'QA Ortak İsim', dogum: '2019-03-01' }) } })
    assert.equal(s1.durum, 'eklendi')
    const satir = db.tablo('gelen_belgeler')[0]
    assert.equal(satir.doctor_id, A.id)
    assert.ok(String(satir.depo_yolu).startsWith(`${A.id}/gelen/`))
    assert.ok(db.depolama.get('hasta-belgeler')?.has(satir.depo_yolu))
    assert.deepEqual(satir.oneriler.map((o: { patient_id: string }) => o.patient_id), [A.hasta], 'never the other doctor’s patient with the same name')
    assert.ok(!String(satir.okuma_sifreli).includes('Hemogram'), 'reading is stored encrypted')

    const s2 = await m.gelenBelgeEkle({ supabase: sb, doktorId: A.id, kaynak: 'yukleme', dosya: pdf(), bagimlilik: { okuyucu: okuyucu({}) } })
    assert.equal(s2.durum, 'zaten_var')
    assert.equal(db.tablo('gelen_belgeler').length, 1)
    // The same bytes for ANOTHER doctor are that doctor's own item.
    const s3 = await m.gelenBelgeEkle({ supabase: sb, doktorId: B.id, kaynak: 'yukleme', dosya: pdf(), bagimlilik: { okuyucu: okuyucu({}) } })
    assert.equal(s3.durum, 'eklendi')

    const liste = await m.gelenleriListele(sb, A.id)
    assert.equal(liste.ogeler.length, 1)
    assert.equal(liste.ogeler[0].ozet, 'Hemogram — Hb düşük')
    assert.equal(liste.ogeler[0].oneriler[0].ad, 'QA Ortak İsim')
    assert.equal(liste.ogeler[0].oneriler[0].kesinlik, 'eminim')
    assert.match(String(liste.ogeler[0].url), /\/object\/sign\//, 'signed URL, never a public one')
  })

  it('before migration 099 it fails soft', async () => {
    const hatali = { from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ neq: () => ({ limit: () => ({ maybeSingle: async () => ({ data: null, error: { message: 'relation "gelen_belgeler" does not exist' } }) }) }) }) }) }) }) }
    const s = await m.gelenBelgeEkle({ supabase: hatali as never, doktorId: randomUUID(), kaynak: 'yukleme', dosya: pdf() })
    assert.equal(s.durum, 'hazir_degil')
  })

  it('too big / unsupported files are refused with a plain sentence', async () => {
    const { A } = sahne()
    const sb = db.istemci() as never
    const buyuk = await m.gelenBelgeEkle({ supabase: sb, doktorId: A.id, kaynak: 'yukleme', dosya: { ad: 'a.pdf', mime: 'application/pdf', bytes: Buffer.alloc(4 * 1024 * 1024 + 1) } })
    assert.deepEqual(buyuk, { durum: 'gecersiz', hata: 'Bu dosya çok büyük (en fazla 4 MB).' })
    const tur = await m.gelenBelgeEkle({ supabase: sb, doktorId: A.id, kaynak: 'yukleme', dosya: { ad: 'a.zip', mime: 'application/zip', bytes: Buffer.from('x') } })
    assert.equal(tur.durum, 'gecersiz')
  })

  it('Dosyaya ekle: vault document + hasta_belgeler row + audit, item marked filed, inbox copy removed', async () => {
    const { A } = sahne()
    const sb = db.istemci() as never
    const s = await m.gelenBelgeEkle({ supabase: sb, doktorId: A.id, kaynak: 'kamera', dosya: pdf(), bagimlilik: { okuyucu: okuyucu({}) } })
    assert.equal(s.durum, 'eklendi')
    const id = (s as { id: string }).id
    const yol = db.tablo('gelen_belgeler')[0].depo_yolu
    const r = await m.dosyala(sb, { doktorId: A.id, id, patientId: A.hasta, isleyen: { userId: A.id, personelId: null, rol: 'doktor' }, brans: 'kardiyoloji' })
    assert.equal(r.ok, true)
    const belge = db.tablo('medical_documents').find((x) => x.patient_id === A.hasta)
    assert.ok(belge, 'vault document created')
    assert.equal(belge!.category, 'Lab Sonucu')
    assert.ok(db.bloblar.has(belge!.id), 'bytes in the encrypted vault')
    const hb = db.tablo('hasta_belgeler').find((x) => x.patient_id === A.hasta)
    assert.equal(hb?.dosya_url, `kasa:${belge!.id}`)
    const satir = db.tablo('gelen_belgeler')[0]
    assert.equal(satir.durum, 'dosyalandi')
    assert.equal(satir.dosyalayan_user_id, A.id)
    assert.equal(satir.medical_document_id, belge!.id)
    assert.equal(satir.depo_yolu, null)
    assert.equal(db.depolama.get('hasta-belgeler')?.has(yol), false)
    assert.ok(db.tablo('audit_logs').some((a) => a.resource_id === id && a.new_values?.kaynak === 'kamera'))
    // Filed = no longer in the inbox, and cannot be filed twice.
    assert.equal((await m.gelenleriListele(sb, A.id)).ogeler.length, 0)
    const tekrar = await m.dosyala(sb, { doktorId: A.id, id, patientId: A.hasta, isleyen: { userId: A.id, personelId: null, rol: 'doktor' }, brans: 'kardiyoloji' })
    assert.equal(tekrar.ok, false)
  })

  it('another doctor’s patient or item → 404; a branch-only type on another branş → 400', async () => {
    const { A, B } = sahne()
    const sb = db.istemci() as never
    const s = await m.gelenBelgeEkle({ supabase: sb, doktorId: A.id, kaynak: 'yukleme', dosya: pdf(), bagimlilik: { okuyucu: okuyucu({}) } })
    const id = (s as { id: string }).id
    const isleyen = { userId: A.id, personelId: null, rol: 'doktor' as const }
    const yabanciHasta = await m.dosyala(sb, { doktorId: A.id, id, patientId: B.hasta, isleyen, brans: 'kardiyoloji' })
    assert.deepEqual(yabanciHasta, { ok: false, durum: 404, hata: 'Hasta bulunamadı.' })
    const yabanciOge = await m.dosyala(sb, { doktorId: B.id, id, patientId: B.hasta, isleyen: { ...isleyen, userId: B.id }, brans: 'pediatri' })
    assert.equal(yabanciOge.ok, false)
    const tur = await m.dosyala(sb, { doktorId: A.id, id, patientId: A.hasta, belgeTuru: 'Yenidoğan Taburculuk Epikrizi', isleyen, brans: 'kardiyoloji' })
    assert.deepEqual(tur, { ok: false, durum: 400, hata: 'Bu belge türü branşınız için kullanılamaz.' })
    assert.equal(db.tablo('medical_documents').length, 0)
  })

  it('Sil removes the file and the content; the 30-day clean-up destroys old unfiled items only', async () => {
    const { A } = sahne()
    const sb = db.istemci() as never
    const s = await m.gelenBelgeEkle({ supabase: sb, doktorId: A.id, kaynak: 'yukleme', dosya: pdf('bir'), bagimlilik: { okuyucu: okuyucu({}) } })
    const id = (s as { id: string }).id
    assert.deepEqual(await m.sil(sb, { doktorId: A.id, id, isleyen: { userId: A.id, personelId: null, rol: 'doktor' } }), { ok: true })
    const silinen = db.tablo('gelen_belgeler').find((x) => x.id === id)!
    assert.equal(silinen.durum, 'silindi')
    assert.equal(silinen.okuma_sifreli, null)
    // Deleted → the same file may arrive again as a new item.
    assert.equal((await m.gelenBelgeEkle({ supabase: sb, doktorId: A.id, kaynak: 'yukleme', dosya: pdf('bir'), bagimlilik: { okuyucu: okuyucu({}) } })).durum, 'eklendi')

    const eski = await m.gelenBelgeEkle({ supabase: sb, doktorId: A.id, kaynak: 'yukleme', dosya: pdf('eski'), bagimlilik: { okuyucu: okuyucu({}) } })
    const eskiSatir = db.tablo('gelen_belgeler').find((x) => x.id === (eski as { id: string }).id)!
    eskiSatir.created_at = new Date(Date.now() - 31 * 86400e3).toISOString()
    const eskiYol = eskiSatir.depo_yolu
    silinen.silindi_at = new Date(Date.now() - 31 * 86400e3).toISOString()
    const t = await m.gelenleriTemizle(sb)
    assert.equal(t.silinen, 2)
    assert.equal(db.tablo('gelen_belgeler').filter((x) => x.durum === 'yeni').length, 1, 'the recent item stays')
    assert.equal(db.depolama.get('hasta-belgeler')?.has(eskiYol), false)
  })
})

describe('routes: staff gating enforced on the server', () => {
  const iste = (yontem: string, yol: string, token: string, govde?: unknown) => new NextRequestSinifi(`http://localhost${yol}`, {
    method: yontem, headers: { authorization: `Bearer ${token}`, ...(govde ? { 'content-type': 'application/json' } : {}) },
    body: govde ? JSON.stringify(govde) : undefined,
  })

  it('secretary: 403 while the switch is off, allowed once the doctor turns it on; only the doctor can flip it', async () => {
    const { A, sekreterToken } = sahne()
    const rota = await import('../../app/api/doktor/gelen-belgeler/route')
    const ayar = await import('../../app/api/doktor/gelen-belgeler/ayar/route')

    const kapali = await rota.GET(iste('GET', '/api/doktor/gelen-belgeler', sekreterToken))
    assert.equal(kapali.status, 403)
    const sayi = await (await rota.GET(iste('GET', '/api/doktor/gelen-belgeler?sayi=1', sekreterToken))).json()
    assert.deepEqual(sayi, { sayi: 0, erisim: false })
    const sekreterAyar = await ayar.POST(iste('POST', '/api/doktor/gelen-belgeler/ayar', sekreterToken, { acik: true }))
    assert.equal(sekreterAyar.status, 403, 'a secretary cannot open access for themself')

    const ac = await ayar.POST(iste('POST', '/api/doktor/gelen-belgeler/ayar', A.token, { acik: true }))
    assert.equal(ac.status, 200)
    const acik = await rota.GET(iste('GET', '/api/doktor/gelen-belgeler', sekreterToken))
    assert.equal(acik.status, 200)
    const j = await acik.json()
    assert.equal(j.rol, 'sekreter')
    assert.ok(Array.isArray(j.turler) && !j.turler.includes('Yenidoğan Taburculuk Epikrizi'), 'kardiyoloji never sees the pediatri-only type')
  })

  it('doctor: pasted text arrives as a text document', async () => {
    const { A } = sahne()
    const rota = await import('../../app/api/doktor/gelen-belgeler/route')
    const y = await rota.POST(iste('POST', '/api/doktor/gelen-belgeler', A.token, { metin: 'Hemoglobin 9,1 g/dL (12-16)\nLökosit 7,2 10^3/µL', kaynak: 'yapistir' }))
    assert.equal(y.status, 201)
    const satir = db.tablo('gelen_belgeler')[0]
    assert.equal(satir.kaynak, 'yapistir')
    assert.equal(satir.mime, 'text/plain')
    assert.equal(satir.bicim, 'metin')
  })
})
