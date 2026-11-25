/**
 * AKKS watched files on disk (node fs) — shared by scripts/akks/izle.mts and lib/akks/akksIzleme.test.ts. The rules are
 * in core/akks/izleme.ts (pure).
 */
import fs from 'node:fs'
import path from 'node:path'
import { icerikOzeti, izlenenMi } from '@/core/akks/izleme'

function yuruyus(kok: string, dizin: string, out: string[] = []): string[] {
  for (const ad of fs.readdirSync(path.join(kok, dizin))) {
    const rel = `${dizin}/${ad}`
    if (fs.statSync(path.join(kok, rel)).isDirectory()) { if (ad !== 'node_modules') yuruyus(kok, rel, out) } else out.push(rel)
  }
  return out
}

/** path → content hash of every watched file in the checkout at `kok`. */
export function simdikiDosyalar(kok: string): Record<string, string> {
  const duz = ['lib/ai', 'lib/asistan', 'lib/doktor', 'lib/klinik', 'lib/kaynaklar/protokolKutuphanesi'].flatMap((d) => fs.readdirSync(path.join(kok, d)).map((f) => `${d}/${f}`))
  const out: Record<string, string> = {}
  for (const y of [...yuruyus(kok, 'specialties'), ...duz].filter(izlenenMi).sort()) out[y] = icerikOzeti(fs.readFileSync(path.join(kok, y)))
  return out
}
