/**
 * NOTYA-SES-NORMAL-01 — dev tool: which abbreviations do Ayşe's spoken answers still carry after the medical speech layer?
 *
 *   npm run denetim:ses-kisaltma            the last corpus runs found in .denetim-out (live and stand-in)
 *   npm run denetim:ses-kisaltma -- --kuru  the stand-in run only
 *   npm run denetim:ses-kisaltma -- --canli the live run only
 *
 * Reads the voice turns of .denetim-out/gokhan-korpus[-kuru].jsonl (written by npm run denetim:korpus[:kuru]), builds
 * the engine text of each spoken answer with fishMetni — the same function the speech path uses — and lists the
 * all-capital and mixed-capital tokens that are left, with how often and where. Each line is a candidate entry for
 * lib/ses/tibbiSeslendirmeSozluk.ts (or a word to leave alone). Prints only; changes nothing. Synthetic patients only.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fishMetni } from '../../lib/asistan/fishSes'
import { bilinmeyenKisaltmalar } from '../../lib/ses/gelistirme/bilinmeyenKisaltma'
import { seslendirilmemisler } from '../../lib/ses/tibbiSeslendirme'

const arg = process.argv.slice(2)
const kok = process.cwd()
const adaylar = [
  ...(arg.includes('--kuru') ? [] : ['gokhan-korpus.jsonl']),
  ...(arg.includes('--canli') ? [] : ['gokhan-korpus-kuru.jsonl']),
].map((d) => path.join(kok, '.denetim-out', d)).filter((d) => fs.existsSync(d))

if (!adaylar.length) {
  console.log('SES KISALTMA DENETİMİ KOŞMADI: .denetim-out içinde korpus çıktısı yok. Önce: npm run denetim:korpus:kuru (NOT RUN — no corpus run to read.)')
  process.exit(2)
}

for (const dosya of adaylar) {
  const satirlar = fs.readFileSync(dosya, 'utf8').split('\n').filter(Boolean).map((s) => JSON.parse(s) as { yuzey?: string; sozlu?: string; id?: string })
  const sesli = satirlar.filter((s) => s.yuzey === 'ses' && String(s.sozlu || '').trim())
  const okunuslar = sesli.map((s) => fishMetni(String(s.sozlu)))
  const kalan = bilinmeyenKisaltmalar(okunuslar)
  const sozlukten = new Map<string, number>()
  for (const o of okunuslar) for (const k of seslendirilmemisler(o)) sozlukten.set(k, (sozlukten.get(k) || 0) + 1)

  console.log(`\n${path.relative(kok, dosya)} — ${sesli.length} voice turns with speech (${satirlar.length} graded turns).`)
  console.log(`Unknown capital tokens left in the engine text: ${kalan.length} distinct, ${kalan.reduce((t, k) => t + k.adet, 0)} occurrences.`)
  for (const k of kalan) console.log(`  ${String(k.adet).padStart(4)}  ${k.yazi.padEnd(18)} ${k.tur.padEnd(6)} … ${k.ornek}`)
  console.log(`Dictionary abbreviations or unit symbols the layer left unread: ${sozlukten.size}.`)
  for (const [k, n] of [...sozlukten].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${k}`)
}
