import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { SPECIALTIES } from '@/lib/doktor/specialties'
import { KLINIK_YENI_SLUGS } from '@/lib/specialties/klinikDikey'
import { belgeAkisi, varsayilanGoruntuModalitesi } from './belgeAkisi'

const KOK = process.cwd()
function dosyalar(d: string, out: string[] = []): string[] {
  for (const f of readdirSync(join(KOK, d))) {
    if (f === 'node_modules' || f === '.next') continue
    const yol = join(d, f)
    if (statSync(join(KOK, yol)).isDirectory()) dosyalar(yol, out); else if (/\.(ts|tsx)$/.test(f)) out.push(yol)
  }
  return out
}

test('all 30 medical branches + 10 Özel Branşlar inherit the standard document workflow (no opt-out)', () => {
  const hepsi = [...SPECIALTIES.map((s) => s.key), ...KLINIK_YENI_SLUGS]
  assert.equal(hepsi.length, 40)
  for (const k of hepsi) {
    const a = belgeAkisi(k)
    assert.equal(a.otomatik, true, k)
    assert.equal(a.belgeBasinaOnay, false, k)
    assert.equal(a.bolum, 'objektif', k)
    assert.ok(varsayilanGoruntuModalitesi(a.bransAnahtari), k)
  }
})

test('static check: nobody opts out, and no specialty folder forks the document step', () => {
  const kaynaklar = [...dosyalar('core/belgeler'), ...dosyalar('components/doktor'), ...dosyalar('lib/doktor'), ...dosyalar('specialties')]
  for (const f of kaynaklar) {
    if (f.endsWith('.test.ts')) continue
    const s = readFileSync(join(KOK, f), 'utf8')
    assert.ok(!/otomatik\s*[:=]\s*false/.test(s), `${f} opts out of the automatic document workflow`)
    assert.ok(!/belgeBasinaOnay\s*[:=]\s*true/.test(s), `${f} re-introduces a per-document approval gate`)
  }
  const catallar = dosyalar('specialties').filter((f) => /MuayeneEkler|BelgeEkle|belgeleriEkle/i.test(f))
  assert.deepEqual(catallar, [], 'specialty forks of the belgeleri-ekle step are not allowed')
})

test('static check: every entry point uses the shared core, not its own copy', () => {
  const oku = (f: string) => readFileSync(join(KOK, f), 'utf8')
  assert.match(oku('components/doktor/MuayeneEkleri.tsx'), /belgeleriOtomatikIsle/)
  assert.match(oku('lib/doktor/belgeNotaYaz.ts'), /notaBloklariUygula/)
  assert.match(oku('app/api/doktor/belgeler/analiz/onayla/route.ts'), /notaBloklariUygula/)
  assert.ok(!/maskeOnizleme|onizlemeUrl/.test(oku('app/dashboard/doktor/hastalar/[id]/belgeler/[belgeId]/page.tsx')), 'doctor must see the original, not a blacked-out preview')
})
