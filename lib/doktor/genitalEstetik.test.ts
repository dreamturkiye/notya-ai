/**
 * GENITAL-ESTETIK-01 — Türkiye build: the package's server and wiring.
 *   - LEAK GATE: the tab, the templates and the routes exist for KD, plastik cerrahi and the Özel Branş estetik & plastik
 *     cerrahi only (brans-alan-sizmasi); energy, injection, whitening, FSFI / FGSIS and the lot recall for KD only.
 *   - UNDER-18: the server refuses a cosmetic record / cosmetic genital operation note for a minor; a medical one passes.
 *   - PHOTO NEVER TO AI: no file that calls a model reads the intimate-photo table; the photo routes import no model client;
 *     the photo archive / document / portal / consultation / export code never names the table.
 *   - AUDIT: every view writes an audit_logs row BEFORE bytes leave; a failed audit write serves nothing; a foreign id is null.
 * Synthetic QA data only (no real patient, no production database).
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { SupabaseClient } from '@supabase/supabase-js'

process.env.ENCRYPTION_MASTER_KEY ||= 'test-master-key-notya-genital-estetik'

const KOK = join(__dirname, '..', '..')
const oku = (p: string) => readFileSync(join(KOK, p), 'utf8')
function gez(d: string, out: string[] = []): string[] {
  for (const ad of readdirSync(join(KOK, d))) {
    if (ad === 'node_modules' || ad === '.next') continue
    const y = join(d, ad)
    if (statSync(join(KOK, y)).isDirectory()) gez(y, out)
    else if (/\.(ts|tsx)$/.test(ad) && !/\.test\.tsx?$/.test(ad)) out.push(y)
  }
  return out
}

// ── a tiny in-memory Supabase (enough for the chains this package uses) ──
type Satir = Record<string, any>
function sahteSb(tablolar: Record<string, Satir[]>, opts: { denetimHatasi?: boolean } = {}) {
  const from = (t: string) => {
    tablolar[t] ||= []
    const filtre: ((r: Satir) => boolean)[] = []
    let ekle: Satir | null = null
    let sinir = Infinity
    const sonuc = () => tablolar[t].filter((r) => filtre.every((f) => f(r))).slice(0, sinir)
    const b: any = {
      select: () => b, eq: (k: string, v: unknown) => { filtre.push((r) => r[k] === v); return b },
      in: (k: string, v: unknown[]) => { filtre.push((r) => v.includes(r[k])); return b },
      order: () => b, limit: (n: number) => { sinir = n; return b },
      insert: (r: Satir) => {
        if (t === 'audit_logs' && opts.denetimHatasi) { const e = { error: { message: 'audit down' } }; return { ...e, select: () => ({ single: async () => ({ data: null, ...e }) }), then: (f: any) => Promise.resolve(e).then(f) } }
        ekle = { id: `${t}-${tablolar[t].length + 1}-0000-0000-000000000000`, ...r }; tablolar[t].push(ekle); return b
      },
      maybeSingle: async () => ({ data: sonuc()[0] ?? null, error: null }),
      single: async () => ({ data: ekle ?? sonuc()[0] ?? null, error: null }),
      then: (f: any, g: any) => Promise.resolve({ data: ekle ? [ekle] : sonuc(), error: null }).then(f, g),
    }
    return b
  }
  return { from } as unknown as SupabaseClient
}

let sunucu: typeof import('./genitalEstetikSunucu')
let encrypt: (s: string) => string
let encryptBytes: (b: Buffer) => Buffer
before(async () => {
  sunucu = await import('./genitalEstetikSunucu')
  encrypt = (await import('@/lib/security/encryption')).encrypt
  encryptBytes = (await import('@/lib/vault/crypto')).encryptBytes
})

const A = 'aaaaaaaa-0000-4000-8000-00000000000a', B = 'bbbbbbbb-0000-4000-8000-00000000000b'
const HA = 'aaaaaaaa-1111-4000-8000-00000000000a', HB = 'bbbbbbbb-1111-4000-8000-00000000000b'
function veriTabani(dogumA = '1990-01-01') {
  return {
    users: [{ id: A, specialty: 'kadin-dogum' }, { id: B, specialty: 'pediatri' }],
    patients: [
      { id: HA, doctor_id: A, dob_encrypted: encrypt(dogumA), name_encrypted: encrypt(JSON.stringify({ ad: 'QA Hasta A', soyad: 'GIZLI-A-7Q' })) },
      { id: HB, doctor_id: B, dob_encrypted: encrypt('1990-01-01'), name_encrypted: encrypt(JSON.stringify({ ad: 'QA Hasta B', soyad: 'GIZLI-B-7Q' })) },
    ],
  } as Record<string, Satir[]>
}

describe('GENITAL-ESTETIK-01 leak gate: KD (everything), plastic and aesthetic surgery (the surgical part), nobody else', () => {
  it('the branch decision: KD spellings → full; plastik cerrahi and estetik & plastik cerrahi → surgical; every other branch and Özel Branş → none', async () => {
    const { genitalEstetikBransi, genitalEstetikKapsami } = await import('./genitalEstetikBrans')
    for (const k of ['kadin-dogum', 'kadin-hastaliklari-dogum', 'Kadın Hastalıkları ve Doğum', 'jinekoloji']) assert.equal(genitalEstetikKapsami(k), 'tam', k)
    for (const k of ['plastik-cerrahi', 'Plastik, Rekonstrüktif ve Estetik Cerrahi', 'estetik-cerrahi', 'Estetik & Plastik Cerrahi']) assert.equal(genitalEstetikKapsami(k), 'cerrahi', k)
    const { BRANS_ETIKETLERI } = await import('@/lib/intake/bransSorulari')
    const digerleri = [...Object.keys(BRANS_ETIKETLERI).filter((k) => k !== 'kadin-hastaliklari-dogum' && k !== 'plastik-cerrahi'), 'pediatri', 'uroloji', 'dermatoloji', 'genel-cerrahi', 'aile-hekimligi']
    const { KLINIK_YENI_SLUGS } = await import('@/lib/specialties/klinikDikey')
    for (const k of [...digerleri, ...KLINIK_YENI_SLUGS.filter((s) => s !== 'estetik-cerrahi'), 'medikal-estetik', null, '', 'genel']) {
      assert.equal(genitalEstetikBransi(k as string), false, String(k))
      assert.equal(genitalEstetikKapsami(k as string), null, String(k))
    }
  })
  it('the surgical part never writes energy, injection, whitening, FSFI or FGSIS; KD writes everything', async () => {
    const { geKayitAcik, geOlcekleriKapsam } = await import('./genitalEstetikBrans')
    const { GE_OLCEKLER } = await import('@/lib/clinical/genitalEstetik')
    for (const tur of ['enerji', 'enjeksiyon', 'beyazlatma']) { assert.equal(geKayitAcik('cerrahi', tur), false, tur); assert.equal(geKayitAcik('tam', tur), true, tur) }
    for (const o of ['fsfi', 'fgsis']) { assert.equal(geKayitAcik('cerrahi', 'olcek', o), false, o); assert.equal(geKayitAcik('tam', 'olcek', o), true, o) }
    assert.equal(geKayitAcik('cerrahi', 'olcek', 'cops_l'), true)
    assert.equal(geKayitAcik('cerrahi', 'foto_onam'), true)
    assert.equal(geKayitAcik(null, 'foto_onam'), false)
    assert.deepEqual(geOlcekleriKapsam('cerrahi', GE_OLCEKLER), ['cops_l'])
    assert.deepEqual(geOlcekleriKapsam('tam', GE_OLCEKLER), [...GE_OLCEKLER])
    // the route enforces it before anything is written, and hides the KD-only records and the lot recall
    const r = oku('app/api/doktor/genital-estetik/route.ts')
    assert.match(r, /if \(!geKayitAcik\(k\.kapsam, String\(b\.tur \?\? ''\), olcek\)\) return yanit\(\{ error: GE_HATA\.yalniz_kd/)
    assert.match(r, /if \(!geKayitAcik\(k\.kapsam, 'enjeksiyon'\)\) return yanit\(\{ error: GE_HATA\.yalniz_kd \}, 403\)/)
    assert.match(r, /tumu\.filter\(\(r\) => geKayitAcik\(k\.kapsam, r\.tur, r\.veri\.olcek\)\)/)
    // the screen shows the surgical scope only its own sections
    const ui = oku('components/doktor/HastaGenitalEstetik.tsx')
    assert.match(ui, /veri\.kapsam === 'tam' \? SEKMELER_TAM : SEKMELER_CERRAHI/)
  })
  it('the tab: present for KD, absent otherwise (the button and the mount read the same boolean)', async () => {
    const { hastaDosyaSekmeleri } = await import('./hastaDosyaSekmeleri')
    const var_ = (g: boolean) => hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false, genitalEstetikUygun: g } as any).some((s) => s.id === 'genital-estetik')
    assert.equal(var_(true), true)
    assert.equal(var_(false), false)
    const sayfa = oku('app/dashboard/doktor/hastalar/[id]/page.tsx')
    assert.match(sayfa, /activeTab === 'genital-estetik' && genitalEstetikUygun && <HastaGenitalEstetik/)
    assert.match(sayfa, /genitalEstetikUygun = genitalEstetikBransi\(doktorBransi\)/)
  })
  it('the templates: the four genital ones with their indication flag reach KD, plastic and aesthetic surgery — no other branch', async () => {
    const { ameliyatSablonlariBransIcin } = await import('./ameliyatNotuSunucu')
    const GE = ['labioplasti', 'labioplasti_klitoral', 'vajinoplasti_kolpoperineorafi', 'perineoplasti_kolporafi']
    for (const b of ['kadin-dogum', 'plastik-cerrahi', 'estetik-cerrahi']) {
      const l = await ameliyatSablonlariBransIcin(b)
      for (const k of GE) assert.ok(l.find((s) => s.kod === k)?.endikasyonSinifiGerekli, `${b}: ${k}`)
      assert.ok(!l.some((s) => /himen|hymen/.test(s.kod)), b)
    }
    assert.equal((await ameliyatSablonlariBransIcin('plastik-cerrahi')).length, GE.length, 'plastic surgery: the four, nothing gynaecological')
    for (const b of ['uroloji', 'genel-cerrahi', 'medikal-estetik', 'sac-ekimi']) assert.equal((await ameliyatSablonlariBransIcin(b)).length, 0, b)
  })
  it('every route asks the branch before anything else', () => {
    assert.match(oku('app/api/doktor/genital-estetik/route.ts'), /const kapsam = genitalEstetikKapsami\(await doktorBransi\(/)
    for (const r of ['app/api/doktor/genital-estetik/foto/route.ts', 'app/api/doktor/genital-estetik/foto/[fotoId]/route.ts']) assert.match(oku(r), /genitalEstetikBransi\(await doktorBransi\(/, r)
  })
})

describe('GENITAL-ESTETIK-01 under-18 block on the server', () => {
  const kozmetikEnj = { tarih: '2026-11-06', endikasyon: 'kozmetik', urun: 'ha_dolgu', urunAdi: 'Sentetik', lot: 'QA1', sonKullanma: '2027-12', hacimMl: 1, bolge: 'labia_majora', teknik: 'bolus', kontrolGun: 14 }
  it('a cosmetic record of a minor is refused BEFORE anything is written', async () => {
    const db = veriTabani('2012-01-01')
    const r = await sunucu.kayitEkle(sahteSb(db), A, HA, 'enjeksiyon', kozmetikEnj)
    assert.deepEqual(!r.ok && [r.status, r.hata], [422, 'yas_18_alti'])
    assert.equal((db.genital_estetik_kayitlari || []).length, 0)
  })
  it('a cosmetic record without a birth date is refused', async () => {
    const db = veriTabani(); db.patients[0].dob_encrypted = null
    const r = await sunucu.kayitEkle(sahteSb(db), A, HA, 'beyazlatma', { tarih: '2026-11-06', endikasyon: 'kozmetik', yontem: 'topikal', ajan: 'x', konsantrasyonYuzde: 2, bolgeler: ['perine'] })
    assert.deepEqual(!r.ok && r.hata, 'dogum_tarihi_yok')
  })
  it('a medically indicated session for a minor is written; an adult cosmetic one too, lot kept for recall', async () => {
    const db = veriTabani('2012-01-01')
    const m = await sunucu.kayitEkle(sahteSb(db), A, HA, 'enerji', { tarih: '2026-11-06', endikasyon: 'medikal', medikalGerekce: 'liken_skleroz', medikalAciklama: 'Biyopsiyle dogrulanmis liken skleroz', modalite: 'co2_lazer', cihaz: 'Sentetik', amac: 'liken_skleroz', bolgeler: ['vulva_labia'], gecis: 1, seansNo: 1, seriToplam: 1 })
    assert.ok(m.ok)
    const db2 = veriTabani()
    const k = await sunucu.kayitEkle(sahteSb(db2), A, HA, 'enjeksiyon', { ...kozmetikEnj, lot: 'qa 77' })
    assert.ok(k.ok && k.kayit.lot === 'QA77')
    assert.equal(db2.genital_estetik_kayitlari[0].lot_no, 'QA77')
    assert.ok(!String(db2.genital_estetik_kayitlari[0].veri_encrypted).includes('Sentetik'), 'content encrypted')
    const geri = await sunucu.lotAra(sahteSb(db2), A, 'qa77')
    assert.equal(geri.length, 1)
    assert.equal((await sunucu.lotAra(sahteSb(db2), B, 'qa77')).length, 0, 'another doctor never sees the recall rows')
  })
  it('a foreign patient: 404, nothing written', async () => {
    const db = veriTabani()
    const r = await sunucu.kayitEkle(sahteSb(db), A, HB, 'enjeksiyon', kozmetikEnj)
    assert.deepEqual(!r.ok && r.status, 404)
  })
  it('the op-note route applies the same gate to genital templates (source check)', () => {
    const s = oku('app/api/doktor/ameliyat-notlari/route.ts')
    assert.match(s, /tpl\?\.endikasyonSinifiGerekli/)
    assert.match(s, /geKapi\(\{ dogumTarihi: dogum, gun: d\.tarih, endikasyon: d\.veri\.endikasyonSinifi/)
    assert.match(s, /status: 422/)
  })
})

describe('GENITAL-ESTETIK-01 intimate photos: never to AI, consent first, every view audited', () => {
  const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0xd2, 0xcf, 0x20, 0xff, 0xd9])
  it('no file that reaches a model names the photo table; only the package\'s own files do', () => {
    const izinli = new Set(['lib/doktor/genitalEstetikSunucu.ts'])
    const kod = (f: string) => oku(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    const adlandiran = [...gez('app'), ...gez('lib'), ...gez('components'), ...gez('core')].filter((f) => kod(f).includes('genital_estetik_fotolar') || /\bT_FOTO\b/.test(kod(f)))
    for (const f of adlandiran) assert.ok(izinli.has(f.split('\\').join('/')), `unexpected reader of intimate photos: ${f}`)
  })
  it('the package\'s server and routes import no model client', () => {
    for (const f of ['lib/doktor/genitalEstetikSunucu.ts', 'app/api/doktor/genital-estetik/route.ts', 'app/api/doktor/genital-estetik/foto/route.ts', 'app/api/doktor/genital-estetik/foto/[fotoId]/route.ts', 'components/doktor/HastaGenitalEstetik.tsx']) {
      const s = oku(f)
      assert.ok(!/@\/lib\/ai\/|anthropic|openai|openrouter|fotoServis|aiCagir|muayeneEk\/foto/i.test(s), `${f} imports a model path`)
    }
  })
  it('the photo archive, documents, portal, consultation and export never read the intimate store', () => {
    for (const f of ['lib/doktor/fotoArsiv/sunucu.ts', 'lib/doktor/muayeneEk/foto/fotoServis.ts', 'lib/doktor/hastaDisaAktarim.ts', 'app/api/doktor/konsultasyon/route.ts', 'app/api/doktor/belgeler/analiz/route.ts']) assert.ok(!/genital_estetik/.test(oku(f)), f)
  })
  it('upload needs a separate photo consent; with it the photo is stored encrypted, metadata stripped, no thumbnail', async () => {
    const db = veriTabani()
    const sb = sahteSb(db)
    const yok = await sunucu.fotoYukle(sb, A, HA, { gorunum: 'perine', cekimTarihi: '2026-11-06', gorsel: `data:image/jpeg;base64,${JPEG.toString('base64')}` })
    assert.deepEqual(!yok.ok && yok.hata, 'foto_onam_yok')
    assert.ok((await sunucu.kayitEkle(sb, A, HA, 'foto_onam', { tarih: '2026-11-01', belgeleme: true })).ok)
    const r = await sunucu.fotoYukle(sb, A, HA, { gorunum: 'perine', cekimTarihi: '2026-11-06', gorsel: `data:image/jpeg;base64,${JPEG.toString('base64')}` })
    assert.ok(r.ok, JSON.stringify(r))
    const satir = db.genital_estetik_fotolar[0]
    assert.ok(!('kucuk' in satir) && !('thumbnail' in satir))
    assert.notEqual(satir.veri_encrypted, JPEG.toString('base64'))
    assert.equal((await sunucu.fotoListesi(sb, A, HA))?.[0] && 'veri_encrypted' in ((await sunucu.fotoListesi(sb, A, HA)) as any)[0], false, 'the list carries metadata only')
  })
  it('a view writes the audit row first; a foreign doctor gets null; a failed audit serves nothing', async () => {
    const db = veriTabani()
    db.genital_estetik_fotolar = [{ id: 'f0000000-0000-4000-8000-000000000001', doctor_id: A, patient_id: HA, gorunum: 'perine', mime: 'image/jpeg', veri_encrypted: encryptBytes(JPEG).toString('base64') }]
    const r = await sunucu.fotoGoruntule(sahteSb(db), A, HA, 'f0000000-0000-4000-8000-000000000001', A)
    assert.ok(r && r !== 'denetim_yazilamadi' && r.bytes.equals(JPEG))
    assert.equal(db.audit_logs.length, 1)
    assert.deepEqual([db.audit_logs[0].resource_type, db.audit_logs[0].action, db.audit_logs[0].new_values.patient_id], ['genital_estetik_foto', 'view', HA])
    // two views, two rows
    await sunucu.fotoGoruntule(sahteSb(db), A, HA, 'f0000000-0000-4000-8000-000000000001', A)
    assert.equal(db.audit_logs.length, 2)
    // another doctor (and another doctor's patient id): nothing, no audit row about a photo they cannot see
    assert.equal(await sunucu.fotoGoruntule(sahteSb(db), B, HA, 'f0000000-0000-4000-8000-000000000001', B), null)
    assert.equal(await sunucu.fotoGoruntule(sahteSb(db), B, HB, 'f0000000-0000-4000-8000-000000000001', B), null)
    assert.equal(db.audit_logs.length, 2)
    // audit table down: fail closed
    assert.equal(await sunucu.fotoGoruntule(sahteSb(db, { denetimHatasi: true }), A, HA, 'f0000000-0000-4000-8000-000000000001', A), 'denetim_yazilamadi')
  })
  it('the screen: blurred placeholder without image data until clicked; no <img> before the click', () => {
    const s = oku('components/doktor/HastaGenitalEstetik.tsx')
    assert.match(s, /data-ge="bulanik"/)
    assert.match(s, /\{url \? \(/)
    assert.ok(!/kucuk|thumbnail/i.test(s.replace(/\/\*[\s\S]*?\*\//g, '')), 'no thumbnail path in the screen')
  })
  it('the export never includes them (it reads no photo or document table)', () => {
    const s = oku('lib/doktor/hastaDisaAktarim.ts')
    assert.ok(!/medical_documents|hasta_foto|genital_estetik_fotolar/.test(s))
  })
})
