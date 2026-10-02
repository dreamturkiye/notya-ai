/**
 * NOTYA-GOKHAN-KORPUS-01 — RUN Dr. Gökhan's complaint corpus against today's build.
 *
 *   OPENROUTER_API_KEY=… npm run denetim:korpus          live: the real primary model, guard disabled
 *   npm run denetim:korpus:kuru                          dry: a stand-in answers instead of the model
 *     [KORPUS_SADECE=L-KIMLIK-ANNE,T-,Y-0]   entry ids, or id prefixes ending in "-"
 *     [KORPUS_KAT=kimlik,takvim]             categories
 *     [KORPUS_KAYNAK=OPEN-COMMITMENTS]       substring of a source path or source id
 *     [KORPUS_YUZEY=yazi|ses|panel]          one surface
 *     [KORPUS_TZ=Europe/Istanbul]            the doctor's timezone
 *     [KORPUS_ETIKET=gokhan-korpus]          output name
 *     [KORPUS_KURU_RAPOR=1]                  dry run only: also write the report to docs/denetim/<date>-<etiket>-kuru.md
 *
 * Needs nothing but the OpenRouter key: the database is the in-memory scene and every patient is synthetic, so no
 * production row is read or written and the answers may be committed. The guard is disabled for the run — a
 * sentence the primary cannot answer is a failure, not a rescued answer. Full set: about 410 entries, about 840
 * graded turns (an entry is graded once per surface), of which roughly 400 reach the model.
 *
 * Without a key the live run is SKIPPED and says so; nothing is written.
 *
 * Output: .denetim-out/<etiket>[-kuru].jsonl (gitignored, one row per graded turn) and, for a live run,
 * docs/denetim/<date>-<etiket>.md. Not part of `npm test` — it is not a *.test.ts file.
 *
 * NOTYA-KALITE-STANDART-01: every row carries `kalite` — the verdicts of the quality rubric (lib/asistan/kalite/)
 * — and the report has a quality section. After a run:
 *   npm run denetim:kalite-karsilastir[:kuru]   the gate: non-zero exit when a rule's pass rate, the score or the FAIL
 *                                               count is worse than docs/denetim/kalite-taban.json
 *   npm run denetim:kalite-taban[:kuru]         write this run as the new baseline (a deliberate act)
 */
import { gercekModelAc, sahneHazirla } from './ayseSahne'
import { it } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { vekilOpenRouter } from './eylemDenetimi'
import { korpusRaporu, korpusuKos, ozetle } from './gokhanKorpusKosucu'
import { kaliteOzetle } from '../kalite/ozet'
import { GOKHAN_SIKAYET_KORPUSU, korpusYukle, type KorpusFiltresi, type Yuzey } from './gokhanSikayetKorpusu'
import { MODEL_HIZLI } from '../../ai/modeller'

const KURU = process.env.AYSE_DENETIM_KURU === '1'
const ETIKET = (process.env.KORPUS_ETIKET || 'gokhan-korpus').replace(/[^a-z0-9-]/gi, '-').toLowerCase()
const liste = (v: string | undefined) => v?.split(',').map((x) => x.trim()).filter(Boolean)
const YUZEY = process.env.KORPUS_YUZEY as Yuzey | undefined
const FILTRE: KorpusFiltresi = {
  idler: liste(process.env.KORPUS_SADECE), kat: liste(process.env.KORPUS_KAT), kaynak: process.env.KORPUS_KAYNAK || undefined,
  ...(YUZEY ? { yuzeyler: [YUZEY] } : {}),
}

it('Gökhan şikâyet korpusu', { timeout: 3 * 60 * 60_000 }, async (t) => {
  await sahneHazirla()
  if (!gercekModelAc(KURU ? vekilOpenRouter : undefined)) {
    console.log('GÖKHAN KORPUSU KOŞMADI: OPENROUTER_API_KEY yok. (NOT RUN — no OpenRouter credentials in this environment. Dry run: npm run denetim:korpus:kuru)')
    t.skip('OPENROUTER_API_KEY yok')
    return
  }
  const girdiler = korpusYukle(FILTRE)
  const satirlar = await korpusuKos(girdiler, {
    saatDilimi: process.env.KORPUS_TZ || 'Europe/Istanbul', vekil: KURU,
    ilerleme: (s) => console.log(`${s.id.padEnd(22)} ${s.yuzey.padEnd(5)} ${s.karar.padEnd(6)} ${(s.ms / 1000).toFixed(1).padStart(5)}s  ${(s.rota ?? '—').padEnd(10)} ${s.soz.slice(0, 48)}${s.nedenler.length ? `  ← ${s.nedenler.join('; ').slice(0, 110)}` : ''}`),
  })
  const cikti = path.join(process.cwd(), '.denetim-out')
  fs.mkdirSync(cikti, { recursive: true })
  fs.writeFileSync(path.join(cikti, `${ETIKET}${KURU ? '-kuru' : ''}.jsonl`), satirlar.map((s) => JSON.stringify(s)).join('\n') + '\n')
  // Doctor-local "today" for the file name.
  const tarih = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
  const filtre = Object.entries(FILTRE).filter(([, v]) => (Array.isArray(v) ? v.length : v)).map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(',') : v}`).join(' ')
  const model = KURU ? 'vekil (stand-in)' : (process.env.NOTYA_MODEL_HIZLI || MODEL_HIZLI)
  // Read by scripts/ayse-denetim/kalite-karsilastir.mts: which run the rows are, and whether it was filtered.
  fs.writeFileSync(path.join(cikti, `${ETIKET}${KURU ? '-kuru' : ''}.meta.json`), JSON.stringify({ tarih, model, mod: KURU ? 'kuru' : 'canli', filtre, girdi: girdiler.length, tur: satirlar.length }, null, 2) + '\n')
  const rapor = korpusRaporu({ tarih, model, satirlar, girdiSayisi: girdiler.length, kuru: KURU, ...(filtre ? { filtre } : {}) })
  const dokuman = path.join(process.cwd(), 'docs', 'denetim')
  const hedefler = KURU
    ? [path.join(cikti, `${ETIKET}-kuru.md`), ...(process.env.KORPUS_KURU_RAPOR === '1' ? [path.join(dokuman, `${tarih}-${ETIKET}-kuru.md`)] : [])]
    : [path.join(dokuman, `${tarih}-${ETIKET}.md`)]
  for (const hedef of hedefler) {
    fs.mkdirSync(path.dirname(hedef), { recursive: true })
    fs.writeFileSync(hedef, rapor)
    console.log(`Rapor: ${path.relative(process.cwd(), hedef)}`)
  }
  const o = ozetle(satirlar)
  const k = kaliteOzetle(satirlar)
  console.log(JSON.stringify({ girdi: girdiler.length, korpus: GOKHAN_SIKAYET_KORPUSU.length, ...o.toplam, maliyet: Number(satirlar.reduce((x, s) => x + s.maliyet, 0).toFixed(4)), kalitePuani: k.puan, kaliteKarari: k.toplam.toplam, kaliteYargilanan: k.yargilanan }))
  console.log(`Kalite kapısı: npm run denetim:kalite-karsilastir${KURU ? ':kuru' : ''}`)
})
