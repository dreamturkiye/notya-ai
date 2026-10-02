/**
 * NOTYA-KORPUS-KALAN-01 — the corpus entries that failed on MODEL-FREE routes, run as a plain test.
 *
 * The live run of the Dr. Gökhan complaint corpus on 2026-10-02 (docs/denetim/bugun-korpus-rapor.md) left 36 FAIL
 * turns. The ones below are answered by the server, not by the model, so a stand-in model proves them as well as
 * Luna does: each entry goes through the corpus RUNNER (real /api/asistan/chat, /api/asistan/fish-tur and
 * /api/doktor/konsult, in-memory scene, synthetic patients) with its whole session and is graded by the corpus's
 * own assertions. An entry that is 'not judged' in a stand-in run counts as a failure here — every surface listed is
 * one whose answer the server writes.
 *
 * Causes, commits and proof per entry: docs/korpus-kalan-fix.md. Focused unit tests live next to the code.
 */
import { gercekModelAc, sahneHazirla } from './tests/ayseSahne'
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { vekilOpenRouter } from './tests/eylemDenetimi'
import { korpusuKos, type KorpusSatiri } from './tests/gokhanKorpusKosucu'
import { korpusYukle, type Yuzey } from './tests/gokhanSikayetKorpusu'

/**
 * An entry, or an entry on the surfaces where the server writes its answer (elsewhere the model does).
 * `modele`: the defect was a model-free route TAKING a question that is the model's (cluster D: the read-aloud route).
 * Fixed means the turn reaches the model with the chart; its words are judged by the live run, so here the turn must
 * be on the `model` route and must not FAIL. The server-side halves are proven in korpusKalanOkuma.test.ts.
 */
type Girdi = string | { id: string; yuzeyler: Yuzey[]; modele?: boolean }
/** Cluster → corpus ids. A session entry brings the earlier turns of its session with it (korpusYukle). */
const KUMELER: { ad: string; girdiler: Girdi[] }[] = [
  { ad: 'A — özellik listeleri (arama)', girdiler: ['G-21', 'G-22', 'G-24'] },
  { ad: 'B — adlı hasta turundan sonraki takip soruları', girdiler: ['Y-080', 'T-025', 'Y-083', 'Y-091'] },
  { ad: 'C — ölçümler', girdiler: ['T-042', 'T-044', 'L-DANIS-BOYU', 'Y-021', 'Y-023', { id: 'I-03', yuzeyler: ['panel'] }, 'L-DANIS-SERI-2'] },
  { ad: 'D — okumalar', girdiler: [{ id: 'G-28', yuzeyler: ['ses'], modele: true }, { id: 'Y-063', yuzeyler: ['ses'], modele: true }, { id: 'L-ODAK-HITAP-1', yuzeyler: ['yazi', 'ses'], modele: true }] },
]
const kimlik = (g: Girdi) => (typeof g === 'string' ? g : g.id)

const satirlar = new Map<string, KorpusSatiri[]>()

before(async () => {
  await sahneHazirla()
  assert.ok(gercekModelAc(vekilOpenRouter))
  for (const k of KUMELER) {
    satirlar.set(k.ad, await korpusuKos(korpusYukle({ idler: k.girdiler.map(kimlik) }), { saatDilimi: 'Europe/Istanbul', vekil: true }))
  }
})

for (const k of KUMELER) {
  describe(`korpus — ${k.ad}`, () => {
    for (const g of k.girdiler) {
      const id = kimlik(g)
      const yuzeyler = typeof g === 'string' ? null : g.yuzeyler
      const modele = typeof g !== 'string' && Boolean(g.modele)
      it(`${id}: ${yuzeyler ? yuzeyler.join(', ') : 'her yüzeyde'} ${modele ? 'modele gider, FAIL değil' : 'PASS'}`, () => {
        const s = (satirlar.get(k.ad) || []).filter((x) => x.id === id && (!yuzeyler || yuzeyler.includes(x.yuzey)))
        assert.ok(s.length > 0, `${id} koşmadı`)
        for (const x of s) {
          const ozet = `${id} [${x.yuzey}] ${x.karar} — ${x.nedenler.join('; ')}\n  rota: ${x.rota}\n  cevap: ${(x.cevap || x.sozlu).slice(0, 400)}`
          if (!modele) { assert.equal(x.karar, 'PASS', ozet); continue }
          assert.equal(x.rota, 'model', ozet)
          assert.notEqual(x.karar, 'FAIL', ozet)
        }
      })
    }
  })
}
