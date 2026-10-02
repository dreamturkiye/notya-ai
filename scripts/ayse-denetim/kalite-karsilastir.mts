/**
 * NOTYA-KALITE-STANDART-01 — the quality gate (docs/AYSE-KALITE-STANDARDI.md, Q-40 and Q-41).
 *
 * Compares the last corpus run (.denetim-out/gokhan-korpus[-kuru].jsonl, written by npm run denetim:korpus[:kuru])
 * with the baseline docs/denetim/kalite-taban.json and exits non-zero when anything is worse:
 *
 *   npm run denetim:kalite-karsilastir          live run against the live baseline
 *   npm run denetim:kalite-karsilastir:kuru     stand-in run against the stand-in baseline
 *   npm run denetim:kalite-taban[:kuru]         write the last run as the new baseline (a deliberate act: commit it)
 *
 *   --tolerans 0.5   percentage points a pass rate or the score may fall (default 0; for live-run noise)
 *   --kismi          the run was filtered: turn-by-turn comparison only, no counts and no rates
 *   --etiket ad      KORPUS_ETIKET of the run (default gokhan-korpus)
 *
 * Exit codes: 0 gate open · 1 something is worse than the baseline · 2 nothing to compare (no run, no baseline for
 * this mode, or a filtered run without --kismi).
 *
 * A stand-in run judges only the answers of model-free handlers; it says nothing about what the model writes. The
 * release gate of Q-41 is the LIVE comparison; the stand-in comparison is what can run without a model key.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { TABAN_ACIKLAMASI, kaliteOzetle, tabanKesitiKur, tabanlaKarsilastir, type KaliteSatiri, type KaliteTabani, type TabanModu } from '../../lib/asistan/kalite/ozet'

const arg = process.argv.slice(2)
const bayrak = (ad: string) => arg.includes(`--${ad}`)
const deger = (ad: string) => { const i = arg.indexOf(`--${ad}`); return i !== -1 ? arg[i + 1] : undefined }

const mod: TabanModu = bayrak('kuru') ? 'kuru' : 'canli'
const etiket = (deger('etiket') || 'gokhan-korpus').replace(/[^a-z0-9-]/gi, '-').toLowerCase()
const kok = process.cwd()
const satirDosyasi = path.join(kok, '.denetim-out', `${etiket}${mod === 'kuru' ? '-kuru' : ''}.jsonl`)
const metaDosyasi = satirDosyasi.replace(/\.jsonl$/, '.meta.json')
const tabanDosyasi = path.join(kok, 'docs', 'denetim', 'kalite-taban.json')
const goreli = (d: string) => path.relative(kok, d)

function bitir(kod: number, mesaj: string): never {
  console.log(mesaj)
  process.exit(kod)
}

if (!fs.existsSync(satirDosyasi)) {
  bitir(2, `KALİTE KAPISI KOŞMADI: ${goreli(satirDosyasi)} yok. Önce: npm run denetim:korpus${mod === 'kuru' ? ':kuru' : ''} (NOT RUN — no corpus run to compare.)`)
}
const satirlar = fs.readFileSync(satirDosyasi, 'utf8').split('\n').filter(Boolean).map((s) => JSON.parse(s) as KaliteSatiri)
if (satirlar.some((s) => s.kalite === undefined)) {
  bitir(2, `KALİTE KAPISI KOŞMADI: ${goreli(satirDosyasi)} satırlarında "kalite" alanı yok — koşum bu sürümden eski. (NOT RUN — rerun the corpus.)`)
}
const meta = (fs.existsSync(metaDosyasi) ? JSON.parse(fs.readFileSync(metaDosyasi, 'utf8')) : {}) as { tarih?: string; model?: string; filtre?: string }
const filtreli = Boolean(meta.filtre)
const taban: KaliteTabani = fs.existsSync(tabanDosyasi)
  ? JSON.parse(fs.readFileSync(tabanDosyasi, 'utf8')) as KaliteTabani
  : { surum: 1, aciklama: TABAN_ACIKLAMASI, kuru: null, canli: null }

const o = kaliteOzetle(satirlar)
const fail = satirlar.filter((s) => s.karar === 'FAIL').length
console.log(`Run (${mod === 'kuru' ? 'stand-in' : 'live'}): ${satirlar.length} graded turns, ${o.yargilanan} judged by the rubric, corpus FAIL ${fail}, quality score ${o.puan} (${o.toplam.gecen}/${o.toplam.toplam} verdicts).`)
if (mod === 'kuru') console.log('Stand-in mode: only answers of model-free handlers are judged. Nothing here measures what the model writes.')

if (bayrak('yaz')) {
  if (filtreli) bitir(2, `TABAN YAZILMADI: koşum süzülmüş (${meta.filtre}). The baseline is written from a full run only.`)
  let sha = ''
  try { sha = execSync('git rev-parse --short HEAD', { cwd: kok }).toString().trim() } catch { sha = '' }
  const kirli = (() => { try { return execSync('git status --porcelain -- lib app core specialties', { cwd: kok }).toString().trim().length > 0 } catch { return false } })()
  const tarih = meta.tarih || new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
  taban.surum = 1
  taban.aciklama = TABAN_ACIKLAMASI
  taban[mod] = tabanKesitiKur(satirlar, { tarih, sha: `${sha}${kirli ? '+uncommitted' : ''}`, model: meta.model || (mod === 'kuru' ? 'vekil (stand-in)' : '?') })
  fs.mkdirSync(path.dirname(tabanDosyasi), { recursive: true })
  fs.writeFileSync(tabanDosyasi, JSON.stringify(taban, null, 2) + '\n')
  bitir(0, `Taban yazıldı: ${goreli(tabanDosyasi)} [${mod}] — ${satirlar.length} tur, FAIL ${fail}, puan ${o.puan}. Commit it.`)
}

const kesit = taban[mod]
if (!kesit) {
  bitir(2, `KALİTE KAPISI KOŞMADI: ${goreli(tabanDosyasi)} içinde "${mod}" tabanı yok. (NOT RUN — no baseline for this mode; write one with npm run denetim:kalite-taban${mod === 'kuru' ? ':kuru' : ''}.)`)
}
if (filtreli && !bayrak('kismi')) {
  bitir(2, `KALİTE KAPISI KOŞMADI: koşum süzülmüş (${meta.filtre}). Tam koşum yapın ya da --kismi verin. (NOT RUN — a filtered run is compared only with --kismi.)`)
}

const tolerans = Number(deger('tolerans') ?? 0)
const r = tabanlaKarsilastir(kesit, satirlar, { mod, tolerans: Number.isFinite(tolerans) ? tolerans : 0, kismi: bayrak('kismi') })
console.log(`Baseline [${mod}]: ${kesit.tarih}, ${kesit.sha}, ${kesit.model} — ${kesit.tur} turns, corpus FAIL ${kesit.fail}, quality score ${kesit.puan}.`)
for (const n of r.notlar) console.log(`  note: ${n}`)
for (const s of r.sorunlar) console.log(`  WORSE: ${s}`)
bitir(r.gecti ? 0 : 1, r.gecti
  ? `KALİTE KAPISI AÇIK (${mod}): nothing is worse than the baseline.`
  : `KALİTE KAPISI KAPALI (${mod}): ${r.sorunlar.length} item(s) worse than the baseline.`)
