/**
 * SAGLIGIM-GORUNUM-V3 (Kaan, 2026-11-25) — "Burada 'İyi günler' hastanın adının olması iyi olur."
 *
 * Root cause of the missing name: the portal bundle read `patients` with a plain `gender` column that production does not
 * have (only gender_encrypted). PostgREST fails the WHOLE select on an unknown column, `data` came back null, and every
 * patient's name, DOB (age rule), gender and notes were silently null on Sağlığım since #291. A second route
 * (Özel Branş seans) asked for a non-existent `dogum_tarihi`, so a minor never reached the veli gate there.
 *
 * Guard: every `.from('patients').select('…')` in app/ lib/ components/ may only name columns production really has.
 * The list below was read from production information_schema on 2026-11-25; a migration that adds a column adds it here.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import React, { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { bugunSelami } from '../saglikEvi/bugunGorunum'
import { SAGLIK_EVI_SOZLERI as S } from '../saglikEvi/sozler'
import { yerelDakika } from '../saglikEvi/zaman'
import { BugunBasligi } from '../../components/doktor/portal/saglikEvi/BugunGorunumu'

const kok = path.join(import.meta.dirname, '../..')
;(globalThis as { React?: typeof React }).React = React

/** public.patients — production columns (anjayzospuurymjmmtim, 2026-11-25). */
export const PATIENTS_SUTUNLARI = new Set([
  'created_at', 'dob_encrypted', 'doctor_id', 'email_encrypted', 'enabiz_gonderilmesin', 'etiketler', 'gelen_belge_izni',
  'gelen_belge_izni_guncelleme', 'gelen_belge_izni_guncelleyen', 'gender_encrypted', 'id', 'iletisim_izni_eposta',
  'iletisim_izni_guncelleme', 'iletisim_izni_guncelleyen', 'iletisim_izni_sms', 'iletisim_izni_whatsapp', 'is_active',
  'name_encrypted', 'notes_encrypted', 'phone_encrypted', 'tc_kimlik_hash', 'updated_at',
])

function kaynaklar(): string[] {
  const gez = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    if (e.name === 'node_modules' || e.name.startsWith('.')) return []
    const p = path.join(d, e.name)
    return e.isDirectory() ? gez(p) : /\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name) ? [p] : []
  })
  return ['app', 'lib', 'components'].flatMap((d) => gez(path.join(kok, d)))
}

/** Plain column names of a PostgREST select string (embedded relations and `alias:col` handled). */
export function sutunlar(secim: string): string[] {
  return secim.split(',').map((c) => c.trim()).filter(Boolean)
    .filter((c) => c !== '*' && !c.includes('(') && !c.includes('!'))
    .map((c) => c.split(':').pop()!.split('::')[0]!.trim())
}

describe('SAGLIGIM-GORUNUM-V3 — patients selects name only real columns', () => {
  it('sutunlar() reads a select string', () => {
    assert.deepEqual(sutunlar('name_encrypted, dob_encrypted, gender'), ['name_encrypted', 'dob_encrypted', 'gender'])
    assert.deepEqual(sutunlar('id, ad:name_encrypted'), ['id', 'name_encrypted'])
  })

  it('the portal bundle route selects only production columns (the missing-name bug)', () => {
    const src = fs.readFileSync(path.join(kok, 'app/api/portal/hasta/[token]/route.ts'), 'utf8')
    const m = src.match(/from\('patients'\)\.select\('([^']*)'\)/)
    assert.ok(m, 'portal route reads patients')
    const kotu = sutunlar(m![1]!).filter((c) => !PATIENTS_SUTUNLARI.has(c))
    assert.deepEqual(kotu, [], `unknown patients column(s) fail the whole PostgREST select: ${kotu.join(', ')}`)
    assert.match(m![1]!, /name_encrypted/)
    assert.match(m![1]!, /dob_encrypted/)
    // a failed read must be visible in the logs, not look like an empty record
    assert.match(src, /hastaSonuc\.error\) console\.error/)
  })

  it('every .from(\'patients\').select(…) in the app names only production columns', () => {
    const hatalar: string[] = []
    const re = /\.from\(\s*['"]patients['"]\s*\)\s*\.select\(\s*(['"`])([^'"`]*)\1/g
    for (const f of kaynaklar()) {
      const t = fs.readFileSync(f, 'utf8')
      for (const m of t.matchAll(re)) {
        const kotu = sutunlar(m[2]!).filter((c) => !PATIENTS_SUTUNLARI.has(c))
        if (kotu.length) hatalar.push(`${path.relative(kok, f)}: ${kotu.join(', ')}`)
      }
    }
    assert.deepEqual(hatalar, [])
  })
})

describe('SAGLIGIM-GORUNUM-V3 — Bugün greeting', () => {
  const sel = (dakika: number | null, hastaAdi: string | null, veli?: boolean) => bugunSelami({ dakika, hastaAdi, veli, selam: S.selam, notr: S.selamNotr })

  it('adult: day-part + first name', () => {
    assert.equal(sel(11 * 60 + 30, 'Kaan Arıoğlu', false), 'İyi günler, Kaan')
    assert.equal(sel(10 * 60 + 11, 'Kaan Arıoğlu', false), 'Günaydın, Kaan')
    assert.equal(sel(19 * 60, '  Işıl   Şükrü Ağaoğlu ', false), 'İyi akşamlar, Işıl')
  })

  it('under 18 (a parent reads the page): no name in the greeting', () => {
    assert.equal(sel(11 * 60 + 30, 'Deniz Yılmaz', true), 'İyi günler')
  })

  it('no name on record → day-part only, never a placeholder', () => {
    assert.equal(sel(11 * 60 + 30, null, false), 'İyi günler')
    assert.equal(sel(11 * 60 + 30, '   ', false), 'İyi günler')
  })

  it('before the device clock is known (server render) → neutral word, no day-part', () => {
    assert.equal(sel(null, 'Kaan Arıoğlu', false), 'Hoş geldiniz, Kaan')
    assert.doesNotMatch(S.selamNotr, /Günaydın|günler|akşamlar|geceler/)
  })

  it('day-part follows the DEVICE clock, not Türkiye time (10:11 in Baltimore is morning)', () => {
    const onceki = process.env.TZ
    try {
      process.env.TZ = 'America/New_York'
      // 2026-11-25 15:11 UTC = 10:11 in Baltimore = 18:11 in Türkiye
      const an = Date.parse('2026-11-25T15:11:00Z')
      assert.equal(yerelDakika(an), 10 * 60 + 11)
      assert.equal(S.selam(yerelDakika(an)), 'Günaydın')
    } finally {
      if (onceki === undefined) delete process.env.TZ
      else process.env.TZ = onceki
    }
  })

  it('rendered header: adult name in the h1, minor gets the identity line instead; server markup is neutral', () => {
    const yetiskin = renderToStaticMarkup(createElement(BugunBasligi, { s: S, hastaAdi: 'Kaan Arıoğlu', veli: false }))
    assert.match(yetiskin, /data-testid="bugun-selam">Hoş geldiniz, Kaan<\/h1>/)
    assert.doesNotMatch(yetiskin, /bugun-hasta-kimlik/)
    const cocuk = renderToStaticMarkup(createElement(BugunBasligi, { s: S, hastaAdi: 'Deniz Yılmaz', veli: true }))
    assert.match(cocuk, /data-testid="bugun-selam">Hoş geldiniz<\/h1>/)
    assert.match(cocuk, /data-testid="bugun-hasta-kimlik"><small>Hasta<\/small>Deniz Yılmaz/)
    // the art is client-only (Save-Data known there), alt="" — no words in the image, no "AI" wording anywhere
    assert.doesNotMatch(yetiskin, /<img/)
    assert.doesNotMatch(yetiskin + cocuk, /yapay zek|\bAI\b/i)
  })
})
