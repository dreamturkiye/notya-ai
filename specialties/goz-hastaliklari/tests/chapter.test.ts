import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { okumaGecisi, taslakTaniDiliUyarisi } from '../imaging/dualSign'
import { olcumSchema, enjeksiyonSchema } from '../schema'
import { GOZ_KAYNAKLAR, KAYNAK_SIRASI } from '../protocols/sources'
import { specialtyProfile } from '../../../lib/specialties/registry'
import { hastaDosyaSekmeleri } from '../../../lib/doktor/hastaDosyaSekmeleri'
import { normalizeImagingModality } from '../../../lib/doktor/imagingModalities'

const ROOT = join(import.meta.dirname, '..')
const kok = join(ROOT, '..', '..')
const walk = (d: string): string[] => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p] })

describe('dual-sign imaging', () => {
  it('asistan cannot approve; only a draft can be approved/corrected; empty correction refused', () => {
    const o = { taslak: 'Makulada sıvı ile uyumlu görünüm?', taslakYazan: 'asistan' as const, durum: 'draft' as const, uzmanMetin: null }
    assert.equal(okumaGecisi(o, 'onayla', 'asistan').ok, false)
    const r = okumaGecisi(o, 'onayla', 'uzman'); assert.ok(r.ok && r.okuma.durum === 'onayli')
    assert.equal(okumaGecisi({ ...o, durum: 'onayli' }, 'duzelt', 'uzman', 'x').ok, false)
    assert.equal(okumaGecisi(o, 'duzelt', 'uzman', '  ').ok, false)
    assert.ok(taslakTaniDiliUyarisi('kesin tanı: yaş tip YBMD')); assert.equal(taslakTaniDiliUyarisi('drusen izlendi'), null)
  })
})

describe('registry + schema', () => {
  it('göz is a real chapter: VA/GİB first-class measurements, Strong Gözlerim module, oct/fundus imaging', () => {
    const p = specialtyProfile('goz-hastaliklari')
    assert.notEqual(p.olgunluk, 'baseline')
    for (const k of ['gormeKeskinligiSag', 'gormeKeskinligiSol', 'gozIciBasinciSag', 'gozIciBasinciSol']) assert.ok(p.olcumler.some((o) => o.anahtar === k), k)
    assert.equal(p.portal![0].derinlik, 'Strong'); assert.deepEqual(p.portal![0].nav.map((n) => n.path), ['/gozlerim'])
    assert.ok(p.goruntu!.modaliteler.includes('oct') && p.goruntu!.modaliteler.includes('fundus'))
    assert.ok(p.hesaplayicilar.every((h) => h.deterministik === true))
  })
  it('sources: TR yasal/dernek before international; SUT 4.2.33 primary-verified', () => {
    const ilkUluslararasi = KAYNAK_SIRASI.findIndex((r) => GOZ_KAYNAKLAR[r].rol === 'uluslararasi' || GOZ_KAYNAKLAR[r].rol === 'ders-kitabi')
    assert.ok(KAYNAK_SIRASI.slice(0, ilkUluslararasi).every((r) => GOZ_KAYNAKLAR[r].rol.startsWith('tr-')))
    assert.equal(GOZ_KAYNAKLAR.SUT_4233.dogrulama, 'birincil')
  })
  it('payload validation rejects out-of-range GİB and unknown agents', () => {
    assert.equal(olcumSchema.safeParse({ va: {}, gibSag: 120 }).success, false)
    assert.equal(olcumSchema.safeParse({ va: { sag: { uzak_cc: '0,8' } }, gibSag: 16 }).success, true)
    assert.equal(enjeksiyonSchema.safeParse({ goz: 'sag', ajan: 'bilinmeyen', endikasyon: 'ybmd', faz: 'yukleme', tarih: '2026-09-17', durum: 'planli' }).success, false)
  })
  it('hasta dosyası Göz tab only for göz doctors; imaging codes normalize', () => {
    assert.ok(hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false, gozUygun: true }).some((t) => t.id === 'goz'))
    assert.ok(!hastaDosyaSekmeleri({ pediatriUygun: false, gebelikUygun: false }).some((t) => t.id === 'goz'))
    assert.deepEqual(['OCT', 'Fundus fotoğrafı', 'Ön segment fotoğrafı'].map(normalizeImagingModality), ['oct', 'fundus', 'on_segment'])
  })
})

describe('no-bleed + no book text', () => {
  it('göz chapter does not import pediatri, KD, derm or dahiliye internals, nor Neyzi / SAT dating', () => {
    const YASAK = [/specialties\/pediatri/, /specialties\/kadin-dogum/, /specialties\/dermatoloji/, /specialties\/dahiliye/, /lib\/clinical\/buyumeEgrisi/, /lib\/clinical\/gebelik['"]/, /lib\/asi\//]
    const hits = walk(ROOT).filter((f) => /\.(ts|tsx)$/.test(f) && !f.endsWith('chapter.test.ts')).flatMap((f) => { const t = readFileSync(f, 'utf8').split('\n').filter((l) => /^\s*import |from ['"]|require\(/.test(l)).join('\n'); return YASAK.filter((r) => r.test(t)).map((r) => `${relative(ROOT, f)} ⇄ ${r}`) })
    assert.deepEqual(hits, [])
  })
  it('migration keeps göz truth in goz_* tables (not specialty_records, not core patients columns)', () => {
    const m = readFileSync(join(kok, 'lib/db/migrations/048_goz_chapter.sql'), 'utf8')
    assert.ok(!/specialty_records/i.test(m.replace(/--.*$/gm, ''))); assert.ok(!/alter table patients/i.test(m))
  })
})
