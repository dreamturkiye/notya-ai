/**
 * AKKS gate — the watched files (pure). Any change to what shapes Ayşe's clinical answer (prompts, model policy, assistant
 * routing, source stacks / citation lock, the specialty assistant prompts) changes the manifest hash in
 * core/akks/izlenen.json. Then:
 *   1. `npm test` fails (lib/akks/akksIzleme.test.ts) until the change is acknowledged with
 *      `npm run akks:izle -- --yaz "<what changed>"` — the acknowledgement is a line in docs/AKKS-KAPI-KAYDI.md;
 *   2. the deployed build carries the new hash; the nightly AKKS cron sees a hash no finished run has measured and runs the
 *      tracking set as a GATE run against the accepted baseline (core/akks/kapi.ts kapiKarari) — a regression turns the
 *      founder dashboard red and `npm run akks:kapi -- --son` exits 1.
 * The voice-path founder lock (lib/asistan/ses-kilit.json) is separate and unchanged; several files are in both lists.
 */
import { createHash } from 'node:crypto'

/** Exact files and directory prefixes (prefix ends with "/"); SOAP-only prompt files are not part of the assistant. */
export const IZLENEN_YOLLAR: readonly string[] = [
  'lib/ai/modeller.ts',
  'lib/ai/cagir.ts',
  'lib/ai/saglayici.ts',
  'lib/asistan/ayseCevapla.ts',
  'lib/asistan/onbellekBloklari.ts',
  'lib/asistan/personaEngine.ts',
  'lib/asistan/soruNiyeti.ts',
  'lib/asistan/yanitCoz.ts',
  'lib/asistan/okumaAraclari.ts',
  'lib/asistan/turkishSpecialtyRefs.ts',
  'lib/doktor/kaynakKilidi.ts',
  'lib/doktor/dozKilidi.ts',
  'lib/doktor/klinikMetin.ts',
  'lib/klinik/ozelPrompt.ts',
  'lib/klinik/klinikTurkishRefs.ts',
  'lib/kaynaklar/protokolKutuphanesi/belgeler.ts',
  'lib/kaynaklar/protokolKutuphanesi/index.ts',
  'lib/kaynaklar/protokolKutuphanesi/cip.ts',
  'specialties/',
]

/** Under specialties/ only the assistant prompt files count (prompts/<file>, not soap-*.md). */
export function izlenenMi(yol: string): boolean {
  const y = yol.replace(/\\/g, '/')
  if (y.startsWith('specialties/')) return /^specialties\/[^/]+\/prompts\/(?!soap-)[^/]+\.(md|ts)$/.test(y) && !y.endsWith('.test.ts')
  return IZLENEN_YOLLAR.includes(y)
}

export const icerikOzeti = (icerik: string | Buffer) => createHash('sha256').update(icerik).digest('hex').slice(0, 16)

export interface IzlenenManifest {
  /** path → 16-hex content hash, sorted by path */
  dosyalar: Record<string, string>
  /** hash of the whole list — what a run records as `izlenen_ozet` */
  ozet: string
  guncelleme: string
  not: string
}

export function manifestOzeti(dosyalar: Record<string, string>): string {
  return icerikOzeti(Object.keys(dosyalar).sort().map((k) => `${k}:${dosyalar[k]}`).join('\n'))
}

export function manifestFarki(kayitli: Record<string, string>, simdi: Record<string, string>): { degisen: string[]; eklenen: string[]; silinen: string[] } {
  const degisen = Object.keys(simdi).filter((k) => k in kayitli && kayitli[k] !== simdi[k]).sort()
  const eklenen = Object.keys(simdi).filter((k) => !(k in kayitli)).sort()
  const silinen = Object.keys(kayitli).filter((k) => !(k in simdi)).sort()
  return { degisen, eklenen, silinen }
}
