/**
 * NOTYA-KORPUS-KALAN-01 — the corpus entries that failed on MODEL-FREE routes, run as a plain test.
 *
 * The live run of the Dr. Gökhan complaint corpus on 2026-10-02 (docs/denetim/bugun-korpus-rapor.md) left 36 FAIL
 * turns. The ones below are answered by the server, not by the model, so a stand-in model proves them as well as
 * Luna does: each entry goes through the corpus RUNNER (real /api/asistan/chat, /api/asistan/fish-tur and
 * /api/doktor/konsult, in-memory scene, synthetic patients) with its whole session and is graded by the corpus's
 * own assertions. An entry that is 'not judged' in a stand-in run counts as a failure here — every entry listed is
 * one whose answer the server writes.
 *
 * Causes, commits and proof per entry: docs/korpus-kalan-fix.md. Focused unit tests live next to the code.
 */
import { gercekModelAc, sahneHazirla } from './tests/ayseSahne'
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { vekilOpenRouter } from './tests/eylemDenetimi'
import { korpusuKos, type KorpusSatiri } from './tests/gokhanKorpusKosucu'
import { korpusYukle } from './tests/gokhanSikayetKorpusu'

/** Cluster → corpus ids. A session entry brings the earlier turns of its session with it (korpusYukle). */
const KUMELER: { ad: string; idler: string[] }[] = [
  { ad: 'A — özellik listeleri (arama)', idler: ['G-21', 'G-22', 'G-24'] },
  { ad: 'B — adlı hasta turundan sonraki takip soruları', idler: ['Y-080', 'T-025', 'Y-083', 'Y-091'] },
]

const satirlar = new Map<string, KorpusSatiri[]>()

before(async () => {
  await sahneHazirla()
  assert.ok(gercekModelAc(vekilOpenRouter))
  for (const k of KUMELER) {
    satirlar.set(k.ad, await korpusuKos(korpusYukle({ idler: k.idler }), { saatDilimi: 'Europe/Istanbul', vekil: true }))
  }
})

for (const k of KUMELER) {
  describe(`korpus — ${k.ad}`, () => {
    for (const id of k.idler) {
      it(`${id}: her yüzeyde PASS`, () => {
        const s = (satirlar.get(k.ad) || []).filter((x) => x.id === id)
        assert.ok(s.length > 0, `${id} koşmadı`)
        for (const x of s) {
          assert.equal(x.karar, 'PASS', `${id} [${x.yuzey}] ${x.karar} — ${x.nedenler.join('; ')}\n  rota: ${x.rota}\n  cevap: ${(x.cevap || x.sozlu).slice(0, 400)}`)
        }
      })
    }
  })
}
