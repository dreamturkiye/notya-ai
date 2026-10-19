import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

describe('diyetisyen motor dosyaları', () => {
  it('sekiz motor dosyası durur', () => {
    const dosyalar = fs.readdirSync(path.join(process.cwd(), 'specialties', 'diyetisyen', 'engines')).filter((f) => f.endsWith('.ts'))
    assert.ok(dosyalar.length >= 8, dosyalar.join(','))
  })
})
