/** DIKTE-TIBBI-01 (country port) — keyterms sent with a visit recording. */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'fs'
import path from 'path'
import { konusmaAnahtarTerimleri, KONUSMA_ROL_ANAHTARLARI, KONUSMA_TERIM_AZAMI } from './konusmaTerimleri'

const SINIR = (t: string[]) => {
  assert.ok(t.length > 50 && t.length <= KONUSMA_TERIM_AZAMI)
  for (const k of t) assert.ok(k.length <= 50 && k.split(' ').length <= 5 && !/[<>{}[\]\\]/.test(k), k)
  assert.equal(new Set(t.map((k) => k.toLowerCase())).size, t.length)
}

describe('country keyterms', () => {
  it('ENT (the 2026-11-21 feedback) — British packs', () => {
    const t = konusmaAnahtarTerimleri('en-GB', 'otolaryngology')
    SINIR(t)
    for (const k of ['tympanic membrane', 'oropharynx', "Wharton's duct orifices", 'nasal endoscopy', 'middle meatus', 'nasopharynx', 'paradoxical middle turbinate', 'otorrhoea']) assert.ok(t.includes(k), k)
    assert.ok(t.indexOf('oropharynx') < t.indexOf('examination'), 'role terms first')
  })
  it('American spelling for en-US and en-CA; albuterol only in the US', () => {
    const us = konusmaAnahtarTerimleri('en-US', 'otolaryngology')
    const ca = konusmaAnahtarTerimleri('en-CA', 'paediatrics')
    assert.ok(us.includes('otorrhea') && !us.includes('otorrhoea'))
    assert.ok(us.includes('edema') && us.includes('acetaminophen'))
    assert.ok(konusmaAnahtarTerimleri('en-US', 'paediatrics').includes('albuterol'))
    assert.ok(ca.includes('salbutamol') && ca.includes('acetaminophen'))
    for (const d of ['en-AU', 'en-NZ'] as const) assert.ok(konusmaAnahtarTerimleri(d, 'otolaryngology').includes('otorrhoea'))
  })
  it('Uzbekistan: Russian terms, Türkiye-shaped role keys resolve', () => {
    const t = konusmaAnahtarTerimleri('ru', 'kulak-burun-bogaz')
    SINIR(t)
    assert.ok(t.includes('барабанная перепонка') && t.includes('носоглотка') && t.includes('ротоглотка'))
    assert.ok(konusmaAnahtarTerimleri('uz-Latn', 'kulak-burun-bogaz').includes('средний носовой ход'))
  })
  it('every shared English role has its own list; an unknown role gets the core list', () => {
    assert.ok(KONUSMA_ROL_ANAHTARLARI.length >= 40)
    SINIR(konusmaAnahtarTerimleri('en-GB', 'no-such-role'))
  })
  it('wired into the visit recording, with the two-pass ceiling kept', () => {
    const kayit = readFileSync(path.join(__dirname, 'muayeneKaydi.ts'), 'utf8')
    assert.ok(kayit.includes('konusmayiTani(ses, notDili, konusmaAnahtarTerimleri(notDili, g.sablon))'))
    const tanima = readFileSync(path.join(__dirname, 'konusmaTanima.ts'), 'utf8')
    assert.ok(tanima.includes("form.append('keyterms', t)"))
    assert.ok(/if \(ilkCevap === 'reddedildi' && gecisSayisi < AZAMI_GECIS\)/.test(tanima))
  })
})
