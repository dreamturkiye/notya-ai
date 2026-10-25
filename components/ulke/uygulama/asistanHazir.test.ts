/** AU-LAUNCH-01g — the assistant entries draw only when the status call says `{ hazir: true }`, and never before it is known. */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { hazirMi } from './asistanHazir'

const DIR = resolve(__dirname)
const oku = (f: string) => readFileSync(join(DIR, f), 'utf8')

describe('asistanHazir (only an explicit true is available; unknown keeps the entries)', () => {
  it('only an explicit hazir:true is available', () => {
    assert.equal(hazirMi({ hazir: true, ad: 'X' }), true)
    for (const v of [{ hazir: false }, { hazir: 'true' }, { hazir: 1 }, {}, null, undefined, 'x', 0]) assert.equal(hazirMi(v), false)
  })
  it('sidebar and phone menu entry follow the shared hook', () => {
    const s = oku('Kabuk.tsx')
    assert.match(s, /useAsistanHazir\(Boolean\(asistanSesAdlari\(\)\)\)/)
    assert.match(s, /if \(p && asistanHazir\) asistan = /)
    assert.doesNotMatch(s, /if \(p && asistanSesAdlari\(\)\) asistan/)
  })
  it('home tiles and quick access draw nothing while unavailable (no dead placeholder)', () => {
    const b = oku('Bugun.tsx')
    assert.match(b, /const asistanYolu = asistanHazir \? YOL\.asistan : null/)
    assert.doesNotMatch(b, /<span style=\{ARAC\}>\{m\.asistan\.etiket\}/)
    assert.match(b, /asistanYolu \? karo\(asistanYolu/)
    assert.match(b, /asistanYolu \? \{ href: asistanYolu, text: p\.asistanAc/)
  })
})
