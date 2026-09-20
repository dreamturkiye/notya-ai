/**
 * NOTYA-EYLEM — THE registry. Core actions + the actions chapters contribute.
 *
 * Typed so a malformed contribution fails `tsc`: everything in the list is an `EylemTanimi`, whose
 * `calistir` / `geriAl` signatures and field metadata are checked at compile time.
 *
 * Two invariants are asserted at MODULE LOAD, not left to a reviewer's memory:
 *   1. no duplicate `anahtar` — two actions answering to one tool name would make which one runs
 *      depend on array order;
 *   2. no T3 key (core/eylemler/yasakli.ts) — reçete, not onayı, silme and anything leaving the
 *      system are enforced by ABSENCE from this registry, and this is where absence is checked.
 * A violation throws on import, so it cannot reach production behind a code path nobody exercised.
 */
import { TEMEL_EYLEMLER } from './temelEylemler'
import { BRANS_EYLEMLERI } from './bransEylemleri'
import { eskiSessizTipMi, t3Mi } from './yasakli'
import type { EylemTanimi } from './types'

const TUMU: EylemTanimi[] = [...TEMEL_EYLEMLER, ...BRANS_EYLEMLERI]

{
  const gorulen = new Set<string>()
  for (const e of TUMU) {
    if (gorulen.has(e.anahtar)) throw new Error(`NOTYA-EYLEM: yinelenen eylem anahtarı "${e.anahtar}"`)
    gorulen.add(e.anahtar)
    if (t3Mi(e.anahtar)) throw new Error(`NOTYA-EYLEM: T3 eylemi kayıt defterine giremez — "${e.anahtar}" (docs/AYSE-EYLEM-MIMARISI.md §3)`)
    // NOTYA-EYLEM-24: the old silent-path names are a closed door, not a tool name to be revived.
    if (eskiSessizTipMi(e.anahtar)) throw new Error(`NOTYA-EYLEM: eski sessiz yazma yolunun adı eylem anahtarı olamaz — "${e.anahtar}" (core/eylemler/yasakli.ts)`)
  }
}

const INDEKS = new Map(TUMU.map((e) => [e.anahtar, e]))

export function eylemler(): EylemTanimi[] {
  return TUMU
}

export function eylemBul(anahtar: string): EylemTanimi | null {
  return INDEKS.get(String(anahtar || '')) ?? null
}
