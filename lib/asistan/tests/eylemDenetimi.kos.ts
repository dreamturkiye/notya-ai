/**
 * NOTYA-AYSE-GERI-08 (audit PR 11) — RUN the action audit against the real primary model.
 *
 *   OPENROUTER_API_KEY=… npm run denetim:eylem
 *     [AYSE_DENETIM_ETIKET=ayse-eylem] [AYSE_DENETIM_SADECE=1,12,30] [AYSE_DENETIM_MOD=uretim|zorlamasiz]
 *     [AYSE_DENETIM_KANAL=yazi|ses] [AYSE_DENETIM_TZ=Europe/Istanbul]
 *
 * Needs nothing but the OpenRouter key: the database is the in-memory scene and the patient is synthetic, so no
 * production row is read or written and the answers may be committed. The guard is disabled for the run
 * (NOTYA_KORUYUCU_KAPALI=1) — a sentence the primary cannot answer is a failure, not a rescued answer.
 * Full set: 33 sentences × 2 channels × 2 passes ≈ 150 model calls.
 *
 * Without a key the run is SKIPPED and says so; nothing is written. With AYSE_DENETIM_KURU=1 a stand-in answers
 * instead of the model (harness check) and the output goes to .denetim-out only.
 *
 * Output: .denetim-out/<etiket>.jsonl (gitignored, one row per sentence) and, for a real run,
 * docs/denetim/<date>-<etiket>.md. Not part of `npm test` — it is not a *.test.ts file.
 */
import { gercekModelAc, sahneHazirla } from './ayseSahne'
import { it } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { EYLEM_CUMLELERI, denetimRaporu, eylemDenetiminiKos, ozetle, vekilOpenRouter, type Kanal, type Mod } from './eylemDenetimi'
import { MODEL_HIZLI } from '../../ai/modeller'

const KURU = process.env.AYSE_DENETIM_KURU === '1'
const ETIKET = (process.env.AYSE_DENETIM_ETIKET || 'ayse-eylem').replace(/[^a-z0-9-]/gi, '-').toLowerCase()
const SADECE = process.env.AYSE_DENETIM_SADECE?.split(',').map(Number).filter(Boolean)
const MOD = process.env.AYSE_DENETIM_MOD as Mod | undefined
const KANAL = process.env.AYSE_DENETIM_KANAL as Kanal | undefined

it('Ayşe eylem denetimi', { timeout: 60 * 60_000 }, async (t) => {
  await sahneHazirla()
  if (!gercekModelAc(KURU ? vekilOpenRouter : undefined)) {
    console.log('EYLEM DENETİMİ KOŞMADI: OPENROUTER_API_KEY yok. (NOT RUN — no OpenRouter credentials in this environment.)')
    t.skip('OPENROUTER_API_KEY yok')
    return
  }
  const cumleler = EYLEM_CUMLELERI.filter((c) => !SADECE || SADECE.includes(c.no))
  const satirlar = await eylemDenetiminiKos({
    cumleler, saatDilimi: process.env.AYSE_DENETIM_TZ || 'Europe/Istanbul',
    ...(MOD ? { modlar: [MOD] } : {}), ...(KANAL ? { kanallar: [KANAL] } : {}),
    ilerleme: (s) => console.log(`${String(s.no).padStart(3)} ${s.mod.padEnd(10)} ${s.kanal.padEnd(4)} ${s.dogru ? 'OK  ' : 'FAIL'} ${(s.ms / 1000).toFixed(1).padStart(5)}s  ${(s.cagrilan.join(',') || '—').padEnd(28)} ${s.soz.slice(0, 50)}${s.hata ? `  ${s.hata}` : ''}`),
  })
  const cikti = path.join(process.cwd(), '.denetim-out')
  fs.mkdirSync(cikti, { recursive: true })
  fs.writeFileSync(path.join(cikti, `${ETIKET}${KURU ? '-kuru' : ''}.jsonl`), satirlar.map((s) => JSON.stringify(s)).join('\n') + '\n')
  // Doctor-local "today" for the file name; the report itself carries no clock-dependent claim.
  const tarih = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
  const rapor = denetimRaporu({ tarih, model: KURU ? 'vekil (stand-in)' : (process.env.NOTYA_MODEL_HIZLI || MODEL_HIZLI), satirlar, kuru: KURU })
  const hedef = KURU ? path.join(cikti, `${ETIKET}-kuru.md`) : path.join(process.cwd(), 'docs', 'denetim', `${tarih}-${ETIKET}.md`)
  fs.mkdirSync(path.dirname(hedef), { recursive: true })
  fs.writeFileSync(hedef, rapor)
  console.log(JSON.stringify(ozetle(satirlar)))
  console.log(`Rapor: ${path.relative(process.cwd(), hedef)}`)
})
