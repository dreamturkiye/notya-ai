/**
 * NOTYA-CHECKPOINT-KARSILASTIRMA-01 — which corpus entries ask for a capability that did NOT EXIST at the
 * 2026-09-27 checkpoint (commit ac947eef).
 *
 * The corpus was written against today's build: some entries expect a route, a fixed sentence, a tool or a
 * speech-engine text that was introduced after the checkpoint. Such an entry is still run and its answer recorded,
 * but its verdict is NEW, not FAIL — the old build cannot fail at something it never claimed to do. Everything else
 * is graded by the unchanged rules of gokhanSikayetKorpusu.ts (beklentiDegerlendir).
 *
 * The rule is structural and narrow on purpose: an entry is NEW only when its EXPECTATION names a mechanism that is
 * absent from this commit's source. A complaint that was merely filed after the checkpoint is not NEW — whether the
 * old build already answered it correctly is exactly what the run measures.
 *
 * PURE (no scene, no mocks): the action registry is passed in by the runner.
 */
import type { Beklenti, KorpusGirdisi, KorpusRota } from './gokhanSikayetKorpusu'

/** The checkpoint's surfaces. 'sesllm' = the ElevenLabs Custom LLM endpoint; it is graded with the corpus's voice expectations. */
export type CheckpointYuzeyi = 'yazi' | 'panel' | 'sesllm'

/** Steps of lib/asistan/ayseCevapla.ts that can answer a turn at this commit. */
export const CHECKPOINT_ROTALARI: readonly KorpusRota[] = ['kimlik', 'oku', 'arama', 'hizli-kart', 'model']

/** Routes added after the checkpoint, with what they are. */
export const SONRADAN_GELEN_ROTALAR: Partial<Record<KorpusRota, string>> = {
  kapsam: 'the model-free scope gate and its fixed refusal',
  takvim: 'the model-free calendar handler (day / week summary, free slots)',
  gurultu: 'the recogniser-noise drop',
  'dosya-ac': 'the model-free "open the chart" handler and its fixed sentences',
  kayit: 'the model-free record tables (vaccines, measurements, exams) from stored rows',
}

/**
 * Fixed sentences written by a handler that does not exist at this commit (checked: none of them occurs under app/,
 * lib/, core/ or specialties/ at ac947eef). An `icerir` pattern that contains one can only be satisfied by that handler.
 */
export const SONRADAN_GELEN_CUMLELER: { parca: string; ne: string }[] = [
  { parca: 'Bu isimde bir hasta bulamadım', ne: 'the fixed "no such patient" sentence of the chart-open handler' },
  { parca: 'dosyası açık', ne: 'the fixed "chart is open" sentence of the chart-open handler' },
  { parca: 'Dikkat Hocam', ne: 'the server-written safety line on a medication card (NOTYA-AYSE-GUVENLIK-01)' },
]

/**
 * Why this entry is NEW on this surface, or null when the checkpoint could in principle pass it.
 * `eylemAnahtarlari` = the action registry of this commit (core/eylemler/kayit.ts eylemler()).
 */
export function yeniYetenek(g: KorpusGirdisi, beklenti: Beklenti | 'MANUAL', yuzey: CheckpointYuzeyi, eylemAnahtarlari: ReadonlySet<string>): string | null {
  if (g.geriAlDk) return 'the stored conversation-context record (and its expiry) did not exist'
  if (beklenti === 'MANUAL') return null
  if (beklenti.ret) return 'the fixed out-of-scope refusal did not exist'
  if (yuzey !== 'panel' && beklenti.rota?.length && !beklenti.rota.some((r) => CHECKPOINT_ROTALARI.includes(r))) {
    return `route ${beklenti.rota.join(' / ')} did not exist: ${beklenti.rota.map((r) => SONRADAN_GELEN_ROTALAR[r] || r).join('; ')}`
  }
  for (const ad of [beklenti.arac, beklenti.kart]) {
    if (ad && !eylemAnahtarlari.has(ad)) return `the action ${ad} did not exist in the registry`
  }
  for (const d of beklenti.icerir || []) {
    const c = SONRADAN_GELEN_CUMLELER.find((x) => d.includes(x.parca))
    if (c) return `expects ${c.ne}`
  }
  if (yuzey === 'sesllm' && beklenti.okunus) return 'graded on the text handed to the Fish speech engine, which did not exist'
  return null
}
