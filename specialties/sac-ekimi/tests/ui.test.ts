import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

describe('sac-ekimi stüdyo', () => {
  it('kendi stüdyosu ve tuvali vardır; pediatri ölçüsü sızmaz', () => {
    const kok = path.join(process.cwd(), 'specialties', 'sac-ekimi')
    const studyo = fs.readFileSync(path.join(kok, 'ui', 'Studyo.tsx'), 'utf8')
    const tuval = fs.readFileSync(path.join(kok, 'ui', 'Tuval.tsx'), 'utf8')
    assert.match(studyo, /data-studyo="sac-ekimi"/)
    assert.match(tuval, /data-tuval="sac-ekimi"/)
    assert.doesNotMatch(studyo, /Neyzi|Baş Çevresi|FTR/)
    assert.doesNotMatch(tuval, /Baş Çevresi/)
  })
})
