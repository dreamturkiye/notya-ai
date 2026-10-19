import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

describe('medikal-estetik stüdyo', () => {
  it('kendi stüdyosu ve tuvali vardır; pediatri ölçüsü sızmaz', () => {
    const kok = path.join(process.cwd(), 'specialties', 'medikal-estetik')
    const studyo = fs.readFileSync(path.join(kok, 'ui', 'Studyo.tsx'), 'utf8')
    const tuval = fs.readFileSync(path.join(kok, 'ui', 'Tuval.tsx'), 'utf8')
    assert.match(studyo, /data-studyo="medikal-estetik"/)
    assert.match(tuval, /data-tuval="medikal-estetik"/)
    assert.doesNotMatch(studyo, /Neyzi|Baş Çevresi|FTR/)
    assert.doesNotMatch(tuval, /Baş Çevresi/)
  })
})
