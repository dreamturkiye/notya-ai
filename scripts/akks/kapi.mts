/**
 * AKKS gate — "any change to prompts / models / assistant routing must not lower the AKKS score on recorded runs".
 *
 *   npx tsx scripts/akks/kapi.mts --yerel <file.json>     replay a recorded set (committed sample: core/akks/testing/kayit-ornek.json)
 *   AKKS_ANAHTAR=<pass> npx tsx scripts/akks/kapi.mts --url https://<host> --son        latest finished run: its gate decision
 *   AKKS_ANAHTAR=<pass> npx tsx scripts/akks/kapi.mts --url https://<host> --kosu <id>  that run's gate decision
 *   AKKS_ANAHTAR=<pass> npx tsx scripts/akks/kapi.mts --url https://<host> --tekrar <id> replay that run's recorded grades
 *
 * Replay (no model call): the recorded grader outputs are re-scored with the CURRENT rubric code (core/akks/kapi.ts
 * tekrarKarari) and must give the same or a higher summary than the one stored with the run — guards the scoring code.
 * Gate: a new run (the nightly cron starts one for every newly deployed watched-file hash) is compared, paired, with the
 * accepted baseline (kapiKarari). Exit 1 on any regression, a stale / partial run, or a missing recording.
 */
import fs from 'node:fs'
import { tekrarKarari } from '../../core/akks/kapi'
import type { CevapKaydi } from '../../core/akks/tipler'

const arg = (ad: string) => { const i = process.argv.indexOf(`--${ad}`); return i > 0 ? process.argv[i + 1] : undefined }
const bayrak = (ad: string) => process.argv.includes(`--${ad}`)

async function uzak(govde: Record<string, unknown>): Promise<Record<string, unknown>> {
  const url = (arg('url') || '').replace(/\/$/, ''), anahtar = process.env.AKKS_ANAHTAR || ''
  if (!url || !anahtar) { console.error('--url and AKKS_ANAHTAR are required'); process.exit(2) }
  const r = await fetch(`${url}/api/kurucu/ayse-kalite-degerlendir`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-degerlendirme-anahtari': anahtar }, body: JSON.stringify(govde) })
  if (!r.ok) { console.error(`HTTP ${r.status}`); process.exit(2) }
  return (await r.json()) as Record<string, unknown>
}

function tekrar(kayitli: { genelPuan: number | null; zararli: number; kilavuzUyumu: number | null }, kayitlar: CevapKaydi[]) {
  if (!kayitlar.length) { console.error('no recorded grades: the set is stale — re-record it'); process.exit(1) }
  const t = tekrarKarari(kayitli, kayitlar)
  console.log(JSON.stringify({ kayitli, simdi: { genelPuan: t.simdi.genelPuan, kilavuzUyumu: t.simdi.kilavuzUyumu, zararli: t.simdi.zararli, n: t.simdi.n } }))
  if (!t.gecti) { console.error(`AKKS replay FAILED: ${t.nedenler.join('; ')}`); process.exit(1) }
  console.log('AKKS replay: no drop')
}

if (arg('yerel')) {
  const f = JSON.parse(fs.readFileSync(arg('yerel')!, 'utf8')) as { kayitli: { genelPuan: number | null; zararli: number; kilavuzUyumu: number | null }; kayitlar: CevapKaydi[] }
  tekrar(f.kayitli, f.kayitlar)
} else if (arg('tekrar')) {
  const kosuId = arg('tekrar')!
  const o = (await uzak({ islem: 'ozet', kosuId })).kosu as { ozet?: { genel?: { genelPuan: number | null; zararli: number; kilavuzUyumu: number | null } } } | null
  if (!o?.ozet?.genel) { console.error('run not finished / unknown'); process.exit(1) }
  tekrar(o.ozet.genel, (await uzak({ islem: 'kayitlar', kosuId })).kayitlar as CevapKaydi[])
} else if (bayrak('son') || arg('kosu')) {
  const o = (await uzak({ islem: 'ozet', kosuId: arg('kosu') })).kosu as { id: string; etiket: string; tur: string; durum: string; kapi: { gecti: boolean; nedenler: string[] } | null } | null
  if (!o) { console.error('no finished run'); process.exit(1) }
  if (o.durum !== 'tamam') { console.error(`run ${o.etiket} is ${o.durum} — not finished`); process.exit(1) }
  if (!o.kapi) { console.log(`run ${o.etiket} (${o.tur}) has no baseline to compare with`); process.exit(o.tur === 'taban' ? 0 : 1) }
  if (!o.kapi.gecti) { console.error(`AKKS gate FAILED for ${o.etiket}: ${o.kapi.nedenler.join(' | ')}`); process.exit(1) }
  console.log(`AKKS gate passed for ${o.etiket}`)
} else {
  console.error('usage: --yerel <file> | --son | --kosu <id> | --tekrar <id>  (remote modes need --url and AKKS_ANAHTAR)')
  process.exit(2)
}
