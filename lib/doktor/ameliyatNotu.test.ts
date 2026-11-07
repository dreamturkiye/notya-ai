/**
 * OP-DR-01 + AMELIYAT-NOTU-01 (2026-11-05): the stored title on every printout, the operation-note shell (core for every
 * surgical branch), and the KD templates that never leave KD.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { SupabaseClient } from '@supabase/supabase-js'
import { hekimAdi, hekimUnvanli, hekimUnvanliSatirdan, kayitliUnvan } from './hekimAdi'
import { DOKTOR_UNVANLARI } from '../address'
import {
  AMELIYAT_NOTU_BRANSLARI, AMELIYAT_NOTU_OZEL_BRANSLARI, BOS_AMELIYAT_NOTU, IMZA_ZORUNLU, UZUN_AZAMI, ameliyatNotuBolumleri,
  ameliyatNotuBransi, ameliyatNotuDogrula, sablonUygula,
} from './ameliyatNotu'
import { ameliyatSablonlariBransIcin, sablonGecerliMi } from './ameliyatNotuSunucu'
import { BRANS_ETIKETLERI } from '../intake/bransSorulari'
import { KLINIK_YENI_SLUGS } from '../specialties/klinikDikey'
import { hastaDosyaSekmeleri } from './hastaDosyaSekmeleri'
import { KD_AMELIYAT_SABLONLARI } from '../../specialties/kadin-dogum/engines/ameliyatSablonlari'

const oku = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const usersSb = (row: Record<string, unknown> | null) => ({
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: row, error: null }) }) }) }),
}) as unknown as SupabaseClient

describe('OP-DR-01 — the stored title', () => {
  it('five titles in their order', () => {
    assert.deepEqual([...DOKTOR_UNVANLARI], ['Dr.', 'Uzm. Dr.', 'Op. Dr.', 'Doç. Dr.', 'Prof. Dr.'])
  })
  it('kayitliUnvan normalises every stored spelling; anything else is null', () => {
    assert.equal(kayitliUnvan('Op. Dr.'), 'Op. Dr.')
    assert.equal(kayitliUnvan('Op.Dr.'), 'Op. Dr.')
    assert.equal(kayitliUnvan('op dr'), 'Op. Dr.')
    assert.equal(kayitliUnvan('Uzm.Dr.'), 'Uzm. Dr.')
    assert.equal(kayitliUnvan('Doc. Dr.'), 'Doç. Dr.')
    for (const x of ['', null, undefined, 'Hocam', 'Op.', 3]) assert.equal(kayitliUnvan(x), null, String(x))
  })
  it('the stored title wins over a title typed into the name, and is never doubled', () => {
    assert.equal(hekimUnvanli('Ayşe Kaya', 'Op. Dr.'), 'Op. Dr. Ayşe Kaya')
    assert.equal(hekimUnvanli('Dr. Ayşe Kaya', 'Op. Dr.'), 'Op. Dr. Ayşe Kaya')
    assert.equal(hekimUnvanli('Uzm. Dr. Ayşe Kaya', 'Op.Dr.'), 'Op. Dr. Ayşe Kaya')
    assert.equal(hekimUnvanli('Prof. Dr. Ayşe Kaya', 'Prof. Dr.'), 'Prof. Dr. Ayşe Kaya')
  })
  it('without a stored title the previous rule holds (plain "Dr.", never "Uzm. Dr.")', () => {
    assert.equal(hekimUnvanli('Ayşe Kaya'), 'Dr. Ayşe Kaya')
    assert.equal(hekimUnvanli('Ayşe Kaya', null), 'Dr. Ayşe Kaya')
    assert.equal(hekimUnvanli('Doç. Dr. Ayşe Kaya'), 'Doç. Dr. Ayşe Kaya')
    assert.equal(hekimUnvanliSatirdan({ full_name: 'Ayşe Kaya', title: null, unvan: 'Op. Dr.' }), 'Op. Dr. Ayşe Kaya', 'legacy users.unvan as fallback')
  })
  it('hekimAdi (every server printout: epikriz, gebelik kartı, konsültasyon, foto raporu, the new reports) carries users.title', async () => {
    assert.equal(await hekimAdi(usersSb({ full_name: 'Ayşe Kaya', title: 'Op. Dr.', unvan: null }), 'd'), 'Op. Dr. Ayşe Kaya')
    assert.equal(await hekimAdi(usersSb({ full_name: 'Ayşe Kaya', title: null, unvan: null }), 'd'), 'Dr. Ayşe Kaya')
    assert.equal(await hekimAdi(usersSb({ full_name: '', title: 'Op. Dr.', unvan: null }), 'd'), 'Op. Dr.')
    assert.equal(await hekimAdi(usersSb({ full_name: '', title: null, unvan: null }), 'd'), 'Dr.')
  })
  it('no printout falls back to a hard-coded "Uzm. Dr."', () => {
    for (const f of ['app/api/doktor/araclar/epikriz/route.ts', 'app/dashboard/doktor/hastalar/[id]/gebelik/yazdir/page.tsx', 'components/doktor/yazdir/AntetliKagit.tsx', 'lib/doktor/raporDoktorBlogu.ts', 'lib/doktor/hekimAdi.ts']) {
      assert.ok(!/\|\|\s*['"`]Uzm\. Dr\.['"`]/.test(oku(f)), `${f} still falls back to "Uzm. Dr."`)
    }
    assert.match(oku('app/api/doktor/araclar/epikriz/route.ts'), /hekim \|\| 'Dr\.'/)
    assert.match(oku('app/dashboard/doktor/hastalar/[id]/gebelik/yazdir/page.tsx'), /b\.hekim \|\| 'Dr\.'/)
  })
  it('the note print, the tetkik letterheads and Hesabım read the stored title', () => {
    assert.match(oku('app/api/notes/[id]/route.ts'), /select\('full_name, title, unvan, email, recete_baslik'\)/)
    assert.match(oku('app/api/doktor/recete-baslik/route.ts'), /unvanliAd: /)
    assert.match(oku('app/doktor-tools/tetkik/page.tsx'), /p\.unvanliAd \|\| p\.hekim/)
    assert.match(oku('app/dashboard/doktor/notlar/[id]/tetkikler/page.tsx'), /p\.unvanliAd \|\| p\.hekim/)
    assert.match(oku('app/dashboard/doktor/hesap/page.tsx'), /DOKTOR_UNVANLARI\.map/)
  })
  it('migration 186 widens users.title to exactly the five titles', () => {
    const m = oku('lib/db/migrations/186_op_dr_unvan_ameliyat_notu_kd_rapor.sql')
    assert.match(m, /array\['Dr\.'::text, 'Uzm\. Dr\.'::text, 'Op\. Dr\.'::text, 'Doç\. Dr\.'::text, 'Prof\. Dr\.'::text\]/)
  })
})

describe('AMELIYAT-NOTU-01 — who has the shell (core, surgical branches, 30 + 10 written out)', () => {
  it('every one of the 30 medical branches and the 10 Özel Branşlar is classified', () => {
    assert.deepEqual(Object.keys(AMELIYAT_NOTU_BRANSLARI).sort(), Object.keys(BRANS_ETIKETLERI).sort())
    assert.deepEqual(Object.keys(AMELIYAT_NOTU_OZEL_BRANSLARI).sort(), [...KLINIK_YENI_SLUGS].sort())
  })
  it('surgical branches get it; the others never do; unknown never does', () => {
    for (const b of ['kadin-hastaliklari-dogum', 'kadin-dogum', 'Kadın Hastalıkları ve Doğum', 'genel-cerrahi', 'ortopedi', 'uroloji', 'kulak-burun-bogaz', 'goz-hastaliklari', 'beyin-cerrahisi', 'kalp-damar-cerrahisi', 'gogus-cerrahisi', 'plastik-cerrahi', 'cocuk-cerrahisi', 'sac-ekimi', 'estetik-cerrahi']) assert.equal(ameliyatNotuBransi(b), true, b)
    for (const b of ['pediatri', 'kardiyoloji', 'dahiliye', 'aile-hekimligi', 'anestezi', 'dermatoloji', 'gogus-hastaliklari', 'medikal-estetik', 'fizyoterapi', '', null, 'bilinmeyen']) assert.equal(ameliyatNotuBransi(b), false, String(b))
  })
  it('the tab exists only when the gate says so, and the page mounts it behind the same boolean', () => {
    const temel = { pediatriUygun: false, gebelikUygun: false }
    assert.ok(hastaDosyaSekmeleri({ ...temel, ameliyatUygun: true }).some((t) => t.id === 'ameliyat'))
    assert.ok(!hastaDosyaSekmeleri(temel).some((t) => t.id === 'ameliyat'))
    const sayfa = oku('app/dashboard/doktor/hastalar/[id]/page.tsx')
    assert.match(sayfa, /const ameliyatUygun = ameliyatNotuBransi\(doktorBransi\)/)
    assert.match(sayfa, /activeTab === 'ameliyat' && ameliyatUygun && <HastaAmeliyatNotlari/)
  })
})

describe('AMELIYAT-NOTU-01 — the record', () => {
  const tam = { ...BOS_AMELIYAT_NOTU, baslangic: '2026-11-05T09:30', aciliyet: 'elektif', preopTani: 'Myoma uteri', postopTani: 'Myoma uteri', islem: 'TLH', cerrah: 'Op. Dr. QA', anesteziTuru: 'genel', anestezist: 'Uzm. Dr. QA', bulgular: 'b', teknik: 't', patoloji: 'gonderildi', patolojiMateryal: 'Uterus', kanKaybiMl: 150, komplikasyon: 'Yok', kapanis: 'k', postopOrderlar: 'p' }
  it('a draft needs only the date and the procedure', () => {
    assert.equal(ameliyatNotuDogrula({ baslangic: '2026-11-05T09:30', islem: 'TLH' }, { imza: false }).ok, true)
    const r = ameliyatNotuDogrula({ islem: 'TLH' }, { imza: false })
    assert.equal(r.ok, false); if (!r.ok) assert.equal(r.alan, 'baslangic')
    const r2 = ameliyatNotuDogrula({ baslangic: '2026-11-05T09:30' }, { imza: false })
    assert.equal(r2.ok, false); if (!r2.ok) assert.equal(r2.alan, 'islem')
  })
  it('the sign-off requires every RCS-GSP field; local anaesthesia needs no anaesthetist; sent tissue needs a name', () => {
    assert.equal(ameliyatNotuDogrula(tam, { imza: true }).ok, true)
    for (const k of IMZA_ZORUNLU) {
      const eksik = { ...tam, [k]: k === 'kanKaybiMl' ? null : '' }
      const r = ameliyatNotuDogrula(eksik, { imza: true })
      if (k === 'baslangic') { assert.equal(r.ok, false); continue }
      assert.equal(r.ok, false, k); if (!r.ok) assert.equal(r.alan, k)
    }
    assert.equal(ameliyatNotuDogrula({ ...tam, anestezist: '' }, { imza: true }).ok, false)
    assert.equal(ameliyatNotuDogrula({ ...tam, anesteziTuru: 'lokal', anestezist: '' }, { imza: true }).ok, true)
    assert.equal(ameliyatNotuDogrula({ ...tam, patolojiMateryal: '' }, { imza: true }).ok, false)
  })
  it('refuses nonsense: an unknown anaesthesia, a blood loss out of range, an over-long text', () => {
    assert.equal(ameliyatNotuDogrula({ ...tam, anesteziTuru: 'hipnoz' }, { imza: false }).ok, false)
    assert.equal(ameliyatNotuDogrula({ ...tam, kanKaybiMl: -5 }, { imza: false }).ok, false)
    assert.equal(ameliyatNotuDogrula({ ...tam, kanKaybiMl: 99999 }, { imza: false }).ok, false)
    assert.equal(ameliyatNotuDogrula({ ...tam, teknik: 'x'.repeat(UZUN_AZAMI + 1) }, { imza: false }).ok, false)
  })
  it('a template fills only empty fields — the surgeon\'s own words are never overwritten', () => {
    const s = KD_AMELIYAT_SABLONLARI.find((x) => x.kod === 'sezaryen')!
    const v = sablonUygula({ ...BOS_AMELIYAT_NOTU, islem: 'Kendi yazdığım' }, s)
    assert.equal(v.islem, 'Kendi yazdığım')
    assert.ok(v.teknik.includes('Alt segment transvers'))
  })
  it('the printed sections leave an empty optional field out and mark an empty required one', () => {
    const b = ameliyatNotuBolumleri({ ...BOS_AMELIYAT_NOTU, islem: 'TLH' })
    assert.ok(b.some((x) => x.anahtar === 'bulgular' && x.deger === '—'))
    assert.ok(!b.some((x) => x.anahtar === 'implantlar'))
  })
})

describe('AMELIYAT-NOTU-01 — KD templates never leave KD (brans-alan-sizmasi)', () => {
  it('a KD doctor (every stored spelling) receives the KD templates', async () => {
    for (const b of ['kadin-hastaliklari-dogum', 'kadin-dogum', 'Kadın Hastalıkları ve Doğum']) {
      const l = await ameliyatSablonlariBransIcin(b)
      assert.equal(l.length, KD_AMELIYAT_SABLONLARI.length, b)
    }
  })
  it('every other medical branch, every Özel Branş and an unknown branch receive none — but the four genital-aesthetic templates for plastic and aesthetic surgery', async () => {
    // GENITAL-ESTETIK-01 (Kaan, 2026-11-06): plastik cerrahi and the Özel Branş estetik & plastik cerrahi receive exactly the four genital-aesthetic templates
    const GE = ['labioplasti', 'labioplasti_klitoral', 'perineoplasti_kolporafi', 'vajinoplasti_kolpoperineorafi']
    for (const b of ['plastik-cerrahi', 'estetik-cerrahi', 'Plastik, Rekonstrüktif ve Estetik Cerrahi']) assert.deepEqual((await ameliyatSablonlariBransIcin(b)).map((s) => s.kod).sort(), GE, b)
    assert.equal(await sablonGecerliMi('plastik-cerrahi', 'sezaryen'), null, 'plastic surgery never names a gynaecological template')
    for (const b of Object.keys(BRANS_ETIKETLERI).filter((k) => k !== 'kadin-hastaliklari-dogum' && k !== 'plastik-cerrahi')) assert.equal((await ameliyatSablonlariBransIcin(b)).length, 0, b)
    for (const b of KLINIK_YENI_SLUGS.filter((k) => k !== 'estetik-cerrahi')) assert.equal((await ameliyatSablonlariBransIcin(b)).length, 0, b)
    for (const b of [null, '', 'genel']) assert.equal((await ameliyatSablonlariBransIcin(b)).length, 0, String(b))
    assert.equal(await sablonGecerliMi('genel-cerrahi', 'sezaryen'), null, 'a non-KD note cannot name a KD template')
    assert.equal(await sablonGecerliMi('kadin-dogum', 'sezaryen'), 'sezaryen')
  })
  it('the operations a KD surgeon does are covered, including the benchmark private-practice list', () => {
    const kodlar = KD_AMELIYAT_SABLONLARI.map((s) => s.kod)
    for (const k of ['sezaryen', 'tlh', 'tah', 'vajinal_histerektomi', 'lap_myomektomi', 'abdominal_myomektomi', 'tanisal_laparoskopi', 'lap_over_kistektomi', 'lap_endometriozis', 'histeroskopi', 'dc_kuretaj', 'vakum_aspirasyon', 'kolposkopi_biyopsi_leep', 'ria_takilmasi', 'labioplasti', 'perineoplasti_kolporafi']) assert.ok(kodlar.includes(k), k)
    assert.equal(new Set(kodlar).size, kodlar.length, 'template keys are unique')
  })
  it('templates cite a published source and write no dose, no named doctor', () => {
    for (const s of KD_AMELIYAT_SABLONLARI) {
      assert.ok(s.kaynak.length > 10, s.kod)
      const metin = JSON.stringify(s.veri)
      assert.ok(!/\b\d+(?:[.,]\d+)?\s*(mg|mcg|µg|IU|ünite|U\/|mL\b|ml\b|cc\b)/i.test(metin), `${s.kod} writes a dose`)
      assert.ok(!/G[üu]rsoy|Hatice/i.test(metin + s.kaynak + s.ad), `${s.kod} names a doctor`)
    }
  })
  it('the server is the only template source: the core shell file holds no KD content', () => {
    const core = oku('lib/doktor/ameliyatNotu.ts') + oku('components/doktor/HastaAmeliyatNotlari.tsx')
    assert.ok(!/Sezaryen|histerektomi|myomektomi/i.test(core.replace(/\/\*\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')))
  })
})
