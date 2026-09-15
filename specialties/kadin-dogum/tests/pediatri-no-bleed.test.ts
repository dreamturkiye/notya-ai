import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = join(import.meta.dirname, '..')

function walk(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else out.push(p)
  }
  return out
}

const FORBIDDEN = [
  /app\/api\/doktor\/asilar/,
  /app\/api\/doktor\/gelisim-taramasi/,
  /specialties\/pediatri/,
  /lib\/asi\/ulusalAsiTakvimi/,
  /lib\/clinical\/gelisimTaramasi/,
]

describe('pediatri-no-bleed', () => {
  it('kadin-dogum source does not import aşılar, gelişim taraması, or specialties/pediatri', () => {
    const files = walk(ROOT).filter((f) => /\.(ts|tsx)$/.test(f))
    const hits: string[] = []
    for (const file of files) {
      if (file.endsWith('pediatri-no-bleed.test.ts')) continue
      const text = readFileSync(file, 'utf8')
      for (const re of FORBIDDEN) {
        if (re.test(text)) hits.push(`${relative(ROOT, file)} ⇄ ${re}`)
      }
    }
    assert.deepEqual(hits, [])
  })
})
