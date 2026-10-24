/**
 * The intake form's required-question handling, for whichever pack is active: the rule that marks a question, the
 * banner that counts, the line under the question, and — above all — that every mark is gone the moment its question
 * is answered, so the Next / Send buttons never wait on a stale error.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { formMetni, girdiMetni } from '@/lib/ulke/arayuz'
import type { FormSorusu, HastaFormuGorunumu } from '@/lib/ulke/intake/tipler'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { eksikBandi, formEksikleri, HastaFormuGorunumu as Gorunum } from './HastaFormu'

const q = (anahtar: string, tur: FormSorusu['tur'], zorunlu: boolean, ek: Partial<FormSorusu> = {}): FormSorusu => ({
  anahtar, tur, metin: `Q-${anahtar}`, yardim: null, zorunlu, secenekler: tur === 'cok-secim' ? [{ anahtar: 'a', ad: 'A', tek: false }, { anahtar: 'b', ad: 'B', tek: false }] : null, ayrinti: null, birim: null, ...ek,
})
const SORULAR = [q('uzun', 'cok-secim', true), q('metin', 'kisa-metin', true), q('serbest', 'kisa-metin', false)]

describe('intake form: required questions', () => {
  const p = ulkePaketi()
  const dil = p.varsayilanDil
  const f = formMetni(dil)
  const g = girdiMetni(dil)
  it('marks exactly the required questions with no answer', () => {
    assert.deepEqual(formEksikleri(SORULAR, {}, {}), ['uzun', 'metin'])
    assert.deepEqual(formEksikleri(SORULAR, { uzun: ['a'] }, {}), ['metin'])
    assert.deepEqual(formEksikleri(SORULAR, { uzun: ['a'], metin: 'x' }, {}), [])
  })
  it('a mark clears when its question is answered and the form can then be sent', () => {
    const isaretli = formEksikleri(SORULAR, {}, {})
    const kalan = (c: Record<string, never | string | string[]>) => isaretli.filter((k) => formEksikleri(SORULAR, c, {}).includes(k))
    assert.deepEqual(kalan({}), ['uzun', 'metin'])
    assert.deepEqual(kalan({ uzun: ['b'] }), ['metin'])
    assert.deepEqual(kalan({ uzun: ['b'], metin: 'y' }), [])
    assert.equal(eksikBandi(f, g, SORULAR, kalan({ uzun: ['b'], metin: 'y' }), { uzun: ['b'], metin: 'y' }, {}), null)
  })
  it('the banner names the count, in the pack words', () => {
    const iki = eksikBandi(f, g, SORULAR, ['uzun', 'metin'], {}, {})
    const bir = eksikBandi(f, g, SORULAR, ['metin'], { uzun: ['a'] }, {})
    assert.ok(iki && iki.includes('2'), String(iki))
    assert.equal(bir, f.hasta.eksikTek)
    assert.notEqual(iki, bir)
  })
  it('the screen shows a mark and a line under each marked question, and nothing once answered', () => {
    const form: HastaFormuGorunumu = { id: 'f', durum: 'taslak', veli: false, dil, gonderildi: null, riza: { metin: 'c', kabul: true }, bolumler: [{ anahtar: 'bir', baslik: 'P', sorular: SORULAR }], cevaplar: {} }
    const ciz = (cevaplar: Record<string, string | string[]>, eksik: string[]) => renderToStaticMarkup(React.createElement(Gorunum, { f, form, cevaplar, sayilar: {}, bolum: 0, riza: true, setRiza: () => {}, rizaHatasi: false, kayit: 'yok', gonderim: 'yok', eksik, degistir: () => {}, hamDegistir: () => {}, git: () => {}, gonder: () => {}, kapat: () => {} }))
    const html = ciz({}, ['uzun', 'metin'])
    assert.equal((html.match(/data-hata="zorunlu"/g) ?? []).length, 2)
    assert.match(html, /id="uzf-soru-uzun"[^>]*data-eksik="evet"|data-eksik="evet"[^>]*id="uzf-soru-uzun"/)
    assert.ok(html.includes(f.hasta.soruEksik))
    const temiz = ciz({ uzun: ['a'], metin: 'x' }, [])
    assert.ok(!/data-hata="zorunlu"|data-eksik="evet"/.test(temiz))
    assert.ok(!/role="alert"/.test(temiz))
    assert.ok(!/disabled=""/.test(temiz.split('data-eylem="form-ileri"')[0].slice(-200)), 'Next stays enabled')
  })
})
