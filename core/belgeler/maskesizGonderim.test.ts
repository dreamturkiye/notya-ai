/**
 * NOTYA-BELGE-DEID-03 (2026-11-20) — GUARD: no upload / evaluate path may send an UNMASKED image to a model.
 * belge-otomatik-akis: only the on-device masked copy leaves; masking failed -> not sent (stays in Belgeler).
 *
 * Fails when:
 *  - a server file on a patient-document path builds a model image block from raw vault bytes (new path or regression);
 *  - a muayene-flow evaluator accepts an image without the masked copy;
 *  - a browser path sends an image re-encoded WITHOUT the OCR mask (`gorseliKimliksizlestir` = EXIF strip only);
 *  - a browser entry point stops gating its send on `maske.durum === 'maskelendi'`.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { icerikBlogu } from '@/lib/doktor/muayeneEk/icerik'
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

/**
 * Pre-existing paths OUTSIDE the muayene document flow that still read the vault original into a model call (lab table extraction
 * page, aşı karnesi reader). Logged in docs/OPEN-COMMITMENTS.md (NOTYA-BELGE-DEID-03, 2026-11-20). This list may only SHRINK.
 */
const ACIK_KALAN = new Set(['app/api/doktor/asilar/karne/route.ts', 'app/api/doktor/belgeler/lab/route.ts'])

test('inventory: no patient-document server path builds a model image block from raw vault bytes', () => {
  const kapsam = ['app/api/doktor', 'app/api/sessions', 'app/api/portal', 'app/api/ulke', 'lib/doktor', 'lib/asi', 'lib/ulke', 'core/belgeler', 'core/lab'].flatMap((d) => dosyalar(d))
  const ihlal = new Set<string>()
  for (const f of kapsam) {
    for (const satir of oku(f).split('\n')) {
      if (/(type|tip):\s*['"]image['"]/.test(satir) && /\b(bytes|b64|buf|buffer)\b/.test(satir)) ihlal.add(f.replace(/\\/g, '/'))
    }
  }
  const yeni = [...ihlal].filter((f) => !ACIK_KALAN.has(f))
  assert.deepEqual(yeni, [], `unmasked vault image sent to a model: ${yeni.join(', ')}`)
  const kapanan = [...ACIK_KALAN].filter((f) => var_(f) && !ihlal.has(f))
  assert.deepEqual(kapanan, [], `fixed — remove from ACIK_KALAN and close the OPEN-COMMITMENTS item: ${kapanan.join(', ')}`)
})

test('muayene-flow content block: an image without its masked copy is never sent; with it, only the masked pixels go', () => {
  const orijinal = Buffer.from('ORIGINAL-WITH-NAME')
  assert.equal(icerikBlogu({ fileType: 'image/jpeg' }, orijinal, null), null)
  assert.equal(icerikBlogu({ fileType: 'image/png' }, orijinal), null)
  assert.equal(icerikBlogu({ fileType: 'image/heic' }, orijinal, { mime: '', base64: '' }), null)
  const b = icerikBlogu({ fileType: 'image/jpeg' }, orijinal, { mime: 'image/jpeg', base64: 'TUFTS0VE' }) as { type: string; source: { data: string } }
  assert.equal(b.type, 'image')
  assert.equal(b.source.data, 'TUFTS0VE')
  assert.notEqual(b.source.data, orijinal.toString('base64'))
})

test('muayene-flow server: every evaluator and the type guess take the masked copy; no image path reads the original', { skip: !TR_EKLER && 'no Türkiye Ekler step in this tree' }, () => {
  const s = oku('lib/doktor/muayeneEk/sunucu.ts')
  assert.doesNotMatch(s, /function icerikBlogu/, 'content blocks must come from the guarded pure module (./icerik)')
  for (const f of ['aiSiniflandir', 'labDegerlendir', 'asiDegerlendir', 'genelDegerlendir', 'goruntuDegerlendir']) {
    assert.match(s, new RegExp(`async function ${f}\\([^)]*deid: DeidGorsel \\| null`), `${f} must receive the masked copy`)
  }
  assert.match(oku('app/api/doktor/muayene-ekleri/siniflandir/route.ts'), /belgeyiSiniflandir\(.*, deid\)/)
  assert.match(oku('app/api/doktor/belgeler/analiz/route.ts'), /Kimliksizleştirilmiş görüntü \(deid\) gerekli/)
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
  assert.match(sayfa, /maske\.durum !== 'maskelendi'/) // the manual fallback checkbox lives only here (skill)
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
