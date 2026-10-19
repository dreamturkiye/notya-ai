import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

describe('ergoterapi motor dosyaları', () => {
  it('sekiz motor dosyası durur', () => {
    const dosyalar = fs.readdirSync(path.join(process.cwd(), 'specialties', 'ergoterapi', 'engines')).filter((f) => f.endsWith('.ts'))
    assert.ok(dosyalar.length >= 8, dosyalar.join(','))
  })
})
