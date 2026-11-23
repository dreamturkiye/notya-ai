/**
 * NOTYA-BELGE-DEID-03 (2026-11-20) — GUARD: no upload / evaluate path may send an UNMASKED image or PDF to a model.
 * belge-otomatik-akis: only the on-device masked copy leaves (an image, or a PDF's pages drawn and masked on the device);
 * masking failed -> not sent (stays in Belgeler for manual evaluation). There is NO exception list: it was emptied on 2026-11-20
 * (DEID-03-a lab page + aşı karnesi reader, DEID-03-b PDFs) and must stay empty.
 *
 * Fails when:
 *  - a server file on a patient-document path builds a model image block from raw vault bytes, or ANY PDF document block
 *    (`type: 'document'` / `media_type: 'application/pdf'`), or passes `tip: 'pdf'` to a model helper (new path or regression);
 *  - a muayene-flow evaluator, the lab reader, the aşı karnesi reader or the analysis route accepts an image / PDF without the masked copy;
 *  - a browser path sends an image re-encoded WITHOUT the OCR mask (`gorseliKimliksizlestir` = EXIF strip only);
 *  - a browser entry point stops gating its send on `maske.durum === 'maskelendi'`, or stops masking PDFs.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { deidCoz, icerikBloklari, DEID_AZAMI_KARAKTER, DEID_AZAMI_SAYFA } from '@/lib/doktor/muayeneEk/icerik'
import { topluIsle } from './otoBatch'

const KOK = process.cwd()
function dosyalar(d: string, out: string[] = []): string[] {
  let liste: string[] = []
  try { liste = readdirSync(join(KOK, d)) } catch { return out }
  for (const f of liste) {
    if (f === 'node_modules' || f === '.next') continue
    const yol = join(d, f)
    if (statSync(join(KOK, yol)).isDirectory()) dosyalar(yol, out); else if (/\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f)) out.push(yol)
  }
  return out
}
const oku = (f: string) => readFileSync(join(KOK, f), 'utf8')
const var_ = (f: string) => existsSync(join(KOK, f))
/** The Türkiye tree has the post-dictation Ekler step; country trees have their own (NOTYA-ULKE-EKLER-01). Both are checked. */
const TR_EKLER = var_('lib/doktor/muayeneEk/sunucu.ts')
const ULKE_EKLER = var_('components/ulke/uygulama/Ekler.tsx')

const KAPSAM = ['app/api/doktor', 'app/api/sessions', 'app/api/portal', 'app/api/ulke', 'lib/doktor', 'lib/asi', 'lib/ulke', 'core/belgeler', 'core/lab', 'core/elNotu', 'lib/elNotu']

test('inventory: no patient-document server path builds a model block from the vault original (image or PDF)', () => {
  const ihlal = new Set<string>()
  for (const f of KAPSAM.flatMap((d) => dosyalar(d))) {
    for (const satir of oku(f).split('\n')) {
      const kod = satir.replace(/\/\/.*$/, '')
      const hamGorsel = /(type|tip):\s*['"]image['"]/.test(kod) && /\b(bytes|b64|buf|buffer)\b/.test(kod)
      const pdfBlogu = /type:\s*['"]document['"]/.test(kod) || /media_type:\s*['"]application\/pdf['"]/.test(kod) || /\btip:\s*['"]pdf['"]/.test(kod)
      if (hamGorsel || pdfBlogu) ihlal.add(`${f.replace(/\\/g, '/')}: ${satir.trim().slice(0, 120)}`)
    }
  }
  assert.deepEqual([...ihlal], [], 'unmasked vault image / PDF sent to a model')
})

test('content blocks: an image or PDF without its masked copy is never sent; with it, only the masked pictures go (PDF = its pages)', () => {
  assert.equal(icerikBloklari({ fileType: 'image/jpeg' }, null), null)
  assert.equal(icerikBloklari({ fileType: 'image/png' }), null)
  assert.equal(icerikBloklari({ fileType: 'application/pdf' }, null), null)
  assert.equal(icerikBloklari({ fileType: 'image/heic' }, { mime: '', base64: '' }), null)
  const b = icerikBloklari({ fileType: 'image/jpeg' }, { mime: 'image/jpeg', base64: 'TUFTS0VE' }) as { type: string; source: { data: string } }[]
  assert.deepEqual(b.map((x) => [x.type, x.source.data]), [['image', 'TUFTS0VE']])
  const p = icerikBloklari({ fileType: 'application/pdf' }, { mime: 'image/jpeg', base64: 'UDE=', ekSayfalar: [{ mime: 'image/jpeg', base64: 'UDI=' }, { mime: 'image/jpeg', base64: 'UDM=' }] }) as { type: string; source: { media_type: string; data: string } }[]
  assert.deepEqual(p.map((x) => [x.type, x.source.media_type, x.source.data]), [['image', 'image/jpeg', 'UDE='], ['image', 'image/jpeg', 'UDI='], ['image', 'image/jpeg', 'UDM=']])
  assert.ok(!JSON.stringify(p).includes('application/pdf'))
})

test('request body -> masked copy: malformed, too many pages or too big is treated as "no masked copy"', () => {
  assert.equal(deidCoz(null), null)
  assert.equal(deidCoz({ mime: 'image/jpeg' }), null)
  assert.equal(deidCoz({ base64: 'eA==', ekSayfalar: [{ base64: 1 }] }), null)
  assert.equal(deidCoz({ base64: 'eA==', ekSayfalar: Array.from({ length: DEID_AZAMI_SAYFA }, () => ({ base64: 'eA==' })) }), null)
  assert.equal(deidCoz({ base64: 'x'.repeat(DEID_AZAMI_KARAKTER + 1) }), null)
  assert.deepEqual(deidCoz({ mime: 'image/jpeg', base64: 'eA==', ekSayfalar: [{ mime: 'image/jpeg', base64: 'eQ==' }] }), { mime: 'image/jpeg', base64: 'eA==', ekSayfalar: [{ mime: 'image/jpeg', base64: 'eQ==' }] })
})

test('muayene-flow server: every evaluator and the type guess take the masked copy; no image path reads the original', { skip: !TR_EKLER && 'no Türkiye Ekler step in this tree' }, () => {
  const s = oku('lib/doktor/muayeneEk/sunucu.ts')
  assert.doesNotMatch(s, /function icerik(Blogu|Bloklari)/, 'content blocks must come from the guarded pure module (./icerik)')
  assert.match(s, /maskeliBelgeMi\(c\.meta\) && !deid\?\.base64\) return atlandiSonucu\('lab'/, 'lab: an image or PDF without its masked copy is skipped')
  for (const f of ['aiSiniflandir', 'labDegerlendir', 'asiDegerlendir', 'genelDegerlendir', 'goruntuDegerlendir']) {
    assert.match(s, new RegExp(`async function ${f}\\([^)]*deid: DeidGorsel \\| null`), `${f} must receive the masked copy`)
  }
  assert.match(oku('app/api/doktor/muayene-ekleri/siniflandir/route.ts'), /belgeyiSiniflandir\(.*, deid\)/)
  assert.match(oku('app/api/doktor/belgeler/analiz/route.ts'), /Kimliksizleştirilmiş görüntü \(deid\) gerekli/)
})

test('lab reader, aşı karnesi reader, analysis route, consultation draft: the masked copy is required; the original never feeds a model', () => {
  const lab = oku('app/api/doktor/belgeler/lab/route.ts')
  assert.match(lab, /if \(maskeliBelgeMi\(meta\) && !deid\) return NextResponse\.json\(\{ error: KIMLIK_GIZLENEMEDI, neden: 'deid_gerekli' \}/)
  assert.match(lab, /gorselCikar\(\{ tip: 'image', mime: deidMime\(deid\), base64: deid\.base64, ekSayfalar: deid\.ekSayfalar \}/)
  assert.equal((lab.match(/gorselCikar\(/g) || []).length, 1, 'one vision call, fed only by the masked copy')
  assert.match(lab, /kimlikSatiriMi\(r\.raw_name, r\.value\)/, 'identity rows from the structural parse are dropped')
  const karne = oku('app/api/doktor/asilar/karne/route.ts')
  assert.match(karne, /if \(!deid\) return NextResponse\.json\(\{ error: `\$\{KIMLIK_GIZLENEMEDI\}/)
  assert.doesNotMatch(karne, /downloadDocument/, 'the karne reader never opens the vault original')
  assert.match(karne, /content: \[\.\.\.bloklar,/)
  const analiz = oku('app/api/doktor/belgeler/analiz/route.ts')
  assert.match(analiz, /const deid = deidCoz\(body\.deid\)\n\s*if \(!deid\) return/, 'PDF included: no masked copy -> 400')
  const kons = oku('app/api/doktor/konsultasyon/route.ts')
  assert.match(kons, /belge\.file_type === 'application\/pdf' \|\| belge\.file_type\.startsWith\('image\/'\)\) \{[\s\S]*?neden: 'deid_gerekli'/)
  for (const f of ['core/belgeler/yazar.ts', 'core/lab/cikarim.ts']) assert.doesNotMatch(oku(f), /tip: 'pdf'/, `${f}: a raw PDF must not be representable as model input`)
})

test('browser: no path sends an image re-encoded without the OCR mask', () => {
  const istemci = ['app', 'components', 'lib', 'core', 'specialties'].flatMap((d) => dosyalar(d)).filter((f) => !f.replace(/\\/g, '/').endsWith('core/belgeler/deid.ts'))
  const ihlal = istemci.filter((f) => /\bgorseliKimliksizlestir\s*\(/.test(oku(f)))
  assert.deepEqual(ihlal, [], `EXIF-only re-encode (burned-in identity left visible) used as an outbound copy: ${ihlal.join(', ')}`)
})

test('browser entry points gate every send on a successful mask', () => {
  const oto = oku('core/belgeler/otoIstemci.ts')
  assert.match(oto, /maske\.durum !== 'maskelendi'\) return \{ ok: false/)
  if (TR_EKLER) {
    const ekler = oku('components/doktor/MuayeneEklerAdimi.tsx')
    assert.match(ekler, /maske\.durum === "maskelendi" \?/)
    assert.match(ekler, /maskeliKopya\(key, k\.blob\)[\s\S]*muayene-ekleri\/siniflandir[^\n]*deid/)
    assert.match(ekler, /maskeli = await maskeliKopya\(key, o\.dosya\)\s*\n\s*if \(!maskeli\)/)
  }
  if (ULKE_EKLER) assert.match(oku('components/ulke/uygulama/Ekler.tsx'), /maske\.durum !== 'maskelendi'\) \{[^}]*atlandi/)
  if (var_('lib/doktor/konsultasyonIstemci.ts')) assert.match(oku('lib/doktor/konsultasyonIstemci.ts'), /maske\.durum !== 'maskelendi'\) return/)
  const sayfa = oku('app/dashboard/doktor/hastalar/[id]/belgeler/[belgeId]/page.tsx')
  assert.match(sayfa, /maske\.durum !== 'maskelendi'/) // manual fallback checkbox: Belgeler document pages only (skill)
  assert.match(sayfa, /if \(pdfMi\) \{[\s\S]*?belgeyiOtomatikKimliksizlestir/, 'Belgeler page: a PDF is masked on the device too')
  if (TR_EKLER) assert.match(oku('components/doktor/MuayeneEklerAdimi.tsx'), /const maskelenirMi = \(b: Blob\) => b\.type\.startsWith\("image\/"\) \|\| pdfDosyasiMi\(b\)/, 'Ekler step: PDFs are masked too')
  const lab = oku('app/dashboard/doktor/hastalar/[id]/belgeler/[belgeId]/lab/page.tsx')
  assert.match(lab, /o!\.maske\.durum !== 'maskelendi'\) \{\s*setYedekGerek\(true\);\s*if \(!kimlikYok\) \{/)
  assert.match(lab, /deid: gidenDeid\(o!\.gorsel\)/)
  const karne = oku('components/doktor/AsiKarnesiOkuma.tsx')
  assert.match(karne, /m\.maske\.durum !== 'maskelendi'\) \{ setYedekGerek\(true\)[^\n]*return; \}/)
  assert.match(karne, /deid: gidenDeid\(m\.gorsel\)/)
  if (var_('specialties/dahiliye/ui/DahiliyeWow5.tsx')) assert.match(oku('specialties/dahiliye/ui/DahiliyeWow5.tsx'), /m\.maske\.durum !== 'maskelendi'\) \{[\s\S]*?return\s*\}[\s\S]*?kaynak: 'enabiz', deid: gidenDeid\(m\.gorsel\)/)
  assert.match(oku('lib/doktor/konsultasyonIstemci.ts'), /belgeyiOtomatikKimliksizlestir\(await r\.blob\(\)/, 'consultation draft: images and PDFs masked')
})

test('batch: a document whose masking failed is never evaluated (never sent)', async () => {
  const gonderilen: string[] = []
  const r = await topluIsle<string>(
    [{ belgeId: 'a', ad: 'a.jpg', yuklemeSirasi: 0 }, { belgeId: 'b', ad: 'b.jpg', yuklemeSirasi: 1 }, { belgeId: 'c', ad: 'c.jpg', yuklemeSirasi: 2 }],
    {
      maskele: async (b) => (b.belgeId === 'a' ? { ok: true, yuk: 'masked-a' } : b.belgeId === 'b' ? { ok: false, neden: 'x' } : Promise.reject(new Error('ocr'))),
      degerlendir: async (b, yuk) => { gonderilen.push(`${b.belgeId}:${yuk}`); return { ok: true, girdi: { belgeId: b.belgeId, etiket: '', tarih: '', yuklemeSirasi: 0 } } },
      yaz: async () => undefined,
    },
  )
  assert.deepEqual(gonderilen, ['a:masked-a'])
  assert.equal(r.genel.atlanan, 2)
})
