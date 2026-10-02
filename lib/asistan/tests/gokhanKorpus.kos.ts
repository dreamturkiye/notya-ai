/**
 * NOTYA-CHECKPOINT-KARSILASTIRMA-01 — RUN Dr. Gökhan's complaint corpus against the 2026-09-27 checkpoint build
 * (commit ac947eef: the brain before the later routers, ElevenLabs voice). A MEASUREMENT of the old Ayşe, to be
 * read next to today's run; it proposes nothing.
 *
 *   OPENROUTER_API_KEY=… npm run denetim:korpus:checkpoint        live: this commit's primary model, guard refused
 *   npm run denetim:korpus:checkpoint:kuru                        dry: a stand-in answers instead of the model
 *     [KORPUS_SADECE=L-KIMLIK-ANNE,T-,Y-0]   entry ids, or id prefixes ending in "-"
 *     [KORPUS_KAT=kimlik,takvim]             categories
 *     [KORPUS_KAYNAK=OPEN-COMMITMENTS]       substring of a source path or source id
 *     [KORPUS_YUZEY=yazi|panel|sesllm]       one surface (sesllm = the ElevenLabs Custom LLM endpoint)
 *     [NOTYA_MODEL_HIZLI=<slug>]             answer with another primary model (lib/ai/modeller.ts) — e.g. today's,
 *                                            to separate what the code changed from what the model changed
 *
 * Needs nothing but the provider key: the database is the in-memory scene and every patient is synthetic, so no
 * production row is read or written. Without a key the live run is SKIPPED and says so; nothing is written.
 *
 * Output: .denetim-out/korpus-checkpoint.jsonl (one row per graded turn: id, surface, verdict, route, answer, …;
 * every row says whether it is live or stand-in) and .denetim-out/korpus-checkpoint.meta.json. The comparison with
 * today's results is scripts/checkpoint-karsilastir.mts. A filtered run writes korpus-checkpoint-kismi.* instead, so
 * a partial run never replaces the full one. Not part of `npm test` — it is not a *.test.ts file.
 */
import { birincilModelAdi, gercekModelAc, ortam, sahneHazirla, vekilOpenRouter } from './ayseSahne'
import { it } from 'node:test'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { korpusuKos, ozetle } from './gokhanKorpusKosucu'
import type { CheckpointYuzeyi } from './checkpointYetenek'
import { GOKHAN_SIKAYET_KORPUSU, korpusYukle, type KorpusFiltresi, type Yuzey } from './gokhanSikayetKorpusu'

const KURU = process.env.AYSE_DENETIM_KURU === '1'
const liste = (v: string | undefined) => v?.split(',').map((x) => x.trim()).filter(Boolean)
const YUZEY = process.env.KORPUS_YUZEY as CheckpointYuzeyi | undefined
const KORPUS_YUZEYI: Record<CheckpointYuzeyi, Yuzey> = { yazi: 'yazi', panel: 'panel', sesllm: 'ses' }
const FILTRE: KorpusFiltresi = { idler: liste(process.env.KORPUS_SADECE), kat: liste(process.env.KORPUS_KAT), kaynak: process.env.KORPUS_KAYNAK || undefined }

it('Gökhan şikâyet korpusu — 2026-09-27 checkpoint', { timeout: 4 * 60 * 60_000 }, async (t) => {
  await sahneHazirla()
  if (!gercekModelAc(KURU ? vekilOpenRouter : undefined)) {
    console.log('CHECKPOINT KORPUSU KOŞMADI: OPENROUTER_API_KEY yok. (NOT RUN — no provider credentials in this environment. Dry run: npm run denetim:korpus:checkpoint:kuru)')
    t.skip('OPENROUTER_API_KEY yok')
    return
  }
  // Entries of the surface's corpus counterpart only; a session keeps its earlier entries (korpusYukle).
  const girdiler = korpusYukle({ ...FILTRE, ...(YUZEY ? { yuzeyler: [KORPUS_YUZEYI[YUZEY]] } : {}) })
  const filtreli = Boolean(YUZEY || FILTRE.idler?.length || FILTRE.kat?.length || FILTRE.kaynak)
  const ad = `korpus-checkpoint${filtreli ? '-kismi' : ''}`
  const cikti = path.join(process.cwd(), '.denetim-out')
  fs.mkdirSync(cikti, { recursive: true })
  // `node --test` holds the file's output until the test ends; a live run takes hours, so progress goes to a file.
  const ilerlemeDosyasi = path.join(cikti, `${ad}.ilerleme.log`)
  fs.writeFileSync(ilerlemeDosyasi, '')
  const satirlar = await korpusuKos(girdiler, {
    vekil: KURU, ...(YUZEY ? { yuzeyler: [YUZEY] } : {}),
    ilerleme: (s) => fs.appendFileSync(ilerlemeDosyasi, `${s.id.padEnd(22)} ${s.surface.padEnd(8)} ${s.verdict.padEnd(10)} ${(s.ms / 1000).toFixed(1).padStart(5)}s  ${(s.route ?? '—').padEnd(10)} ${s.soz.slice(0, 48)}${s.nedenler.length ? `  ← ${s.nedenler.join('; ').slice(0, 110)}` : ''}\n`),
  })
  fs.writeFileSync(path.join(cikti, `${ad}.jsonl`), satirlar.map((s) => JSON.stringify(s)).join('\n') + '\n')
  const o = ozetle(satirlar)
  let commit = ''
  try { commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim() } catch { /* not a checkout */ }
  const meta = {
    mode: KURU ? 'stand-in' : 'live',
    model: KURU ? 'vekil (stand-in)' : birincilModelAdi(),
    // Doctor-local day of the run: the fixture dates are relative to it.
    tarih: new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' }),
    commit, korpus: GOKHAN_SIKAYET_KORPUSU.length, girdi: girdiler.length, tur: satirlar.length,
    yuzey: o.yuzey, toplam: o.toplam,
    maliyet: Number(satirlar.reduce((x, s) => x + s.maliyet, 0).toFixed(4)),
    // A query the in-memory database could not run would bias the answers; the list must be empty.
    sahteVeritabaniHatalari: [...new Set(ortam.sahteHatalari)],
    ...(filtreli ? { filtre: { ...FILTRE, yuzey: YUZEY ?? null } } : {}),
  }
  fs.writeFileSync(path.join(cikti, `${ad}.meta.json`), JSON.stringify(meta, null, 2) + '\n')
  console.log(`Çıktı: .denetim-out/${ad}.jsonl`)
  console.log(JSON.stringify(meta))
})
