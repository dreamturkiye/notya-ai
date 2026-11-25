/**
 * AKKS runner — drives a run on the PRODUCTION assistant through the founder-only evaluation route
 * (app/api/kurucu/ayse-kalite-degerlendir). The model key never leaves the host.
 *
 *   AKKS_ANAHTAR=<pass> npx tsx scripts/akks/kos.mts --url https://<host> --tur taban
 *        --branslar pediatri,kulak-burun-bogaz [--bransBasina 40] [--izleme] [--paralel 5] [--etiket taban-2026-11-24]
 *   AKKS_ANAHTAR=<pass> npx tsx scripts/akks/kos.mts --url https://<host> --kosu <runId>      resume + close a run
 *
 * AKKS_ANAHTAR: a short-lived evaluation pass (purpose 'ayse-kalite-degerlendir', ≤ 2 h, only its SHA-256 in the database).
 * It is read from the environment and never printed. Per-item lines go to .denetim-out/akks-<etiket>.jsonl (gitignored);
 * the console shows counts and the per-branş summary only.
 */
import fs from 'node:fs'
import path from 'node:path'

const arg = (ad: string) => { const i = process.argv.indexOf(`--${ad}`); return i > 0 ? process.argv[i + 1] : undefined }
const URL_ = (arg('url') || '').replace(/\/$/, '')
const ANAHTAR = process.env.AKKS_ANAHTAR || ''
if (!URL_ || !ANAHTAR) { console.error('--url and AKKS_ANAHTAR are required'); process.exit(2) }
const UC = `${URL_}/api/kurucu/ayse-kalite-degerlendir`
const PARALEL = Math.max(1, Math.min(10, Number(arg('paralel')) || 5))

async function cagir(govde: Record<string, unknown>, deneme = 2): Promise<Record<string, unknown>> {
  for (let i = 0; i < deneme; i++) {
    try {
      const r = await fetch(UC, { method: 'POST', headers: { 'content-type': 'application/json', 'x-degerlendirme-anahtari': ANAHTAR }, body: JSON.stringify(govde), signal: AbortSignal.timeout(310_000) })
      const j = (await r.json().catch(() => ({}))) as Record<string, unknown>
      if (r.ok) return j
      if (r.status === 403 || r.status === 404) throw new Error(`refused (${r.status})`)
      if (i === deneme - 1) throw new Error(`HTTP ${r.status} ${String(j.error || '')}`)
    } catch (e) {
      if (i === deneme - 1 || (e instanceof Error && e.message.startsWith('refused'))) throw e
    }
    await new Promise((r) => setTimeout(r, 3000))
  }
  throw new Error('unreachable')
}

let kosuId = arg('kosu') || ''
let soruIdleri: string[] = []
let etiket = arg('etiket') || ''
if (!kosuId) {
  const tur = arg('tur') || 'elle'
  etiket ||= `${tur}-${new Date().toISOString().slice(0, 10)}`
  const r = await cagir({
    islem: 'kosu-ac', etiket, tur, branslar: arg('branslar')?.split(',').filter(Boolean),
    sadeceIzleme: process.argv.includes('--izleme'), bransBasina: arg('bransBasina') ? Number(arg('bransBasina')) : undefined,
  })
  kosuId = String(r.kosuId); soruIdleri = r.soruIdleri as string[]
  console.log(`run ${kosuId} opened · ${soruIdleri.length} items`)
} else {
  soruIdleri = (await cagir({ islem: 'kalan', kosuId })).kalan as string[]
  etiket ||= kosuId.slice(0, 8)
  console.log(`run ${kosuId} resumed · ${soruIdleri.length} items left`)
}

const cikti = path.join(process.cwd(), '.denetim-out', `akks-${etiket.replace(/[^\w.-]/g, '-')}.jsonl`)
fs.mkdirSync(path.dirname(cikti), { recursive: true })
let bitti = 0, hata = 0, zararli = 0
const t0 = Date.now()
const kuyruk = [...soruIdleri]
async function isci() {
  while (kuyruk.length) {
    const soruId = kuyruk.shift()!
    try {
      const r = await cagir({ islem: 'soru', kosuId, soruId })
      fs.appendFileSync(cikti, `${JSON.stringify(r)}\n`)
      if (r.hata) hata++
      if (r.zararli) zararli++
    } catch (e) {
      hata++
      fs.appendFileSync(cikti, `${JSON.stringify({ soruId, hata: e instanceof Error ? e.message : 'error' })}\n`)
    }
    bitti++
    if (bitti % 10 === 0 || !kuyruk.length) console.log(`${bitti}/${soruIdleri.length} · errors ${hata} · harmful ${zararli} · ${Math.round((Date.now() - t0) / 1000)} s`)
  }
}
await Promise.all(Array.from({ length: PARALEL }, isci))

const kalan = (await cagir({ islem: 'kalan', kosuId })).kalan as string[]
if (kalan.length) { console.log(`${kalan.length} items still unanswered — rerun with --kosu ${kosuId}`); process.exit(1) }
const k = await cagir({ islem: 'kosu-kapat', kosuId }) as { ozet: { genel: Record<string, unknown>; branslar: Record<string, Record<string, unknown>> }; kapi: { gecti: boolean; nedenler: string[] } | null; maliyet: Record<string, unknown> }
const yz = (x: unknown) => (typeof x === 'number' ? `${Math.round(x * 1000) / 10}%` : '—')
for (const [b, o] of Object.entries(k.ozet.branslar)) console.log(`${b.padEnd(26)} n=${o.n} overall=${yz(o.genelPuan)} guideline=${yz(o.kilavuzUyumu)} harmful=${o.zararli} citation=${yz(o.atifDogrulugu)} bar=${(o.bar as { durum: string }).durum}`)
console.log(`ALL n=${k.ozet.genel.n} overall=${yz(k.ozet.genel.genelPuan)} harmful=${k.ozet.genel.zararli} · gate: ${k.kapi ? (k.kapi.gecti ? 'pass' : `FAIL ${k.kapi.nedenler.join('; ')}`) : 'no baseline'} · model calls ${String(k.maliyet.cagri)}`)
