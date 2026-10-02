/**
 * NOTYA-KALITE-STANDART-01 — the quality rubric on ONE answer, for the live spot check (docs/qa/canli-kontrol.md).
 *
 * Give it the doctor's sentence and what Ayşe answered; it prints every verdict of lib/asistan/kalite/ with its rule
 * id. No model call, no network, nothing written. The rubric measures form and wording — whether the values are the
 * chart's is judged by the person running the spot check, against the answer key.
 *
 *   npx tsx scripts/ayse-denetim/kalite-cevap.mts --soru "Kilosu kaç?" --hasta "Ad Soyad" --ekran cevap.txt
 *   npx tsx scripts/ayse-denetim/kalite-cevap.mts --soru "Bu hastayı bana kısaca özetler misin?" --yuzey ses \
 *     --hasta "Ad Soyad" --soz soylenen.txt [--ekran ekran.txt]
 *
 *   --soru     the sentence said or typed
 *   --yuzey    yazi (default) | ses | panel
 *   --hasta    the open patient's name, when the answer is about that patient's chart
 *   --ekran    file with the screen answer
 *   --soz      file with what Ayşe SAID (voice)
 *   --kimlik   comma-separated identity values that must not be spoken (parent names, phone)
 *
 * Keep the answer files outside the repository when the patient is not a synthetic one. Exit code 1 when a verdict
 * failed, 2 on a usage error.
 */
import fs from 'node:fs'
import { cevabiDenetle } from '../../lib/asistan/kalite/rubrik'
import { istenenOlcumBul, okuIstegiMi, yapiBul } from '../../lib/asistan/kalite/cikarim'
import { fishMetni } from '../../lib/asistan/fishSes'
import type { KaliteYuzeyi } from '../../lib/asistan/kalite/denetimler'

const arg = (ad: string) => { const i = process.argv.indexOf(`--${ad}`); return i > 0 ? process.argv[i + 1] : undefined }
const dosya = (yol: string | undefined) => (yol ? fs.readFileSync(yol, 'utf8').trim() : '')

const soru = arg('soru') || ''
const yuzey = (arg('yuzey') || 'yazi') as KaliteYuzeyi
const ekran = dosya(arg('ekran'))
const soz = dosya(arg('soz'))
if (!soru || !['yazi', 'ses', 'panel'].includes(yuzey) || (yuzey === 'ses' ? !arg('soz') : !arg('ekran'))) {
  console.error('Kullanım: npx tsx scripts/ayse-denetim/kalite-cevap.mts --soru "<cümle>" [--yuzey yazi|ses|panel] [--hasta "<ad>"] --ekran <dosya> | --soz <dosya>')
  process.exit(2)
}

const olcum = istenenOlcumBul(soru)
const kararlar = cevabiDenetle({
  soru, yuzey, ekran,
  ...(yuzey === 'ses' ? { soz, okunus: fishMetni(soz) } : {}),
  hastaAdi: arg('hasta') || null,
  yapi: yapiBul(soru),
  olcum,
  olgu: olcum !== null,
  kimlikDegerleri: (arg('kimlik') || '').split(',').map((x) => x.trim()).filter(Boolean),
  okuIstegi: okuIstegiMi(soru),
})
for (const k of kararlar) console.log(`${k.gecti ? 'PASS' : 'FAIL'}  ${k.kural}  ${k.denetim.padEnd(16)} ${k.hedef === 'soz' ? 'spoken' : 'screen'}${k.neden ? `  — ${k.neden}` : ''}`)
const kalan = kararlar.filter((k) => !k.gecti)
console.log(`${kararlar.length - kalan.length} / ${kararlar.length} verdicts passed.${kalan.length ? ` Failed rules: ${[...new Set(kalan.map((k) => k.kural))].join(', ')}.` : ''}`)
process.exit(kalan.length ? 1 : 0)
